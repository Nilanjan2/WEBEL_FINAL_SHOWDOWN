import os
import json
import pandas as pd
import re

EXCEL_FILE = "./data/grievances.xlsx"

# Common typo corrections
TYPO_MAP = {
    'hoe': 'how',
    'meny': 'many',
    'mny': 'many',
    'emials': 'emails',
    'emals': 'emails',
    'frm': 'from',
    'suspention': 'suspension',
    'suspnsion': 'suspension',
    'followup': 'follow up',
    'folowup': 'follow up',
    'collge': 'college',
    'colege': 'college',
}

def fix_typos(text):
    """Fix common typos in the question"""
    words = text.lower().split()
    fixed_words = [TYPO_MAP.get(word, word) for word in words]
    return ' '.join(fixed_words)

def parse_question(question):
    """Parse user question into structured query (rule-based only)"""
    # Fix typos first
    question = fix_typos(question)
    
    q = question.lower()
    parsed = {
        "action": "count",
        "category": None,
        "sender": None,
        "days": None,
        "mail_type": None,
        "date_from": None,
        "date_to": None
    }
    
    # Detect action
    if any(word in q for word in ["show", "list", "display"]):
        parsed["action"] = "list"
    
    # Extract college name (from "from X college")
    college_match = re.search(r'from\s+([a-z\s]+?)(?:\s+college|\s+govt|\s+government|$)', q)
    if college_match:
        parsed["sender"] = college_match.group(1).strip()
    
    # Extract category
    if "suspension" in q or "disciplinary" in q:
        parsed["category"] = "suspension"
    elif "fir" in q or "arrest" in q:
        parsed["category"] = "fir"
    elif "semester" in q or "exam" in q:
        parsed["category"] = "semester"
    
    # Extract mail type
    if "follow" in q and "up" in q:
        parsed["mail_type"] = "Follow-up"
    elif "fresh" in q:
        parsed["mail_type"] = "Fresh"
    
    # Extract date range (between X and Y)
    date_range_match = re.search(r'between\s+(\w+\s+\d+)\s+and\s+(\w+\s+\d+)', q)
    if date_range_match:
        from datetime import datetime
        try:
            # Parse "sep 4" format
            start_str = date_range_match.group(1)
            end_str = date_range_match.group(2)
            
            # Add current year
            current_year = 2024  # Based on email data from 2024
            parsed["date_from"] = f"{start_str} {current_year}"
            parsed["date_to"] = f"{end_str} {current_year}"
        except:
            pass
    
    # Extract days (fallback if no date range)
    if not parsed["date_from"]:
        days_match = re.search(r'(\d+)\s*days?', q)
        if days_match:
            parsed["days"] = int(days_match.group(1))
    
    print(f"DEBUG: Question: {question}")
    print(f"DEBUG: Parsed: {parsed}")
    return parsed

def run_query(parsed):
    df = pd.read_excel(EXCEL_FILE)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    
    initial_count = len(df)

    if parsed.get("category"):
        df = df[df["category"].str.contains(parsed["category"], case=False, na=False)]
        print(f"DEBUG: After category filter: {len(df)} rows")

    if parsed.get("sender"):
        df = df[df["sender"].str.contains(parsed["sender"], case=False, na=False)]
        print(f"DEBUG: After sender filter '{parsed.get('sender')}': {len(df)} rows")

    if parsed.get("mail_type"):
        df = df[df["mail_type"] == parsed["mail_type"]]
        print(f"DEBUG: After mail_type filter: {len(df)} rows")

    # Handle date range (between X and Y)
    if parsed.get("date_from") and parsed.get("date_to"):
        from datetime import datetime
        try:
            start_date = pd.to_datetime(parsed["date_from"], format="%b %d %Y")
            end_date = pd.to_datetime(parsed["date_to"], format="%b %d %Y")
            df = df[(df["date"] >= start_date) & (df["date"] <= end_date)]
            print(f"DEBUG: After date range filter ({parsed['date_from']} to {parsed['date_to']}): {len(df)} rows")
        except Exception as e:
            print(f"DEBUG: Date parsing failed: {e}")

    # Handle "last X days" (fallback)
    if parsed.get("days"):
        cutoff = pd.Timestamp.now() - pd.Timedelta(days=parsed["days"])
        df = df[df["date"] >= cutoff]
        print(f"DEBUG: After days filter: {len(df)} rows")

    # COUNT → return detailed answer
    if parsed["action"] == "count":
        count = len(df)
        
        # Build descriptive response
        parts = []
        if parsed.get("sender"):
            parts.append(f"from colleges matching '{parsed['sender']}'")
        if parsed.get("category"):
            parts.append(f"in category '{parsed['category']}'")
        if parsed.get("mail_type"):
            parts.append(f"of type '{parsed['mail_type']}'")
        if parsed.get("date_from") and parsed.get("date_to"):
            parts.append(f"between {parsed['date_from']} and {parsed['date_to']}")
        elif parsed.get("days"):
            parts.append(f"in the last {parsed['days']} days")
        
        description = " ".join(parts) if parts else "in the database"
        return f"{count} email{'s' if count != 1 else ''} {description}."

    # LIST → return minimal readable list
    if parsed["action"] == "list":
        if df.empty:
            return "No records found"
        return "\n".join(
            f"{i+1}. {row['subject']} ({row['date'].date()})"
            for i, row in df.head(10).iterrows()
        )

    return "Unsupported query"

def ask(question):
    parsed = parse_question(question)
    return run_query(parsed)
