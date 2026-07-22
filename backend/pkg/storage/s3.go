package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Storage defines storage operation methods
type Storage interface {
	GeneratePresignedPutURL(ctx context.Context, key string, contentType string) (string, error)
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
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(expiryDuration))

	if err != nil {
		return "", fmt.Errorf("failed to generate presigned upload URL: %w", err)
	}

	return req.URL, nil
}
