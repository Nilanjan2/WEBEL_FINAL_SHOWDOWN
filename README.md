# WEBEL_FINAL_SHOWDOWN

A full‑stack web application for **processing, categorizing, analyzing, and querying grievance emails** using a rule‑based + AI‑assisted backend.

The system is designed to help administrators quickly understand large volumes of grievance emails by category, college, timeline, attachments, and follow‑ups, with a chatbot‑style query interface.

---

## Key Features

* Parse and process `.eml` grievance emails
* Categorize emails (Suspension, Examination, FIR, Administration, etc.)
* Query emails by **college / institution name**
* Track emails **with / without attachments**
* Identify **follow‑up emails**
* Count‑based analytical queries (time range, category, college)
* Chatbot interface for natural‑language querying
* Download original emails and extracted attachments

---

## System Architecture

```
Frontend (React + Vite)
        |
        v
Backend API (FastAPI)
        |
        v
Processed Email Dataset (Excel / JSON)
        |
        v
Rule‑Based Query Engine (+ Optional RAG)
```

---

## Repository Structure

```
WEBEL_FINAL_SHOWDOWN/
├── backend/                 # FastAPI backend
│   ├── main.py              # API entry point
│   ├── requirements.txt     # Python dependencies
│   ├── files/               # Raw .eml email files
│   ├── attachments/         # Extracted attachments
│   └── processed_data/      # Generated Excel / JSON
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── reply-generator-main/    # (Optional) RAG / AI reply module
├── data/                    # Static data (college list, mappings)
├── INTEGRATION_SUMMARY.md
├── QUICK_START.md
├── RAG_ARCHITECTURE.md
└── RAG_SETUP_GUIDE.md
```

---

## Backend Setup (Local)

### Prerequisites

* Python 3.9+
* pip

### Setup Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux / Mac
venv\Scripts\activate     # Windows
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Add Email Files

Place all `.eml` grievance emails inside:

```
backend/files/
```

### Run Backend Server

```bash
uvicorn main:app --reload --port 8000
```

### API Documentation

Access Swagger UI:

```
http://localhost:8000/docs
```

---

##  Frontend Setup (Local)

### Prerequisites

* Node.js (v16+)
* npm / yarn

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Backend URL

Create `.env` in `frontend/`:

```
VITE_API_URL=http://localhost:8000
```

### Run Frontend

```bash
npm run dev
```

Frontend will be available at:

```
http://localhost:5173
```

---

##  Important API Endpoints

| Endpoint                      | Method | Description             |
| ----------------------------- | ------ | ----------------------- |
| `/`                           | GET    | Health check            |
| `/process`                    | POST   | Parse all `.eml` files  |
| `/emails`                     | GET    | List all emails         |
| `/emails?category=XYZ`        | GET    | Filter by category      |
| `/emails?college=ABC`         | GET    | Filter by college       |
| `/chat`                       | POST   | Chatbot query endpoint  |
| `/download/email/{file}`      | GET    | Download original email |
| `/download/attachment/{file}` | GET    | Download attachment     |

---

##  Chatbot Query Examples

Supported query patterns:

* "How many emails had attachments?"
* "How many emails had no attachments?"
* "How many suspension emails in the last 7 days?"
* "Show follow‑up emails from APC Roy College"
* "How many emails from XYZ College?"

**Request Format:**

```json
{
  "message": "How many emails had attachments?"
}
```

**Response Format:**

```json
{
  "answer": "286 emails have attachments."
}
```

>  The chatbot is **data‑driven**, not generic. All answers are computed strictly from the processed grievance dataset.

---

## ☁️ Deployment

### Backend (Hugging Face Spaces)

1. Push backend code to HF Space
2. Ensure startup command runs FastAPI
3. Confirm `/chat` accepts **POST**, not GET

### Frontend (Vercel / Netlify)

1. Connect GitHub repo
2. Set environment variable:

```
VITE_API_URL=https://<backend-url>
```

3. Deploy

---

##  Common Issues & Fixes

* **405 Method Not Allowed on /chat**

  * Ensure frontend uses `POST`, not `GET`
  * Ensure FastAPI route decorator is `@app.post("/chat")`

* **Same count returned for all queries**

  * Query parser fallback triggered
  * Ensure intent detection and filters are applied before default response

---

##  Best Practices

* Do not hardcode counts
* Always compute results from filtered dataframe
* Log parsed intent + applied filters
* Validate chatbot response against dataset

---

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push and open a Pull Request

---

##  License

Specify license here (MIT / Apache‑2.0 / Proprietary).

---

##  Contact

For technical issues, deployment help, or improvements, please raise an issue in the repository.


