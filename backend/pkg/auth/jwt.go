package auth

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrMissingToken = errors.New("missing authorization header")
	ErrInvalidToken = errors.New("invalid or expired token")
)

// Claims represents the JWT claims payload
type Claims struct {
	UserID string `json:"userId"`
	jwt.RegisteredClaims
}

// Authenticator defines methods for JWT operations
type Authenticator interface {
	GenerateToken(userID string) (string, error)
	ValidateToken(tokenStr string) (*Claims, error)
	ExtractUserID(request events.APIGatewayV2HTTPRequest) (string, error)
}

type JWTAuth struct {
	secretKey []byte
}

func NewJWTAuth(secret string) *JWTAuth {
	if secret == "" {
		secret = "cdrive-dev-secret-key-2026"
	}
	return &JWTAuth{
		secretKey: []byte(secret),
	}
}

// GenerateToken creates a signed JWT token valid for 24 hours
func (j *JWTAuth) GenerateToken(userID string) (string, error) {
	if userID == "" {
		return "", errors.New("userId cannot be empty")
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "cdrive-auth-service",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(j.secretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken parses and validates a JWT token string
func (j *JWTAuth) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secretKey, nil
	})

	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || claims.UserID == "" {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ExtractUserID extracts and validates the JWT Bearer token from APIGatewayV2HTTPRequest headers
func (j *JWTAuth) ExtractUserID(request events.APIGatewayV2HTTPRequest) (string, error) {
	authHeader := ""
	for key, val := range request.Headers {
		if strings.ToLower(key) == "authorization" {
			authHeader = val
			break
		}
	}

	if authHeader == "" {
		return "", ErrMissingToken
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", ErrInvalidToken
	}

	tokenStr := strings.TrimSpace(parts[1])
	claims, err := j.ValidateToken(tokenStr)
	if err != nil {
		return "", err
	}

	return claims.UserID, nil
}
