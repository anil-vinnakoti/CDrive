package storage

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// Storage defines storage operation methods
type Storage interface {
	GeneratePresignedPutURL(ctx context.Context, key string, contentType string) (string, error)
	GeneratePresignedGetURL(ctx context.Context, key string) (string, error)
	DeleteObject(ctx context.Context, key string) error
}

type S3Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	bucketName    string
}

func NewS3Storage(client *s3.Client, bucketName string) *S3Storage {
	return &S3Storage{
		client:        client,
		presignClient: s3.NewPresignClient(client),
		bucketName:    bucketName,
	}
}

// GeneratePresignedPutURL creates a 5-minute pre-signed PUT URL for uploading a file to S3
func (s *S3Storage) GeneratePresignedPutURL(ctx context.Context, key string, contentType string) (string, error) {
	const expiryDuration = 5 * time.Minute

	req, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:       aws.String(s.bucketName),
		Key:          aws.String(key),
		ContentType:  aws.String(contentType),
		StorageClass: types.StorageClassIntelligentTiering,
	}, s3.WithPresignExpires(expiryDuration))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned upload URL: %w", err)
	}

	return req.URL, nil
}

// GeneratePresignedGetURL creates a 5-minute pre-signed GET URL for downloading or viewing a file in S3
func (s *S3Storage) GeneratePresignedGetURL(ctx context.Context, key string) (string, error) {
	const expiryDuration = 5 * time.Minute

	req, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiryDuration))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned download URL: %w", err)
	}

	return req.URL, nil
}

// DeleteObject deletes a file object from the S3 storage bucket
func (s *S3Storage) DeleteObject(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		// Ignore NoSuchBucket/NoSuchKey or local dev S3 missing bucket errors so DynamoDB deletion proceeds
		if strings.Contains(err.Error(), "NoSuchBucket") || strings.Contains(err.Error(), "NoSuchKey") || os.Getenv("AWS_SAM_LOCAL") == "true" {
			return nil
		}
		return fmt.Errorf("failed to delete object from S3: %w", err)
	}
	return nil
}
