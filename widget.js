(function(){
  const API_BASE = "https://reset-assistant.vercel.app";
  let sessionId = null;
  let assistantName = "Assistant";

  const bubble = document.createElement("div");
  bubble.id = "reset-bubble";
  bubble.innerText = "💬";
  document.body.appendChild(bubble);

  const windowEl = document.createElement("div");
  windowEl.id = "reset-window";
  windowEl.style = `
    position: fixed; bottom: 90px; right: 20px;
    width: 320px; height: 420px; background: white;
    display:none; flex-direction:column; overflow:hidden; z-index:9999;
  `;
  windowEl.innerHTML = `
    <div id="reset-header" style="background:#0077ff;color:white;padding:8px;font-weight:bold;text-align:center;position:relative;">
      💬 Chat with Assistant — Reset Guide
      <span id="reset-close" style="display:none;position:absolute;right:10px;top:5px;cursor:pointer;font-size:20px;color:white;">✖</span>
    </div>
    <div id="reset-messages" style="flex:1;padding:10px;overflow-y:auto;"></div>
    <div style="display:flex;border-top:1px solid #ccc;">
      <input id="reset-text" style="flex:1;border:none;padding:10px;" placeholder="Type here..."/>
      <button id="reset-send" style="background:#0077ff;color:white;border:none;padding:10px;">Send</button>
    </div>
    <div style="border-top:1px solid #ccc;padding:5px;text-align:center;">
      <button id="reset-clear" style="background:#eee;border:none;padding:5px 10px;cursor:pointer;font-size:12px;">🗑️ Start New Chat</button>
    </div>
  `;
  document.body.appendChild(windowEl);

  const closeBtn = windowEl.querySelector("#reset-close");
  const sendBtn = windowEl.querySelector("#reset-send");
  const clearBtn = windowEl.querySelector("#reset-clear");
  const inputEl = windowEl.querySelector("#reset-text");
  const messagesEl = windowEl.querySelector("#reset-messages");

  const STORAGE_KEY = "reset-assistant-history";

  function loadHistory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        sessionId = parsed.sessionId || null;
        messagesEl.innerHTML = parsed.html || "";
      } catch (err) {
        console.warn("⚠️ Corrupted chat history, resetting...");
        localStorage.removeItem(STORAGE_KEY);
        messagesEl.innerHTML = `<div id="reset-welcome"><b>${assistantName}:</b> Hi 👋! I’m your Reset Guide.</div>`;
      }
    } else {
      messagesEl.innerHTML = `<div id="reset-welcome"><b>${assistantName}:</b> Hi 👋! I’m your Reset Guide.</div>`;
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, html: messagesEl.innerHTML }));
  }

  clearBtn.onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionId = null;
    loadHistory();
  };

  // Responsive styles + slide-up animation
  const style = document.createElement("style");
  style.innerHTML = `
    @media (max-width: 768px) {
      #reset-window {
        width: 100% !important;
        height: 100% !important;
        bottom: -100% !important;
        right: 0 !important;
        border-radius: 0 !important;
        transition: bottom 0.4s ease-in-out;
      }
      #reset-window.show {
        bottom: 0 !important;
      }
    }
    #reset-bubble {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      width: 60px !important;
      height: 60px !important;
      border-radius: 50% !important;
      background: #0077ff !important;
      color: white !important;
      font-size: 28px !important;
      z-index: 2147483647 !important;
      cursor: pointer !important;
    }
  `;
  document.head.appendChild(style);

  bubble.onclick = () => {
    windowEl.classList.add("show");
    windowEl.style.display = "flex";
    if (window.innerWidth <= 768) {
      closeBtn.style.display = "block";
    }
  };

  closeBtn.onclick = () => {
    windowEl.classList.remove("show");
    setTimeout(() => {
      windowEl.style.display = "none";
    }, 400);
  };

  async function loadBranding() {
    try {
      const res = await fetch(`${API_BASE}/api/branding?licenseeId=${window.LICENSEE_ID || "clinic123"}`);
      const data = await res.json();

      assistantName = data.assistantName || "Assistant";

      // Update header + tooltip + input placeholder
      document.getElementById("reset-header").innerText = `💬 Chat with ${assistantName} — Reset Guide`;
      bubble.title = `Chat with ${assistantName}`;
      inputEl.placeholder = `Ask ${assistantName} something...`;

      // Apply branding styles
      bubble.style.background = data.bubbleColor;
      document.getElementById("reset-header").style.background = data.bubbleColor;
      messagesEl.style.fontSize = data.fontSize;
      messagesEl.style.fontFamily = data.fontFamily;
      messagesEl.style.lineHeight = data.lineHeight;
      windowEl.style.borderRadius = data.cornerRadius;

      // Replace welcome message with licensee-specific one
      messagesEl.innerHTML = `<div id="reset-welcome"><b>${assistantName}:</b> ${data.welcomeMessage}</div>`;
    } catch (err) {
      console.error("⚠️ Branding load error", err);
    }
  }

  async function sendMessage(){
    const msg = inputEl.value.trim();
    if(!msg) return;
    messagesEl.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    inputEl.value="";
    messagesEl.scrollTop = messagesEl.scrollHeight;
    saveHistory();

    let typingDiv = null;
    let dotInterval = null;
    const typingTimeout = setTimeout(() => {
      typingDiv = document.createElement("div");
      typingDiv.id = "reset-typing";
      typingDiv.innerHTML = `<i>${assistantName} is typing<span class='dots'>.</span></i>`;
      messagesEl.appendChild(typingDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      let dotCount = 1;
      dotInterval = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        typingDiv.querySelector(".dots").textContent = ".".repeat(dotCount);
      }, 500);
    }, 1000);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:msg, licenseeId:window.LICENSEE_ID || "clinic123", sessionId})
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      clearTimeout(typingTimeout);
      if (typingDiv) {
        clearInterval(dotInterval);
        typingDiv.remove();
      }

      if (data.sessionId) sessionId = data.sessionId;
      if (!data.reply) throw new Error("No reply from API.");

      messagesEl.innerHTML += `<div><b>${assistantName}:</b> ${data.reply}</div>`;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      saveHistory();

    } catch (err) {
      clearTimeout(typingTimeout);
      if (typingDiv) {
        clearInterval(dotInterval);
        typingDiv.remove();
      }
      messagesEl.innerHTML += `<div style="color:red;"><b>⚠️ Connection issue.</b></div>`;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      saveHistory();
    }
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

  loadBranding();
  loadHistory();
})();