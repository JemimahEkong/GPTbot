// ── State ──
let chats = [];
let activeChatId = null;
let isTyping = false;

const CHAT_API_URL = "http://localhost:5000/api/chat";

// ── DOM ──
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const closeSidebarBtn = document.getElementById("closeSidebar");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const chatTitle = document.getElementById("chatTitle");
const messagesContainer = document.getElementById("messagesContainer");
const welcomeScreen = document.getElementById("welcomeScreen");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

// ── Speech Recognition ──
let recognition = null;
let isListening = false;
const speechSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

if (speechSupported) {
  micBtn.style.display = "flex";
}

// ── Sidebar ──
function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}

menuBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// ── Chat Management ──
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createChat(title) {
  const chat = {
    id: generateId(),
    title: title || "New Chat",
    messages: [],
  };
  chats.unshift(chat);
  activeChatId = chat.id;
  renderChatList();
  renderMessages();
  return chat.id;
}

function deleteChat(id) {
  chats = chats.filter((c) => c.id !== id);
  if (activeChatId === id) {
    activeChatId = chats.length > 0 ? chats[0].id : null;
  }
  renderChatList();
  renderMessages();
}

function getActiveChat() {
  return chats.find((c) => c.id === activeChatId) || null;
}

function renderChatList() {
  if (chats.length === 0) {
    chatList.innerHTML = '<p class="no-chats">No conversations yet</p>';
    return;
  }
  chatList.innerHTML = chats
    .map(
      (chat) => `
    <button class="chat-item ${chat.id === activeChatId ? "active" : ""}" data-id="${chat.id}">
      <span>💬</span>
      <span class="chat-item-title">${escapeHtml(chat.title)}</span>
      <span class="delete-btn" data-delete="${chat.id}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span>
    </button>`
    )
    .join("");

  chatList.querySelectorAll(".chat-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;
      activeChatId = el.dataset.id;
      renderChatList();
      renderMessages();
      closeSidebar();
    });
  });

  chatList.querySelectorAll(".delete-btn").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(el.dataset.delete);
    });
  });
}

newChatBtn.addEventListener("click", () => {
  createChat();
  closeSidebar();
});

// ── Messages ──
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderMessages() {
  const chat = getActiveChat();
  chatTitle.textContent = chat ? chat.title : "GPT AI";

  if (!chat || chat.messages.length === 0) {
    welcomeScreen.style.display = "flex";
    messagesDiv.style.display = "none";
    messagesDiv.innerHTML = "";
    return;
  }

  welcomeScreen.style.display = "none";
  messagesDiv.style.display = "flex";

  messagesDiv.innerHTML = chat.messages
    .map(
      (msg) => `
    <div class="message ${msg.role}">
      <div class="avatar">${msg.role === "user" ? "U" : "G"}</div>
      <div class="bubble">${escapeHtml(msg.content)}
        <button class="copy-btn" data-copy="${escapeHtml(msg.content)}">📋</button>
      </div>
    </div>`
    )
    .join("");

  messagesDiv.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "✓";
      setTimeout(() => (btn.textContent = "📋"), 2000);
    });
  });

  scrollToBottom();
}

function addMessage(chatId, role, content) {
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return;
  chat.messages.push({ id: generateId(), role, content });
  if (role === "user" && chat.messages.length === 1) {
    chat.title = content.slice(0, 40) + (content.length > 40 ? "..." : "");
    renderChatList();
  }
  renderMessages();
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "typing-indicator";
  el.id = "typingIndicator";
  el.innerHTML = `
    <div class="avatar" style="background:var(--accent-gradient);color:#fff;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">Z</div>
    <div class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  messagesDiv.style.display = "flex";
  messagesDiv.appendChild(el);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── Send Logic ──
async function handleSend(content) {
  const text = content.replace(/🎙.*$/, "").trim();
  if (!text || isTyping) return;

  let chatId = activeChatId;
  if (!chatId) chatId = createChat(text.slice(0, 40));

  addMessage(chatId, "user", text);

  isTyping = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        message: text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.details || errorPayload.error || "Failed to fetch assistant response.");
    }

    const data = await response.json();
    addMessage(chatId, "assistant", data.reply || "I couldn't generate a response right now.");
  } catch (error) {
    const friendlyError = error.name === "AbortError" ? "Request timed out. Please try again." : error.message;
    addMessage(chatId, "assistant", `Sorry, I couldn't reach the chat service. ${friendlyError}`);
  } finally {
    hideTyping();
    isTyping = false;
    updateSendBtn();
  }
}

// ── Input ──
function updateSendBtn() {
  const cleaned = messageInput.value.replace(/🎙.*$/, "").trim();
  sendBtn.disabled = !cleaned || isTyping;
}

messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 160) + "px";
  updateSendBtn();
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend(messageInput.value);
    messageInput.value = "";
    messageInput.style.height = "auto";
    updateSendBtn();
  }
});

sendBtn.addEventListener("click", () => {
  handleSend(messageInput.value);
  messageInput.value = "";
  messageInput.style.height = "auto";
  updateSendBtn();
});

// ── Suggestion Cards ──
document.querySelectorAll(".suggestion-card").forEach((card) => {
  card.addEventListener("click", () => {
    handleSend(card.dataset.prompt);
  });
});

// ── Speech Recognition ──
function stopListening() {
  if (recognition) recognition.stop();
  isListening = false;
  micBtn.classList.remove("listening");
  micBtn.innerHTML= `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic-icon lucide-mic"><path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/></svg>`;
}

function startListening() {
  if (!speechSupported) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  let finalTranscript = "";

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const base = messageInput.value.replace(/\s*🎙.*$/, "");
    const combined = (base ? base + " " : "") + finalTranscript + (interim ? "🎙 " + interim : "");
    messageInput.value = combined.trim();
    updateSendBtn();
  };

  recognition.onerror = () => stopListening();
  recognition.onend = () => stopListening();

  recognition.start();
  isListening = true;
  micBtn.classList.add("listening");
  micBtn.textContent = "⏹";
}

micBtn.addEventListener("click", () => {
  isListening ? stopListening() : startListening();
});

// ── Init ──
renderChatList();
renderMessages();
  const attachBtn = document.getElementById("attachBtn");
  const fileInput = document.getElementById("fileInput");

  
//
const attachmentPreview = document.getElementById("attachmentPreview");

attachBtn.addEventListener("click", () => {
  fileInput.click();
});
fileInput.addEventListener("change", () => {
  attachmentPreview.innerHTML = "";

  Array.from(fileInput.files).forEach((file, index) => {
    const chip = document.createElement("div");
    chip.classList.add("file-chip");

    chip.innerHTML = `
      📎 ${file.name}
      <button data-index="${index}">✕</button>
    `;

    chip.querySelector("button").addEventListener("click", () => {
      removeFile(index);
    });

    attachmentPreview.appendChild(chip);
  });
});

function removeFile(index) {
  const dt = new DataTransfer();
  const files = fileInput.files;

  Array.from(files).forEach((file, i) => {
    if (i !== index) dt.items.add(file);
  });

  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event("change"));
}