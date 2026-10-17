# Web Memory — AI Agent & Developer Handover Guide

> **Project Source of Truth**: `WEB_MEMORY_BUILD_SPEC.pdf` (Version 1.0 • October 2026)
> This document records the architecture, file map, implementation decisions, and verification details so any AI model or engineer can immediately understand, run, and extend this codebase.

---

## 1. Project Overview & Vision

**Web Memory** is a privacy-conscious Chrome Extension (Manifest V3) + Web Dashboard + REST API built using the MERN stack (MongoDB, Express, React, Node.js). It enables users to explicitly capture webpages, selected excerpts, code snippets, and notes, and retrieve them via keyword search, tags, and optional AI-grounded semantic retrieval.

### Core Principles
- **Explicit Capture**: Never silently track or record user browsing. User triggers all captures.
- **Source Fidelity**: Always preserve original URL, page title, and capture timestamp.
- **Useful Without AI**: Core capture, search, filtering, and CRUD operations function 100% reliably even if the AI provider is unavailable. AI is strictly an additive enhancement.
- **Privacy First**: Strict per-user data isolation. Every query is scoped to the authenticated `userId`. No client-supplied `userId` is trusted.
- **Safe Sandboxing & Security**: URLs restricted to `http:` and `https:`. No secrets in client bundles.

---

## 2. Monorepo Architecture & File Map

The workspace is an npm workspaces monorepo:

```
web-memory/
├── package.json               # Root monorepo workspace configuration & orchestrator scripts
├── .gitignore                 # Standard node, env, build, and OS ignore patterns
├── agent.md                   # Complete architectural record & handover log (this document)
├── apps/
│   ├── api/                   # Node.js + Express REST API with MongoDB & Mongoose
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── config/        # Environment and DB connection
│   │   │   ├── controllers/   # Auth, Memory, and AI controllers
│   │   │   ├── middleware/    # Auth, error handling, rate limiting
│   │   │   ├── models/        # Mongoose User & Memory schemas with indexes
│   │   │   ├── routes/        # Modular API routes
│   │   │   ├── services/      # Business logic & AI provider adapter
│   │   │   └── server.js      # App entry point
│   │   └── tests/             # Vitest / Supertest test suite
│   ├── extension/             # Chrome Extension Manifest V3 (React + Vite + Tailwind)
│   │   ├── package.json
│   │   ├── manifest.json      # Manifest V3 specification
│   │   ├── vite.config.js     # Explicit build configuration outputting to dist/
│   │   ├── index.html         # Popup HTML entry point
│   │   └── src/               # React popup UI (Save page, Save selection, Recent list)
│   └── dashboard/             # Web Dashboard (React + Vite + Tailwind)
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       └── src/               # Dashboard views (Auth, Memories List, Detail, Search)
├── packages/
│   └── shared/                # Shared utilities, constants, URL & tag validators
└── docs/                      # Additional documentation & test plans
```

---

## 3. Milestone Execution Status

- [x] **Milestone 0: Repository Audit & Monorepo Setup**
  - Inspected workspace: Node `v24.16.0`, npm `11.13.0`, initialized git repository.
  - Initialized root `package.json` with npm workspaces (`apps/*`, `packages/*`).
  - Created `.gitignore` and `agent.md`.
- [x] **Milestone 1: Extension Capture MVP** (Completed)
- [x] **Milestone 2: Express + MongoDB REST API** (Completed)
- [x] **Milestone 3: Connect Extension + Web Dashboard** (Completed)
- [x] **Milestone 4: Deployment & Quality Assurance** (Completed)
- [x] **Milestone 5: Optional AI Features & Semantic Retrieval** (Completed)

---

## 4. Key Technical Decisions & Data Contract

### 4.1 Database Model (`Memory`)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // Verified from auth token
  title: String,           // Required, max 300 chars
  url: String,             // Required, http/https only
  domain: String,          // Derived server-side from url
  type: "page" | "highlight" | "snippet" | "note",
  selectedText: String,    // Default "", max 20,000 chars
  note: String,            // Default "", max 5,000 chars
  tags: [String],          // Normalized (lowercased, trimmed, deduplicated)
  summary: String,         // Optional AI-generated summary
  embedding: [Number],     // Optional vector embeddings
  createdAt: Date,
  updatedAt: Date
}
```
Indexes:
- Compound index `{ userId: 1, createdAt: -1 }`
- Text index on `title`, `note`, `selectedText`, and `tags`

### 4.2 Standard API Response Envelope
Success:
```json
{
  "data": { ... },
  "message": "Memory created"
}
```
Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title and URL are required"
  }
}
```
Pagination returns `data: [...]`, `page`, `limit`, `total`, `totalPages`.

---

## 5. Implementation Log by Milestone

