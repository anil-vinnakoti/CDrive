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

func TestHandleRename_Success(t *testing.T) {
	jwtAuth := auth.NewJWTAuth("test-secret")
	tokenStr, _ := jwtAuth.GenerateToken("test-user")

	mockRepo := &MockRepo{
		UpdateItemNameFunc: func(ctx context.Context, pk, sk, newName string) error {
			if pk != "USER#test-user" || sk != "FILE#item-123" || newName != "new_name.pdf" {
				t.Fatalf("unexpected arguments: pk=%s, sk=%s, newName=%s", pk, sk, newName)
			}
			return nil
		},
	}

	handler := NewRenameHandler(mockRepo, jwtAuth)

	reqBody, _ := json.Marshal(models.RenameItemRequest{
		ItemID:  "item-123",
		Type:    "FILE",
		NewName: "new_name.pdf",
	})

	resp, err := handler.HandleRename(context.Background(), events.APIGatewayV2HTTPRequest{
		Body: string(reqBody),
		Headers: map[string]string{
			"authorization": "Bearer " + tokenStr,
		},
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}
}

func TestHandleRename_MissingFields(t *testing.T) {
	mockRepo := &MockRepo{}

	handler := NewRenameHandler(mockRepo, nil)

	reqBody, _ := json.Marshal(models.RenameItemRequest{
		UserID:  "test-user",
		ItemID:  "item-123",
		Type:    "FILE",
		NewName: "",
	})

	resp, err := handler.HandleRename(context.Background(), events.APIGatewayV2HTTPRequest{
		Body: string(reqBody),
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.StatusCode)
	}
}
