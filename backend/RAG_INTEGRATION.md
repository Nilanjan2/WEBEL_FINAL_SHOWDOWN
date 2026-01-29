# RAG-Based Reply Generation Integration Guide

## Overview
Your email grievance system now uses a RAG (Retrieval-Augmented Generation) model to generate intelligent, policy-compliant suggested replies based on your friend's reply-generator system.

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The following new dependencies have been added:
- `faiss-cpu` - For vector similarity search
- `python-dotenv` - For environment variables
- `torch` - For deep learning models

### 2. Configure OpenAI API Key

1. Create a `.env` file in the `backend` folder:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. Get your API key from: https://platform.openai.com/api-keys

### 3. Verify RAG Data Files

Make sure the following files exist in `reply-generator-main/reply-generator-main/data/`:
- `faiss.index` - The FAISS vector index
- `policy_chunks.json` - The policy document chunks

If these files don't exist, you need to run the ingestion script:
```bash
cd reply-generator-main/reply-generator-main
python ingest.py
```

### 4. Test the Integration

Test the reply generator directly:
```bash
cd backend
python reply_generator.py
```

This will run a test and show you a sample generated reply.

### 5. Start the Backend Server

```bash
cd backend
python main.py
```

The server will start at `http://localhost:8000`

### 6. Start the Frontend

```bash
cd frontend
npm install  # if not already done
npm run dev
```

## How It Works

### Backend Flow:

1. **Email received** → User clicks "Generate AI Suggested Reply"
2. **Frontend sends request** to `/generate-reply` endpoint with:
   - Email content
   - Subject
   - Sender information

3. **RAG Processing**:
   - Email content is converted to embeddings using `sentence-transformers`
   - FAISS searches for the top 5 most similar policy chunks
   - Relevant policy sections are retrieved based on similarity score (>60%)

4. **LLM Generation**:
   - Retrieved policy chunks are sent to GPT-4o-mini as context
   - LLM generates a policy-compliant reply using only the provided context
   - Reply is formatted as a professional email

5. **Response sent back** to frontend

### Frontend Flow:

1. User opens ReplyModal for an email
2. Clicks "Generate AI Suggested Reply (RAG-Based)" button
3. Loading state shows "Generating AI Reply..."
4. Generated reply appears in the text area
5. User can edit the reply before sending
6. Reply is saved/sent when user clicks "Send Reply"

## Features

✅ **RAG-Based Intelligence**: Uses your policy documents as knowledge base
✅ **Policy Compliance**: Only generates replies based on actual policies
✅ **Fallback Mechanism**: If RAG fails, uses template-based fallback
✅ **Editable Replies**: Users can modify AI-generated replies
✅ **Visual Feedback**: Shows loading states and error messages
✅ **Context-Aware**: Uses email subject, content, and sender information

## API Endpoint

### POST `/generate-reply`

**Request Body:**
```json
{
  "email_content": "string",
  "email_subject": "string (optional)",
  "sender": "string (optional)"
}
```

**Response:**
```json
{
  "suggested_reply": "string"
}
```

## Troubleshooting

### Issue: "OPENAI_API_KEY not set"
- Solution: Make sure `.env` file exists in backend folder with valid API key

### Issue: "FAISS index not found"
- Solution: Run `python ingest.py` in reply-generator-main folder

### Issue: "Failed to generate reply"
- Check: Backend server is running
- Check: OpenAI API key is valid
- Check: FAISS index and policy_chunks.json exist
- The system will fall back to template-based replies

### Issue: CORS errors
- Make sure backend is running on port 8000
- Frontend should access `http://localhost:8000`

## File Changes Summary

### New Files:
- `backend/reply_generator.py` - RAG integration module
- `backend/.env.example` - Environment template
- `backend/RAG_INTEGRATION.md` - This guide

### Modified Files:
- `backend/main.py` - Added `/generate-reply` endpoint
- `backend/requirements.txt` - Added RAG dependencies
- `frontend/src/components/ReplyModal.tsx` - Integrated RAG API calls

## Cost Considerations

- Using GPT-4o-mini model (cost-effective)
- Each reply generation costs ~$0.0001-0.0003
- Temperature set to 0.1 for consistent, policy-focused responses
- 15-second timeout to prevent hanging

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure OpenAI API key
3. ✅ Verify RAG data files exist
4. ✅ Test the system
5. ✅ Start using RAG-based replies!

## Support

For issues related to:
- **RAG model**: Check with your friend who created reply-generator-main
- **Integration**: Check this guide and the code comments
- **Backend API**: Check `backend/main.py` and `backend/reply_generator.py`
- **Frontend UI**: Check `frontend/src/components/ReplyModal.tsx`
