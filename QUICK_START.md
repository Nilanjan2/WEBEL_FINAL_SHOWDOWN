# ⚡ Quick Start - RAG Integration

## 🚦 3-Step Setup

### Step 1: Install Dependencies (2 minutes)
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Add API Key (1 minute)
```bash
# Create .env file in backend/
cd backend
echo OPENAI_API_KEY=sk-your-key-here > .env

# Or manually:
# 1. Copy .env.example to .env
# 2. Replace "your_openai_api_key_here" with your actual key
# 3. Get key from: https://platform.openai.com/api-keys
```

### Step 3: Start Servers (30 seconds)
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## ✅ Test It Out

1. Open frontend in browser
2. Click any email
3. Click "Reply" button
4. Click **"Generate AI Suggested Reply (RAG-Based)"** (purple button)
5. Wait 2-5 seconds
6. See AI-generated reply!
7. Edit if needed
8. Send!

## 📋 Checklist

- [ ] Installed: `faiss-cpu`, `torch`, `python-dotenv`
- [ ] Created: `backend/.env` file
- [ ] Added: OpenAI API key to `.env`
- [ ] Running: Backend on port 8000
- [ ] Running: Frontend dev server
- [ ] Verified: FAISS index exists at `reply-generator-main/reply-generator-main/data/faiss.index`
- [ ] Tested: Generated first AI reply successfully!

## 🎯 What You Get

| Before | After |
|--------|-------|
| Template replies only | AI-powered + Templates |
| Static responses | Policy-aware responses |
| No context | Uses actual policies |
| Manual writing | One-click generation |

## 💰 Cost

- **Per reply:** ~$0.0002 USD
- **100 replies:** ~$0.02 USD
- **1000 replies:** ~$0.20 USD

**Conclusion:** Extremely affordable! 🎉

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "OPENAI_API_KEY not set" | Create `.env` file with API key |
| "FAISS index not found" | Check path: `reply-generator-main/reply-generator-main/data/` |
| "Failed to generate reply" | Check API key validity & internet |
| CORS errors | Ensure backend is on port 8000 |
| Import errors | Run `pip install -r requirements.txt` |

## 🔧 Troubleshooting Commands

```bash
# Check if backend is running
curl http://localhost:8000/dashboard

# Test reply generator directly
cd backend
python reply_generator.py

# Check if dependencies installed
pip list | grep -E "faiss|torch|openai|dotenv"

# Verify FAISS index
ls reply-generator-main/reply-generator-main/data/
```

## 📚 Documentation

- **Setup Guide:** [RAG_SETUP_GUIDE.md](RAG_SETUP_GUIDE.md)
- **Architecture:** [RAG_ARCHITECTURE.md](RAG_ARCHITECTURE.md)  
- **Summary:** [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)
- **Original Docs:** [backend/RAG_INTEGRATION.md](backend/RAG_INTEGRATION.md)

## 🎊 Done!

Your system now has:
- ✅ AI-powered reply generation
- ✅ Policy-compliant responses
- ✅ Fallback templates
- ✅ Beautiful UI
- ✅ Error handling
- ✅ Cost-effective (~$0.0002/reply)

**Start generating smart replies now! 🚀**
