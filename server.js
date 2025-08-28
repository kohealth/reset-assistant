import express from "express";
import fetch from "node-fetch";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

// ✅ Enable CORS for all licensee websites
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 🔗 Published Google Sheet (must end in ?output=csv)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRh4WQtnznsHb4P-ETKnnFceDuenY2nJ-2IsvDepmX3v8u7p2uBj9zxea1elNx5ncGXwfLuql3gfvVG/pub?output=csv";

// In-memory sessions: { sessionId: [ {role, content}, ... ] }
const sessions = {};

// 🔹 Global rules (applies to all licensees)
const GLOBAL_PROMPT = `
You are the Reset Guide for the 21-Day Met Reset™ program.

Rules:
- Greet warmly only ONCE at the very beginning.
- Do not repeat greetings if the user has already engaged.
- Stay focused on answering their specific questions or guiding them forward.
- If user says "yes" or confirms interest, move forward with next step instead of repeating.
- Always include disclaimer at the end: "⚠️ This is not medical advice. For health concerns, consult a licensed provider."
`;

// 🔹 Fetch licensee configs from Google Sheet
async function getLicenseeConfigs() {
  try {
    const res = await fetch(SHEET_URL);
    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true });
    const rows = parsed.data;

    const configs = {};
    rows.forEach(row => {
      if (row.licenseeId) {
        configs[row.licenseeId] = {
          branding: row.branding,
          enrollLink: row.enrollLink,
          bookingLink: row.bookingLink,
          assistantName: row.assistantName || "Assistant",
          welcomeMessage: row.welcomeMessage || `Hi 👋! I’m your Reset Guide.`,
          bubbleColor: row.bubbleColor || "#0077ff",
          logoUrl: row.logoUrl || "",
          fontSize: row.fontSize || "16px",
          fontFamily: row.fontFamily || "Arial, sans-serif",
          lineHeight: row.lineHeight || "1.6",
          bubbleSize: row.bubbleSize || "60px",
          cornerRadius: row.cornerRadius || "16px"
        };
      }
    });

    return configs;
  } catch (err) {
    console.error("⚠️ Error fetching Google Sheet:", err);
    return {}; // fallback to empty if sheet fails
  }
}

// 🔹 Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, licenseeId, sessionId } = req.body;

  try {
    const LICENSEE_CONFIGS = await getLicenseeConfigs();
    const config = LICENSEE_CONFIGS[licenseeId] || {};

    // Build system prompt with licensee context
    const systemPrompt = `
      ${GLOBAL_PROMPT}
      Clinic: ${config.branding || "Reset Clinic"}
      Assistant name: ${config.assistantName || "Assistant"}
      Enrollment link: ${config.enrollLink || "N/A"}
      Booking link: ${config.bookingLink || "N/A"}
    `;

    // Manage session history
    const sid = sessionId || uuidv4();
    if (!sessions[sid]) {
      sessions[sid] = [
        { role: "system", content: systemPrompt }
      ];
    }

    // Add user message
    sessions[sid].push({ role: "user", content: message });

    // Call OpenAI
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

// 🔹 Branding endpoint for widget.js
app.get("/api/branding", async (req, res) => {
  const licenseeId = req.query.licenseeId || "clinic123";

  try {
    const LICENSEE_CONFIGS = await getLicenseeConfigs();
    const config = LICENSEE_CONFIGS[licenseeId] || {};

    res.json({
      branding: config.branding || "Reset Clinic",
      assistantName: config.assistantName || "Assistant",
      welcomeMessage: config.welcomeMessage || "Hi 👋! I’m your Reset Guide.",
      enrollLink: config.enrollLink || "",
      bookingLink: config.bookingLink || "",
      bubbleColor: config.bubbleColor || "#0077ff",
      logoUrl: config.logoUrl || "",
      fontSize: config.fontSize || "16px",
      fontFamily: config.fontFamily || "Arial, sans-serif",
      lineHeight: config.lineHeight || "1.6",
      bubbleSize: config.bubbleSize || "60px",
      cornerRadius: config.cornerRadius || "16px"
    });
  } catch (err) {
    console.error("⚠️ Branding fetch error:", err);
    res.status(500).json({ error: "Could not load branding" });
  }
});

export default app;
