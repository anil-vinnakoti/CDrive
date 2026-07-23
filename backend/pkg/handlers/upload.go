package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"
	"cdrive-backend/pkg/storage"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
)

type UploadHandler struct {
	repo          repository.Repository
	storage       storage.Storage
	authenticator auth.Authenticator
}

func NewUploadHandler(repo repository.Repository, storage storage.Storage, authenticator auth.Authenticator) *UploadHandler {
	return &UploadHandler{
		repo:          repo,
		storage:       storage,
		authenticator: authenticator,
	}
}

// HandleUploadProcess generates a 5-minute presigned PUT URL and registers file metadata in DynamoDB
func (h *UploadHandler) HandleUploadProcess(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.UploadRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request body",
			Details: err.Error(),
		})
	}

	// Validate JWT authentication
	if h.authenticator != nil {
		authenticatedUserID, err := h.authenticator.ExtractUserID(request)
		if err != nil {
			return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
				Error: "Unauthorized access: " + err.Error(),
			})
		}
		req.UserID = authenticatedUserID
	}

	if req.UserID == "" || req.FileName == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId and fileName are required fields",
		})
	}

	fileID := uuid.New().String()
	s3Key := req.UserID + "/" + fileID + "/" + req.FileName
	now := time.Now().UTC()

	// Single-table keys design
	// PK = USER#<UserID>, SK = FILE#<FileID>
	pk := "USER#" + req.UserID
	sk := "FILE#" + fileID

	driveItem := models.DriveItem{
		PK:        pk,
		SK:        sk,
		ID:        fileID,
		UserID:    req.UserID,
		FolderID:  req.FolderID,
		Type:      "FILE",
		Name:      req.FileName,
		Size:      req.Size,
		MimeType:  req.MimeType,
		S3Key:     s3Key,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// 1. Generate 5-minute presigned upload URL
	presignedURL, err := h.storage.GeneratePresignedPutURL(ctx, s3Key, req.MimeType)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate presigned upload URL",
			Details: err.Error(),
		})
	}

	// 2. Persist metadata to DynamoDB single table
	if err := h.repo.PutItem(ctx, driveItem); err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to save file metadata",
			Details: err.Error(),
		})
	}

	resp := models.UploadResponse{
		UploadURL: presignedURL,
		ExpiresIn: 300, // 5 minutes
		Item:      &driveItem,
	}

	return jsonResponse(http.StatusCreated, resp)
}

func jsonResponse(statusCode int, body interface{}) (events.APIGatewayV2HTTPResponse, error) {
	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return events.APIGatewayV2HTTPResponse{
			StatusCode: http.StatusInternalServerError,
			Body:       `{"error":"Failed to marshal response"}`,
			Headers:    map[string]string{"Content-Type": "application/json"},
		}, nil
	}

	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Body:       string(jsonBytes),
		Headers: map[string]string{
			"Content-Type":                 "application/json",
			"Access-Control-Allow-Origin":  "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	}, nil
}
