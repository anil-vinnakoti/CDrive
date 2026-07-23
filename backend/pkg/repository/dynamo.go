package repository

import (
	"context"
	"fmt"

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
	DeleteItem(ctx context.Context, pk string, sk string) error
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
