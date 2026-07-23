package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandleTokenGen_Success(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	mockRepo := &MockRepo{}
	handler := NewAuthHandler(mockRepo, jwtAuth)

	type TokenRequest struct {
		UserID string `json:"userId"`
	}

	payload := TokenRequest{
		UserID: "user_test_99",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleTokenGen(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}

	var userResp models.UserResponse
	if err := json.Unmarshal([]byte(response.Body), &userResp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if userResp.Token == "" {
		t.Error("expected non-empty token string")
	}

	if userResp.ID != "user_test_99" {
		t.Errorf("expected userId 'user_test_99', got '%s'", userResp.ID)
	}
}

func TestHandleSignUp_Success(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	mockRepo := &MockRepo{}
	handler := NewAuthHandler(mockRepo, jwtAuth)

	payload := models.SignUpRequest{
		Email:    "newuser@example.com",
		Password: "password123",
		Name:     "New User",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleSignUp(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201, got %d", response.StatusCode)
	}

	var userResp models.UserResponse
	if err := json.Unmarshal([]byte(response.Body), &userResp); err != nil {
		t.Fatalf("failed to parse signup response: %v", err)
	}

	if userResp.Email != "newuser@example.com" {
		t.Errorf("expected email 'newuser@example.com', got '%s'", userResp.Email)
	}
}
