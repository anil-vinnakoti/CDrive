package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"

	"github.com/aws/aws-lambda-go/events"
)

type AuthHandler struct {
	authenticator auth.Authenticator
}

func NewAuthHandler(authenticator auth.Authenticator) *AuthHandler {
	return &AuthHandler{
		authenticator: authenticator,
	}
}

type TokenRequest struct {
	UserID string `json:"userId"`
}

type TokenResponse struct {
	Token     string `json:"token"`
	ExpiresIn int    `json:"expiresInSeconds"`
	UserID    string `json:"userId"`
}

// HandleTokenGen handles POST requests to generate a valid JWT auth token
func (h *AuthHandler) HandleTokenGen(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req TokenRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request body",
			Details: err.Error(),
		})
	}

	if req.UserID == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId is a required field",
		})
	}

	tokenStr, err := h.authenticator.GenerateToken(req.UserID)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate JWT token",
			Details: err.Error(),
		})
	}

	resp := TokenResponse{
		Token:     tokenStr,
		ExpiresIn: 86400, // 24 hours
		UserID:    req.UserID,
	}

	return jsonResponse(http.StatusOK, resp)
}
