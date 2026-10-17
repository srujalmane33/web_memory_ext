# Web Memory

> **Remember useful information you discover online—without relying on a pile of forgotten bookmarks.**

Web Memory is a privacy-conscious Chrome Extension (Manifest V3) + Web Dashboard + REST API built using the MERN stack (MongoDB, Express, React, Node.js). It enables users to explicitly capture webpages, selected excerpts, code snippets, and notes, and retrieve them via keyword search, tags, and optional AI-grounded semantic retrieval.

---

## 1. Features

### Core MVP (Reliable Non-AI Foundation)
- **Explicit Capture**: Never tracks background browsing. Saves only upon explicit user action.
- **Save Page & Save Selection**: Captures page metadata (title, URL, domain) and highlighted text selections up to 20,000 characters.
- **Editable Before Saving**: Edit title, personal note (up to 5,000 chars), and add/manage tags before submission.
- **Double-Click Prevention**: Disables save button and provides live visual state during in-flight requests.
- **Graceful Error & Restricted Tab Handling**: Detects restricted browser pages (`chrome://`, Chrome Web Store) without crashing.
- **Dashboard CRUD**: Browse, search, filter, edit, and delete memories.
- **Strict Per-User Scoping**: Every API query scopes to verified `userId`. User A cannot access User B's records even with guessed IDs.
- **Bounded Pagination & Search**: Search across titles, notes, excerpts, and tags.

### Optional AI Capabilities (Phase 2)
- **AI Summary**: Generates 1–2 sentence summaries of long excerpts via Gemini.
- **Auto Tag Suggestions**: Suggests 3–5 relevant tags from excerpt context.
- **Ask My Memory (RAG)**: Natural-language question answering grounded **only** in saved user memories with verified clickable citations.
- **Graceful Degradation**: 100% usable without an AI key; AI features return friendly fallback notices when unconfigured.

---

## 2. Architecture & Folder Structure

```
web-memory/
├── apps/
│   ├── api/                   # Node.js + Express REST API
│   │   ├── src/
│   │   │   ├── config/        # Environment and DB connection
│   │   │   ├── controllers/   # Auth, Memory, and AI controllers
│   │   │   ├── middleware/    # Auth, validation, error handler
│   │   │   ├── models/        # Mongoose User & Memory models
│   │   │   ├── routes/        # Express route modules
│   │   │   ├── services/      # AI service provider abstraction
│   │   │   ├── app.js         # Express app configuration
│   │   │   └── server.js      # Server bootstrapper
│   │   └── tests/             # Automated test suite (20+ tests)
│   ├── extension/             # Chrome Extension Manifest V3
│   │   ├── manifest.json      # Manifest V3 specification
│   │   ├── public/            # Manifest and icon assets
│   │   ├── src/               # React popup UI (Save page, Selection, Recent list)
│   │   └── vite.config.js     # Bundles into loadable unpacked dist/
│   └── dashboard/             # Web Dashboard
│       ├── src/               # React views (Library, Detail, Edit, Ask AI)
│       └── vite.config.js     # Dev server on port 5173
├── packages/
│   └── shared/                # Shared URL & tag validators, limits, constants
├── .env.example               # Root configuration template
├── agent.md                   # AI editor implementation and handover guide
└── README.md                  # Project documentation
```

---

## 3. Prerequisites

- **Node.js**: `v20.x` or higher (tested on Node `v24.16.0`)
- **npm**: `v10.x` or higher
- **MongoDB**: Local MongoDB community server (`localhost:27017`) or MongoDB Atlas URI
- **Google Chrome**: For loading the unpacked extension
- **Gemini API Key** *(Optional)*: Required only if testing AI summaries and Ask My Memory RAG

---

## 4. Environment Variables Setup

