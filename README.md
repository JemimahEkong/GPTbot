# GPTbot

A frontend-first chatbot web app with a Node.js/Express backend that proxies chat messages to OpenAI.

---

## Current Project Status

**Working now**
- Chat UI with sidebar, multiple local chats, message bubbles, typing indicator, copy-to-clipboard, prompt suggestions, optional voice input, and attachment-chip UI.
- Backend API endpoint `POST /api/chat` for real AI responses.
- In-memory per-chat backend history for conversation continuity.
- Basic operational endpoint `GET /api/health`.

**In progress / next improvements**
- Persistent storage (database) for chats.
- Auth/user accounts and per-user data isolation.
- File upload + retrieval pipeline (attachments are currently UI-only).
- Streaming token responses for faster perceived latency.
- Retry/backoff/circuit-breaker behavior for provider errors.
- Test suite (unit/integration/e2e) and CI.

---

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js + Express
- **AI Provider:** OpenAI Chat Completions API via official SDK

---

## Repository Structure

- `index.html` — chat layout and DOM structure.
- `style.css` — app styling, responsive behavior, animations.
- `script.js` — frontend state + message handling + API calls.
- `server.js` — Express server, CORS, OpenAI integration, in-memory sessions.
- `package.json` — backend dependencies and scripts.
- `.env.example` — environment variable template.
- `.gitignore` — ignores `node_modules/` and `.env`.

---

## Requirements

- Node.js 18+
- npm 9+
- OpenAI API key

---

## Local Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create local environment file

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set values

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   PORT=5000
   FRONTEND_ORIGIN=*
   ```

4. Start backend

   ```bash
   node server.js
   ```

5. Open app
- Option A: open via your static server and call backend at `http://localhost:5000/api/chat`
- Option B: use backend static serving at `http://localhost:5000`

---

## API Contract

### Health Check

`GET /api/health`

Example response:

```json
{
  "ok": true,
  "model": "gpt-4o-mini",
  "hasApiKey": true
}
```

### Chat

`POST /api/chat`

Request body:

```json
{
  "chatId": "chat_123",
  "message": "Hello"
}
```

Success response:

```json
{
  "reply": "Hi! How can I help you today?"
}
```

Possible error response:

```json
{
  "error": "Failed to generate response from OpenAI.",
  "details": "..."
}
```

---

## What the Bot Can Do Today

- Respond conversationally using OpenAI.
- Keep short contextual history per `chatId` in memory.
- Handle common backend failures gracefully in UI.
- Time out stalled frontend requests and present clear user-facing errors.

## Known Limitations

- Chat history resets when backend restarts.
- No user authentication.
- No persistent storage.
- Attachments are selected visually but not uploaded to backend.

---

## Security Notes

- Keep real API keys only in `.env` (ignored by git).
- Do **not** commit secrets to tracked files.
- If a key is exposed publicly, rotate/revoke it immediately.

---

## Suggested Next Tasks

1. Add SQLite/Postgres persistence for chats.
2. Add login + user scoping.
3. Add streaming responses (SSE/WebSocket).
4. Add upload endpoint and attachment processing.
5. Add test suite + CI workflow.

