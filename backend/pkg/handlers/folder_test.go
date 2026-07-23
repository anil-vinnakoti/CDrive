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

func TestListFolderContents_Success(t *testing.T) {
	mockRepo := &MockRepo{
		GetItemsByFolderIDFunc: func(ctx context.Context, folderID string) ([]models.DriveItem, error) {
			return []models.DriveItem{
				{
					ID:       "item_1",
					Name:     "test_file.txt",
					Type:     "FILE",
					FolderID: folderID,
				},
				{
					ID:       "folder_1",
					Name:     "Docs",
					Type:     "FOLDER",
					FolderID: folderID,
				},
			}, nil
		},
	}

	handler := NewFolderHandler(mockRepo, nil)

	request := events.APIGatewayV2HTTPRequest{
		QueryStringParameters: map[string]string{
			"folderId": "ROOT",
		},
	}

	response, err := handler.ListFolderContents(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}

	var driveResp models.ListUserDriveResponse
	if err := json.Unmarshal([]byte(response.Body), &driveResp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if driveResp.FolderID != "ROOT" {
		t.Errorf("expected folderId 'ROOT', got '%s'", driveResp.FolderID)
	}

	if len(driveResp.Files) != 1 {
		t.Errorf("expected 1 file, got %d", len(driveResp.Files))
	}

	if len(driveResp.Folders) != 1 {
		t.Errorf("expected 1 folder, got %d", len(driveResp.Folders))
	}
}

func TestListFolderContents_AllUserItems(t *testing.T) {
	mockRepo := &MockRepo{
		GetItemsByUserIDFunc: func(ctx context.Context, userID string) ([]models.DriveItem, error) {
			if userID != "user_123" {
				t.Errorf("expected userId 'user_123', got '%s'", userID)
			}
			return []models.DriveItem{
				{ID: "f1", Name: "File 1", Type: "FILE"},
				{ID: "f2", Name: "Folder 1", Type: "FOLDER"},
			}, nil
		},
	}

	handler := NewFolderHandler(mockRepo, nil)

	request := events.APIGatewayV2HTTPRequest{
		QueryStringParameters: map[string]string{
			"userId": "user_123",
		},
	}

	response, err := handler.ListFolderContents(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}

	var driveResp models.ListUserDriveResponse
	if err := json.Unmarshal([]byte(response.Body), &driveResp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if driveResp.Count != 2 {
		t.Errorf("expected count 2, got %d", driveResp.Count)
	}
}

func TestListFolderContents_DefaultRoot(t *testing.T) {
	mockRepo := &MockRepo{
		GetItemsByFolderIDFunc: func(ctx context.Context, folderID string) ([]models.DriveItem, error) {
			if folderID != "ROOT" {
				t.Errorf("expected folderId default to 'ROOT', got '%s'", folderID)
			}
			return []models.DriveItem{}, nil
		},
	}

	handler := NewFolderHandler(mockRepo, nil)

	request := events.APIGatewayV2HTTPRequest{}

	response, err := handler.ListFolderContents(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", response.StatusCode)
	}
}

func TestListFolderContents_RepositoryError(t *testing.T) {
	mockRepo := &MockRepo{
		GetItemsByFolderIDFunc: func(ctx context.Context, folderID string) ([]models.DriveItem, error) {
			return nil, errors.New("dynamo query error")
		},
	}

	handler := NewFolderHandler(mockRepo, nil)

	request := events.APIGatewayV2HTTPRequest{
		QueryStringParameters: map[string]string{"folderId": "ROOT"},
	}

	response, err := handler.ListFolderContents(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", response.StatusCode)
	}
}
