package repository

import (
	"context"
	"fmt"
	"time"

	"cdrive-backend/pkg/models"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// Repository defines data access methods for single-table operations
type Repository interface {
	PutItem(ctx context.Context, item models.DriveItem) error
	GetItem(ctx context.Context, pk string, sk string) (*models.DriveItem, error)
	GetItemsByUserID(ctx context.Context, userID string) ([]models.DriveItem, error)
	GetItemsByFolderID(ctx context.Context, folderID string) ([]models.DriveItem, error)
	UpdateFavoriteStatus(ctx context.Context, pk string, sk string, isFavorite bool) error
	UpdateTrashStatus(ctx context.Context, pk string, sk string, isTrashed bool) error
	DeleteItem(ctx context.Context, pk string, sk string) error
	CreateUser(ctx context.Context, user *models.User) error
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByID(ctx context.Context, userID string) (*models.User, error)
}

type DynamoRepository struct {
	client    *dynamodb.Client
	tableName string
	gsiName   string
}

func NewDynamoRepository(client *dynamodb.Client, tableName string, gsiName string) *DynamoRepository {
	return &DynamoRepository{
		client:    client,
		tableName: tableName,
		gsiName:   gsiName,
	}
}

// PutItem writes a DriveItem entity to DynamoDB
func (r *DynamoRepository) PutItem(ctx context.Context, item models.DriveItem) error {
	av, err := attributevalue.MarshalMap(item)
	if err != nil {
		return fmt.Errorf("failed to marshal item: %w", err)
	}

	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      av,
	})
	if err != nil {
		return fmt.Errorf("failed to put item to DynamoDB: %w", err)
	}

	return nil
}

// GetItem retrieves a single DriveItem by PK and SK
func (r *DynamoRepository) GetItem(ctx context.Context, pk string, sk string) (*models.DriveItem, error) {
	result, err := r.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: pk},
			"SK": &types.AttributeValueMemberS{Value: sk},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item from DynamoDB: %w", err)
	}

	if result.Item == nil {
		return nil, nil
	}

	var item models.DriveItem
	if err := attributevalue.UnmarshalMap(result.Item, &item); err != nil {
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}

	return &item, nil
}

// GetItemsByUserID queries all files and folders owned by a specific user (PK = USER#<UserID>)
func (r *DynamoRepository) GetItemsByUserID(ctx context.Context, userID string) ([]models.DriveItem, error) {
	pk := "USER#" + userID
	input := &dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		KeyConditionExpression: aws.String("PK = :pk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: pk},
		},
	}

	result, err := r.client.Query(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to query DynamoDB by UserID: %w", err)
	}

	var allItems []models.DriveItem
	err = attributevalue.UnmarshalListOfMaps(result.Items, &allItems)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal query items: %w", err)
	}

	var driveItems []models.DriveItem
	for _, item := range allItems {
		if item.Type == "FILE" || item.Type == "FOLDER" {
			driveItems = append(driveItems, item)
		}
	}

	return driveItems, nil
}

// GetItemsByFolderID queries items matching a specific FolderID using the FolderIdIndex GSI
func (r *DynamoRepository) GetItemsByFolderID(ctx context.Context, folderID string) ([]models.DriveItem, error) {
	input := &dynamodb.QueryInput{
		TableName:              aws.String(r.tableName),
		IndexName:              aws.String(r.gsiName),
		KeyConditionExpression: aws.String("FolderID = :folderId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":folderId": &types.AttributeValueMemberS{Value: folderID},
		},
	}

	result, err := r.client.Query(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to query DynamoDB GSI FolderIdIndex: %w", err)
	}

	var items []models.DriveItem
	err = attributevalue.UnmarshalListOfMaps(result.Items, &items)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal query items: %w", err)
	}

	return items, nil
}

// UpdateFavoriteStatus updates the IsFavorite attribute of a DriveItem
func (r *DynamoRepository) UpdateFavoriteStatus(ctx context.Context, pk string, sk string, isFavorite bool) error {
	_, err := r.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: pk},
			"SK": &types.AttributeValueMemberS{Value: sk},
		},
		UpdateExpression: aws.String("SET IsFavorite = :fav"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":fav": &types.AttributeValueMemberBOOL{Value: isFavorite},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to update favorite status: %w", err)
	}
	return nil
}

// UpdateTrashStatus updates the IsTrashed attribute of a DriveItem, setting a 25-day TTL when trashed
func (r *DynamoRepository) UpdateTrashStatus(ctx context.Context, pk string, sk string, isTrashed bool) error {
	var updateExpression string
	var exprValues map[string]types.AttributeValue

	if isTrashed {
		now := time.Now()
		ttlSeconds := now.Add(25 * 24 * time.Hour).Unix()
		updateExpression = "SET IsTrashed = :trashed, TrashedAt = :trashedAt, TTL = :ttl"
		exprValues = map[string]types.AttributeValue{
			":trashed":   &types.AttributeValueMemberBOOL{Value: true},
			":trashedAt": &types.AttributeValueMemberS{Value: now.Format(time.RFC3339)},
			":ttl":       &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", ttlSeconds)},
		}
	} else {
		updateExpression = "SET IsTrashed = :trashed REMOVE TrashedAt, TTL"
		exprValues = map[string]types.AttributeValue{
			":trashed": &types.AttributeValueMemberBOOL{Value: false},
		}
	}

	_, err := r.client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: pk},
			"SK": &types.AttributeValueMemberS{Value: sk},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: exprValues,
	})
	if err != nil {
		return fmt.Errorf("failed to update trash status: %w", err)
	}
	return nil
}

// DeleteItem removes a record from DynamoDB by PK and SK
func (r *DynamoRepository) DeleteItem(ctx context.Context, pk string, sk string) error {
	_, err := r.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: pk},
			"SK": &types.AttributeValueMemberS{Value: sk},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete item from DynamoDB: %w", err)
	}
	return nil
}

// CreateUser saves a User entity to DynamoDB (PK: USER#<UserID>, SK: METADATA#<UserID>)
func (r *DynamoRepository) CreateUser(ctx context.Context, user *models.User) error {
	user.PK = "USER#" + user.ID
	user.SK = "METADATA#" + user.ID

	av, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("failed to marshal user: %w", err)
	}

	_, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(r.tableName),
		Item:      av,
	})
	if err != nil {
		return fmt.Errorf("failed to create user in DynamoDB: %w", err)
	}
	return nil
}

// GetUserByID retrieves a User profile by UserID
func (r *DynamoRepository) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	pk := "USER#" + userID
	sk := "METADATA#" + userID

	result, err := r.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: pk},
			"SK": &types.AttributeValueMemberS{Value: sk},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if result.Item == nil {
		return nil, nil
	}

	var user models.User
	if err := attributevalue.UnmarshalMap(result.Item, &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}
	return &user, nil
}

// GetUserByEmail queries a user record by Email attribute
func (r *DynamoRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	input := &dynamodb.ScanInput{
		TableName:        aws.String(r.tableName),
		FilterExpression: aws.String("Email = :email"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":email": &types.AttributeValueMemberS{Value: email},
		},
	}

	result, err := r.client.Scan(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to scan for user by email: %w", err)
	}

	if len(result.Items) == 0 {
		return nil, nil
	}

	var user models.User
	if err := attributevalue.UnmarshalMap(result.Items[0], &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal user by email: %w", err)
	}
	return &user, nil
}
