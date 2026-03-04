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
# CONFIG
# --------------------------------------------------

DATA_DIR = "data"
INDEX_PATH = f"{DATA_DIR}/faiss.index"
CHUNKS_PATH = f"{DATA_DIR}/policy_chunks.json"

TOP_K = 5
LLM_MODEL = "gpt-4o-mini"
TEMPERATURE = 0.0   # 🔴 Important for deterministic legal output

# --------------------------------------------------
# ENV
# --------------------------------------------------

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

client = OpenAI(api_key=OPENAI_API_KEY)

# --------------------------------------------------
# EMBEDDINGS
# --------------------------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"

embedder = SentenceTransformer(
    "multi-qa-mpnet-base-dot-v1",
    device=device
)

# --------------------------------------------------
# LOAD INDEX + POLICY
# --------------------------------------------------

index = faiss.read_index(INDEX_PATH)

with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
    policy_chunks = json.load(f)

# --------------------------------------------------
# RETRIEVAL
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

    results = sorted(results, key=lambda x: x["score"], reverse=True)

    return results[:3]


# --------------------------------------------------
# MAIN FUNCTION
# --------------------------------------------------

def generate_policy_reply(email_text: str) -> str:

    retrieved = retrieve_policy_chunks(email_text)

    if not retrieved:
        return (
            "Subject: Clarification Required\n\n"
            "Dear Applicant,\n\n"
            "Your submission does not provide sufficient policy-relevant "
            "information for examination. Kindly provide complete details "
            "including dates, category, and supporting documents.\n\n"
            "Regards,\n"
            "Grievance Redressal Cell\n"
            "Higher Education Department"
        )

    # Build policy block
    policy_context = ""
    for c in retrieved:
        clause = c["metadata"]["clause_id"]
        section = c["metadata"]["section"]
        text = c["text"]

        policy_context += f"\nClause {clause} - {section}:\n{text}\n"

    # 🔴 STAGE 1: FORCE STRUCTURED POLICY ANALYSIS
    analysis_prompt = f"""
You are a strict legal compliance evaluator.

EMAIL:
{email_text}

POLICY CLAUSES:
{policy_context}

TASK:
Analyze the email strictly against the clauses.

Return ONLY a JSON object with:

{{
  "identified_issue": "...",
  "relevant_clauses": ["clause_id"],
  "policy_violation": true/false,
  "reasoning": "...",
  "final_decision": "Accepted for Review / Rejected / Additional Information Required"
}}

Do NOT write explanation outside JSON.
"""

    analysis_response = client.chat.completions.create(
        model=LLM_MODEL,
        temperature=TEMPERATURE,
        messages=[
            {"role": "system", "content": "You are a legal reasoning engine."},
            {"role": "user", "content": analysis_prompt}
        ]
    )

    analysis_text = analysis_response.choices[0].message.content.strip()

    # 🔴 STAGE 2: FINAL FORMAL REPLY BASED ON ANALYSIS
    final_prompt = f"""
You are a senior grievance officer.

EMAIL:
{email_text}

POLICY ANALYSIS RESULT:
{analysis_text}

Draft a formal, strong, clause-specific official reply.
- Cite clauses explicitly.
- Do not be generic.
- Make decision firm and clear.
- Maintain strict administrative tone.

FORMAT:

Subject: Response to Grievance Submission

Dear Applicant,

[Summary of case]

[Clause-based reasoning]

Decision: [Decision]

This decision is issued in accordance with the Official Grievance Policy.

Regards,
Grievance Redressal Cell
Higher Education Department
"""

    final_response = client.chat.completions.create(
        model=LLM_MODEL,
        temperature=TEMPERATURE,
        messages=[
            {"role": "system", "content": "You are a strict government officer."},
            {"role": "user", "content": final_prompt}
        ]
    )

    return final_response.choices[0].message.content.strip()
