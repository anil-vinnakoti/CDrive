package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
)

type TrashHandler struct {
	repo          repository.Repository
	authenticator auth.Authenticator
}

func NewTrashHandler(repo repository.Repository, authenticator auth.Authenticator) *TrashHandler {
	return &TrashHandler{
		repo:          repo,
		authenticator: authenticator,
	}
}

func (h *TrashHandler) HandleTrash(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.TrashItemRequest
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

	err := h.repo.UpdateTrashStatus(ctx, pk, sk, req.IsTrashed)
	if err != nil {
		slog.Error("UpdateTrashStatus failed", "pk", pk, "sk", sk, "isTrashed", req.IsTrashed, "error", err)
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to update trash status",
			Details: err.Error(),
		})
	}

	actionStr := "trashed"
	if !req.IsTrashed {
		actionStr = "restored"
	}

	return jsonResponse(http.StatusOK, map[string]interface{}{
		"message":   "Item " + actionStr + " successfully",
		"itemId":    req.ItemID,
		"isTrashed": req.IsTrashed,
	})
}
