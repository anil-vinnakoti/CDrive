# Root Makefile for CDrive Development

.PHONY: start-ui start-backend start-dev test build clean

# Start Next.js Frontend UI Dev Server at http://localhost:8080
start-ui:
	@echo "Starting CDrive Next.js UI Server at http://localhost:8080 ..."
	@cd frontend && export PATH=/opt/homebrew/bin:$$PATH && npm run dev

# Start Backend API Gateway + Lambda on SAM Local (port 3001)
start-backend:
	@cd backend && sam build && sam local start-api --env-vars env.dev.json --port 3001

# Start Backend API (Alias)
start-dev: start-backend

# Run all backend unit tests
test:
	@cd backend && go test -v ./...

# Build production Next.js UI bundle
build-ui:
	@echo "Building production Next.js bundle ..."
	@cd frontend && export PATH=/opt/homebrew/bin:$$PATH && npm run build

# Clean build artifacts
clean:
	@rm -rf backend/.aws-sam backend/bin frontend/.next
