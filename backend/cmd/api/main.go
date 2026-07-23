package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/handlers"
	"cdrive-backend/pkg/repository"
	"cdrive-backend/pkg/storage"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	authHandler     *handlers.AuthHandler
	uploadHandler   *handlers.UploadHandler
	downloadHandler *handlers.DownloadHandler
	folderHandler   *handlers.FolderHandler
	deleteHandler   *handlers.DeleteHandler
	favoriteHandler *handlers.FavoriteHandler
	trashHandler    *handlers.TrashHandler
	shareHandler    *handlers.ShareHandler
	logger          *slog.Logger
)

func init() {
	logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

	tableName := os.Getenv("TABLE_NAME")
	if tableName == "" {
		tableName = os.Getenv("DYNAMODB_TABLE_NAME")
	}
	if tableName == "" {
		tableName = "CustomDriveData"
	}

	bucketName := os.Getenv("BUCKET_NAME")
	if bucketName == "" {
		bucketName = os.Getenv("S3_BUCKET_NAME")
	}
	if bucketName == "" {
		bucketName = "cdrive-file-storage"
	}

	gsiName := os.Getenv("GSI_FOLDER_INDEX")
	if gsiName == "" {
		gsiName = "FolderIdIndex"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "cdrive-dev-secret-key-2026"
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		logger.Error("unable to load AWS SDK config", "error", err)
		os.Exit(1)
	}

	if cfg.Region == "" {
		cfg.Region = "ap-south-1"
	}

	logger.Info("initialized backend config", "region", cfg.Region, "tableName", tableName, "bucketName", bucketName)

	// Support custom DynamoDB local endpoint if configured or running in SAM Local
	dynamoEndpoint := os.Getenv("AWS_ENDPOINT_URL_DYNAMODB")
	if dynamoEndpoint == "" {
		dynamoEndpoint = os.Getenv("DYNAMODB_ENDPOINT")
	}
	if dynamoEndpoint == "" {
		dynamoEndpoint = os.Getenv("AWS_ENDPOINT_URL")
	}
	if dynamoEndpoint == "" && os.Getenv("AWS_SAM_LOCAL") == "true" {
		dynamoEndpoint = "http://host.docker.internal:8000"
	}

	var dynamoClient *dynamodb.Client
	if dynamoEndpoint != "" {
		logger.Info("using custom DynamoDB endpoint", "endpoint", dynamoEndpoint)
		dynamoClient = dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
			o.BaseEndpoint = aws.String(dynamoEndpoint)
		})
	} else {
		dynamoClient = dynamodb.NewFromConfig(cfg)
	}

	s3Client := s3.NewFromConfig(cfg)

	repo := repository.NewDynamoRepository(dynamoClient, tableName, gsiName)
	store := storage.NewS3Storage(s3Client, bucketName)
	jwtAuth := auth.NewJWTAuth(jwtSecret)

	authHandler = handlers.NewAuthHandler(repo, jwtAuth)
	uploadHandler = handlers.NewUploadHandler(repo, store, jwtAuth)
	downloadHandler = handlers.NewDownloadHandler(repo, store, jwtAuth)
	folderHandler = handlers.NewFolderHandler(repo, jwtAuth)
	deleteHandler = handlers.NewDeleteHandler(repo, store, jwtAuth)
	favoriteHandler = handlers.NewFavoriteHandler(repo, jwtAuth)
	trashHandler = handlers.NewTrashHandler(repo, jwtAuth)
	shareHandler = handlers.NewShareHandler(repo, store, jwtAuth)
}

func router(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	method := request.RequestContext.HTTP.Method
	rawPath := request.RawPath

	// Normalize path by stripping /api/v1 or /api prefixes if present
	normalizedPath := rawPath
	normalizedPath = strings.TrimPrefix(normalizedPath, "/api/v1")
	normalizedPath = strings.TrimPrefix(normalizedPath, "/api")

	logger.Info("incoming request", "rawPath", rawPath, "normalizedPath", normalizedPath, "method", method)

	switch {
	case method == "OPTIONS":
		return events.APIGatewayV2HTTPResponse{
			StatusCode: http.StatusOK,
			Headers: map[string]string{
				"Access-Control-Allow-Origin":  "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Access-Control-Allow-Headers": "*",
			},
		}, nil

	case method == "POST" && normalizedPath == "/auth/signup":
		return authHandler.HandleSignUp(ctx, request)

	case method == "POST" && normalizedPath == "/auth/login":
		return authHandler.HandleLogin(ctx, request)

	case method == "POST" && normalizedPath == "/auth/google":
		return authHandler.HandleGoogleAuth(ctx, request)

	case method == "GET" && normalizedPath == "/auth/me":
		return authHandler.HandleGetMe(ctx, request)

	case method == "POST" && normalizedPath == "/auth/token":
		return authHandler.HandleTokenGen(ctx, request)

	case method == "POST" && (normalizedPath == "/files/upload-url" || normalizedPath == "/files/upload" || normalizedPath == "/upload"):
		return uploadHandler.HandleUploadProcess(ctx, request)

	case method == "GET" && (normalizedPath == "/files/download-url" || normalizedPath == "/files/download" || normalizedPath == "/download"):
		return downloadHandler.HandleDownloadURL(ctx, request)

	case method == "POST" && (normalizedPath == "/folders" || normalizedPath == "/folders/create"):
		return folderHandler.CreateFolder(ctx, request)

	case method == "GET" && (normalizedPath == "/folders/contents" || normalizedPath == "/folders" || normalizedPath == "/files"):
		return folderHandler.ListFolderContents(ctx, request)

	case method == "POST" && (normalizedPath == "/items/favorite" || normalizedPath == "/favorite"):
		return favoriteHandler.HandleFavorite(ctx, request)

	case method == "POST" && (normalizedPath == "/items/trash" || normalizedPath == "/trash" || normalizedPath == "/restore"):
		return trashHandler.HandleTrash(ctx, request)

	case method == "POST" && (normalizedPath == "/files/share" || normalizedPath == "/share"):
		return shareHandler.HandleCreateShare(ctx, request)

	case (method == "DELETE" || method == "POST") && (normalizedPath == "/delete" || normalizedPath == "/items/delete" || normalizedPath == "/files/delete" || normalizedPath == "/folders/delete"):
		return deleteHandler.HandleDelete(ctx, request)

	case method == "GET" && normalizedPath == "/health":
		return events.APIGatewayV2HTTPResponse{
			StatusCode: http.StatusOK,
			Body:       `{"status":"ok","message":"CDrive API is operational"}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil

	default:
		return events.APIGatewayV2HTTPResponse{
			StatusCode: http.StatusNotFound,
			Body:       `{"error":"Route not found","path":` + rawPath + `}`,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}
}

func main() {
	lambda.Start(router)
}
