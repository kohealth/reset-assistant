import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const LICENSEE_CONFIGS = {
  "clinic123": {
    enrollLink: "https://clinic123.com/enroll",
    bookingLink: "https://clinic123.com/book",
    branding: "Clinic 123"
  },
  "clinicXYZ": {
    enrollLink: "https://clinicxyz.com/enroll",
    bookingLink: "https://clinicxyz.com/book",
    branding: "Clinic XYZ"
  }
};

app.post("/api/chat", async (req, res) => {
  const { message, licenseeId } = req.body;
  const config = LICENSEE_CONFIGS[licenseeId] || LICENSEE_CONFIGS["clinic123"];

  const systemPrompt = `
    You are the Reset Guide for ${config.branding}.
    Only answer questions about the 21-Day Met Reset program.
    Enrollment link: ${config.enrollLink}.
    Booking link: ${config.bookingLink}.
    If off-topic, redirect user to enroll or book a call.
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
  res.json({ reply: data.choices[0].message.content });
});

export default app;