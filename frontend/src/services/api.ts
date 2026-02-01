const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined");
}

/* ============================
   TYPES
============================ */

export interface BackendEmail {
  email_id: string;
  parent_email_id: string;
  sender: string;
  subject: string;
  category: string;
  mail_type: string;
  followup_count: number;
  date: string;
  content: string;
  attachments: string[];
  eml_file: string;
}

export interface BackendCategory {
  name: string;
  count: number;
}

export interface BackendDashboard {
  total: number;
  fresh: number;
  followup: number;
}

/* ============================
   EMAIL & DASHBOARD APIs
============================ */

// Fetch all categories
export async function fetchCategories(): Promise<BackendCategory[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
}

// Fetch emails for a category
export async function fetchEmailsByCategory(
  category: string
): Promise<BackendEmail[]> {
  const response = await fetch(
    `${API_BASE_URL}/emails?category=${encodeURIComponent(category)}`
  );
  if (!response.ok) throw new Error("Failed to fetch emails");
  return response.json();
}

// Fetch all emails
export async function fetchAllEmails(): Promise<BackendEmail[]> {
  const categories = await fetchCategories();
  const allEmails: BackendEmail[] = [];

  for (const category of categories) {
    const emails = await fetchEmailsByCategory(category.name);
    allEmails.push(...emails);
  }

  return allEmails;
}

// Dashboard stats
export async function fetchDashboard(): Promise<BackendDashboard> {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  if (!response.ok) throw new Error("Failed to fetch dashboard");
  return response.json();
}

// Process new emails
export async function processEmails(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/process`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to process emails");
}

/* ============================
   CHATBOT API  ✅ FIXED
============================ */

// Ask chatbot (POST — correct)

export async function askChatbot(question: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chat?q=${encodeURIComponent(question)}`);
  if (!response.ok) throw new Error('Failed to get chatbot response');
  const data = await response.json();
  return data.answer;
}
/*
export async function askChatbot(question: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: question }),
  });

  if (!response.ok) {
    throw new Error("Failed to get chatbot response");
  }

  const data = await response.json();

  // Works even if backend returns { reply } or { answer }
  return data.reply || data.answer || "";
}
*/
/* ============================
   COLLEGES API
============================ */

export async function fetchColleges(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/colleges`);
  if (!response.ok) throw new Error("Failed to fetch colleges");
  const data = await response.json();
  return data.colleges;
}

/* ============================
   AI REPLY (RAG)
============================ */

export async function generateReply(
  emailContent: string,
  emailSubject: string = "",
  sender: string = ""
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_content: emailContent,
      email_subject: emailSubject,
      sender,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate reply");
  }

  const data = await response.json();
  return data.suggested_reply;
}
