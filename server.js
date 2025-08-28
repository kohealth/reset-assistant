import express from "express";
import fetch from "node-fetch";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

// In-memory sessions: { sessionId: [ {role, content}, ... ] }
const sessions = {};

// GLOBAL PROMPT with stricter rules
const GLOBAL_PROMPT = `
You are the Reset Guide for the 21-Day Met Reset™ program.

Rules:
- Greet warmly only ONCE at the very beginning.
- Do not repeat greetings if the user has already engaged.
- Stay focused on answering their specific questions or guiding them forward.
- If user says "yes" or confirms interest, move forward with next step instead of repeating.
- Always include disclaimer at the end: "⚠️ This is not medical advice. For health concerns, consult a licensed provider."
`;

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, licenseeId, sessionId } = req.body;

  try {
    const sid = sessionId || uuidv4(); // generate new if not provided
    if (!sessions[sid]) {
      sessions[sid] = [
        { role: "system", content: GLOBAL_PROMPT }
      ];
    }

    // Add user message
    sessions[sid].push({ role: "user", content: message });

    // Call OpenAI with full history
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: sessions[sid],
        max_tokens: 300
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "⚠️ No reply";

    // Add assistant reply to history
    sessions[sid].push({ role: "assistant", content: reply });

    res.json({ reply, sessionId: sid });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default app;