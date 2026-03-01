# AI Chatbot Web App

A frontend-first chatbot web app with a Node.js/Express backend that proxies chat messages to OpenAI.

# Current Project Status
✅ Working Now

Chat UI with sidebar, multiple local chats, message bubbles, typing indicator, copy-to-clipboard, prompt suggestions, optional voice input, and attachment-chip UI.

Backend API endpoint POST /api/chat for real AI responses.

In-memory per-chat backend history for conversation continuity.

Basic operational endpoint GET /api/health.

# 🚧 In Progress / Next Improvements

Persistent storage (database) for chats.

Auth/user accounts and per-user data isolation.

File upload + retrieval pipeline (attachments are currently UI-only).

Streaming token responses for faster perceived latency.

Retry/backoff/circuit-breaker behavior for provider errors.

Test suite (unit/integration/e2e) and CI.

# Tech Stack

Frontend: HTML, CSS, Vanilla JavaScript

Backend: Node.js + Express

AI Provider: OpenAI Chat Completions API via official SDK

# Requirements

Node.js 18+

npm 9+

OpenAI API key


# What the Bot Can Do Today

Respond conversationally using OpenAI.

Keep short contextual history per chatId in memory.

Handle common backend failures gracefully in UI.

Time out stalled frontend requests and present clear user-facing errors.

# Known Limitations

Chat history resets when backend restarts.

No user authentication.

No persistent storage.

Attachments are selected visually but not uploaded to backend.

# Security Notes

Keep real API keys only in .env (ignored by git).

Do not commit secrets to tracked files.

If a key is exposed publicly, rotate/revoke it immediately.

