import os
import pandas as pd
import re
import json
import ast
from pathlib import Path
from datetime import datetime
from email_parser import parse_eml
from classifier import classify_grievance
from followup import detect_followup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from chatbot import ask
from pydantic import BaseModel
from reply_generator import generate_suggested_reply


FILES_DIR = "./files"
EXCEL_FILE = "./data/grievances.xlsx"

# Load college database
COLLEGES_DB = []
try:
    colleges_path = Path(__file__).parent / "data" / "colleges.json"
    with open(colleges_path, 'r', encoding='utf-8') as f:
        COLLEGES_DB = json.load(f)
    print(f"Loaded {len(COLLEGES_DB)} colleges from database")
except Exception as e:
    print(f"Warning: Could not load colleges database: {e}")

COLUMNS = [
    "email_id", "parent_email_id", "sender", "subject",
    "category", "mail_type", "followup_count",
    "date", "content", "attachments", "eml_file"
]

def clean_for_excel(text):
    """Remove illegal characters that Excel cannot handle"""
    if not isinstance(text, str):
        return text
    # Remove control characters (0x00-0x1F) except tab, newline, carriage return
    return re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F]', '', text)

def run():
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(EXCEL_FILE), exist_ok=True)
    
    if os.path.exists(EXCEL_FILE):
        df = pd.read_excel(EXCEL_FILE)
    else:
        df = pd.DataFrame(columns=COLUMNS)

    eml_files = [f for f in os.listdir(FILES_DIR) if f.endswith(".eml")]
    total_files = len(eml_files)
    processed = 0
    
    print(f"📧 Found {total_files} email files to process...")
    
    for file in eml_files:
        processed += 1
        print(f"[{processed}/{total_files}] Processing: {file}")
        
        email = parse_eml(os.path.join(FILES_DIR, file))
        
        if email is None:
            print(f"⚠️ Skipping {file} (parse error)")
            continue

        if email["email_id"] in df["email_id"].values:
            print(f"✓ Already processed")
            continue

        category = classify_grievance(email["content"])
        mail_type, parent_id, count = detect_followup(email, df)

        row = {
            **email,
            "category": category,
            "mail_type": mail_type,
            "followup_count": count,
            # Use the actual email date from the parsed email, fallback to today if not available
            "date": email.get("date") or datetime.now().strftime("%Y-%m-%d")
        }

        df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
        print(f"✓ Added to database")

    # Clean all text fields for Excel compatibility
    print("\n🧹 Cleaning data for Excel compatibility...")
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].apply(clean_for_excel)
    
    df.to_excel(EXCEL_FILE, index=False)
    print(f"\n✅ Processing complete! Total records: {len(df)}")
    print(f"📊 Data saved to: {EXCEL_FILE}")

# ---------------- FASTAPI APP ----------------
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Backend running on Hugging Face"}
    
@app.get("/categories")
def get_categories():
    """Get all categories with count"""
    if not os.path.exists(EXCEL_FILE):
        return []
    
    df = pd.read_excel(EXCEL_FILE)
    categories = df.groupby("category").size().reset_index(name="count")
    
    return [
        {"name": row["category"], "count": int(row["count"])}
        for _, row in categories.iterrows()
    ]

@app.get("/colleges")
def get_colleges():
    """Get list of all colleges in database"""
    return {"colleges": COLLEGES_DB, "total": len(COLLEGES_DB)}

