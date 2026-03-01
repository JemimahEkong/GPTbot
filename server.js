const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn("OPENAI_API_KEY is not set. /api/chat requests will fail until configured.");
}

const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
const chatSessions = new Map();
const MAX_MESSAGES_PER_SESSION = 20;

app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

function getTrimmedHistory(messages) {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) {
    return messages;
  }
  return messages.slice(-MAX_MESSAGES_PER_SESSION);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, hasApiKey: Boolean(openaiApiKey) });
});

app.post("/api/chat", async (req, res) => {
  const { chatId, message } = req.body || {};

  if (!chatId || typeof chatId !== "string") {
    return res.status(400).json({ error: "chatId is required and must be a string." });
  }

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required and must be a string." });
  }

  const cleanedMessage = message.trim();
  if (!cleanedMessage) {
    return res.status(400).json({ error: "message cannot be empty." });
  }

  if (!client) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY. Set it in your environment." });
  }

  if (!chatSessions.has(chatId)) {
    chatSessions.set(chatId, []);
  }

  const messages = chatSessions.get(chatId);
  messages.push({ role: "user", content: cleanedMessage });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant in a web chat application. Keep responses concise, clear, and useful.",
        },
        ...getTrimmedHistory(messages),
      ],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response right now.";

    messages.push({ role: "assistant", content: reply });
    chatSessions.set(chatId, getTrimmedHistory(messages));

    return res.json({ reply });
  } catch (error) {
    const status = Number(error?.status) || 500;
    const safeStatus = status >= 400 && status < 600 ? status : 500;

    console.error("OpenAI chat error:", error?.message || error);

    return res.status(safeStatus).json({
      error: "Failed to generate response from OpenAI.",
      details: error?.message || "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
