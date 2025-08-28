(function(){
  const API_BASE = "https://reset-assistant.vercel.app";

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

  bubble.onclick = () => {
    windowEl.style.display = windowEl.style.display === "none" ? "flex" : "none";
  };

  const sendBtn = windowEl.querySelector("#reset-send");
  const clearBtn = windowEl.querySelector("#reset-clear");
  const inputEl = windowEl.querySelector("#reset-text");
  const messagesEl = windowEl.querySelector("#reset-messages");

  let fallbackEnroll = null;
  const STORAGE_KEY = "reset-assistant-history";

  // Load chat history from localStorage
  function loadHistory() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      messagesEl.innerHTML = saved;
    } else {
      messagesEl.innerHTML = `<div id="reset-welcome"><b>Reset Assistant:</b> Hi 👋! I’m your Reset Guide.</div>`;
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Save chat history to localStorage
  function saveHistory() {
    localStorage.setItem(STORAGE_KEY, messagesEl.innerHTML);
  }

  // Clear chat history
  clearBtn.onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    loadHistory();
  };

  // Load branding and style settings
  async function loadBranding() {
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:"__branding__", licenseeId:window.LICENSEE_ID || "clinic123"})
      });
      const data = await res.json();

      if (data.branding) {
        if (data.bubbleColor) {
          bubble.style.background = data.bubbleColor;
          sendBtn.style.background = data.bubbleColor;
        }
        if (data.logoUrl) {
          bubble.innerText = "";
          bubble.style.backgroundImage = `url('${data.logoUrl}')`;
          bubble.style.backgroundSize = "cover";
          bubble.style.backgroundPosition = "center";
        }
        if (data.welcomeMessage && !localStorage.getItem(STORAGE_KEY)) {
          document.getElementById("reset-welcome").innerHTML =
            `<b>Reset Assistant:</b> ${data.welcomeMessage}`;
        }
        if (data.enrollLink) fallbackEnroll = data.enrollLink;

        // Apply style settings if present
        const style = document.createElement("style");
        style.innerHTML = `
          #reset-messages {
            font-size: ${data.fontSize || "16px"} !important;
            line-height: ${data.lineHeight || "1.6"} !important;
            font-family: ${data.fontFamily || "Arial, sans-serif"} !important;
          }
          #reset-messages div { margin-bottom: 10px !important; }
          #reset-bubble {
            width: ${data.bubbleSize || "60px"} !important;
            height: ${data.bubbleSize || "60px"} !important;
            border-radius: 50% !important;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.3) !important;
            color: white; display:flex; align-items:center; justify-content:center;
            font-size:28px; cursor:pointer; position: fixed; bottom: 20px; right: 20px; z-index:9999;
          }
          #reset-window {
            border-radius: ${data.cornerRadius || "16px"} !important;
            box-shadow: 0px 6px 16px rgba(0,0,0,0.25) !important;
            font-family: ${data.fontFamily || "Arial, sans-serif"} !important;
          }
          #reset-text {
            font-size: 14px !important;
            font-family: ${data.fontFamily || "Arial, sans-serif"} !important;
          }
          #reset-send, #reset-clear {
            cursor: pointer !important;
            font-family: ${data.fontFamily || "Arial, sans-serif"} !important;
          }
          #reset-typing {
            font-style: italic;
            color: #666;
            margin-bottom: 8px;
          }
        `;
        document.head.appendChild(style);
      }
    } catch (err) {
      console.error("⚠️ Branding load error", err);
    }
  }

  loadHistory();
  loadBranding();

  async function sendMessage(){
    const msg = inputEl.value.trim();
    if(!msg) return;
    messagesEl.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    inputEl.value="";
    messagesEl.scrollTop = messagesEl.scrollHeight;
    saveHistory();

    // Show typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.id = "reset-typing";
    typingDiv.innerHTML = "<i>Reset Assistant is typing<span class='dots'>.</span></i>";
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    let dotCount = 1;
    const dotInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      typingDiv.querySelector(".dots").textContent = ".".repeat(dotCount);
    }, 500);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:msg, licenseeId:window.LICENSEE_ID || "clinic123"})
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      clearInterval(dotInterval);
      typingDiv.remove();

      if (!data.reply) throw new Error("No reply from API.");

      messagesEl.innerHTML += `<div><b>Reset Assistant:</b> ${data.reply}</div>`;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      saveHistory();

    } catch (err) {
      clearInterval(dotInterval);
      typingDiv.remove();
      let fb = `<div style="color:red;"><b>⚠️ Connection issue.</b></div>`;
      if (fallbackEnroll) fb += `<div>👉 <a href="${fallbackEnroll}" target="_blank">Enroll here</a></div>`;
      messagesEl.innerHTML += fb;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      saveHistory();
    }
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });
})();