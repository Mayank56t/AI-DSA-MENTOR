(function () {
  const apiBase = window.API_BASE || "";

  const authSection = document.getElementById("auth-section");
  const dashboardSection = document.getElementById("dashboard-section");
  const logoutBtn = document.getElementById("logout-btn");

  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const authErrorEl = document.getElementById("auth-error");
  const authTitleEl = document.getElementById("auth-title");
  const authSubtitleEl = document.getElementById("auth-subtitle");
  const signupTabBtn = document.getElementById("tab-signup");
  const loginTabBtn = document.getElementById("tab-login");

  const signupEmailInput = document.getElementById("signup-email");
  const signupPasswordInput = document.getElementById("signup-password");
  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");

  const hintForm = document.getElementById("hint-form");
  const questionInput = document.getElementById("question-input");
  const codeEditor = document.getElementById("code-editor");
  const hintOutput = document.getElementById("hint-output");
  const hintStatus = document.getElementById("hint-status");

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessagesEl = document.getElementById("chat-messages");
  const chatStatus = document.getElementById("chat-status");

  const historyHintsTabBtn = document.getElementById("history-tab-hints");
  const historyChatsTabBtn = document.getElementById("history-tab-chats");
  const hintsPanel = document.getElementById("history-hints-panel");
  const chatsPanel = document.getElementById("history-chats-panel");
  const hintHistoryList = document.getElementById("hint-history-list");
  const chatHistoryList = document.getElementById("chat-history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  const navBtnHint = document.getElementById("nav-btn-hint");
  const navBtnChat = document.getElementById("nav-btn-chat");
  const navBtnHistory = document.getElementById("nav-btn-history");
  const dsaSection = document.getElementById("dsa-section");
  const chatSection = document.getElementById("chat-section");
  const historySection = document.getElementById("history-section");

  let currentChatSessionId = null;
  let chatHistorySessions = [];
  let currentHistoryTab = "hints";

  function getToken() {
    return window.localStorage.getItem("access_token") || null;
  }

  function setToken(token) {
    window.localStorage.setItem("access_token", token);
  }

  function clearToken() {
    window.localStorage.removeItem("access_token");
  }

  async function apiRequest(path, options) {
    const opts = options || {};
    const method = opts.method || "GET";
    const body = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
    const headers = opts.headers ? Object.assign({}, opts.headers) : {};

    if (body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    const response = await fetch(apiBase + path, {
      method: method,
      headers: headers,
      body: body,
    });

    if (response.status === 401) {
      clearToken();
      showAuth();
      throw new Error("Unauthorized. Please log in again.");
    }

    const contentType = response.headers.get("Content-Type") || "";
    const isJson = contentType.includes("application/json");
    let data = null;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { detail: text } : null;
    }

    if (!response.ok) {
      const detail = data && (data.detail || data.message);
      throw new Error(detail || ("Request failed with status " + response.status));
    }

    return data;
  }

  function showAuth() {
    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    if (logoutBtn) {
      logoutBtn.classList.add("hidden");
    }
  }

  function showDashboard() {
    authSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    if (logoutBtn) {
      logoutBtn.classList.remove("hidden");
    }
    switchDashboardTab("hint");
    refreshHistory();
  }

  function switchDashboardTab(tabName) {
    if (!dsaSection || !chatSection || !historySection) return;

    [navBtnHint, navBtnChat, navBtnHistory].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });

    [dsaSection, chatSection, historySection].forEach((section) => {
      if (section) section.classList.add("hidden");
    });

    if (tabName === "hint") {
      if (navBtnHint) navBtnHint.classList.add("active");
      dsaSection.classList.remove("hidden");
      dsaSection.classList.add("tab-pane-animate");
    } else if (tabName === "chat") {
      if (navBtnChat) navBtnChat.classList.add("active");
      chatSection.classList.remove("hidden");
      chatSection.classList.add("tab-pane-animate");
      if (chatInput) chatInput.focus();
    } else if (tabName === "history") {
      if (navBtnHistory) navBtnHistory.classList.add("active");
      historySection.classList.remove("hidden");
      historySection.classList.add("tab-pane-animate");
      refreshHistory();
    }
  }

  function setAuthMode(mode) {
    const isSignup = mode === "signup";
    if (isSignup) {
      signupForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
      signupTabBtn.className = "flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all";
      loginTabBtn.className = "flex-1 px-3 py-2 rounded-lg text-slate-400 font-medium hover:text-slate-200 transition-all";
      authTitleEl.textContent = "Welcome to the Portal";
      authSubtitleEl.textContent = "Unlock direct, zero-fluff DSA coaching and database history controls.";
    } else {
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
      loginTabBtn.className = "flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all";
      signupTabBtn.className = "flex-1 px-3 py-2 rounded-lg text-slate-400 font-medium hover:text-slate-200 transition-all";
      authTitleEl.textContent = "Welcome Back";
      authSubtitleEl.textContent = "Log in to access AI DSA MENTOR workspace and database records.";
    }
    authErrorEl.textContent = "";
  }

  async function handleSignup(event) {
    event.preventDefault();
    authErrorEl.textContent = "";

    const email = (signupEmailInput.value || "").trim();
    const password = signupPasswordInput.value || "";

    if (!email || !password) {
      authErrorEl.textContent = "Email and password are required.";
      return;
    }

    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: { email: email, password: password },
      });
      if (data && data.access_token) {
        setToken(data.access_token);
        signupPasswordInput.value = "";
        showDashboard();
      } else {
        throw new Error("Signup succeeded but token was not returned.");
      }
    } catch (error) {
      authErrorEl.textContent = error.message || "Unable to sign up.";
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    authErrorEl.textContent = "";

    const email = (loginEmailInput.value || "").trim();
    const password = loginPasswordInput.value || "";

    if (!email || !password) {
      authErrorEl.textContent = "Email and password are required.";
      return;
    }

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email: email, password: password },
      });
      if (data && data.access_token) {
        setToken(data.access_token);
        loginPasswordInput.value = "";
        showDashboard();
      } else {
        throw new Error("Login succeeded but token was not returned.");
      }
    } catch (error) {
      authErrorEl.textContent = error.message || "Unable to log in.";
    }
  }

  function handleLogout() {
    clearToken();
    currentChatSessionId = null;
    if (chatMessagesEl) {
      chatMessagesEl.innerHTML = `
        <div class="empty-text my-auto">
          <p class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300 mb-1">👋 Welcome to AI DSA MENTOR Desk!</p>
          <p class="text-xs text-slate-400 font-medium">Ask any technical question below. Responses skip conversational fluff for maximum signal and completeness.</p>
        </div>`;
    }
    if (hintOutput) {
      hintOutput.innerHTML = `<span class="text-slate-400 italic">Submit your problem and code attempt above to receive direct, zero-fluff mentor coaching...</span>`;
    }
    authErrorEl.textContent = "";
    showAuth();
  }

  async function handleHintSubmit(event) {
    event.preventDefault();
    hintStatus.textContent = "";

    const question = (questionInput.value || "").trim();
    const code = codeEditor.value || "";

    if (!question) {
      hintStatus.textContent = "⚠️ Please enter a LeetCode problem name or prompt.";
      return;
    }
    if (!code.trim()) {
      hintStatus.textContent = "⚠️ Paste or type your solution attempt in the workspace editor.";
      return;
    }

    hintStatus.textContent = "⏳ AI DSA MENTOR is diagnosing code and formulating direct technical advice...";
    hintOutput.innerHTML = `<div class="animate-pulse text-cyan-400 font-semibold flex items-center gap-2"><span>⚡ Running zero-fluff algorithmic diagnosis...</span></div>`;

    try {
      const data = await apiRequest("/ai/hint", {
        method: "POST",
        body: { question: question, code: code },
      });
      hintOutput.textContent = data.hint || "No feedback returned.";
      hintStatus.textContent = "✅ Direct mentorship evaluation complete!";
      setTimeout(() => {
        if (hintStatus.textContent === "✅ Direct mentorship evaluation complete!") {
          hintStatus.textContent = "";
        }
      }, 4000);
      refreshHintHistory().catch(function () {});
    } catch (error) {
      hintStatus.textContent = "❌ " + (error.message || "Failed to get hint.");
      hintOutput.innerHTML = `<span class="text-rose-400 font-semibold">Error occurred while evaluating code. Please verify your connection or attempt again.</span>`;
    }
  }

  function appendChatMessage(sender, content, createdAt) {
    if (!chatMessagesEl) return;

    const empty = chatMessagesEl.querySelector(".empty-text");
    if (empty) empty.remove();

    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-bubble");
    wrapper.classList.add(sender === "user" ? "user" : "assistant");

    const meta = document.createElement("div");
    meta.className = "chat-meta";
    const icon = sender === "user" ? "👤" : "⚡";
    const who = sender === "user" ? "You" : "AI DSA MENTOR";
    const dateText = createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
    meta.textContent = `${icon} ${who} ${dateText ? " · " + dateText : ""}`;

    const body = document.createElement("div");
    body.className = "chat-text";
    body.textContent = content;

    wrapper.appendChild(meta);
    wrapper.appendChild(body);
    chatMessagesEl.appendChild(wrapper);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function renderChatMessages(messages) {
    if (!chatMessagesEl) return;
    chatMessagesEl.innerHTML = "";
    if (!messages || !messages.length) {
      chatMessagesEl.innerHTML = `
        <div class="empty-text my-auto">
          <p class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300 mb-1">👋 Welcome to AI DSA MENTOR Desk!</p>
          <p class="text-xs text-slate-400 font-medium">Ask any technical question below. Responses skip conversational fluff for maximum signal and completeness.</p>
        </div>`;
      return;
    }
    messages.forEach(function (msg) {
      appendChatMessage(msg.sender, msg.content, msg.created_at);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    chatStatus.textContent = "";

    const message = (chatInput.value || "").trim();
    if (!message) {
      return;
    }

    appendChatMessage("user", message, new Date().toISOString());
    chatInput.value = "";
    chatStatus.textContent = "⏳ AI DSA MENTOR is evaluating reply...";

    try {
      const data = await apiRequest("/ai/chat", {
        method: "POST",
        body: {
          session_id: currentChatSessionId,
          message: message,
        },
      });

      currentChatSessionId = data.id;
      renderChatMessages(data.messages);
      chatStatus.textContent = "";
      refreshChatHistory().catch(function () {});
    } catch (error) {
      chatStatus.textContent = "❌ " + (error.message || "Chat request failed.");
    }
  }

  async function refreshHintHistory() {
    try {
      const hints = await apiRequest("/history/hints", { method: "GET" });
      renderHintHistory(hints);
    } catch (_error) {
      // Non-critical
    }
  }

  async function refreshChatHistory() {
    try {
      const sessions = await apiRequest("/history/chats", { method: "GET" });
      chatHistorySessions = sessions || [];
      renderChatHistory(chatHistorySessions);
    } catch (_error) {
      // Non-critical
    }
  }

  async function refreshHistory() {
    await Promise.all([refreshHintHistory(), refreshChatHistory()]);
  }

  function renderHintHistory(hints) {
    if (!hintHistoryList) return;
    hintHistoryList.innerHTML = "";
    if (!hints || !hints.length) {
      const empty = document.createElement("div");
      empty.className = "empty-text";
      empty.innerHTML = `<p class="text-sm font-semibold text-slate-300">No algorithm evaluations in database yet.</p><p class="text-xs text-slate-500 mt-1">Submit code in the AI Hint Mentor tab to record mentorship logs.</p>`;
      hintHistoryList.appendChild(empty);
      return;
    }

    hints.forEach(function (item) {
      const card = document.createElement("article");
      card.className = "hint-card";

      const top = document.createElement("div");
      top.className = "hint-card-header";

      const title = document.createElement("h3");
      title.className = "hint-card-title";
      title.innerHTML = `<span>⚡</span> <span class="text-cyan-300 font-bold">${item.question_identifier}</span>`;

      const date = document.createElement("span");
      date.className = "hint-card-date";
      date.textContent = new Date(item.created_at).toLocaleString();

      top.appendChild(title);
      top.appendChild(date);

      const code = document.createElement("pre");
      code.className = "hint-card-code";
      code.textContent = item.user_code || "";

      const hint = document.createElement("div");
      hint.className = "hint-card-hint";
      hint.textContent = item.hint || "";

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "mt-3 flex flex-wrap justify-end gap-2";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "history-delete-btn";
      deleteBtn.innerHTML = `<span>🗑️ Delete</span>`;
      deleteBtn.addEventListener("click", async function () {
        try {
          await apiRequest("/history/hints/" + item.id, { method: "DELETE" });
          card.style.opacity = "0.3";
          setTimeout(() => refreshHintHistory(), 250);
        } catch (err) {
          alert(err.message || "Failed to delete item");
        }
      });

      const reloadBtn = document.createElement("button");
      reloadBtn.type = "button";
      reloadBtn.className = "history-action-btn";
      reloadBtn.innerHTML = `<span>⚡</span> Restore in Workspace`;
      reloadBtn.addEventListener("click", function () {
        if (questionInput) questionInput.value = item.question_identifier;
        if (codeEditor) codeEditor.value = item.user_code;
        if (hintOutput) hintOutput.textContent = item.hint || "";
        if (hintStatus) hintStatus.textContent = "✅ Restored previous submission from history.";
        switchDashboardTab("hint");
      });

      btnWrapper.appendChild(deleteBtn);
      btnWrapper.appendChild(reloadBtn);

      card.appendChild(top);
      card.appendChild(code);
      card.appendChild(hint);
      card.appendChild(btnWrapper);

      hintHistoryList.appendChild(card);
    });
  }

  function renderChatHistory(sessions) {
    if (!chatHistoryList) return;
    chatHistoryList.innerHTML = "";
    if (!sessions || !sessions.length) {
      const empty = document.createElement("div");
      empty.className = "empty-text";
      empty.innerHTML = `<p class="text-sm font-semibold text-slate-300">No conversation logs in database yet.</p><p class="text-xs text-slate-500 mt-1">Start a coaching chat in the AI Assistant tab to save session logs.</p>`;
      chatHistoryList.appendChild(empty);
      return;
    }

    sessions.forEach(function (session) {
      const card = document.createElement("article");
      card.className = "chat-session-card";

      const header = document.createElement("div");
      header.className = "chat-session-header";

      const title = document.createElement("h3");
      title.className = "chat-session-title";
      title.innerHTML = `<span>💬</span> <span class="text-violet-300 font-bold">${session.title || "Chat session #" + session.id}</span>`;

      const date = document.createElement("span");
      date.className = "chat-session-date";
      date.textContent = new Date(session.created_at).toLocaleString();

      header.appendChild(title);
      header.appendChild(date);

      const preview = document.createElement("div");
      preview.className = "chat-session-preview";

      let lastUser = "";
      let lastAssistant = "";
      if (session.messages && session.messages.length) {
        session.messages.forEach(function (m) {
          if (m.sender === "user") {
            lastUser = m.content;
          } else if (m.sender === "assistant") {
            lastAssistant = m.content;
          }
        });
      }

      const userLine = document.createElement("p");
      userLine.className = "chat-session-line";
      userLine.textContent = lastUser
        ? "You: " + lastUser.slice(0, 140)
        : "You: (no question recorded)";

      const aiLine = document.createElement("p");
      aiLine.className = "chat-session-line";
      aiLine.textContent = lastAssistant
        ? "AI DSA MENTOR: " + lastAssistant.slice(0, 140)
        : "AI DSA MENTOR: (no response stored)";

      preview.appendChild(userLine);
      preview.appendChild(aiLine);

      const btnWrapper = document.createElement("div");
      btnWrapper.className = "mt-3 flex flex-wrap justify-end gap-2";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "history-delete-btn";
      deleteBtn.innerHTML = `<span>🗑️ Delete</span>`;
      deleteBtn.addEventListener("click", async function () {
        try {
          await apiRequest("/history/chats/" + session.id, { method: "DELETE" });
          if (currentChatSessionId === session.id) {
            currentChatSessionId = null;
            renderChatMessages([]);
          }
          card.style.opacity = "0.3";
          setTimeout(() => refreshChatHistory(), 250);
        } catch (err) {
          alert(err.message || "Failed to delete session");
        }
      });

      const loadBtn = document.createElement("button");
      loadBtn.type = "button";
      loadBtn.className = "history-action-btn";
      loadBtn.innerHTML = `<span>💬</span> Continue Conversation`;
      loadBtn.dataset.sessionId = String(session.id);
      loadBtn.addEventListener("click", function () {
        currentChatSessionId = session.id;
        renderChatMessages(session.messages || []);
        switchDashboardTab("chat");
      });

      btnWrapper.appendChild(deleteBtn);
      btnWrapper.appendChild(loadBtn);

      card.appendChild(header);
      card.appendChild(preview);
      card.appendChild(btnWrapper);

      chatHistoryList.appendChild(card);
    });
  }

  function setHistoryTab(active) {
    if (!historyHintsTabBtn || !historyChatsTabBtn || !hintsPanel || !chatsPanel) return;
    currentHistoryTab = active;

    if (active === "hints") {
      historyHintsTabBtn.className = "px-3.5 py-1.5 rounded-lg history-tab-active font-bold transition-all";
      historyChatsTabBtn.className = "px-3.5 py-1.5 rounded-lg text-slate-400 font-medium hover:text-slate-200 transition-all";
      hintsPanel.classList.remove("hidden");
      chatsPanel.classList.add("hidden");
    } else {
      historyChatsTabBtn.className = "px-3.5 py-1.5 rounded-lg history-tab-active font-bold transition-all";
      historyHintsTabBtn.className = "px-3.5 py-1.5 rounded-lg text-slate-400 font-medium hover:text-slate-200 transition-all";
      hintsPanel.classList.add("hidden");
      chatsPanel.classList.remove("hidden");
    }
  }

  async function handleClearHistory() {
    const isHintTab = currentHistoryTab === "hints";
    const label = isHintTab ? "hint evaluations" : "chat sessions";
    if (!confirm("Are you sure you want to delete ALL saved " + label + " from the database?")) {
      return;
    }

    try {
      if (isHintTab) {
        await apiRequest("/history/hints", { method: "DELETE" });
        refreshHintHistory();
      } else {
        await apiRequest("/history/chats", { method: "DELETE" });
        currentChatSessionId = null;
        renderChatMessages([]);
        refreshChatHistory();
      }
    } catch (err) {
      alert(err.message || "Failed to clear history");
    }
  }

  async function bootstrap() {
    setAuthMode("signup");

    if (signupForm) signupForm.addEventListener("submit", handleSignup);
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (signupTabBtn) signupTabBtn.addEventListener("click", () => setAuthMode("signup"));
    if (loginTabBtn) loginTabBtn.addEventListener("click", () => setAuthMode("login"));
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    if (hintForm) hintForm.addEventListener("submit", handleHintSubmit);
    if (chatForm) chatForm.addEventListener("submit", handleChatSubmit);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", handleClearHistory);

    // Nav bar bindings
    if (navBtnHint) navBtnHint.addEventListener("click", () => switchDashboardTab("hint"));
    if (navBtnChat) navBtnChat.addEventListener("click", () => switchDashboardTab("chat"));
    if (navBtnHistory) navBtnHistory.addEventListener("click", () => switchDashboardTab("history"));

    // Quick prompt chip bindings
    const promptChips = document.querySelectorAll(".prompt-chip");
    promptChips.forEach(chip => {
      chip.addEventListener("click", () => {
        if (chatInput) {
          chatInput.value = chip.textContent.trim();
          chatInput.focus();
        }
      });
    });

    if (historyHintsTabBtn) historyHintsTabBtn.addEventListener("click", () => setHistoryTab("hints"));
    if (historyChatsTabBtn) historyChatsTabBtn.addEventListener("click", () => setHistoryTab("chats"));

    const token = getToken();
    if (token) {
      try {
        await apiRequest("/auth/me", { method: "GET" });
        showDashboard();
      } catch (_error) {
        clearToken();
        showAuth();
      }
    } else {
      showAuth();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
