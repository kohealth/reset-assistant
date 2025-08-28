(function(){
  const bubble = document.createElement("div");
  bubble.id = "reset-bubble";
  bubble.style = `
    position: fixed; bottom: 20px; right: 20px;
    width: 60px; height: 60px; border-radius: 50%;
    background: #0077ff; color: white; display:flex;
    align-items:center; justify-content:center;
    font-size:28px; cursor:pointer; z-index:9999;
  `;
  bubble.innerText = "💬";
  document.body.appendChild(bubble);

  const windowEl = document.createElement("div");
  windowEl.id = "reset-window";
  windowEl.style = `
    position: fixed; bottom: 90px; right: 20px;
    width: 320px; height: 400px; background: white;
    border-radius: 12px; box-shadow:0px 4px 10px rgba(0,0,0,0.3);
    display:none; flex-direction:column; overflow:hidden;
    font-family:sans-serif; z-index:9999;
  `;
  windowEl.innerHTML = `
    <div id="reset-messages" style="flex:1;padding:10px;overflow-y:auto;font-size:14px;">
      <div><b>Reset Assistant:</b> Hi 👋! I’m your Reset Guide. Are you here because of stubborn weight, low energy, or nagging pain?</div>
    </div>
    <div style="display:flex;border-top:1px solid #ccc;">
      <input id="reset-text" style="flex:1;border:none;padding:10px;" placeholder="Type here..."/>
      <button id="reset-send" style="background:#0077ff;color:white;border:none;padding:10px;">Send</button>
    </div>
  `;
  document.body.appendChild(windowEl);

  bubble.onclick = () => {
    windowEl.style.display = windowEl.style.display === "none" ? "flex" : "none";
  };

  const sendBtn = windowEl.querySelector("#reset-send");
  const inputEl = windowEl.querySelector("#reset-text");
  const messagesEl = windowEl.querySelector("#reset-messages");

  async function sendMessage(){
    const msg = inputEl.value.trim();
    if(!msg) return;
    messagesEl.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    inputEl.value="";

    try {
      const response = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:msg, licenseeId:window.LICENSEE_ID || "clinic123"})
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.reply) {
        throw new Error("No reply from API. Check server logs or OpenAI key.");
      }

      messagesEl.innerHTML += `<div><b>Reset Assistant:</b> ${data.reply}</div>`;
      messagesEl.scrollTop = messagesEl.scrollHeight;

    } catch (err) {
      console.error("❌ Chat Error:", err);
      messagesEl.innerHTML += `<div style="color:red;"><b>Error:</b> ${err.message}</div>`;
    }
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });
})();
