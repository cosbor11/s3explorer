# README-ai.md

## Project Overview

- **App Name:** S3explorer
- **Purpose:**  
  A modern, VSCode-inspired web UI for connecting to, exploring, and managing AWS S3 buckets and objects.  
  Supports browsing, editing, uploading, deleting files/folders, and managing bucket/object ACLs and policies.
- **Target Users:**  
  Developers, devops, SREs, cloud engineers, and technical end-users working with S3 or S3-compatible APIs.

---

## Architecture & Tech Stack

- **Frontend:**  
  - Next.js (15.x), React 19, TypeScript (strict), Tailwind CSS 4.x  
  - Uses React context and hooks extensively  
  - No JavaScript, always use TypeScript with strict types
  - UI components in `/src/components` (split by feature)
- **Backend API:**  
  - Next.js API routes (`/pages/api/*.ts`)
  - Handles all S3 operations via AWS SDK v3 (`@aws-sdk/client-s3`)
  - Credentials provided via **session cookie** and/or session token header (see below)
  - Supports both AWS S3 and LocalStack
- **State Management:**  
  - React Context:  
    - `S3ConnectionContext` for S3 connection profiles and selected connection  
    - `s3` context for file tree, selection, editor state, etc.
- **Storage:**  
  - S3 or S3-compatible (e.g. LocalStack)
- **Session/Auth:**  
  - S3 connection info stored in **HTTP-only session cookie** (`s3session`, JSON-serialized credentials, 30 min expiry)  
  - **Session cookie is the primary session mechanism for most API requests.**  
  - Optionally, session token can be sent in a custom header (`x-s3-session-token`) for API fetches.  
  - No Firebase or traditional user auth (unless noted elsewhere)
- **Other Libraries:**  
  - `clsx`, `dompurify`, `marked`, `lucide-react`, `lodash.isequal`

---

## Key Patterns & Conventions

- **File/Folder Structure:**  
  - **`/src/components`**: All UI and functional components (organized by feature/domain)  
  - **`/src/contexts`**: React context providers for app state and S3 connection  
  - **`/src/hooks`**: Custom hooks (`useApi` for API calls, etc.)  
  - **`/src/clients`**: S3 client logic (AWS SDK v3, session-based creds)  
  - **`/pages/api`**: Next.js API routes (REST-like endpoints for S3 ops)
- **Component/Variable Naming:**  
  - PascalCase for components and types  
  - camelCase for variables and functions  
  - Use full, descriptive names; avoid abbreviations except S3
- **React/Next.js:**  
  - All components are functional  
  - Use `'use client'` directive at top of file where needed  
  - `RootLayout` and `page.tsx` are main app entrypoints
- **API calls:**  
  - Use `useApi` hook for all fetch logic  
  - Always send `x-s3-session-token` header with serialized S3Connection  
  - **Note:** Most server handlers also support session via the `s3session` HTTP-only cookie.
- **S3 connection:**  
  - Multiple named connections supported  
  - No AWS credentials in env vars or hardcoded in code  
  - Credentials (accessKeyId, secretAccessKey, sessionToken, region, endpoint) passed as session token/cookie and managed in context

---

## Custom Concepts & Terms

- **S3Connection:**  
  - Object containing S3 credentials, endpoint, region, and user-defined name/id  
  - Used throughout app and APIs as the auth/session primitive
- **InspectorPanel:**  
  - Main detail/metadata/ACL editor panel (right side, resizable)
- **FileTreePane:**  
  - Main content area; under the editor when the editor is open; hierarchical folder display
- **EditorPane:**  
  - Main editor area, supports text, markdown, images, CSV, raw editing
- **ACL, CORS, Policy, Tags:**  
  - Each has a dedicated inspector section, matching AWS concepts (JSON view, validation, edit/save UI)
- **LocalStack:**  
  - Supported for local S3 emulation (detected via endpoint)

---

## Required Behaviors & Rules

- **Never** use env vars for AWS creds in any code example or API handler (assume session only)
- **Always** include the full file when updating code snippets
- **All** JavaScript examples should be TypeScript, using strict mode  
- **Do not** change CSS, styling, or Tailwind classes unless explicitly requested  
- **Do not** remove or break functionality when updating or modifying code
- **All** API fetches must go through `useApi` or equivalent abstraction
- **CDK/Fargate/Onyx:**  
  - Not used in this project (ignore all CDK/ECS/Fargate/Onyx patterns unless specifically reintroduced)
- **VSCode UI Metaphor:**  
  - Sidebar, file tree, main editor, inspector, context menus  
  - Dark mode, code-friendly layout, and copy-selectable metadata everywhere

---

## API & Session Clarifications

