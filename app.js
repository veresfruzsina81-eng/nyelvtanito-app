// DOM elemek
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const langSelect = document.getElementById("lang");

// Üzenet hozzáadása a chatboxhoz
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Küldés gomb működése
sendBtn.addEventListener("click", async () => {
  const text = userInput.value.trim();
  if (text === "") return;

  // Felhasználó üzenete
  addMessage("user", text);

  // Betöltés jelzés
  addMessage("bot", "✍️ Dolgozom a válaszon...");

  try {
    const lang = langSelect.value;

    // Netlify function meghívása
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, lang: lang })
    });

    const data = await res.json();

    // Utolsó bot üzenet lecserélése a valódi válaszra
    chatBox.lastChild.textContent = data.reply;

  } catch (error) {
    chatBox.lastChild.textContent = "⚠️ Hiba történt: " + error.message;
  }

  userInput.value = "";
});

// Enter gombbal is lehessen küldeni
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
