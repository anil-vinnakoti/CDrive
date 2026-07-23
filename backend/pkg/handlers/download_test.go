package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"cdrive-backend/pkg/models"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandleDownloadURL_Success(t *testing.T) {
	mockRepo := &MockRepo{
		GetItemFunc: func(ctx context.Context, pk, sk string) (*models.DriveItem, error) {
			return &models.DriveItem{
				PK:     pk,
				SK:     sk,
				ID:     "file_123",
				UserID: "user_123",
				S3Key:  "user_123/file_123/doc.pdf",
			}, nil
		},
	}

	mockStore := &MockStorage{
		GeneratePresignedGetURLFunc: func(ctx context.Context, key string) (string, error) {
			return "https://mock-s3-bucket.s3.amazonaws.com/" + key + "?signed=true", nil
		},
	}

	handler := NewDownloadHandler(mockRepo, mockStore)

	request := events.APIGatewayV2HTTPRequest{
		QueryStringParameters: map[string]string{
			"userId": "user_123",
			"fileId": "file_123",
		},
	}

	response, err := handler.HandleDownloadURL(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}

	var downloadResp models.DownloadURLResponse
	if err := json.Unmarshal([]byte(response.Body), &downloadResp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if downloadResp.DownloadURL == "" {
		t.Error("expected non-empty downloadUrl")
	}
}

func TestHandleDownloadURL_MissingQueryParams(t *testing.T) {
	handler := NewDownloadHandler(&MockRepo{}, &MockStorage{})

	request := events.APIGatewayV2HTTPRequest{}

	response, err := handler.HandleDownloadURL(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", response.StatusCode)
	}
}

func TestHandleDownloadURL_FileNotFound(t *testing.T) {
	mockRepo := &MockRepo{
		GetItemFunc: func(ctx context.Context, pk, sk string) (*models.DriveItem, error) {
			return nil, nil // Not found
		},
	}

	handler := NewDownloadHandler(mockRepo, &MockStorage{})

	request := events.APIGatewayV2HTTPRequest{
		QueryStringParameters: map[string]string{
			"userId": "user_123",
			"fileId": "non_existent",
		},
	}

	response, err := handler.HandleDownloadURL(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", response.StatusCode)
	}
}
