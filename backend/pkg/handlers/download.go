package handlers

import (
	"context"
	"net/http"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"
	"cdrive-backend/pkg/storage"

	"github.com/aws/aws-lambda-go/events"
)

type DownloadHandler struct {
	repo          repository.Repository
	storage       storage.Storage
	authenticator auth.Authenticator
}

func NewDownloadHandler(repo repository.Repository, storage storage.Storage, authenticator auth.Authenticator) *DownloadHandler {
	return &DownloadHandler{
		repo:          repo,
		storage:       storage,
		authenticator: authenticator,
	}
}

// HandleDownloadURL generates a 5-minute presigned S3 GET URL for downloading or viewing a file
func (h *DownloadHandler) HandleDownloadURL(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userID := request.QueryStringParameters["userId"]
	fileID := request.QueryStringParameters["fileId"]

	if h.authenticator != nil {
		authenticatedUserID, err := h.authenticator.ExtractUserID(request)
		if err == nil && authenticatedUserID != "" {
			userID = authenticatedUserID
		} else if userID == "" {
			return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
				Error: "Unauthorized access: missing or invalid authentication token",
			})
		}
	}

	if userID == "" || fileID == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId and fileId query parameters are required",
		})
	}

	pk := "USER#" + userID
	sk := "FILE#" + fileID

	item, err := h.repo.GetItem(ctx, pk, sk)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to retrieve file metadata",
			Details: err.Error(),
		})
	}

	if item == nil {
		return jsonResponse(http.StatusNotFound, models.ErrorResponse{
			Error: "File not found",
		})
	}

	downloadURL, err := h.storage.GeneratePresignedGetURL(ctx, item.S3Key)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate presigned download URL",
			Details: err.Error(),
		})
	}

	resp := models.DownloadURLResponse{
		DownloadURL: downloadURL,
		ExpiresIn:   300, // 5 minutes
	}

	return jsonResponse(http.StatusOK, resp)
}
