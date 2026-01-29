# RAG System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + TypeScript)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │         ReplyModal Component                                │         │
│  │  ┌──────────────────────────────────────────────────┐      │         │
│  │  │  [Generate AI Suggested Reply (RAG-Based)]       │      │         │
│  │  │           ↓ (onClick)                            │      │         │
│  │  │     handleGenerateAIReply()                      │      │         │
│  │  └──────────────────────────────────────────────────┘      │         │
│  └─────────────────────────────┬──────────────────────────────┘         │
│                                 │                                        │
│                                 ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  api.ts - generateReply()                                    │        │
│  │  POST http://localhost:8000/generate-reply                   │        │
│  │  Body: { email_content, email_subject, sender }             │        │
│  └─────────────────────────────┬─────────────────────────────────       │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  │ HTTP POST Request
                                  │
┌─────────────────────────────────┼────────────────────────────────────────┐
│                                 ↓                                        │
│                      BACKEND (FastAPI + Python)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  main.py                                                     │        │
│  │  @app.post("/generate-reply")                               │        │
│  │  def generate_reply(request):                               │        │
│  │      → calls reply_generator.generate_suggested_reply()     │        │
│  └─────────────────────────────┬─────────────────────────────────       │
│                                 │                                        │
│                                 ↓                                        │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  reply_generator.py                                          │        │
│  │                                                              │        │
│  │  1. Load SentenceTransformer ("all-MiniLM-L6-v2")          │        │
│  │     ↓                                                        │        │
│  │  2. Convert email to embeddings                             │        │
│  │     ↓                                                        │        │
│  │  3. Search FAISS index for similar policy chunks            │        │
│  │     (TOP_K=5, threshold=60%)                                │        │
│  │     ↓                                                        │        │
│  │  4. Retrieve matching policy chunks                         │        │
│  │     ↓                                                        │        │
│  │  5. Build context from policy sections                      │        │
│  │     ↓                                                        │        │
│  │  6. Call OpenAI GPT-4o-mini API                            │        │
│  │     • System prompt: Strict policy compliance               │        │
│  │     • User prompt: Email + Policy context                   │        │
│  │     • Temperature: 0.1 (consistent)                         │        │
│  │     ↓                                                        │        │
│  │  7. Return formatted professional reply                     │        │
│  └─────────────────────────────┬─────────────────────────────────       │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  │ Response: { suggested_reply: "..." }
                                  │
┌─────────────────────────────────┼────────────────────────────────────────┐
│                                 ↓                                        │
│                      DATA SOURCES & EXTERNAL APIS                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  reply-generator-main/data/  │  │  OpenAI API                    │   │
│  │  • faiss.index              │  │  • GPT-4o-mini model           │   │
│  │  • policy_chunks.json       │  │  • gpt-4o-mini                 │   │
│  │                              │  │  • 15s timeout                 │   │
│  │  (Vector Database)           │  │                                │   │
│  └──────────────────────────────┘  └────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘


FLOW DIAGRAM:

User clicks button
    ↓
Frontend: Show loading spinner "Generating AI Reply..."
    ↓
API call to /generate-reply with email data
    ↓
Backend: Embed email → Search FAISS → Retrieve top 5 policy chunks
    ↓
Backend: Send (email + policy context) to OpenAI GPT-4o-mini
    ↓
OpenAI: Generate policy-compliant reply
    ↓
Backend: Return suggested reply
    ↓
Frontend: Display reply in text area (editable)
    ↓
User: Edit if needed → Send reply


FALLBACK MECHANISM:

If RAG fails (API error, no API key, etc.)
    ↓
Show error message: "Failed to generate AI reply. Using template instead."
    ↓
Use template-based reply (category-specific)
    ↓
Display in text area


FILE STRUCTURE:

webel123/
├── backend/
│   ├── main.py                    ← /generate-reply endpoint ✅
│   ├── reply_generator.py         ← RAG logic ✅
│   ├── requirements.txt           ← Updated with RAG deps ✅
│   ├── .env.example              ← API key template ✅
│   └── .env                       ← Your API key (create this!)
│
├── frontend/
│   └── src/
│       ├── services/
│       │   └── api.ts            ← generateReply() function ✅
│       └── components/
│           └── ReplyModal.tsx    ← RAG UI integration ✅
│
├── reply-generator-main/
│   └── reply-generator-main/
│       └── data/
│           ├── faiss.index       ← Vector database ✅
│           └── policy_chunks.json ← Policy docs ✅
│
└── RAG_SETUP_GUIDE.md            ← Setup instructions ✅


TECHNOLOGY STACK:

Frontend:
  • React + TypeScript
  • Lucide React Icons (Sparkles, Loader2)
  • Fetch API for HTTP requests

Backend:
  • FastAPI (Python web framework)
  • Pydantic (request validation)
  • OpenAI API client

RAG System:
  • SentenceTransformers (all-MiniLM-L6-v2)
  • FAISS (Facebook AI Similarity Search)
  • OpenAI GPT-4o-mini
  • PyTorch (embeddings)

Environment:
  • python-dotenv (API key management)
  • uvicorn (ASGI server)
```
