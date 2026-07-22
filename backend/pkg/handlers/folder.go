package handlers

import (
	"context"
	"net/http"

	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
)

type FolderHandler struct {
	repo *repository.DynamoRepository
}

func NewFolderHandler(repo *repository.DynamoRepository) *FolderHandler {
	return &FolderHandler{
		repo: repo,
	}
}

// ListFolderContents handles GET requests to list files and subfolders within a specific folder using the FolderIdIndex GSI
func (h *FolderHandler) ListFolderContents(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	folderID := request.QueryStringParameters["folderId"]
	if folderID == "" {
		if val, exists := request.PathParameters["folderId"]; exists {
			folderID = val
		}
	}

	if folderID == "" {
		folderID = "ROOT" // Default to ROOT if not provided
	}

	items, err := h.repo.GetItemsByFolderID(ctx, folderID)
	if err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to list folder contents",
			Details: err.Error(),
		})
	}

	if items == nil {
		items = []models.DriveItem{}
	}

	resp := models.ListFolderResponse{
		FolderID: folderID,
		Items:    items,
	}

	return jsonResponse(http.StatusOK, resp)
}
