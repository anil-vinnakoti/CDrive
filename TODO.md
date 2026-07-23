# CDrive — Project TODO & Feature Roadmap

Project feature backlog, implementation priorities, and architectural tasks for **CDrive**.

---

## 🎯 High-Priority Upcoming Features

### 1. 🎛️ Hierarchical S3 Storage Class Tiering (Cost Optimization)
- [ ] **Drive-Level Default Setting (User Settings)**:
  - Add user preference for default upload storage tier (`INTELLIGENT_TIERING`, `GLACIER_IR`, `STANDARD`).
- [ ] **Folder-Level Tiering & Inheritance**:
  - Right-click folder action: **"Set Folder Storage Tier"**.
  - All files uploaded to or inside the folder automatically inherit the folder's storage tier.
  - Batch update backend endpoint for existing files inside the folder (`POST /folders/storage-class`).
- [ ] **File-Level Storage Class Badge & Override**:
  - Render color-coded storage class badges (`🤖 Intelligent`, `⚡ Standard`, `❄️ Glacier IR`, `🧊 Deep Archive`).
  - File action dropdown: **"Change Storage Tier"** using in-place S3 `CopyObject` API (`POST /files/storage-class`).

---

### 2. 📊 Storage Usage Quota & Cost Meter
- [ ] **User Storage Aggregation**:
  - Calculate total bytes used by the authenticated user in DynamoDB / S3.
- [ ] **UI Progress Bar**:
  - Render visual capacity meter in header/sidebar (e.g., `24.5 GB used — ~$0.12/mo`).

---

### 3. 👁️ In-Browser File Preview Modal
- [ ] **Document & Media Previewers**:
  - PDF document viewer.
  - Full-resolution image modal (JPEG, PNG, WebP, SVG).
  - Audio/Video player for MP3 and MP4 files.
  - Text & code syntax highlighter for `.txt`, `.md`, `.json`, `.go`.

---

### 4. 🗑️ Trash Bin (Soft Delete & Recovery)
- [ ] **Soft Delete Workflow**:
  - Mark items `isTrashed: true` in DynamoDB.
- [ ] **Trash Management Screen**:
  - Dedicated `/trash` UI page.
  - **"Restore"** item to original folder.
  - **"Permanently Delete"** item from S3 and DynamoDB.

---

## ✅ Completed Features

- [x] **1-Click Google OAuth 2.0 Login & User Authentication**
- [x] **Strict Multi-Tenant User Isolation** (`USER#<ID>` partitioning in DynamoDB & S3)
- [x] **Direct Presigned S3 Uploads & Downloads** with real-time XHR progress bar
- [x] **AWS SAM Dev Stack Infrastructure** (`cdrive-backend-dev`, API Gateway v2, DynamoDB, S3)
- [x] **Vercel Next.js Frontend Deployment**
- [x] **Clean Dev-Only Workspace & CI/CD Pipelines** (`deploy-dev.yml`)
