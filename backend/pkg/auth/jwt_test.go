package auth

import (
	"testing"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateAndValidateToken_Success(t *testing.T) {
	jwtAuth := NewJWTAuth("test-secret")

	tokenStr, err := jwtAuth.GenerateToken("user_123")
	if err != nil {
		t.Fatalf("unexpected error generating token: %v", err)
	}

	if tokenStr == "" {
		t.Fatal("expected non-empty token string")
	}

	claims, err := jwtAuth.ValidateToken(tokenStr)
	if err != nil {
		t.Fatalf("unexpected error validating token: %v", err)
	}

	if claims.UserID != "user_123" {
		t.Errorf("expected userId 'user_123', got '%s'", claims.UserID)
	}
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	secret := []byte("test-secret")
	claims := &Claims{
		UserID: "user_123",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(secret)

	jwtAuth := NewJWTAuth("test-secret")
	_, err := jwtAuth.ValidateToken(tokenStr)
	if err != ErrInvalidToken {
		t.Errorf("expected ErrInvalidToken, got %v", err)
	}
}

func TestExtractUserID_Success(t *testing.T) {
	jwtAuth := NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("user_abc")

	req := events.APIGatewayV2HTTPRequest{
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
	}

	userID, err := jwtAuth.ExtractUserID(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if userID != "user_abc" {
		t.Errorf("expected 'user_abc', got '%s'", userID)
	}
}

func TestExtractUserID_MissingHeader(t *testing.T) {
	jwtAuth := NewJWTAuth("test-secret")
	req := events.APIGatewayV2HTTPRequest{}

	_, err := jwtAuth.ExtractUserID(req)
	if err != ErrMissingToken {
		t.Errorf("expected ErrMissingToken, got %v", err)
	}
}
