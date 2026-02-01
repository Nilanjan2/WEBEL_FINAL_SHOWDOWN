const API = import.meta.env.VITE_API_URL;

// ---------------- PROCESS EMAILS ----------------
document.getElementById("processBtn").onclick = async () => {
  try {
    console.log("Processing emails...");
    await fetch(`${API}/process`, { method: "POST" });
    loadCategories();
    alert("Emails processed");
  } catch (error) {
    console.error("Error processing emails:", error);
    alert("Error processing emails: " + error.message);
  }
};

// ---------------- LOAD CATEGORIES ----------------
async function loadCategories() {
  try {
    console.log("Loading categories from:", `${API}/categories`);
    const res = await fetch(`${API}/categories`);
    const categories = await res.json();
    console.log("Categories loaded:", categories);

    const container = document.getElementById("categoryList");
    container.innerHTML = "";

    if (categories.length === 0) {
      container.innerHTML = "<p style='color: #666; padding: 10px;'>No categories yet. Click 'Process Emails' to start.</p>";
      return;
    }

    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.innerText = `${cat.name} (${cat.count})`;
      btn.onclick = () => loadEmails(cat.name);
      container.appendChild(btn);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    const container = document.getElementById("categoryList");
    container.innerHTML = "<p style='color: red; padding: 10px;'>Error loading categories. Check console.</p>";
  }
}

// ---------------- LOAD EMAILS ----------------
async function loadEmails(category) {
  try {
    console.log("Loading emails for category:", category);
    document.getElementById("currentCategory").innerText = category;

    const res = await fetch(
      `${API}/emails?category=${encodeURIComponent(category)}`
    );

    const emails = await res.json();
    console.log("Emails loaded:", emails);
    
    const table = document.getElementById("emailTable");
    table.innerHTML = "";

    if (emails.length === 0) {
      table.innerHTML = "<tr><td colspan='5' style='text-align: center; padding: 20px;'>No emails in this category</td></tr>";
      return;
    }

    emails.forEach(e => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${e.subject}</td>
        <td>${e.sender}</td>
        <td>${e.mail_type}</td>
        <td>${e.followup_count}</td>
        <td>${e.date}</td>
      `;
      table.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading emails:", error);
    alert("Error loading emails: " + error.message);
  }
}

// ---------------- CHATBOT ----------------
document.getElementById("chatBtn").onclick = async () => {
  const input = document.getElementById("chatInput");
  const q = input.value.trim();
  if (!q) return;

  const res = await fetch(`${API}/chat?q=${encodeURIComponent(q)}`);
  const data = await res.json();

  const out = document.getElementById("chatOutput");
  out.textContent += `\nYou: ${q}\nBot: ${data.answer}\n`;

  input.value = "";
};

// INITIAL LOAD
loadCategories();