### Milestone 1 — Extension Capture MVP (Completed)
- **Manifest V3 Configuration**: `apps/extension/manifest.json` and `apps/extension/public/manifest.json`
  - Permissions: `activeTab`, `scripting`, `storage`.
  - Host permissions: `http://localhost:5000/*`, `http://127.0.0.1:5000/*`.
  - Icons generated in 16x16, 48x48, 128x128 RGBA PNG format via script `apps/extension/scripts/generate-icons.js`.
- **Chrome API & Tab Scripting Layer**: `apps/extension/src/utils/chrome.js`
  - Active tab querying: `chrome.tabs.query({ active: true, currentWindow: true })`.
  - Safe script execution: `chrome.scripting.executeScript` extracting `document.title`, `window.location.href`, and `window.getSelection()`.
  - Graceful restricted tab detection: Checks for `chrome://`, `chrome-extension://`, `about:`, `edge://`, Chrome Web Store.
  - Safe development mode fallback when running outside the Chrome extension environment.
  - Storage abstraction: `chrome.storage.local` with fallback to `localStorage`.
- **UI Components & UX States**:
  - `Header.jsx`: Web Memory branding, auth state badge, direct link to Web Dashboard, and settings modal trigger.
  - `SaveForm.jsx`:
    - Save Current Page vs Save Selection toggle.
    - Editable title (prefilled from tab, max 300 chars).
    - Source URL badge with extracted domain.
    - Selected excerpt display with character counter (max 20,000 chars) and warning if selection is empty with quick switch to page save.
    - Memory type chips: `page`, `highlight`, `snippet`, `note`.
    - Personal note textarea (max 5,000 chars).
    - Tag manager with chip display and keyboard shortcuts (Enter / comma).
    - In-flight double-click prevention (`isSaving` button disable).
    - Success banner and clear error dismissals.
  - `RecentList.jsx`:
    - List of recently saved memories with title, domain, relative timestamp (`timeAgo`), excerpt preview, note, and tags.
    - Search filter for recent memories.
    - Direct "Open Source" link.
    - Empty and loading states.
  - `AuthModal.jsx`: In-popup authentication allowing users to sign in or register without opening a separate tab.
  - `SettingsModal.jsx`: Configurable API URL and Dashboard URL.
  - `App.jsx`: Top-level coordinator managing tab capture, saving to API or local storage fallback, and caching.

### Milestone 2 — Express + MongoDB REST API (Completed)
- **Environment & DB Connection**:
  - `apps/api/src/config/env.js`: Centralized config with defaults for PORT (5000), MONGODB_URI, JWT_SECRET, and DASHBOARD_ORIGIN.
  - `apps/api/src/config/db.js`: Mongoose connection manager with error logging.
- **Data Models (`apps/api/src/models/`)**:
  - `User.js`: Schema with `email` (unique, lowercase, trimmed), `passwordHash` (bcrypt), `comparePassword` method, and `toSafeObject` sanitizer (guarantees `passwordHash` is never leaked).
  - `Memory.js`: Schema with `userId` (indexed), `title` (max 300 chars), `url` (http/https), `domain` (derived server-side), `type` (page/highlight/snippet/note), `selectedText` (max 20,000 chars), `note` (max 5,000 chars), `tags` (normalized array), `summary`, `embedding`.
  - Indexes: `{ userId: 1, createdAt: -1 }` compound index and text index on `{ title: 'text', note: 'text', selectedText: 'text', tags: 'text' }`.
- **Controllers & Middleware**:
  - `middleware/auth.js`: Verifies `Bearer <JWT>` and attaches `req.user = { id, email }`. Rejects unauthenticated requests with 401.
  - `middleware/validate.js`: Zod schema validation for register, login, memory creation, and memory updates. Strictness prevents client tampering with `userId` or server fields.
  - `middleware/errorHandler.js`: Formats errors into standard `{ error: { code, message } }` envelope.
  - `controllers/authController.js`: Registration with bcrypt hashing, login credential verification, safe user profile retrieval, and logout.
  - `controllers/memoryController.js`: Full CRUD with **strict per-user scoping** in all queries (`{ _id, userId }`), server-derived domains, bounded pagination (max 100 per page), and keyword search.

### Milestone 3 — Connect Extension + Web Dashboard (Completed)
- **Shared API Client Pattern**:
  - `apps/dashboard/src/api/client.js` and `apps/extension/src/utils/api.js`: Unified HTTP client attaching JWT Bearer tokens, intercepting 401 errors, and providing typed helpers for all CRUD and AI endpoints.
- **CORS Configuration**:
  - `apps/api/src/app.js`: Configured to permit requests from the dashboard origin (`http://localhost:5173`), Chrome extension origins (`chrome-extension://*`), and local development hosts.
