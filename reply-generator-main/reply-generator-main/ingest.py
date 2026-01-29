# ingest.py
import os
import json
import numpy as np
import faiss
import torch
from sentence_transformers import SentenceTransformer

# ---------- PATHS ----------
DATA_DIR = "data"
INDEX_PATH = os.path.join(DATA_DIR, "faiss.index")
CHUNKS_PATH = os.path.join(DATA_DIR, "policy_chunks.json")

os.makedirs(DATA_DIR, exist_ok=True)

# ---------- DEVICE ----------
device = "cuda" if torch.cuda.is_available() else "cpu"

# ---------- EMBEDDER ----------
embedder = SentenceTransformer(
    "all-MiniLM-L6-v2",
    device=device
)

# ---------- LOAD POLICY CHUNKS ----------
with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
    policy_chunks = json.load(f)

if not policy_chunks:
    raise ValueError("policy_chunks.json is empty")

texts = [chunk["text"] for chunk in policy_chunks]

# ---------- EMBEDDING ----------
embeddings = embedder.encode(
    texts,
    normalize_embeddings=True,
    show_progress_bar=True
)

embeddings = np.asarray(embeddings).astype("float32")

# ---------- FAISS INDEX ----------
dim = embeddings.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(embeddings)

faiss.write_index(index, INDEX_PATH)

print(f"✅ Ingestion complete")
print(f"📦 Chunks indexed: {len(policy_chunks)}")
print(f"📐 Embedding dim: {dim}")
print(f"💾 Index saved at: {INDEX_PATH}")
