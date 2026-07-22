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
			}, nil
		},
	}

	handler := NewFolderHandler(mockRepo)

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

	var folderResp models.ListFolderResponse
	if err := json.Unmarshal([]byte(response.Body), &folderResp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if folderResp.FolderID != "ROOT" {
		t.Errorf("expected folderId 'ROOT', got '%s'", folderResp.FolderID)
	}

	if len(folderResp.Items) != 1 {
		t.Errorf("expected 1 item, got %d", len(folderResp.Items))
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

	handler := NewFolderHandler(mockRepo)

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

	handler := NewFolderHandler(mockRepo)

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
