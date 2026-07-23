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

func TestCreateFolder_Success(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("user_123")

	folderSaved := false

	mockRepo := &MockRepo{
		PutItemFunc: func(ctx context.Context, item models.DriveItem) error {
			folderSaved = true
			if item.Type != "FOLDER" {
				t.Errorf("expected item.Type 'FOLDER', got '%s'", item.Type)
			}
			if item.Name != "Documents" {
				t.Errorf("expected item.Name 'Documents', got '%s'", item.Name)
			}
			return nil
		},
	}

	handler := NewFolderHandler(mockRepo, jwtAuth)

	payload := models.CreateFolderRequest{
		Name:     "Documents",
		FolderID: "ROOT",
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
	}

	response, err := handler.CreateFolder(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201, got %d", response.StatusCode)
	}

	if !folderSaved {
		t.Error("expected folder item to be saved in DynamoDB")
	}
}

func TestCreateFolder_MissingName(t *testing.T) {
	handler := NewFolderHandler(&MockRepo{}, nil)

	payload := models.CreateFolderRequest{
		UserID: "user_123",
		Name:   "", // Invalid
	}

	bodyBytes, _ := json.Marshal(payload)
	request := events.APIGatewayV2HTTPRequest{
		Body: string(bodyBytes),
	}

	response, err := handler.CreateFolder(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if response.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", response.StatusCode)
	}
}
