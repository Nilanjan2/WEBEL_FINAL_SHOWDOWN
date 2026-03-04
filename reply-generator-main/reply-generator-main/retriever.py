# retriever.py

import os
import json
import faiss
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import torch
from dotenv import load_dotenv

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

DATA_DIR = "data"
INDEX_PATH = f"{DATA_DIR}/faiss.index"
CHUNKS_PATH = f"{DATA_DIR}/policy_chunks.json"

TOP_K = 5                 # Retrieve top 5, use top 3 finally
LLM_MODEL = "gpt-4o-mini"
TEMPERATURE = 0.1

# --------------------------------------------------
# LOAD ENVIRONMENT
# --------------------------------------------------

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

client = OpenAI(api_key=OPENAI_API_KEY)

# --------------------------------------------------
# EMBEDDING MODEL
# --------------------------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"

embedder = SentenceTransformer(
    "multi-qa-mpnet-base-dot-v1",  # Stronger retrieval model
    device=device
)

# --------------------------------------------------
# LOAD INDEX + POLICY DATA
# --------------------------------------------------

if not os.path.exists(INDEX_PATH):
    raise RuntimeError("FAISS index not found. Run ingest.py first.")

if not os.path.exists(CHUNKS_PATH):
    raise RuntimeError("policy_chunks.json not found.")

index = faiss.read_index(INDEX_PATH)

with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
    policy_chunks = json.load(f)

if index.ntotal != len(policy_chunks):
    raise RuntimeError("FAISS index and policy chunks count mismatch")

# --------------------------------------------------
# SYSTEM PROMPT
# --------------------------------------------------

SYSTEM_PROMPT = """
You are a senior grievance redressal officer of the Higher Education Department.

STRICT RULES:
- You MUST make a clear decision: Accepted / Rejected / Additional Information Required.
- You MUST cite clause numbers explicitly.
- You MUST justify your reasoning using only the provided clauses.
- You MUST NOT give generic replies.
- You MUST NOT invent rules.
- Maintain formal government tone.
"""

# --------------------------------------------------
# RETRIEVAL FUNCTION
# --------------------------------------------------

def retrieve_policy_chunks(email_text: str):

    query_emb = embedder.encode(
        [email_text],
        normalize_embeddings=True
    )

    query_emb = np.asarray(query_emb).astype("float32")

    scores, indices = index.search(query_emb, TOP_K)

    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue

        results.append({
            "text": policy_chunks[idx]["text"],
            "metadata": policy_chunks[idx]["metadata"],
            "score": float(score)
        })

    # Sort by similarity score
    results = sorted(results, key=lambda x: x["score"], reverse=True)

    # Keep top 3 strongest clauses
    return results[:3]

# --------------------------------------------------
# MAIN REPLY GENERATION
# --------------------------------------------------

def generate_policy_reply(email_text: str) -> str:

    if not email_text or len(email_text.strip()) < 10:
        return (
            "Subject: Insufficient Information\n\n"
            "Dear Applicant,\n\n"
            "Your submission does not contain sufficient details "
            "for policy examination. Kindly provide complete information.\n\n"
            "Regards,\n"
            "Grievance Redressal Cell\n"
            "Higher Education Department"
        )

    retrieved = retrieve_policy_chunks(email_text)

    if not retrieved:
        return (
            "Subject: Request for Clarification\n\n"
            "Dear Applicant,\n\n"
            "Your submission does not contain sufficient information "
            "to determine the applicable policy provisions. Kindly provide "
            "complete details including relevant dates and supporting documents.\n\n"
            "Regards,\n"
            "Grievance Redressal Cell\n"
            "Higher Education Department"
        )

    # Build structured policy context
    context = ""
    for c in retrieved:
        clause = c["metadata"].get("clause_id", "N/A")
        section = c["metadata"].get("section", "General")
        text = c["text"]

        context += f"\nClause {clause} - {section}:\n{text}\n"

    user_prompt = f"""
EMAIL CONTENT:
{email_text}

RETRIEVED POLICY CLAUSES:
{context}

TASK:

1. Identify grievance category.
2. Check compliance with time limits, documentation, and jurisdiction.
3. Make one clear decision:
   - Accepted for Review
   - Rejected
   - Additional Information Required
4. Draft structured official reply.

FORMAT:

Subject: Response to Grievance Submission

Dear Applicant,

[Brief summary of issue]

As per Clause [X.X], [policy reasoning].

Decision: [Clear decision]

This decision is issued in accordance with the Official Grievance Policy.

Regards,
Grievance Redressal Cell
Higher Education Department
"""

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            temperature=TEMPERATURE,
            timeout=20,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return (
            "Subject: Temporary Technical Issue\n\n"
            "Dear Applicant,\n\n"
            "We are currently experiencing technical difficulties "
            "in processing your request. Kindly try again later.\n\n"
            "Regards,\n"
            "Grievance Redressal Cell\n"
            "Higher Education Department"
        )
