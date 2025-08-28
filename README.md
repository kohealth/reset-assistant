# Reset Assistant – AI Chat Widget (Google Sheets + Logo Version)

This version pulls licensee configuration (links, branding, colors, messages, logos) directly from a Google Sheet.

## 🚀 Setup

1. Upload `licensees_template.xlsx` to Google Drive and convert to a Google Sheet.
2. Publish the sheet to the web → choose CSV format. You’ll get a link like:
   `https://docs.google.com/spreadsheets/d/e/<LONG_ID>/pub?output=csv`
3. Copy that link and replace `SHEET_URL` in `server.js`.
4. Deploy to Vercel with your `OPENAI_API_KEY` set.

## ✅ Features

- Licensee configs are updated live from Google Sheets.
- Bubble color + logo + welcome message update per licensee.
- Global sales script is controlled centrally in `server.js`.
- Auto disclaimer built into every assistant response.