- **Web Dashboard Views (`apps/dashboard/src/components/`)**:
  - `Navbar.jsx`: Search bar with clear action, "Ask My Memory" modal trigger, Add Memory button, and user authentication state.
  - `Sidebar.jsx`: Filtering by type (All, Pages, Highlights, Snippets, Notes), interactive tag chips, sort toggling (Newest/Oldest), and Collections placeholder.
  - `MemoryCard.jsx`: Displays title, domain, relative date, styled excerpt preview, personal note, clickable tags, copy button, edit, and delete actions.
  - `MemoryDetailModal.jsx`: Full detail inspector with complete text excerpt (up to 20,000 chars), personal notes, source URL with "Open Source" external link, metadata, and "Generate with Gemini" AI enrichment.
  - `MemoryEditModal.jsx`: Reusable creation and editing modal with live character counters and validation.
  - `AuthScreen.jsx`: Tabbed sign-in and account registration for unauthenticated sessions.
  - `ConfirmModal.jsx`: Accessible modal dialog replacing crude `window.confirm` for destructive operations like deleting memories.
  - `utils/notifications.js`: Unified toast service wrapping `sonner` for success, error, info, warning, and interactive confirmation toasts.

### Milestone 4 — Deployment & Quality Assurance (Completed)
- **Port Configuration & Browser Safety**:
  - API runs on **Port 5001** (`http://localhost:5001/api`).
  - *Rationale*: Port 5000 is occupied on macOS Monterey+ by Apple's ControlCenter / AirPlay Receiver (`*:commplex-main`). Port 6000 is on Google Chrome's strictly blocked ports list for security (`net::ERR_UNSAFE_PORT` for X11 protocol). Port 5001 is completely safe, standard, and supported by all modern browsers.
- **Configuration Templates**:
  - Root `.env.example`, `apps/api/.env.example`, `apps/dashboard/.env.example`, and `apps/extension/.env.example`.
- **Documentation**:
  - Comprehensive `README.md` containing features, folder tree, prerequisites, setup instructions, load unpacked guide, API reference, security rules, and Definition of Done checklist.
- **Monorepo Build & Test Scripts**:
  - `npm test`: Runs 24 automated tests across `packages/shared` and `apps/api` with zero failures.
  - `npm run build`: Bundles both `apps/extension` into `dist/` (with `manifest.json`, `index.html`, and `icons/`) and `apps/dashboard` into `dist/`.

### Milestone 5 — Optional AI Features & Grounded Retrieval (Completed)
- **AI Service Abstraction (`apps/api/src/services/aiService.js`)**:
  - Server-side Gemini adapter implementing `generateSummary(text)`, `suggestTags(text)`, `embedText(text)`, and `answerFromMemories(question, memories)`.
  - **Graceful Non-Fatal Fallback**: When `AI_API_KEY` is omitted or provider times out, core app behavior is completely preserved without breaking.
- **Ask My Memory (RAG)**:
  - `POST /api/ai/ask` retrieves candidate memories strictly owned by the authenticated user.
  - Prompt enforces: answer ONLY from user-provided saved memories, treat excerpts as untrusted reference data, do not invent citations, and acknowledge when information is missing.
  - **Server-Side Citation Verification**: Model returns source IDs which the server verifies against actual database records before returning verified URLs and titles to the UI.
  - `AskMemoryModal.jsx` in the dashboard presents the grounded answer alongside verified source cards.

---

## 6. Frontend Toast & Confirmation Architecture

The frontend uses **`sonner`** for modern, lightweight, non-blocking toast notifications, and provides two tiers of user confirmation:

### 6.1 Toast Helper API (`apps/dashboard/src/utils/notifications.js`)
```javascript
import { notify } from './utils/notifications';

// 1. Success toast
notify.success('Memory created', 'Saved to your personal library.');

// 2. Error toast
notify.error('Network Error', 'Unable to reach backend.');

// 3. Info toast
notify.info('Copied!', 'Excerpt copied to clipboard.');

// 4. Interactive In-Toast Confirmation
notify.confirm('Delete this memory?', {
  description: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  onConfirm: () => doDelete(),
  onCancel: () => console.log('Cancelled'),
});
```

### 6.2 Confirmation Dialog Modal (`apps/dashboard/src/components/ConfirmModal.jsx`)
Used for critical or destructive user confirmations (replacing `window.confirm`):
```jsx
<ConfirmModal
  isOpen={isOpen}
  title="Delete Memory"
  message="Are you sure you want to delete this memory? This action cannot be undone."
  confirmText="Delete Memory"
  cancelText="Cancel"
  variant="danger"
  isLoading={loading}
  onConfirm={handleConfirmDelete}
  onCancel={() => setIsOpen(false)}
/>
```

---

## 7. How to Run & Verify

```bash
# 1. Run all unit & specification tests
npm test

# 2. Build production artifacts
npm run build

# 3. Start development servers
npm run dev --workspace=apps/api         # Runs API on port 5001
npm run dev --workspace=apps/dashboard   # Runs Dashboard on port 5173

# 4. Load extension in Chrome
# Go to chrome://extensions -> Developer mode -> Load unpacked -> select apps/extension/dist
```