- **Session Management:**
  - The active S3 credentials for the session are stored in a cookie named `s3session`, set via `/api/session/set-connection`.
    - Cookie attributes: `httpOnly`, `secure` (prod), `sameSite=lax`, `path=/`, `maxAge=30m`.
    - Credentials are serialized as JSON; no encryption/signing by default.
  - For client-side fetches, the session token can also be sent as an `x-s3-session-token` header.
  - **Most backend handlers support both methods:** they check for a valid session token header first, then fall back to the cookie if present.
  - When the user switches connection profiles, the `s3session` cookie is updated to reflect the selected profile.

- **Security Notes:**
  - Credentials in the cookie are HTTP-only and not accessible to JS on the client, but are not encrypted/signed. Assume trust in the session channel.
  - Sessions expire after 30 minutes by default; UI should prompt user to reconnect when expired.
  - No user-level authentication or multi-user support; all sessions are per-browser and single-user in scope.
  - No CSRF protection by default; adding support is recommended if exposing beyond localhost/development.

---

## REST API Design & Patterns

- **API routes are REST-like, with one file per resource domain:**
  - `/api/acl.ts` – S3 ACL get/set for buckets and objects
  - `/api/policy.ts`, `/api/policy-validate.ts` – Bucket policy get/set/validate
  - `/api/tags.ts` – Object and bucket tagging
  - `/api/bucket-meta.ts`, `/api/folder-meta.ts` – Metadata, last-modified, counts
  - `/api/s3.ts` – Central S3 operations
  - `/api/session/set-connection.ts` – Sets the current S3 connection profile in the cookie

- **Error Handling:**
  - API handlers return a consistent shape: `{ ok: true, data }` on success, `{ ok: false, error: { message } }` on error.
  - 400 for missing/invalid input, 405 for invalid method, 500 for server error.
  - Most handlers wrap AWS SDK calls in try/catch and log errors to server output.

- **Session Handling in API:**
  - Utility functions like `getS3(req)` resolve the S3 client by extracting credentials from the session cookie or header.
  - When using the API directly (not from browser), set the session cookie or header as required.

---

## Quirks, Gotchas & Edge Cases

- **Session token and cookie are the single source of truth for S3 authentication.**
- Multiple S3 connection profiles can be managed client-side, but only the selected connection is reflected in the current session/cookie.
- When the session expires, the UI should prompt the user to select or reauthenticate with a valid S3 connection.
- Credentials are not encrypted in the cookie; only protected by HTTP-only and secure flags.
- There is no server-side concept of users—just sessions.
- API routes support both S3 bucket and object-level operations; ACLs and tags can be set at either level.

---

## Example Interactions for AI

- **"Show me the entire updated src/clients/s3.ts file with support for X"**  
  > Always output the full file, including imports and all types.
- **"Add a new field to S3Connection and update context/provider logic"**  
  > Output all affected files in full, with changes highlighted.
- **"How is authentication managed?"**  
  > Explain the session cookie/header token pattern, S3Connection object, and context usage.
- **"Add a new S3-compatible provider (e.g. MinIO) connection option"**  
  > Update presets and connection form logic, show all changed files.

---

## Useful Pointers

- **Key files:**  
  - `src/app/layout.tsx` & `src/app/page.tsx`: App entry, global layout  
  - `src/components/Sidebar.tsx`, `FileTree.tsx`, `InspectorPanel.tsx`, `EditorPane.tsx`: Main UI shell  
  - `src/contexts/S3ConnectionContext.tsx`: Connection state logic  
  - `src/hooks/useApi.ts`: API fetch logic  
  - `src/clients/s3.ts`: S3 client instantiation/validation logic  
  - `/pages/api/s3.ts`: Central S3 API route
- **Session token/cookie:**  
  - Always `"x-s3-session-token": <stringified S3Connection>` for client fetches  
  - Or HTTP-only `s3session` cookie for server-side API access

---

## Project Status

- **Stable**, in active development.
- Typical file count: 1000+ (monorepo style, but all Next.js/React/TS, no monorepo tooling)
- All business logic and client/server flows should remain in TypeScript/React/Next.js idioms unless otherwise specified.

---

## How to Use This Document

- Use as the **single source of context** for AI and codegen tools.
- Refer to this file for conventions, rules, architecture, and coding standards when generating, refactoring, or reviewing code for this project.

# File Tree 

