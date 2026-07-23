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

type ShareHandler struct {
	repo          repository.Repository
	storage       storage.Storage
	authenticator auth.Authenticator
}

func NewShareHandler(repo repository.Repository, storage storage.Storage, authenticator auth.Authenticator) *ShareHandler {
	return &ShareHandler{
		repo:          repo,
		storage:       storage,
		authenticator: authenticator,
	}
}

func (h *ShareHandler) HandleCreateShare(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.ShareItemRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request body",
			Details: err.Error(),
		})
	}

	if h.authenticator != nil {
		userID, err := h.authenticator.ExtractUserID(request)
		if err != nil {
			return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
				Error: "Unauthorized access: " + err.Error(),
			})
		}
		req.UserID = userID
	}

	if req.UserID == "" || req.FileID == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId and fileId are required fields",
		})
	}

	if req.ExpiresInSeconds <= 0 {
		req.ExpiresInSeconds = 86400 // Default 24 hours
	}

	// Fetch file item from DynamoDB
	pk := "USER#" + req.UserID
	sk := "FILE#" + req.FileID
	item, err := h.repo.GetItem(ctx, pk, sk)
	if err != nil || item == nil {
		return jsonResponse(http.StatusNotFound, models.ErrorResponse{
			Error: "File not found",
		})
	}

	// Generate 24-hour presigned GET URL for sharing
	downloadURL, err := h.storage.GeneratePresignedGetURL(ctx, item.S3Key)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate share URL",
			Details: err.Error(),
		})
	}

	shareID := uuid.New().String()
	expiresAt := time.Now().UTC().Add(time.Duration(req.ExpiresInSeconds) * time.Second)

	resp := models.ShareItemResponse{
		ShareID:     shareID,
		FileID:      item.ID,
		FileName:    item.Name,
		DownloadURL: downloadURL,
		ExpiresAt:   expiresAt,
	}

	return jsonResponse(http.StatusOK, resp)
}
