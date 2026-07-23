package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
)

type FolderHandler struct {
	repo repository.Repository
}

func NewFolderHandler(repo repository.Repository) *FolderHandler {
	return &FolderHandler{
		repo: repo,
	}
}

// CreateFolder handles POST requests to create a new folder entity in DynamoDB
func (h *FolderHandler) CreateFolder(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var req models.CreateFolderRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid request body",
			Details: err.Error(),
		})
	}

	if req.UserID == "" || req.Name == "" {
		return jsonResponse(http.StatusBadRequest, models.ErrorResponse{
			Error: "userId and name are required fields",
		})
	}

	parentFolderID := req.FolderID
	if parentFolderID == "" {
		parentFolderID = "ROOT"
	}

	folderID := uuid.New().String()
	now := time.Now().UTC()

	pk := "USER#" + req.UserID
	sk := "FOLDER#" + folderID

	folderItem := models.DriveItem{
		PK:        pk,
		SK:        sk,
		ID:        folderID,
		UserID:    req.UserID,
		FolderID:  parentFolderID,
		Type:      "FOLDER",
		Name:      req.Name,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := h.repo.PutItem(ctx, folderItem); err != nil {
		return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to create folder",
			Details: err.Error(),
		})
	}

	return jsonResponse(http.StatusCreated, folderItem)
}

// ListFolderContents handles GET requests to list files and subfolders.
// If userId is passed without folderId, retrieves all files & folders for that user across the entire drive.
// If folderId is passed, queries items inside that specific folder using FolderIdIndex GSI.
func (h *FolderHandler) ListFolderContents(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userID := request.QueryStringParameters["userId"]
	folderID := request.QueryStringParameters["folderId"]
	if folderID == "" {
		if val, exists := request.PathParameters["folderId"]; exists {
			folderID = val
		}
	}

	var rawItems []models.DriveItem
	var err error

	if userID != "" && folderID == "" {
		rawItems, err = h.repo.GetItemsByUserID(ctx, userID)
		if err != nil {
			return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "Failed to list user items",
				Details: err.Error(),
			})
		}
	} else {
		if folderID == "" {
			folderID = "ROOT"
		}
		rawItems, err = h.repo.GetItemsByFolderID(ctx, folderID)
		if err != nil {
			return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "Failed to list folder contents",
				Details: err.Error(),
			})
		}
	}

	files := []models.DriveItem{}
	folders := []models.DriveItem{}
	if rawItems == nil {
		rawItems = []models.DriveItem{}
	}

	for _, item := range rawItems {
		if item.Type == "FILE" {
			files = append(files, item)
		} else if item.Type == "FOLDER" {
			folders = append(folders, item)
		}
	}

	resp := models.ListUserDriveResponse{
		UserID:   userID,
		FolderID: folderID,
		Count:    len(rawItems),
		Files:    files,
		Folders:  folders,
		Items:    rawItems,
	}

	return jsonResponse(http.StatusOK, resp)
}
