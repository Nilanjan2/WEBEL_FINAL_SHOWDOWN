# reply_generator.py
import os
import json
import faiss
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import torch
from dotenv import load_dotenv

# ---------- CONFIG ----------
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "reply-generator-main", "reply-generator-main", "data")
INDEX_PATH = os.path.join(DATA_DIR, "faiss.index")
CHUNKS_PATH = os.path.join(DATA_DIR, "policy_chunks.json")
TOP_K = 5
SIMILARITY_THRESHOLD = 0.60
LLM_MODEL = "gpt-4o-mini"

# ---------- OPENAI ----------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set. Please add it to your .env file")

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------- EMBEDDING ----------
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device} for embeddings")
embedder = SentenceTransformer(
    "all-MiniLM-L6-v2",
    device=device
)

# ---------- LOAD DATA ----------
try:
    index = faiss.read_index(INDEX_PATH)
    with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
        policy_chunks = json.load(f)

    if index.ntotal != len(policy_chunks):
        raise RuntimeError("FAISS index and policy chunks count mismatch")
    
    print(f"✅ Loaded RAG model with {len(policy_chunks)} policy chunks")
except Exception as e:
    print(f"⚠️ Warning: Could not load RAG model: {e}")
    print("Reply generation will use fallback mode")
    index = None
    policy_chunks = []

SYSTEM_PROMPT = """
You are a strict policy-bound compliance assistant for a Higher Education Department grievance redressal system.

Rules:
- Use ONLY the provided policy excerpts to generate replies.
- Do NOT rely on outside knowledge.
- If policy does not cover the query, say so explicitly.
- Do NOT invent rules or exceptions.
- Be formal and professional in tone.
- Address the specific grievance raised in the email.
"""

def retrieve_policy_chunks(email_text: str):
    """Retrieve relevant policy chunks based on email content"""
    if not index or not policy_chunks:
        return []
    
    query_emb = embedder.encode(
        [email_text],
        normalize_embeddings=True
    )
    query_emb = np.asarray(query_emb).astype("float32")

    scores, indices = index.search(query_emb, TOP_K)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1 or score < SIMILARITY_THRESHOLD:
            continue
        results.append({
            "text": policy_chunks[idx]["text"],
            "metadata": policy_chunks[idx]["metadata"],
            "score": float(score)
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def generate_suggested_reply(email_content: str, email_subject: str = "", sender: str = "") -> str:
    """
    Generate a policy-compliant suggested reply using RAG
    
    Args:
        email_content: The content of the email to reply to
        email_subject: Optional subject line
        sender: Optional sender information
        
    Returns:
        A suggested reply text
    """
    try:
        # Combine subject and content for better context
        full_context = f"Subject: {email_subject}\n\n{email_content}" if email_subject else email_content
        
        retrieved = retrieve_policy_chunks(full_context)

        if not retrieved:
            return (
                "Dear Sir/Madam,\n\n"
                "Thank you for your email. The submitted matter does not fall under the scope "
                "of the current grievance redressal policy. Please provide more specific details "
                "or contact the appropriate department for assistance.\n\n"
                "Regards,\n"
                "Higher Education Department"
            )

        # Build context from retrieved policy chunks
        context = "\n\n".join(
            f"[Clause {c['metadata']['clause_id']}] {c['text']}"
            for c in retrieved
        )

        user_prompt = f"""
USER EMAIL:
Subject: {email_subject}
From: {sender}

{email_content}

APPLICABLE POLICY SECTIONS:
{context}

TASK:
Draft a formal, policy-compliant reply to this email. The reply should:
1. Acknowledge the grievance professionally
2. Reference the applicable policy clauses
3. Provide clear guidance or resolution based on the policy
4. Maintain a respectful and helpful tone
5. Include proper salutation and closing

Format the reply as a complete email ready to send.
"""

        response = client.chat.completions.create(
            model=LLM_MODEL,
            temperature=0.1,
            timeout=15,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )

        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"Error generating reply: {e}")
        # Fallback reply
        return (
            "Dear Sir/Madam,\n\n"
            "Thank you for your email regarding your grievance. Your matter has been received "
            "and is under review. We will respond with appropriate guidance based on the "
            "applicable policies and procedures.\n\n"
            "Regards,\n"
            "Higher Education Department"
        )


if __name__ == "__main__":
    # Test the reply generator
    test_email = """
    We are writing to inform you about a suspension case at our college. 
    The employee has been suspended for 6 months due to misconduct. 
    Please advise on the next steps according to the policy.
    """
    
    reply = generate_suggested_reply(
        email_content=test_email,
        email_subject="Suspension Case Query",
        sender="principal@college.edu"
    )
    
    print("=" * 80)
    print("SUGGESTED REPLY:")
    print("=" * 80)
    print(reply)
