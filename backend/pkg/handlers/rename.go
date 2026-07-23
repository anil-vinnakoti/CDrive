package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
)

type RenameHandler struct {
	repo          repository.Repository
	authenticator auth.Authenticator
}

func NewRenameHandler(repo repository.Repository, authenticator auth.Authenticator) *RenameHandler {
	return &RenameHandler{
		repo:          repo,
		authenticator: authenticator,
	}
}

func (h *RenameHandler) HandleRename(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.RenameItemRequest
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

	req.NewName = strings.TrimSpace(req.NewName)
	if req.UserID == "" || req.ItemID == "" || req.NewName == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId, itemId, and newName are required fields",
		})
	}

	prefix := "FILE#"
	if req.Type == "FOLDER" {
		prefix = "FOLDER#"
	}

	pk := "USER#" + req.UserID
	sk := prefix + req.ItemID

	err := h.repo.UpdateItemName(ctx, pk, sk, req.NewName)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to update item name",
			Details: err.Error(),
		})
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{
		"message": "Item renamed successfully",
		"itemId":  req.ItemID,
		"name":    req.NewName,
	})
}
