# CDrive — Project TODO & Feature Roadmap

Project feature backlog, implementation priorities, and architectural tasks for **CDrive**.

---

## 🎯 Upcoming Features Backlog

### 1. 📁 Move & Copy Files and Folders (`MEDIUM PRIORITY`)
- [ ] **Interactive Folder Picker Modal**:
  - Tree navigation dialog to select destination target folder.
- [ ] **Move Item Workflow (`POST /items/move`)**:
  - Update `FolderID` attribute in DynamoDB table to relocate a file or folder into a target folder.
- [ ] **Copy Item Workflow (`POST /items/copy`)**:
  - Create new DynamoDB entity for copied file/folder.
  - Perform S3 `CopyObject` operation to duplicate file binary in S3 storage (`<UserID>/<NewFileID>/<FileName>`).

---

### 2. 🎛️ Hierarchical S3 Storage Class Tiering (Cost Optimization) (`MEDIUM PRIORITY`)
- [ ] **Drive-Level Default Setting (User Settings)**:
  - Add user preference for default upload storage tier (`INTELLIGENT_TIERING`, `GLACIER_IR`, `STANDARD`).
- [ ] **Folder-Level Tiering & Inheritance**:
  - Action: **"Set Folder Storage Tier"**.
  - All files uploaded to or inside the folder automatically inherit the folder's storage tier.
  - Batch update backend endpoint for existing files inside the folder (`POST /folders/storage-class`).
- [ ] **File-Level Storage Class Override**:
  - File action: **"Change Storage Tier"** using in-place S3 `CopyObject` API (`POST /files/storage-class`).

---

### 3. 📊 Detailed AWS Usage, Billing Report & Storage Meter (`LOWEST PRIORITY`)
- [ ] **Real-Time AWS Cost Explorer & CloudWatch Integration**:
  - Integrate AWS Cost Explorer API (`ce:GetCostAndUsage`) & AWS CloudWatch Metrics (`S3/BucketSizeBytes`, `ApiGateway/Count`, `S3/BytesDownloaded`).
  - Backend API endpoint (`GET /reports/usage`) returning exact S3 storage volume, HTTP API Gateway request counts, and data transfer out bandwidth.
- [ ] **Granular Date Range & Filter Controls**:
  - Allow users to filter billing reports by **Daily**, **Monthly**, **Annual**, or **Custom Date Range**.
- [ ] **Detailed Usage Breakdown Dashboard**:
  - Interactive UI charts breaking down costs: Storage (GB-months), API Requests (PUT/GET counts), and Bandwidth egress.
- [ ] **Sidebar Capacity Progress Bar**:
  - Live progress meter in sidebar showing storage quota usage (e.g., `2.4 GB of 50 GB used`).

---

### 4. 📱 Responsive Design for All Screen Sizes (`HIGH PRIORITY`)
- [ ] **Landing Page (`/`)**:
  - [ ] Mobile hamburger menu replacing desktop nav links.
  - [ ] Hero section font scale & CTA button stacking on small screens.
  - [ ] S3 Simulator and Cost Calculator sections full-width on mobile.
  - [ ] Floating Apple Glass navbar collapses gracefully on mobile.
- [ ] **Drive App (`/drive`)**:
  - [ ] Sidebar collapses to a slide-over drawer on mobile (toggle button in topbar).
  - [ ] Topbar search field full-width on mobile, icon-only on narrow viewports.
  - [ ] File grid adapts: `grid-cols-1` on mobile → `grid-cols-2` on tablet → `grid-cols-4` on desktop.
  - [ ] Breadcrumb truncation on small screens (show only last 2 levels).
  - [ ] Action toolbar (sort, view toggle) collapses to icon-only on mobile.
- [ ] **Modals**:
  - [ ] Full-screen sheet style on mobile (bottom-sheet pattern for Upload, Folder, Rename).
  - [ ] Preview modal full-screen on mobile with swipe-to-dismiss.
- [ ] **Login Page (`/login`)**:
  - [ ] Center card vertically & horizontally, full-width on very small screens.

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
