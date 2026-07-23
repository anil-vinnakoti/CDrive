package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"cdrive-backend/pkg/auth"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandleTokenGen_Success(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	handler := NewAuthHandler(jwtAuth)

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

	var tokenResp TokenResponse
	if err := json.Unmarshal([]byte(response.Body), &tokenResp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if tokenResp.Token == "" {
		t.Error("expected non-empty token string")
	}

	if tokenResp.UserID != "user_test_99" {
		t.Errorf("expected userId 'user_test_99', got '%s'", tokenResp.UserID)
	}
}

func TestHandleTokenGen_MissingUserID(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	handler := NewAuthHandler(jwtAuth)

	payload := TokenRequest{
		UserID: "",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleTokenGen(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", response.StatusCode)
	}
}
