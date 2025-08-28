import express from "express";
import fetch from "node-fetch";
import Papa from "papaparse";

const app = express();
app.use(express.json());

// ✅ Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// 🔑 Replace with your Google Sheet CSV link
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/<LONG_ID>/pub?output=csv";

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
          bubbleColor: row.bubbleColor || "#0077ff",
          logoUrl: row.logoUrl || "",
          welcomeMessage: row.welcomeMessage || `Hi 👋! I’m the Reset Guide for ${row.branding}.`,
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
    return {
      "clinic123": {
        branding: "Clinic 123",
        enrollLink: "https://clinic123.com/enroll",
        bookingLink: "https://clinic123.com/book",
        bubbleColor: "#0077ff",
        logoUrl: "",
        welcomeMessage: "Hi 👋! I’m your Reset Guide. Are you here for stubborn weight, low energy, or pain?",
        fontSize: "16px",
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.6",
        bubbleSize: "60px",
        cornerRadius: "16px"
      }
    };
  }
}

const GLOBAL_PROMPT = `
You are the Reset Guide for the 21-Day Met Reset™ program.
Your job is to:
- Welcome visitors warmly
- Ask clarifying questions
- Educate them on the Reset program
- Direct them to enroll (link provided) or book a call (link provided)
Rules:
- Stay positive and encouraging
- Keep answers short, clear, and conversational
- Always include disclaimer: "⚠️ This is not medical advice. For health concerns, consult a licensed provider."
`;

app.post("/api/chat", async (req, res) => {
  const { message, licenseeId } = req.body;
  console.log("📩 Incoming:", { message, licenseeId });

  try {
    const LICENSEE_CONFIGS = await getLicenseeConfigs();
    const config = LICENSEE_CONFIGS[licenseeId] || LICENSEE_CONFIGS["clinic123"];

    if (message === "__branding__") {
      return res.json(config);
    }

    const systemPrompt = `
      ${GLOBAL_PROMPT}
      Clinic: ${config.branding}
      Enrollment link: ${config.enrollLink}
      Booking link: ${config.bookingLink}
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "⚠️ No reply" });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default app;