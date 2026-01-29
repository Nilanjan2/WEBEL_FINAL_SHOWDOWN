# RAG System Integration - Setup Guide

## ✅ Integration Complete!

The RAG (Retrieval-Augmented Generation) system has been successfully integrated into your email grievance management system. Here's how to get it running:

---

## 🚀 Quick Start

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**New dependencies added:**
- `faiss-cpu` - Vector similarity search
- `python-dotenv` - Environment variable management
- `torch` - Deep learning framework for embeddings

### Step 2: Configure OpenAI API Key

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file and add your OpenAI API key:**
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Get your API key from:** https://platform.openai.com/api-keys

### Step 3: Verify RAG Data Files

The following files should exist in `reply-generator-main/reply-generator-main/data/`:
- ✅ `faiss.index` - Vector database index
- ✅ `policy_chunks.json` - Policy document chunks

**Note:** These files already exist in your workspace!

### Step 4: Test the Integration

Run a quick test of the reply generator:

```bash
cd backend
python reply_generator.py
```

You should see a sample generated reply based on a test suspension case.

### Step 5: Start the Backend Server

```bash
cd backend
python main.py
```

The server will start at: **http://localhost:8000**

### Step 6: Start the Frontend

```bash
cd frontend
npm run dev
```

---

## 🎯 How to Use

### Generating AI Replies:

1. **Open any email** in the Email Thread Panel
2. **Click "Reply"** button
3. **Click "Generate AI Suggested Reply (RAG-Based)"** - the big purple button
4. **Wait a few seconds** for the AI to generate a policy-compliant reply
5. **Review and edit** the generated reply if needed
6. **Click "Send Reply"** to save the response

### Alternative Template Reply:

If you prefer a simple template-based reply, click **"Use Template Reply"** instead.

---

## 🔧 How It Works

### Backend Flow:

1. **User requests a reply** → Frontend sends email content to `/generate-reply` endpoint
2. **Embedding generation** → Email is converted to vector embeddings
3. **FAISS search** → Top 5 most similar policy chunks are retrieved (>60% similarity)
4. **LLM generation** → GPT-4o-mini generates reply using retrieved policy context
5. **Response returned** → Frontend displays the generated reply

### Frontend Flow:

1. User clicks "Generate AI Suggested Reply"
2. Loading spinner shows: "Generating AI Reply..."
3. AI reply appears in text area (editable)
4. User can modify before sending
5. Reply is saved when user clicks "Send Reply"

---

## ✨ Features

✅ **RAG-Based Intelligence** - Uses your actual policy documents  
✅ **Policy Compliance** - Only generates replies based on documented policies  
✅ **Fallback Mechanism** - Uses template if RAG fails  
✅ **Editable Replies** - Users can modify AI-generated text  
✅ **Visual Feedback** - Loading states and error messages  
✅ **Context-Aware** - Uses email subject, content, and sender info  

---

## 📁 Files Modified/Created

### New Files:
- `backend/reply_generator.py` - RAG integration module ✅ (already existed)
- `backend/.env.example` - Environment template ✅ (already existed)

### Modified Files:
- `backend/requirements.txt` - Added RAG dependencies ✅
- `backend/main.py` - Added `/generate-reply` endpoint ✅
- `frontend/src/services/api.ts` - Added `generateReply()` function ✅
- `frontend/src/components/ReplyModal.tsx` - Integrated RAG UI ✅

---

## 🔍 API Endpoint

### POST `/generate-reply`

**Request:**
```json
{
  "email_content": "Email text here...",
  "email_subject": "Subject line (optional)",
  "sender": "sender@example.com (optional)"
}
```

**Response:**
```json
{
  "suggested_reply": "Dear Sir/Madam,\n\nThank you for..."
}
```

---

## ⚠️ Troubleshooting

### Issue: "OPENAI_API_KEY not set"
**Solution:** Create `.env` file in the `backend` folder with your API key

### Issue: "FAISS index not found"
**Solution:** The index already exists at `reply-generator-main/reply-generator-main/data/faiss.index`

### Issue: "Failed to generate reply"
**Checks:**
- ✓ Backend server is running on port 8000
- ✓ OpenAI API key is valid
- ✓ You have sufficient OpenAI credits
- ✓ Internet connection is active

**Note:** The system will automatically fall back to template-based replies if RAG fails.

### Issue: CORS errors
**Solution:** Make sure backend is running on port 8000 and frontend accesses `http://localhost:8000`

---

## 💰 Cost Information

- **Model:** GPT-4o-mini (cost-effective)
- **Cost per reply:** ~$0.0001-0.0003 (less than a cent)
- **Temperature:** 0.1 (consistent, policy-focused)
- **Timeout:** 15 seconds

---

## 🎨 UI Changes

The Reply Modal now features:

1. **Two buttons when empty:**
   - "Generate AI Suggested Reply (RAG-Based)" (purple gradient, prominent)
   - "Use Template Reply" (gray, secondary option)

2. **Loading state:**
   - Animated spinner with "Generating AI Reply..."

3. **Success indicator:**
   - Purple banner: "AI-generated reply - you can edit it before sending"

4. **Error handling:**
   - Amber warning if RAG fails, automatically falls back to template

---

## 📚 Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Configure `.env` file with OpenAI API key
3. ✅ Test: `python reply_generator.py`
4. ✅ Start backend: `python main.py`
5. ✅ Start frontend: `npm run dev`
6. ✅ Try generating a reply!

---

## 🤝 Support

For issues:
- **RAG model:** Check `reply-generator-main` folder and data files
- **Integration:** Review this guide and code comments
- **Backend:** Check [backend/main.py](backend/main.py#L232) and [backend/reply_generator.py](backend/reply_generator.py)
- **Frontend:** Check [frontend/src/components/ReplyModal.tsx](frontend/src/components/ReplyModal.tsx)

---

**Happy reply generating! 🎉**
