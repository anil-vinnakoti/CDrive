.PHONY: build-CDriveApiFunction build test clean start-dev deploy-dev deploy-prod

build-CDriveApiFunction:
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -ldflags="-s -w" -o $(ARTIFACTS_DIR)/bootstrap ./cmd/api

build:
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -tags lambda.norpc -ldflags="-s -w" -o bin/bootstrap ./cmd/api

# Local Development Commands
start-dev:
	sam build && sam local start-api --env-vars env.dev.json

start-prod-local:
	sam build && sam local start-api --env-vars env.prod.json

# SAM Deployment Commands
deploy-dev:
	sam build && sam deploy --stack-name cdrive-backend-dev --parameter-overrides Stage=dev --capabilities CAPABILITY_IAM --region ap-south-1 --resolve-s3

deploy-prod:
	sam build && sam deploy --stack-name cdrive-backend-prod --parameter-overrides Stage=prod --capabilities CAPABILITY_IAM --region ap-south-1 --resolve-s3

test:
	go test -v ./...

clean:
	rm -rf bin/ .aws-sam/ $(ARTIFACTS_DIR)/bootstrap
