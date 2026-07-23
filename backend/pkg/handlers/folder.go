package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"cdrive-backend/pkg/auth"
	"cdrive-backend/pkg/models"
	"cdrive-backend/pkg/repository"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
)

type FolderHandler struct {
	repo          repository.Repository
	authenticator auth.Authenticator
}

func NewFolderHandler(repo repository.Repository, authenticator auth.Authenticator) *FolderHandler {
	return &FolderHandler{
		repo:          repo,
		authenticator: authenticator,
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

	if h.authenticator != nil {
		authenticatedUserID, err := h.authenticator.ExtractUserID(request)
		if err != nil {
			return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
				Error: "Unauthorized access: " + err.Error(),
			})
		}
		req.UserID = authenticatedUserID
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
// Strictly requires a valid JWT Bearer token and filters items by authenticated user ID.
func (h *FolderHandler) ListFolderContents(ctx context.Context, request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	folderID := request.QueryStringParameters["folderId"]
	if folderID == "" {
		if val, exists := request.PathParameters["folderId"]; exists {
			folderID = val
		}
	}

	var authenticatedUserID string
	if h.authenticator != nil {
		var err error
		authenticatedUserID, err = h.authenticator.ExtractUserID(request)
		if err != nil || authenticatedUserID == "" {
			return jsonResponse(http.StatusUnauthorized, models.ErrorResponse{
				Error: "Unauthorized access: valid Bearer authentication token is required",
			})
		}
	}

	var rawItems []models.DriveItem
	var err error

	if folderID == "" || folderID == "ALL" {
		rawItems, err = h.repo.GetItemsByUserID(ctx, authenticatedUserID)
		if err != nil {
			return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "Failed to list user items",
				Details: err.Error(),
			})
		}
	} else {
		allFolderItems, err := h.repo.GetItemsByFolderID(ctx, folderID)
		if err != nil {
			return jsonResponse(http.StatusInternalServerError, models.ErrorResponse{
				Error:   "Failed to list folder contents",
				Details: err.Error(),
			})
		}

		// Strictly filter items owned by the authenticated user ID
		for _, item := range allFolderItems {
			if item.UserID == authenticatedUserID {
				rawItems = append(rawItems, item)
			}
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
		UserID:   authenticatedUserID,
		FolderID: folderID,
		Count:    len(rawItems),
		Files:    files,
		Folders:  folders,
		Items:    rawItems,
	}

	return jsonResponse(http.StatusOK, resp)
}
