# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from retriever import generate_policy_reply
import logging

# ---------- LOGGING ----------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- APP ----------
app = FastAPI(
    title="Policy Reply Generator",
    version="1.0.0"
)

# ---------- SCHEMAS ----------
class EmailRequest(BaseModel):
    email_text: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="User grievance email text"
    )

class ReplyResponse(BaseModel):
    suggested_reply: str

# ---------- ENDPOINTS ----------
@app.post("/generate-reply", response_model=ReplyResponse)
async def generate_reply(req: EmailRequest):
    try:
        logger.info("Generating reply for incoming email")
        reply = generate_policy_reply(req.email_text)
        return {"suggested_reply": reply}

    except Exception as e:
        logger.exception("Reply generation failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate reply"
        )

@app.get("/health")
def health_check():
    return {"status": "ok"}
