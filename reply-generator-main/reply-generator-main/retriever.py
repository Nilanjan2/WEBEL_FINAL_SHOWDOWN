# retriever.py
import os
import json
import faiss
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import torch
from dotenv import load_dotenv

# ---------- CONFIG ----------
DATA_DIR = "data"
INDEX_PATH = f"{DATA_DIR}/faiss.index"
CHUNKS_PATH = f"{DATA_DIR}/policy_chunks.json"
TOP_K = 5
SIMILARITY_THRESHOLD = 0.60
LLM_MODEL = "gpt-4o-mini"

# ---------- OPENAI ----------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------- EMBEDDING ----------
device = "cuda" if torch.cuda.is_available() else "cpu"
embedder = SentenceTransformer(
    "all-MiniLM-L6-v2",
    device=device
)

# ---------- LOAD DATA ----------
index = faiss.read_index(INDEX_PATH)
with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
    policy_chunks = json.load(f)

if index.ntotal != len(policy_chunks):
    raise RuntimeError("FAISS index and policy chunks count mismatch")

SYSTEM_PROMPT = """
You are a strict policy-bound compliance assistant.

Rules:
- Use ONLY the provided policy excerpts.
- Do NOT rely on outside knowledge.
- If policy does not cover the query, say so explicitly.
- Do NOT invent rules or exceptions.
"""

def retrieve_policy_chunks(email_text: str):
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


def generate_policy_reply(email_text: str) -> str:
    retrieved = retrieve_policy_chunks(email_text)

    if not retrieved:
        return (
            "The submitted grievance does not fall under the scope "
            "of the current grievance redressal policy."
        )

    context = "\n\n".join(
        f"[Clause {c['metadata']['clause_id']}] {c['text']}"
        for c in retrieved
    )

    user_prompt = f"""
USER EMAIL:
{email_text}

APPLICABLE POLICY:
{context}

TASK:
Draft a formal, policy-compliant reply.
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
