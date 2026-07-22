package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"cdrive-backend/pkg/models"

	"github.com/aws/aws-lambda-go/events"
)

// MockRepo mocks the DynamoDB repository interface
type MockRepo struct {
	PutItemFunc            func(ctx context.Context, item models.DriveItem) error
	GetItemsByFolderIDFunc func(ctx context.Context, folderID string) ([]models.DriveItem, error)
}

func (m *MockRepo) PutItem(ctx context.Context, item models.DriveItem) error {
	if m.PutItemFunc != nil {
		return m.PutItemFunc(ctx, item)
	}
	return nil
}

func (m *MockRepo) GetItemsByFolderID(ctx context.Context, folderID string) ([]models.DriveItem, error) {
	if m.GetItemsByFolderIDFunc != nil {
		return m.GetItemsByFolderIDFunc(ctx, folderID)
	}
	return []models.DriveItem{}, nil
}

// MockStorage mocks the S3 storage interface
type MockStorage struct {
	GeneratePresignedPutURLFunc func(ctx context.Context, key string, contentType string) (string, error)
}

func (m *MockStorage) GeneratePresignedPutURL(ctx context.Context, key string, contentType string) (string, error) {
	if m.GeneratePresignedPutURLFunc != nil {
		return m.GeneratePresignedPutURLFunc(ctx, key, contentType)
	}
	return "https://mock-s3-bucket.s3.amazonaws.com/test-key", nil
}

func TestHandleUploadProcess_Success(t *testing.T) {
	mockRepo := &MockRepo{}
	mockStore := &MockStorage{}
	handler := NewUploadHandler(mockRepo, mockStore)

	payload := models.UploadRequest{
		UserID:   "user_test_123",
		FileName: "test_doc.pdf",
		FolderID: "ROOT",
		Size:     1024,
		MimeType: "application/pdf",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleUploadProcess(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201, got %d", response.StatusCode)
	}

	var uploadResp models.UploadResponse
	if err := json.Unmarshal([]byte(response.Body), &uploadResp); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}

	if uploadResp.UploadURL == "" {
		t.Error("expected non-empty uploadUrl")
	}

	if uploadResp.Item.UserID != "user_test_123" {
		t.Errorf("expected userId 'user_test_123', got '%s'", uploadResp.Item.UserID)
	}
}

func TestHandleUploadProcess_MissingRequiredFields(t *testing.T) {
	mockRepo := &MockRepo{}
	mockStore := &MockStorage{}
	handler := NewUploadHandler(mockRepo, mockStore)

	payload := models.UploadRequest{
		UserID: "", // Invalid
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleUploadProcess(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", response.StatusCode)
	}
}

func TestHandleUploadProcess_S3PresignError(t *testing.T) {
	mockRepo := &MockRepo{}
	mockStore := &MockStorage{
		GeneratePresignedPutURLFunc: func(ctx context.Context, key string, contentType string) (string, error) {
			return "", errors.New("S3 presign error")
		},
	}
	handler := NewUploadHandler(mockRepo, mockStore)

	payload := models.UploadRequest{
		UserID:   "user_123",
		FileName: "file.txt",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.HandleUploadProcess(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", response.StatusCode)
	}
}