Copy `.env.example` in `apps/api/`:
```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env`:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/web_memory
JWT_SECRET=your_long_random_jwt_secret_at_least_32_characters
DASHBOARD_ORIGIN=http://localhost:5173
AI_PROVIDER=gemini
AI_API_KEY=your_optional_gemini_api_key
```

---

## 5. Quickstart & Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```
All 24 specification tests run and verify:
- URL schemes validation (rejects `javascript:`, `chrome:`, `data:`)
- Character length boundaries and tag normalization
- Zod schema validation
- JWT generation and auth middleware protection
- Strict cross-user data isolation
- AI fallback when unconfigured

### 3. Build All Packages
```bash
npm run build
```
This builds both the extension into `apps/extension/dist/` and the dashboard into `apps/dashboard/dist/`.

### 4. Start Development Servers
In separate terminal windows:
```bash
# Terminal 1: API
npm run dev --workspace=apps/api

# Terminal 2: Dashboard
npm run dev --workspace=apps/dashboard

# Terminal 3: Extension (watches changes for build)
npm run build --workspace=apps/extension
```

Dashboard is accessible at: `http://localhost:5173`
API is running at: `http://localhost:5000/api`

---

## 6. How to Load the Extension in Chrome

1. Build the extension package:
   ```bash
   npm run build --workspace=apps/extension
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the folder:
   `/path/to/web-memory/apps/extension/dist`
6. The **Web Memory** extension icon will appear in your Chrome toolbar. Click it to open the capture popup.

---

## 7. REST API Reference

All requests and responses adhere to the standard envelope format:

### Standard Success Response
```json
{
  "data": { ... },
  "message": "Memory created"
}
```

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title and URL are required"
  }
}
```

### Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new account (`email`, `password`) |
| `POST` | `/api/auth/login` | Public | Login and receive Bearer JWT |
| `POST` | `/api/auth/logout` | Authenticated | Logout session |
| `GET` | `/api/auth/me` | Authenticated | Safe user profile (`id`, `email`, `createdAt`) |
| `POST` | `/api/memories` | Authenticated | Create a memory |
| `GET` | `/api/memories` | Authenticated | List memories (supports `page`, `limit`, `sort`, `type`, `tag`, `q`) |
| `GET` | `/api/memories/:id` | Authenticated | Get single memory (enforces ownership) |
| `PATCH` | `/api/memories/:id` | Authenticated | Update allowlisted fields (`title`, `note`, `tags`, `selectedText`, `type`) |
| `DELETE` | `/api/memories/:id` | Authenticated | Delete memory (enforces ownership) |
| `GET` | `/api/memories/search?q=...` | Authenticated | Keyword search |
| `POST` | `/api/ai/ask` | Authenticated | Ask My Memory (grounded RAG query) |
| `POST` | `/api/ai/summarize` | Authenticated | Summarize excerpt |
| `GET` | `/api/health` | Public | Service health & uptime |

---

## 8. Security & Privacy Guarantees

- **No Silently Captured Browsing**: No background trackers or history crawlers. Captures are solely initiated by user clicks.
- **Strict Server-Side Validation**: URLs restricted to `http:` and `https:`. Domain extracted server-side.
- **Zero Cross-User Leakage**: All database queries strictly join `_id` and `userId`.
- **Untrusted Content Defense**: Webpage excerpts treated strictly as reference text in AI prompts to prevent prompt injection.
- **No Client Secrets**: API keys and JWT secrets exist only in server-side environment variables.

---

## 9. Definition of Done Checklist

- [x] Repository audited before edits
- [x] Extension popup loads in Chrome with valid Manifest V3
- [x] Save page works
- [x] Save selection works
- [x] Empty/restricted-tab states handled gracefully
- [x] MongoDB persistence and models configured
- [x] Authentication (register, login, JWT) works
- [x] Ownership checks verified (User A cannot access User B's memories)
- [x] Dashboard CRUD works (List, detail, edit, delete, filters, search)
- [x] Keyword search and filters work
- [x] No secrets in client bundle
- [x] Production extension build verified (`apps/extension/dist`)
- [x] README and `.env.example` included
- [x] AI remains optional and app degrades gracefully without AI key
- [x] AI citations point to real saved memories
