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
	GetItemsByFolderID(ctx context.Context, folderID string) ([]models.DriveItem, error)
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
