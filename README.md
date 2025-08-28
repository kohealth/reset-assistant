# Reset Assistant – AI Chat Widget

This project gives you a plug-and-play AI chat widget powered by OpenAI.

## 🚀 Quick Setup

### 1. Clone Repo
```
git clone https://github.com/YOURNAME/reset-assistant.git
cd reset-assistant
```

### 2. Install Dependencies
```
npm install
```

### 3. Set OpenAI API Key
Create a `.env` file:
```
OPENAI_API_KEY=sk-yourkey
```

### 4. Run Locally
```
node server.js
```

### 5. Deploy to Vercel
1. Create a free account at [vercel.com](https://vercel.com).  
2. Import this GitHub repo into Vercel.  
3. Add `OPENAI_API_KEY` in Vercel → Settings → Environment Variables.  
4. Click Deploy.  

You’ll get a live URL like:
- Widget: `https://yourproject.vercel.app/widget.js`
- API: `https://yourproject.vercel.app/api/chat`
- Demo: `https://yourproject.vercel.app/`

### 6. Add Widget to a Site
On any licensee site, paste:
```html
<script>window.LICENSEE_ID="clinic123";</script>
<script src="https://yourproject.vercel.app/widget.js"></script>
```

That’s it 🎉