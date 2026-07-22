# AGENTS.md - CDrive Project Guidelines & Rules

This document outlines the architectural constraints, database guidelines, SAM deployment rules, multi-environment rules, and Go Lambda development standards for the **CDrive** project. All AI agents and developers working on this repository must adhere to these rules.

---

## 1. Project Overview & Core Constraints

**CDrive** is a cloud storage application built on AWS serverless primitives with a Go backend and modern web frontend.

### Stack Standards
- **Backend Language**: Go 1.22+
- **Infrastructure as Code**: AWS Serverless Application Model (SAM)
- **Database**: Single-table Amazon DynamoDB (`CustomDriveData-<Stage>`)
- **File Storage**: Amazon S3 (`cdrive-file-storage-<Stage>-<AccountId>`) with presigned URLs for direct browser uploads
- **API Engine**: AWS HTTP API Gateway (v2) integrated with Go Lambda functions
- **Primary Region**: `ap-south-1`

### General Principles
- **Clean Architecture**: Decouple HTTP handlers, domain services, repository/data access layers, and AWS SDK integrations.
- **Security First**: Principle of least privilege for IAM roles, strict CORS configurations, and validated presigned URLs for S3.
- **Performance**: Optimize Go Lambda startup times (cold starts) by initializing AWS SDK clients once in `init()` or `main()`.

---

## 2. Multi-Environment Architecture (`dev` vs `prod`)

The application supports strict environment isolation for **Development (`dev`)** and **Production (`prod`)**:

### Environment Matrix

| Environment | Description | Database Table | S3 Bucket Name | SAM Command |
| :--- | :--- | :--- | :--- | :--- |
| **`dev` (Local)** | Local testing with Docker DynamoDB | `CustomDriveData` (Local port 8000) | Mock / Presigned S3 | `make start-dev` |
| **`dev` (Cloud)** | AWS Cloud isolated staging stack | `CustomDriveData-dev` | `cdrive-file-storage-dev-<AccId>` | `make deploy-dev` |
| **`prod` (Cloud)** | Live AWS production stack | `CustomDriveData-prod` | `cdrive-file-storage-prod-<AccId>` | `make deploy-prod` |

### Environment Rule Constraints
- Never mix production and development data or credentials.
- Local development utilizes `env.dev.json` pointing to Docker DynamoDB (`http://host.docker.internal:8000`).
- Production deployments must use `env.prod.json` / SAM parameter `--parameter-overrides Stage=prod`.

---

## 3. Single-Table DynamoDB Rules

The application uses a **Single-Table Design** pattern in DynamoDB to minimize latency and manage operational complexity.

### Primary Keys & Index Layout
- **Table Name**: Defined via `TABLE_NAME` env var (default: `CustomDriveData-<Stage>`).
- **Partition Key (PK)**: String (`S`)
- **Sort Key (SK)**: String (`S`)
- **Global Secondary Index (GSI)**: `FolderIdIndex`
  - **GSI PK**: `FolderID` (`S`)
  - **GSI SK**: `SK` (`S`)
  - **Projection**: `ALL`

### Entity Partitioning & Naming Conventions

| Entity | PK Format | SK Format | GSI `FolderID` | Description |
| :--- | :--- | :--- | :--- | :--- |
| **User** | `USER#<UserID>` | `METADATA#<UserID>` | `N/A` | User profile, authentication metadata |
| **Folder** | `USER#<UserID>` | `FOLDER#<FolderID>` | `<ParentFolderID>` | Folder entity owned by a user |
| **File** | `USER#<UserID>` | `FILE#<FileID>` | `<FolderID>` | File metadata and S3 object reference |

---

## 4. AWS SAM Configuration Rules

- **Template Location**: `backend/template.yaml`
- **Go Runtime**: `provided.al2023` using ARM64 (`arm64`) architecture for superior performance and reduced cost.
- **Build Strategy**: Utilize Makefile or `sam build` with native Go compilation (`GOOS=linux GOARCH=arm64`).

### Infrastructure & IAM Rules
- **Environment Variables**: Never hardcode resource names. Always inject via SAM `Environment` variables (`TABLE_NAME`, `BUCKET_NAME`, `STAGE`).
- **Permissions**: SAM policy templates (`DynamoDBCrudPolicy`, `S3CrudPolicy`) or explicit minimal IAM statements must be used.
- **CORS Configuration**: HTTP API Gateway and S3 buckets must explicitly define allowed origins, methods, and headers.

---

## 5. Go Lambda Rules

### Code Structure Guidelines
```
backend/
├── cmd/
│   └── api/
│       └── main.go       # Lambda handler entry point
├── pkg/
│   ├── handlers/         # HTTP request parsing & response serialization
│   ├── services/         # Business logic (Upload, Metadata, Auth)
│   ├── repository/       # DynamoDB single-table implementation
│   ├── storage/          # S3 presigned URL generation & client calls
│   └── models/           # Go structs for DTOs and DynamoDB entities
├── env.dev.json          # Dev environment environment variables
├── env.prod.json         # Prod environment environment variables
├── Makefile              # SAM build & environment targets
└── template.yaml         # SAM infrastructure template
```

### Handler & Response Rules
- Use `github.com/aws/aws-lambda-go/events` package (`events.APIGatewayProxyRequest` / `events.APIGatewayV2HTTPRequest`).
- Standardize HTTP JSON responses using helper functions with proper headers (`Content-Type: application/json`).
- Always handle errors gracefully without leaking raw internal stack traces to clients.

### AWS SDK v2 Best Practices
- Use AWS SDK for Go v2 (`github.com/aws/aws-sdk-go-v2`).
- Initialize `cfg`, DynamoDB client, and S3 client inside `main()` or global variables outside the Lambda handler function to reuse connections across invocations.

### Logging & Context
- Use Go `slog` package for structured JSON logging.
- Pass `context.Context` from the Lambda handler to all AWS SDK calls and downstream methods.
