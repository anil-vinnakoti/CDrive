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

func TestHandleDelete_FileSuccess(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("user_123")

	s3Deleted := false
	dynamoDeleted := false

	mockRepo := &MockRepo{
		GetItemFunc: func(ctx context.Context, pk, sk string) (*models.DriveItem, error) {
			return &models.DriveItem{
				PK:    pk,
				SK:    sk,
				ID:    "file_123",
				S3Key: "user_123/file_123/file.pdf",
			}, nil
		},
		DeleteItemFunc: func(ctx context.Context, pk, sk string) error {
			dynamoDeleted = true
			return nil
		},
	}

	mockStorage := &MockStorage{
		DeleteObjectFunc: func(ctx context.Context, key string) error {
			s3Deleted = true
			return nil
		},
	}

	handler := NewDeleteHandler(mockRepo, mockStorage, jwtAuth)

	payload := models.DeleteItemRequest{
		ItemID: "file_123",
		Type:   "FILE",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
	}

	response, err := handler.HandleDelete(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}

	if !s3Deleted {
		t.Error("expected S3 DeleteObject to be called")
	}

	if !dynamoDeleted {
		t.Error("expected DynamoDB DeleteItem to be called")
	}
}

func TestHandleDelete_FolderSuccess(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("user_123")

	dynamoDeleted := false

	mockRepo := &MockRepo{
		DeleteItemFunc: func(ctx context.Context, pk, sk string) error {
			dynamoDeleted = true
			return nil
		},
	}

	handler := NewDeleteHandler(mockRepo, &MockStorage{}, jwtAuth)

	payload := models.DeleteItemRequest{
		ItemID: "folder_456",
		Type:   "FOLDER",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
	}

	response, err := handler.HandleDelete(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}

	if !dynamoDeleted {
		t.Error("expected DynamoDB DeleteItem to be called")
	}
}

func TestHandleDelete_MissingRequiredFields(t *testing.T) {
	handler := NewDeleteHandler(&MockRepo{}, &MockStorage{}, nil)

	payload := models.DeleteItemRequest{
		UserID: "",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleDelete(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", response.StatusCode)
	}
}
