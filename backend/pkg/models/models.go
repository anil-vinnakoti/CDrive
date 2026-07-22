package models

import "time"

// DriveItem represents a file or folder record stored in DynamoDB
type DriveItem struct {
	PK          string    `dynamodbav:"PK" json:"pk"`
	SK          string    `dynamodbav:"SK" json:"sk"`
	ID          string    `dynamodbav:"ID" json:"id"`
	UserID      string    `dynamodbav:"UserID" json:"userId"`
	FolderID    string    `dynamodbav:"FolderID,omitempty" json:"folderId,omitempty"`
	Type        string    `dynamodbav:"Type" json:"type"` // "FILE" or "FOLDER"
	Name        string    `dynamodbav:"Name" json:"name"`
	Size        int64     `dynamodbav:"Size,omitempty" json:"size,omitempty"`
	MimeType    string    `dynamodbav:"MimeType,omitempty" json:"mimeType,omitempty"`
	S3Key       string    `dynamodbav:"S3Key,omitempty" json:"s3Key,omitempty"`
	CreatedAt   time.Time `dynamodbav:"CreatedAt" json:"createdAt"`
	UpdatedAt   time.Time `dynamodbav:"UpdatedAt" json:"updatedAt"`
}

// UploadRequest represents the payload to request a presigned upload URL
type UploadRequest struct {
	UserID   string `json:"userId"`
	FileName string `json:"fileName"`
	FolderID string `json:"folderId"`
	Size     int64  `json:"size"`
	MimeType string `json:"mimeType"`
}

// UploadResponse represents the response containing the S3 presigned URL and file item metadata
type UploadResponse struct {
	UploadURL string     `json:"uploadUrl"`
	ExpiresIn int        `json:"expiresInSeconds"`
	Item      *DriveItem `json:"item"`
}

// CreateFolderRequest represents the payload to create a new folder
type CreateFolderRequest struct {
	UserID   string `json:"userId"`
	Name     string `json:"name"`
	FolderID string `json:"folderId"` // Parent folder ID, optional
}

// ListFolderResponse represents the payload returned when querying folder contents
type ListFolderResponse struct {
	FolderID string      `json:"folderId"`
	Items    []DriveItem `json:"items"`
}

// ErrorResponse standardizes error HTTP bodies
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