@app.get("/emails")
def get_emails(category: str):
    """Get all emails for a specific category"""
    try:
        print(f"Received request for category: '{category}'")
        
        if not os.path.exists(EXCEL_FILE):
            print(f"Excel file not found: {EXCEL_FILE}")
            return []
        
        df = pd.read_excel(EXCEL_FILE)
        print(f"Total records in Excel: {len(df)}")
        print(f"Unique categories: {df['category'].unique().tolist()}")
        
        filtered = df[df["category"] == category]
        print(f"Found {len(filtered)} emails for category '{category}'")
        
        result = [
            {
                "subject": str(row["subject"]),
                "sender": str(row["sender"]),
                "category": str(row["category"]),
                "mail_type": str(row["mail_type"]),
                "followup_count": int(row["followup_count"]) if pd.notna(row["followup_count"]) else 0,
                "date": str(row["date"]),
                "email_id": str(row["email_id"]) if pd.notna(row["email_id"]) else "",
                "parent_email_id": str(row["parent_email_id"]) if pd.notna(row["parent_email_id"]) else "",
                "content": str(row["content"]) if pd.notna(row["content"]) and str(row["content"]) != "nan" else "",
                "attachments": ast.literal_eval(str(row["attachments"])) if pd.notna(row["attachments"]) and str(row["attachments"]) not in ["nan", "", "[]"] else [],
                "eml_file": str(row["eml_file"]) if pd.notna(row["eml_file"]) and str(row["eml_file"]) != "nan" else ""
            }
            for _, row in filtered.iterrows()
        ]
        
        return result
    except Exception as e:
        print(f"Error in get_emails: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.post("/process")
def process_emails():
    run()
    return {"status": "emails processed"}

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    print("📥 CHAT MESSAGE:", repr(request.message))

    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")

    answer = ask(request.message)

    print("🤖 CHAT ANSWER:", repr(answer))
    return {"answer": answer}

@app.get("/dashboard")
def dashboard():
    if not os.path.exists(EXCEL_FILE):
        return {"total": 0, "fresh": 0, "followup": 0}
    
    df = pd.read_excel(EXCEL_FILE)
    
    return {
        "total": len(df),
        "fresh": int((df["mail_type"] == "Fresh").sum()),
        "followup": int((df["mail_type"] == "Follow-up").sum()),
    }

@app.get("/download/attachment/{filename}")
def download_attachment(filename: str):
    """Download an actual attachment file (PDF, DOCX, Excel, etc.)"""
    file_path = os.path.join("./attachments", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Determine media type based on extension
    ext = filename.lower().split('.')[-1]
    media_types = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
    }
    media_type = media_types.get(ext, 'application/octet-stream')
    
    # Extract original filename (remove hash prefix)
    original_name = '_'.join(filename.split('_')[1:]) if '_' in filename else filename
    
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=original_name
    )

@app.get("/download/email/{eml_filename}")
def download_eml(eml_filename: str):
    """Download the original .eml file if needed"""
    file_path = os.path.join(FILES_DIR, eml_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Email file not found")
    return FileResponse(
        file_path,
        media_type="message/rfc822",
        filename=eml_filename
    )

# Request model for reply generation
class GenerateReplyRequest(BaseModel):
    email_content: str
    email_subject: str = ""
    sender: str = ""

@app.post("/generate-reply")
def generate_reply(request: GenerateReplyRequest):
    """Generate AI-powered suggested reply using RAG system"""
    try:
        suggested_reply = generate_suggested_reply(
            email_content=request.email_content,
            email_subject=request.email_subject,
            sender=request.sender
        )
        return {"suggested_reply": suggested_reply}
    except Exception as e:
        print(f"Error generating reply: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")

# ---------------- MAIN ----------------
if __name__ == "__main__":
    import sys
    import os
    port = int(os.environ.get("PORT", 7860))

    print(f"🚀 Starting FastAPI on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
    # If script is run directly, process emails first
    if len(sys.argv) > 1 and sys.argv[1] == "process":
        run()
    else:
        # Start the FastAPI server with uvicorn
        import uvicorn
        print("\n🚀 Starting FastAPI server...")
        print("📍 Backend running at: http://localhost:8000")
        print("📊 API Documentation at: http://localhost:8000/docs")
        print("\nPress Ctrl+C to stop the server\n")
        uvicorn.run(app, host="0.0.0.0", port=8000)
        