```
.
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── pages
│   └── api
│       ├── acl.ts
│       ├── bucket-meta.ts
│       ├── cors-validate.ts
│       ├── cors.ts
│       ├── folder-meta.ts
│       ├── meta.ts
│       ├── policy-validate.ts
│       ├── policy.ts
│       ├── s3.ts
│       ├── session
│       ├── tags.ts
│       ├── test-s3-connection.ts
│       └── test.ts
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── img
│   │   └── s3-explorer-logo.png
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── README-ai.md
├── README.md
├── src
│   ├── app
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── clients
│   │   └── s3.ts
│   ├── components
│   │   ├── BreadcrumbBar.tsx
│   │   ├── connection
│   │   ├── ContextMenu.tsx
│   │   ├── editor
│   │   ├── EditorPane.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── FileTreePane.tsx
│   │   ├── inspector
│   │   ├── InspectorPanel.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── S3ConnectionDropdown.tsx
│   │   ├── S3ConnectionForm.tsx
│   │   ├── S3ConnectionManagerDialog.tsx
│   │   ├── Sidebar.tsx
│   │   └── Tooltip.tsx
│   ├── contexts
│   │   ├── s3
│   │   └── S3ConnectionContext.tsx
│   ├── hooks
│   │   └── useApi.ts
│   └── styles
│       └── markdown.css
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

## S3 Context & Separation of Concerns

- **Purpose:**  
  The `src/contexts/s3` directory provides a modular, React Context-based state and actions layer for all S3 file tree and editor operations.  
  It abstracts S3 interactions and editor state from the UI, exposing a stable API to components.

- **Files & Responsibilities:**  
  - `index.tsx`:  
    Main context provider (`S3Provider`) and hook (`useS3`).  
    Manages all app state for buckets, file tree, file content, selection, menu state, and editor.  
    Implements all actions (open, edit, upload, delete, rename, download, etc) as context methods.
  - `api.ts`:  
    Pure functions for API request/response logic (fetch wrappers with session token, error handling),  
    S3 file tree building, and file download helpers.  
    **Never** manages React state directly.
  - `editor.ts`:  
    Simple utilities for resetting editor-related state in a type-safe way.
  - `menu.ts`:  
    Encapsulates menu open/close logic, decoupled from context state shape.
  - `types.ts`:  
    All shared types and interfaces: `S3Node` (file/folder), `MenuState`, `S3ContextState` (full context shape), and action signatures.

- **Key Concepts:**  
  - All **S3 state and business logic** (file/folder ops, editor, selection, context menus) live in this context, not in UI components.
  - UI components consume `useS3()` and never access S3 API/routes directly.
  - API abstraction (`api.ts`) ensures consistent session token, error handling, and response shape.
  - No AWS SDK logic or direct S3 manipulation—**all S3 interaction flows through the Next.js API layer** (`/api/s3`, etc).
  - Context provider manages loading, error, and dirty state for fine-grained UI feedback.

- **Separation of Concerns:**  
  - **API logic** is pure and reusable—testable without React.
  - **Context** manages state, lifecycle, and React side effects.
  - **UI** components are presentation-only, rely on context for all logic.
  - All S3 business logic and wiring is kept out of UI components for testability and maintainability.

- **How to Extend:**  
  - Add new S3 actions or state to `S3ContextState` and implement in `index.tsx`.
  - Pure helper functions or new API shapes go in `api.ts`.
  - Only export what needs to be consumed by the rest of the app.

## S3Connection Object & API Interaction Patterns

- **S3Connection Type Definition:**

```ts
export type S3Connection = {
  id: string
  name: string
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}
```
- This object is the *only* source of S3 credentials/session for all operations.
- It is stored and passed between UI, context, and all API routes via the `"x-s3-session-token"` header or `s3session` cookie.

- **API Request Example:**
  - All S3-related API routes expect the session to be present either as an HTTP-only cookie or (for client fetches) as a custom header.

```http
GET /api/s3?action=listBuckets
x-s3-session-token: "<JSON.stringify(S3Connection)>"
# or as the s3session cookie set by /api/session/set-connection
```

- **Client Fetch Logic:**
  - All fetches are wrapped to always include this header from `sessionStorage`:

```ts
const token = sessionStorage.getItem('s3-session-token')
const headers = {
  ...(init?.headers ?? {}),
  ...(token ? { 'x-s3-session-token': token } : {}),
}
await fetch(input, { ...init, headers })
```
  - Alternatively, session can be managed by the backend via HTTP-only cookie (`s3session`).

- **Typical API Response Shape:**

```json
// Success
{
  "ok": true,
  "data": {
    "Buckets": [{ "Name": "my-bucket" }]
  }
}
// Error
{
  "ok": false,
  "error": {
    "code": "AuthFailed",
    "message": "Invalid S3 credentials"
  }
}
```

- **Server Handler Pattern:**
  - Handlers respond using either:

```ts
return res.status(200).json({ ok: true, data })
// or
return res.status(400).json({ ok: false, error: { code, message } })
```
  - Consistent with this pattern across all `/pages/api` S3 endpoints.


**Important**

Always provide full updated file (unless it is only one line of code updated). I want to be able to paste the file and run. cat