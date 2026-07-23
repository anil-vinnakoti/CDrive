package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"
	"cdrive-backend/pkg/storage"

	"github.com/aws/aws-lambda-go/events"
)

type DeleteHandler struct {
	repo          repository.Repository
	storage       storage.Storage
	authenticator auth.Authenticator
}

func NewDeleteHandler(repo repository.Repository, storage storage.Storage, authenticator auth.Authenticator) *DeleteHandler {
	return &DeleteHandler{
		repo:          repo,
		storage:       storage,
		authenticator: authenticator,
	}
}

// HandleDelete deletes a file (S3 object + DynamoDB) or a folder (DynamoDB)
func (h *DeleteHandler) HandleDelete(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.DeleteItemRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request body",
			Details: err.Error(),
		})
	}

	if h.authenticator != nil {
		authenticatedUserID, err := h.authenticator.ExtractUserID(request)
		if err != nil {
			return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
				Error: "Unauthorized access: " + err.Error(),
			})
		}
		req.UserID = authenticatedUserID
	}

	if req.UserID == "" || req.ItemID == "" || req.Type == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId, itemId, and type ('FILE' or 'FOLDER') are required fields",
		})
	}

	pk := "USER#" + req.UserID
	var sk string

	if req.Type == "FILE" {
		sk = "FILE#" + req.ItemID

		// 1. Fetch file metadata to locate S3 Key
		item, err := h.repo.GetItem(ctx, pk, sk)
		if err != nil {
			return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "Failed to fetch item metadata",
				Details: err.Error(),
			})
		}

		if item != nil && item.S3Key != "" {
			// 2. Delete S3 object
			if err := h.storage.DeleteObject(ctx, item.S3Key); err != nil {
				return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
					Error:   "Failed to delete S3 file object",
					Details: err.Error(),
				})
			}
		}
	} else if req.Type == "FOLDER" {
		sk = "FOLDER#" + req.ItemID
	} else {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "type must be either 'FILE' or 'FOLDER'",
		})
	}

	// 3. Delete DynamoDB metadata record
	if err := h.repo.DeleteItem(ctx, pk, sk); err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to delete metadata record from DynamoDB",
			Details: err.Error(),
		})
	}

	resp := models.DeleteItemResponse{
		Message: "Item deleted successfully",
		ItemID:  req.ItemID,
	}

	return jsonResponse(http.StatusOK, resp)
}
