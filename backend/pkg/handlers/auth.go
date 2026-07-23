package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	repo          repository.Repository
	authenticator auth.Authenticator
}

func NewAuthHandler(repo repository.Repository, authenticator auth.Authenticator) *AuthHandler {
	return &AuthHandler{
		repo:          repo,
		authenticator: authenticator,
	}
}

type GoogleTokenInfo struct {
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Sub           string `json:"sub"`
	EmailVerified string `json:"email_verified"`
	Error         string `json:"error_description"`
}

// HandleTokenGen handles POST requests for legacy demo token generation
func (h *AuthHandler) HandleTokenGen(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	type TokenRequest struct {
		UserID string `json:"userId"`
	}
	var req TokenRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request body",
			Details: err.Error(),
		})
	}

	if req.UserID == "" {
		req.UserID = "demo_user"
	}

	tokenStr, err := h.authenticator.GenerateToken(req.UserID)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate JWT token",
			Details: err.Error(),
		})
	}

	resp := models.UserResponse{
		ID:           req.UserID,
		Email:        req.UserID + "@cdrive.dev",
		Name:         req.UserID,
		AuthProvider: "demo",
		Token:        tokenStr,
	}

	return jsonResponse(http.StatusOK, resp)
}

// HandleSignUp handles POST /auth/signup (Email & Password registration)
func (h *AuthHandler) HandleSignUp(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.SignUpRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid JSON payload",
			Details: err.Error(),
		})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "Email and password are required fields",
		})
	}

	if len(req.Password) < 6 {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "Password must be at least 6 characters long",
		})
	}

	// Check if user with email already exists
	existing, err := h.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		// Log error but proceed if scan failed
	}
	if existing != nil {
		return jsonResponse(http.StatusConflict, models.ErrorResponse{
			Error: "An account with this email address already exists",
		})
	}

	// Hash password using bcrypt
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to hash password",
			Details: err.Error(),
		})
	}

	userID := uuid.New().String()
	name := req.Name
	if name == "" {
		parts := strings.Split(req.Email, "@")
		name = parts[0]
	}

	user := models.User{
		ID:           userID,
		Email:        req.Email,
		Name:         name,
		PasswordHash: string(hash),
		AuthProvider: "local",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreateUser(ctx, &user); err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to save user account",
			Details: err.Error(),
		})
	}

	tokenStr, err := h.authenticator.GenerateToken(userID)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate session token",
			Details: err.Error(),
		})
	}

	return jsonResponse(http.StatusCreated, models.UserResponse{
		ID:           userID,
		Email:        user.Email,
		Name:         user.Name,
		AuthProvider: "local",
		Token:        tokenStr,
	})
}

// HandleLogin handles POST /auth/login (Email & Password authentication)
func (h *AuthHandler) HandleLogin(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.AuthLoginRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid JSON payload",
			Details: err.Error(),
		})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "Email and password are required fields",
		})
	}

	user, err := h.repo.GetUserByEmail(ctx, req.Email)
	if err != nil || user == nil {
		return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
			Error: "Invalid email or password",
		})
	}

	if user.PasswordHash == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "Account signed up via Google. Please log in using Google Sign-In",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
			Error: "Invalid email or password",
		})
	}

	tokenStr, err := h.authenticator.GenerateToken(user.ID)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate session token",
			Details: err.Error(),
		})
	}

	return jsonResponse(http.StatusOK, models.UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Picture:      user.Picture,
		AuthProvider: user.AuthProvider,
		Token:        tokenStr,
	})
}

// HandleGoogleAuth handles POST /auth/google (Google OAuth 2.0 id_token verification)
func (h *AuthHandler) HandleGoogleAuth(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.GoogleAuthRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid JSON payload",
			Details: err.Error(),
		})
	}

	if req.IdToken == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "idToken is a required field",
		})
	}

	// Verify Google OAuth id_token via Google's tokeninfo API
	resp, err := http.Get(fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", req.IdToken))
	if err != nil {
		return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "Failed to verify Google token with Google OAuth servers",
			Details: err.Error(),
		})
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var info GoogleTokenInfo
	if err := json.Unmarshal(bodyBytes, &info); err != nil || info.Email == "" {
		return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "Invalid Google ID Token",
			Details: string(bodyBytes),
		})
	}

	info.Email = strings.TrimSpace(strings.ToLower(info.Email))

	// Find or Create user record in DynamoDB
	existing, _ := h.repo.GetUserByEmail(ctx, info.Email)
	var userID string
	var user models.User

	if existing != nil {
		userID = existing.ID
		user = *existing
		user.Picture = info.Picture
		user.Name = info.Name
		user.UpdatedAt = time.Now()
		_ = h.repo.CreateUser(ctx, &user)
	} else {
		userID = uuid.New().String()
		user = models.User{
			ID:           userID,
			Email:        info.Email,
			Name:         info.Name,
			Picture:      info.Picture,
			AuthProvider: "google",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		if err := h.repo.CreateUser(ctx, &user); err != nil {
			return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "Failed to create Google user account",
				Details: err.Error(),
			})
		}
	}

	tokenStr, err := h.authenticator.GenerateToken(userID)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to generate session token",
			Details: err.Error(),
		})
	}

	return jsonResponse(http.StatusOK, models.UserResponse{
		ID:           userID,
		Email:        user.Email,
		Name:         user.Name,
		Picture:      user.Picture,
		AuthProvider: "google",
		Token:        tokenStr,
	})
}

// HandleGetMe handles GET /auth/me (Retrieve authenticated user profile)
func (h *AuthHandler) HandleGetMe(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userID, err := h.authenticator.ExtractUserID(request)
	if err != nil {
		return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
			Error: "Unauthorized request",
		})
	}

	user, err := h.repo.GetUserByID(ctx, userID)
	if err != nil || user == nil {
		return jsonResponse(http.StatusOK, models.UserResponse{
			ID:           userID,
			Email:        userID + "@cdrive.dev",
			Name:         userID,
			AuthProvider: "demo",
		})
	}

	return jsonResponse(http.StatusOK, models.UserResponse{
		ID:           user.ID,
		Email:        user.Email,
		Name:         user.Name,
		Picture:      user.Picture,
		AuthProvider: user.AuthProvider,
	})
}
