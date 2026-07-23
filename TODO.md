# CDrive — Project TODO & Feature Roadmap

Project feature backlog, implementation priorities, and architectural tasks for **CDrive**.

---

## 🎯 Upcoming Features Backlog

### 1. 📁 Move & Copy Files and Folders (`NEW`)
- [ ] **Interactive Folder Picker Modal**:
  - Tree navigation dialog to select destination target folder.
- [ ] **Move Item Workflow (`POST /items/move`)**:
  - Update `FolderID` attribute in DynamoDB table to relocate a file or folder into a target folder.
- [ ] **Copy Item Workflow (`POST /items/copy`)**:
  - Create new DynamoDB entity for copied file/folder.
  - Perform S3 `CopyObject` operation to duplicate file binary in S3 storage (`<UserID>/<NewFileID>/<FileName>`).

---

### 2. 🎛️ Hierarchical S3 Storage Class Tiering (Cost Optimization)
- [ ] **Drive-Level Default Setting (User Settings)**:
  - Add user preference for default upload storage tier (`INTELLIGENT_TIERING`, `GLACIER_IR`, `STANDARD`).
- [ ] **Folder-Level Tiering & Inheritance**:
  - Action: **"Set Folder Storage Tier"**.
  - All files uploaded to or inside the folder automatically inherit the folder's storage tier.
  - Batch update backend endpoint for existing files inside the folder (`POST /folders/storage-class`).
- [ ] **File-Level Storage Class Override**:
  - File action: **"Change Storage Tier"** using in-place S3 `CopyObject` API (`POST /files/storage-class`).

---

### 3. 📊 Storage Usage Quota & Cost Meter
- [ ] **User Storage Aggregation**:
  - Calculate total bytes used by the authenticated user in DynamoDB / S3.
- [ ] **UI Progress Bar**:
  - Render visual capacity meter in header/sidebar (e.g., `24.5 GB used — ~$0.12/mo`).

---

## ✅ Completed Features

- [x] **1-Click Google OAuth 2.0 Login & User Authentication**
- [x] **Strict Multi-Tenant User Isolation** (`USER#<ID>` partitioning in DynamoDB & S3)
- [x] **Direct Presigned S3 Uploads & Downloads** with real-time XHR progress bar
- [x] **In-Browser File Preview Modal** (PDF, full-res Images, Video player, Audio player)
- [x] **Trash Bin with 25-Day DynamoDB TTL Auto-Purge & Permanent Delete**
- [x] **Minimalist Obsidian & Dark Zinc Monochromatic Theme**
- [x] **UI Unit Testing Suite (Vitest + React Testing Library)** with 100% test pass rate
- [x] **Frontend Performance Optimizations & Code-Splitting** (`next/dynamic`, `React.memo`, `useDebounce`)
- [x] **File & Folder Renaming** (`POST /api/v1/items/rename`)
- [x] **Google Drive Style Item Sorting** (Folders grouped first, Name A-Z, Date, File Size)
- [x] **AWS SAM Dev Stack Infrastructure** (`cdrive-backend-dev`, API Gateway v2, DynamoDB, S3)
- [x] **Vercel Next.js Frontend Deployment**
