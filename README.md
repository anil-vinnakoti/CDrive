# CDrive - Serverless Cloud Storage Platform

CDrive is a high-performance, enterprise-grade serverless cloud storage application built on AWS primitives using a **Go Lambda** backend, a **Single-Table Amazon DynamoDB** architecture, **Amazon S3** direct browser uploads, and **AWS SAM (Serverless Application Model)** for infrastructure as code.

---

## 📋 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [System Data Flow Diagrams](#-system-data-flow-diagrams)
- [DynamoDB Single-Table Design Schema](#-dynamodb-single-table-design-schema)
- [Tech Stack & Prerequisites](#-tech-stack--prerequisites)
- [Detailed Local Development Setup](#-detailed-local-development-setup)
  - [Step 1: Environment Setup](#step-1-environment-setup)
  - [Step 2: Local DynamoDB Database](#step-2-local-dynamodb-database)
  - [Step 3: Table & GSI Creation](#step-3-table--gsi-creation)
  - [Step 4: Running the SAM Development API](#step-4-running-the-sam-development-api)
- [API Reference & Testing](#-api-reference--testing)
- [Multi-Environment Architecture (dev vs prod)](#-multi-environment-architecture-dev-vs-prod)
- [AWS Cloud Deployment Guide](#-aws-cloud-deployment-guide)
- [Makefile Command Reference](#-makefile-command-reference)
- [Codebase Architecture & Contributing Guidelines](#-codebase-architecture--contributing-guidelines)

---

## 🏗️ Architectural Overview

CDrive decouples metadata management from binary object storage to provide scalable file operations:

- **Metadata Engine**: AWS Lambda (Go 1.22+ `provided.al2023` ARM64 execution environment) handling HTTP endpoints and storing file/folder metadata inside Amazon DynamoDB using single-table indexing.
- **Direct Object Uploads**: Files bypass the Lambda backend for binary transfer. The backend generates 5-minute cryptographic **S3 Presigned PUT URLs**, allowing frontend clients to upload files directly to Amazon S3 securely.
- **API Gateway Engine**: AWS HTTP API Gateway (v2) routes incoming HTTP requests to Lambda handlers with built-in CORS configurations.

---

## 📊 System Data Flow Diagrams

### Direct S3 File Upload Flow

```
[ Frontend / Client ]          [ API Gateway ]          [ Go Lambda ]          [ DynamoDB Local / AWS ]          [ Amazon S3 ]
         │                            │                      │                           │                            │
         │─── 1. POST /files/upload-url ────────────────────►│                           │                            │
         │       (FileName, Size, FolderID)                  │                           │                            │
         │                                                   │─── 2. Generate 5-min ────►│                            │
         │                                                   │    Presigned PUT URL      │                            │
         │                                                   │                           │                            │
         │                                                   │─── 3. Write Metadata ────►│                            │
         │                                                   │    (PK, SK, FolderID)     │                            │
         │                                                   │                           │                            │
         │◄── 4. Response (UploadURL, FileID) ───────────────│                           │                            │
         │                                                                                                            │
         │─── 5. Direct Binary Upload (PUT to UploadURL) ────────────────────────────────────────────────────────────►│
```

### Folder Navigation & Query Flow

```
[ Frontend / Client ]          [ API Gateway ]          [ Go Lambda ]          [ DynamoDB (FolderIdIndex GSI) ]
         │                            │                      │                           │
         │─── 1. GET /folders/contents?folderId=ROOT ───────►│                           │
         │                                                   │─── 2. Query Index ───────►│
         │                                                   │    (FolderID = "ROOT")    │
         │                                                   │                           │
         │◄── 3. Response JSON (Array of Files & Folders) ───│◄── Array of Items ────────│
```

---

## 🗄️ DynamoDB Single-Table Design Schema

CDrive uses a single DynamoDB table named `CustomDriveData` (or `CustomDriveData-<Stage>`) with a Global Secondary Index named `FolderIdIndex`.

### Primary Index Layout
- **Partition Key (`PK`)**: String (`USER#<UserID>`)
- **Sort Key (`SK`)**: String (`FILE#<FileID>`, `FOLDER#<FolderID>`, or `METADATA#<UserID>`)

### Global Secondary Index (`FolderIdIndex`)
- **GSI Partition Key (`FolderID`)**: String (`<ParentFolderID>` or `"ROOT"`)
- **GSI Sort Key (`SK`)**: String (`FILE#<FileID>` or `FOLDER#<FolderID>`)
- **Projection**: `ALL`

### Entity Record Layout Examples

#### 1. File Metadata Record (`FILE#<FileID>`)
```json
{
  "PK": "USER#user_123",
  "SK": "FILE#a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "ID": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "UserID": "user_123",
  "FolderID": "ROOT",
  "Type": "FILE",
  "Name": "financial_report.pdf",
  "Size": 2048576,
  "MimeType": "application/pdf",
  "S3Key": "user_123/a1b2c3d4-5678-90ab-cdef-1234567890ab/financial_report.pdf",
  "CreatedAt": "2026-07-23T01:00:00Z",
  "UpdatedAt": "2026-07-23T01:00:00Z"
}
```

#### 2. Folder Record (`FOLDER#<FolderID>`)
```json
{
  "PK": "USER#user_123",
  "SK": "FOLDER#f9e8d7c6-5432-10fe-dcba-0987654321ba",
  "ID": "f9e8d7c6-5432-10fe-dcba-0987654321ba",
  "UserID": "user_123",
  "FolderID": "ROOT",
  "Type": "FOLDER",
  "Name": "Projects",
  "CreatedAt": "2026-07-23T01:00:00Z",
  "UpdatedAt": "2026-07-23T01:00:00Z"
}
```

---

## 🛠️ Tech Stack & Prerequisites

Before developing locally, ensure the following tooling is installed:

| Tool | Version Requirement | Purpose | Verification Command |
| :--- | :--- | :--- | :--- |
| **Go** | 1.22 or higher | Backend Go Lambda runtime | `go version` |
| **AWS SAM CLI** | Latest | Infrastructure build & local API container runner | `sam --version` |
| **AWS CLI** | v2.x | Local DynamoDB management & Cloud deployment | `aws --version` |
| **Docker Desktop** | Latest | Container runtime for SAM Lambda emulation & DynamoDB local | `docker --version` |
| **Make** | Any standard `make` | Task automation & build script execution | `make --version` |

---

## 💻 Detailed Local Development Setup

Follow these step-by-step instructions to run the CDrive backend server locally on your workstation.

### Step 1: Environment Setup

Clone the repository and inspect the directory structure:

```bash
git clone <repository-url>
cd CDrive/backend
```

Ensure `backend/env.dev.json` contains local environment variables:

```json
{
  "CDriveApiFunction": {
    "STAGE": "dev",
    "TABLE_NAME": "CustomDriveData",
    "BUCKET_NAME": "cdrive-file-storage-dev",
    "GSI_FOLDER_INDEX": "FolderIdIndex",
    "AWS_ENDPOINT_URL_DYNAMODB": "http://host.docker.internal:8000",
    "AWS_REGION": "ap-south-1",
    "AWS_ACCESS_KEY_ID": "local",
    "AWS_SECRET_ACCESS_KEY": "local"
  }
}
```

---

### Step 2: Local DynamoDB Database

Launch the official Amazon DynamoDB Local image in Docker:

```bash
docker run -d -p 8000:8000 --name cdrive-dynamodb-local amazon/dynamodb-local
```

Verify that the container is running:

```bash
docker ps --filter name=cdrive-dynamodb-local
```

---

### Step 3: Table & GSI Creation

Create the `CustomDriveData` table and `FolderIdIndex` GSI inside your local DynamoDB container:

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local aws dynamodb create-table \
  --table-name CustomDriveData \
  --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
      AttributeName=FolderID,AttributeType=S \
  --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
      '[{"IndexName":"FolderIdIndex","KeySchema":[{"AttributeName":"FolderID","KeyType":"HASH"},{"AttributeName":"SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region ap-south-1
```

Verify that the table is created successfully:

```bash
AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region ap-south-1
```

---

### Step 4: Running the SAM Development API

Compile the Go ARM64 binary and launch the local serverless API server:

```bash
make start-dev
```

This starts the API Gateway server locally at:
`http://127.0.0.1:3000`

---

## 🧪 API Reference & Testing

### 1. Generate Presigned Upload URL & Store Metadata

- **Endpoint**: `POST /api/v1/files/upload-url` (or `POST /files/upload-url`)
- **Header**: `Content-Type: application/json`

#### Request Body
```json
{
  "userId": "user_123",
  "fileName": "quarterly_budget.xlsx",
  "folderId": "ROOT",
  "size": 1048576,
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```

#### Curl Command
```bash
curl -X POST http://127.0.0.1:3000/api/v1/files/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "fileName": "quarterly_budget.xlsx",
    "folderId": "ROOT",
    "size": 1048576,
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }'
```

#### Success Response (`201 Created`)
```json
{
  "uploadUrl": "https://cdrive-file-storage-dev.s3.ap-south-1.amazonaws.com/user_123/.../quarterly_budget.xlsx?...",
  "expiresInSeconds": 300,
  "item": {
    "pk": "USER#user_123",
    "sk": "FILE#6c9e0d12-3b4a-4d56-8e9f-1a2b3c4d5e6f",
    "id": "6c9e0d12-3b4a-4d56-8e9f-1a2b3c4d5e6f",
    "userId": "user_123",
    "folderId": "ROOT",
    "type": "FILE",
    "name": "quarterly_budget.xlsx",
    "size": 1048576,
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "s3Key": "user_123/6c9e0d12-3b4a-4d56-8e9f-1a2b3c4d5e6f/quarterly_budget.xlsx",
    "createdAt": "2026-07-23T01:30:00Z",
    "updatedAt": "2026-07-23T01:30:00Z"
  }
}
```

---

### 2. List Folder Contents

- **Endpoint**: `GET /api/v1/folders/contents?folderId=ROOT` (or `GET /folders/contents?folderId=ROOT`)

#### Curl Command
```bash
curl -X GET "http://127.0.0.1:3000/api/v1/folders/contents?folderId=ROOT"
```

#### Success Response (`200 OK`)
```json
{
  "folderId": "ROOT",
  "items": [
    {
      "pk": "USER#user_123",
      "sk": "FILE#6c9e0d12-3b4a-4d56-8e9f-1a2b3c4d5e6f",
      "id": "6c9e0d12-3b4a-4d56-8e9f-1a2b3c4d5e6f",
      "userId": "user_123",
      "folderId": "ROOT",
      "type": "FILE",
      "name": "quarterly_budget.xlsx",
      "size": 1048576,
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "s3Key": "user_123/6c9e0d12-3b4a-4d56-8e9f-1a2b3c4d5e6f/quarterly_budget.xlsx",
      "createdAt": "2026-07-23T01:30:00Z",
      "updatedAt": "2026-07-23T01:30:00Z"
    }
  ]
}
```

---

### 3. API Health Check

- **Endpoint**: `GET /health`

```bash
curl http://127.0.0.1:3000/health
```

---

## ⚙️ Multi-Environment Architecture (`dev` vs `prod`)

CDrive uses explicit parameterization for development and production stacks:

| Resource Attribute | Development (`dev`) | Production (`prod`) |
| :--- | :--- | :--- |
| **Stage Parameter** | `Stage=dev` | `Stage=prod` |
| **DynamoDB Table** | `CustomDriveData-dev` | `CustomDriveData-prod` |
| **S3 Storage Bucket** | `cdrive-file-storage-dev-<AccountId>` | `cdrive-file-storage-prod-<AccountId>` |
| **HTTP API Name** | `CDriveHttpApi-dev` | `CDriveHttpApi-prod` |
| **Environment Variable File** | `backend/env.dev.json` | `backend/env.prod.json` |
| **Deployment Command** | `make deploy-dev` | `make deploy-prod` |

---

## ☁️ AWS Cloud Deployment Guide

### Prerequisites for Cloud Deployment
1. Configure AWS CLI with access credentials:
   ```bash
   aws configure
   ```
2. Ensure IAM user/role has permissions for CloudFormation, DynamoDB, S3, API Gateway, and Lambda.

### Deploying the Staging Environment (`dev`)
```bash
cd backend
make deploy-dev
```

### Deploying the Production Environment (`prod`)
```bash
cd backend
make deploy-prod
```

---

## 📜 Makefile Command Reference

All primary build and run workflows are defined in [backend/Makefile](backend/Makefile):

| Target Command | Description |
| :--- | :--- |
| `make start-ui` | Launches UI Web Server at `http://localhost:8005` |
| `make start-dev` | Builds Lambda binary and launches local SAM API Gateway using `env.dev.json` |
| `make start-prod-local` | Launches local SAM API Gateway using `env.prod.json` |
| `make build` | Compiles ARM64 Linux `bootstrap` Go binary to `bin/bootstrap` |
| `make build-CDriveApiFunction` | SAM builder target compiling `bootstrap` to SAM artifacts folder |
| `make deploy-dev` | Manual developer build & deploy for `dev` stage to AWS |
| `make deploy-prod` | Builds and deploys the CloudFormation stack for `prod` stage to AWS (Also automated via CI/CD) |
| `make test` | Runs all Go unit tests (`go test -v ./...`) |
| `make clean` | Cleans build binaries (`bin/`) and SAM cached artifacts (`.aws-sam/`) |

---

## 📂 Codebase Architecture & Contributing Guidelines

### Project Directory Tree
```
CDrive/
├── .agents/
│   └── rules/
│       └── AGENTS.md          # Project architectural rules & constraints
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go        # Lambda entry point, SDK init & HTTP router
│   ├── pkg/
│   │   ├── handlers/          # HTTP request handlers & JSON responses
│   │   ├── repository/        # DynamoDB single-table data access layer
│   │   ├── storage/           # S3 presigner service
│   │   └── models/            # Go structs for DTOs and DynamoDB entities
│   ├── env.dev.json           # Local dev environment overrides
│   ├── env.prod.json          # Production environment overrides
│   ├── Makefile               # Build & deployment targets
│   └── template.yaml          # AWS SAM infrastructure template
├── .gitignore                 # Workspace git exclusion rules
└── README.md                  # Comprehensive developer documentation
```

### Developer Guidelines

1. **Decoupled Architecture**: Keep HTTP request parsing and response formatting in `pkg/handlers/`. Business and storage calls must go through `pkg/repository/` and `pkg/storage/`.
2. **Cold Start Optimization**: Always initialize AWS SDK v2 configuration, DynamoDB client, and S3 client inside `init()` or `main()` outside the request handler function.
3. **Structured Logging**: Use the standard Go `slog` package for JSON-formatted logs.
4. **Context Propagation**: Pass `context.Context` from the Lambda handler through to all AWS SDK calls.
5. **Rule Adherence**: Review [.agents/rules/AGENTS.md](.agents/rules/AGENTS.md) before submitting pull requests or making schema changes.
