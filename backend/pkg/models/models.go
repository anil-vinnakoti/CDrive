package models

import "time"

// DriveItem represents a file or folder record stored in DynamoDB
type DriveItem struct {
	PK        string     `dynamodbav:"PK" json:"pk"`
	SK        string     `dynamodbav:"SK" json:"sk"`
	ID        string     `dynamodbav:"ID" json:"id"`
	UserID    string     `dynamodbav:"UserID" json:"userId"`
	FolderID  string     `dynamodbav:"FolderID,omitempty" json:"folderId,omitempty"`
	Type      string     `dynamodbav:"Type" json:"type"` // "FILE" or "FOLDER"
	Name      string     `dynamodbav:"Name" json:"name"`
	Size      int64      `dynamodbav:"Size,omitempty" json:"size,omitempty"`
	MimeType  string     `dynamodbav:"MimeType,omitempty" json:"mimeType,omitempty"`
	S3Key     string     `dynamodbav:"S3Key,omitempty" json:"s3Key,omitempty"`
	IsFavorite bool      `dynamodbav:"IsFavorite" json:"isFavorite"`
	IsTrashed  bool      `dynamodbav:"IsTrashed" json:"isTrashed"`
	TrashedAt *time.Time `dynamodbav:"TrashedAt,omitempty" json:"trashedAt,omitempty"`
	TTL       *int64     `dynamodbav:"TTL,omitempty" json:"ttl,omitempty"`
	CreatedAt time.Time  `dynamodbav:"CreatedAt" json:"createdAt"`
	UpdatedAt time.Time  `dynamodbav:"UpdatedAt" json:"updatedAt"`
}

// User represents a user account record stored in DynamoDB (PK: USER#<UserID>, SK: METADATA#<UserID>)
type User struct {
	PK           string    `dynamodbav:"PK" json:"pk"`
	SK           string    `dynamodbav:"SK" json:"sk"`
	ID           string    `dynamodbav:"ID" json:"id"`
	Email        string    `dynamodbav:"Email" json:"email"`
	Name         string    `dynamodbav:"Name" json:"name"`
	Picture      string    `dynamodbav:"Picture,omitempty" json:"picture,omitempty"`
	PasswordHash string    `dynamodbav:"PasswordHash,omitempty" json:"-"`
	AuthProvider string    `dynamodbav:"AuthProvider" json:"authProvider"` // "local" or "google"
	CreatedAt    time.Time `dynamodbav:"CreatedAt" json:"createdAt"`
	UpdatedAt    time.Time `dynamodbav:"UpdatedAt" json:"updatedAt"`
}

// SignUpRequest represents payload for email/password registration
type SignUpRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// AuthLoginRequest represents payload for email/password login
type AuthLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// GoogleAuthRequest represents payload for Google OAuth 2.0 token verification
type GoogleAuthRequest struct {
	IdToken string `json:"idToken"`
}

// UserResponse represents payload returned to client after successful authentication
type UserResponse struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	Picture      string `json:"picture,omitempty"`
	AuthProvider string `json:"authProvider"`
	Token        string `json:"token"`
}

// FavoriteItemRequest represents the request to star/unstar an item
type FavoriteItemRequest struct {
	UserID     string `json:"userId"`
	ItemID     string `json:"itemId"`
	Type       string `json:"type"`
	IsFavorite bool   `json:"isFavorite"`
}

// TrashItemRequest represents the request to trash or restore an item
type TrashItemRequest struct {
	UserID    string `json:"userId"`
	ItemID    string `json:"itemId"`
	Type      string `json:"type"`
	IsTrashed bool   `json:"isTrashed"`
}

// ShareItemRequest represents the payload to create a shareable expiring link
type ShareItemRequest struct {
	UserID           string `json:"userId"`
	FileID           string `json:"fileId"`
	ExpiresInSeconds int    `json:"expiresInSeconds"` // Default: 86400 (24h)
}

// ShareItemResponse represents the public share URL payload
type ShareItemResponse struct {
	ShareID     string    `json:"shareId"`
	FileID      string    `json:"fileId"`
	FileName    string    `json:"fileName"`
	DownloadURL string    `json:"downloadUrl"`
	ExpiresAt   time.Time `json:"expiresAt"`
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

// DownloadURLResponse represents the response containing the S3 presigned download URL
type DownloadURLResponse struct {
	DownloadURL string `json:"downloadUrl"`
	ExpiresIn   int    `json:"expiresInSeconds"`
}

// CreateFolderRequest represents the payload to create a new folder
type CreateFolderRequest struct {
	UserID   string `json:"userId"`
	Name     string `json:"name"`
	FolderID string `json:"folderId"` // Parent folder ID, optional
}

// DeleteItemRequest represents the payload to delete a file or folder
type DeleteItemRequest struct {
	UserID string `json:"userId"`
	ItemID string `json:"itemId"`
	Type   string `json:"type"` // "FILE" or "FOLDER"
}

// DeleteItemResponse represents the response when an item is deleted
type DeleteItemResponse struct {
	Message string `json:"message"`
	ItemID  string `json:"itemId"`
}

// ListFolderResponse represents the payload returned when querying folder contents
type ListFolderResponse struct {
	FolderID string      `json:"folderId"`
	Items    []DriveItem `json:"items"`
}

// ListUserDriveResponse represents the structured response containing files, folders, and combined items
type ListUserDriveResponse struct {
	UserID   string      `json:"userId"`
	FolderID string      `json:"folderId,omitempty"`
	Count    int         `json:"count"`
	Files    []DriveItem `json:"files"`
	Folders  []DriveItem `json:"folders"`
	Items    []DriveItem `json:"items"`
}

// ErrorResponse standardizes error HTTP bodies
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
