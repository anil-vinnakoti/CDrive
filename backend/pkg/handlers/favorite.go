package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
)

type FavoriteHandler struct {
	repo          repository.Repository
	authenticator auth.Authenticator
}

func NewFavoriteHandler(repo repository.Repository, authenticator auth.Authenticator) *FavoriteHandler {
	return &FavoriteHandler{
		repo:          repo,
		authenticator: authenticator,
	}
}

func (h *FavoriteHandler) HandleFavorite(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.FavoriteItemRequest
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

	if req.UserID == "" || req.ItemID == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId and itemId are required fields",
		})
	}

	prefix := "FILE#"
	if req.Type == "FOLDER" {
		prefix = "FOLDER#"
	}

	pk := "USER#" + req.UserID
	sk := prefix + req.ItemID

	err := h.repo.UpdateFavoriteStatus(ctx, pk, sk, req.IsFavorite)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to update favorite status",
			Details: err.Error(),
		})
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{
		"message":    "Favorite status updated successfully",
		"itemId":     req.ItemID,
		"isFavorite": req.IsFavorite,
	})
}
