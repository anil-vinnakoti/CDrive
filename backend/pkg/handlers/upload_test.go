package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"

	"github.com/aws/aws-lambda-go/events"
)

// MockRepo mocks the DynamoDB repository interface
type MockRepo struct {
	PutItemFunc              func(ctx context.Context, item models.DriveItem) error
	GetItemFunc              func(ctx context.Context, pk, sk string) (*models.DriveItem, error)
	GetItemsByUserIDFunc     func(ctx context.Context, userID string) ([]models.DriveItem, error)
	GetItemsByFolderIDFunc   func(ctx context.Context, folderID string) ([]models.DriveItem, error)
	UpdateFavoriteStatusFunc func(ctx context.Context, pk, sk string, isFavorite bool) error
	UpdateTrashStatusFunc    func(ctx context.Context, pk, sk string, isTrashed bool) error
	DeleteItemFunc           func(ctx context.Context, pk, sk string) error
}

func (m *MockRepo) PutItem(ctx context.Context, item models.DriveItem) error {
	if m.PutItemFunc != nil {
		return m.PutItemFunc(ctx, item)
	}
	return nil
}

func (m *MockRepo) GetItem(ctx context.Context, pk, sk string) (*models.DriveItem, error) {
	if m.GetItemFunc != nil {
		return m.GetItemFunc(ctx, pk, sk)
	}
	return nil, nil
}

func (m *MockRepo) GetItemsByUserID(ctx context.Context, userID string) ([]models.DriveItem, error) {
	if m.GetItemsByUserIDFunc != nil {
		return m.GetItemsByUserIDFunc(ctx, userID)
	}
	return []models.DriveItem{}, nil
}

func (m *MockRepo) GetItemsByFolderID(ctx context.Context, folderID string) ([]models.DriveItem, error) {
	if m.GetItemsByFolderIDFunc != nil {
		return m.GetItemsByFolderIDFunc(ctx, folderID)
	}
	return []models.DriveItem{}, nil
}

func (m *MockRepo) UpdateFavoriteStatus(ctx context.Context, pk, sk string, isFavorite bool) error {
	if m.UpdateFavoriteStatusFunc != nil {
		return m.UpdateFavoriteStatusFunc(ctx, pk, sk, isFavorite)
	}
	return nil
}

func (m *MockRepo) UpdateTrashStatus(ctx context.Context, pk, sk string, isTrashed bool) error {
	if m.UpdateTrashStatusFunc != nil {
		return m.UpdateTrashStatusFunc(ctx, pk, sk, isTrashed)
	}
	return nil
}

func (m *MockRepo) DeleteItem(ctx context.Context, pk, sk string) error {
	if m.DeleteItemFunc != nil {
		return m.DeleteItemFunc(ctx, pk, sk)
	}
	return nil
}

func (m *MockRepo) CreateUser(ctx context.Context, user *models.User) error {
	return nil
}

func (m *MockRepo) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	return nil, nil
}

func (m *MockRepo) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	return nil, nil
}

// MockStorage mocks the S3 storage interface
type MockStorage struct {
	GeneratePresignedPutURLFunc func(ctx context.Context, key string, contentType string) (string, error)
	GeneratePresignedGetURLFunc func(ctx context.Context, key string) (string, error)
	DeleteObjectFunc            func(ctx context.Context, key string) error
}

func (m *MockStorage) GeneratePresignedPutURL(ctx context.Context, key string, contentType string) (string, error) {
	if m.GeneratePresignedPutURLFunc != nil {
		return m.GeneratePresignedPutURLFunc(ctx, key, contentType)
	}
	return "https://mock-s3-bucket.s3.amazonaws.com/test-key", nil
}

func (m *MockStorage) GeneratePresignedGetURL(ctx context.Context, key string) (string, error) {
	if m.GeneratePresignedGetURLFunc != nil {
		return m.GeneratePresignedGetURLFunc(ctx, key)
	}
	return "https://mock-s3-bucket.s3.amazonaws.com/test-key?get=true", nil
}

func (m *MockStorage) DeleteObject(ctx context.Context, key string) error {
	if m.DeleteObjectFunc != nil {
		return m.DeleteObjectFunc(ctx, key)
	}
	return nil
}

func TestHandleUploadProcess_Success(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("user_test_123")

	mockRepo := &MockRepo{}
	mockStore := &MockStorage{}
	handler := NewUploadHandler(mockRepo, mockStore, jwtAuth)

	payload := models.UploadRequest{
		FileName: "test_doc.pdf",
		FolderID: "ROOT",
		Size:     1024,
		MimeType: "application/pdf",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
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

func TestHandleUploadProcess_Unauthorized(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	handler := NewUploadHandler(&MockRepo{}, &MockStorage{}, jwtAuth)

	payload := models.UploadRequest{
		FileName: "file.pdf",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes), // Missing Authorization header
	}

	response, err := handler.HandleUploadProcess(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", response.StatusCode)
	}
}

func TestHandleUploadProcess_MissingRequiredFields(t *testing.T) {
	handler := NewUploadHandler(&MockRepo{}, &MockStorage{}, nil)

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
	jwtAuth := auth.NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("user_123")

	mockRepo := &MockRepo{}
	mockStore := &MockStorage{
		GeneratePresignedPutURLFunc: func(ctx context.Context, key string, contentType string) (string, error) {
			return "", errors.New("S3 presign error")
		},
	}
	handler := NewUploadHandler(mockRepo, mockStore, jwtAuth)

	payload := models.UploadRequest{
		FileName: "file.txt",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
	}

	response, err := handler.HandleUploadProcess(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", response.StatusCode)
	}
}
