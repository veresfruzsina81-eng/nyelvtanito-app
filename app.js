// DOM elemek
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Üzenet hozzáadása a chatboxhoz
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight; // automatikus görgetés
}

// Küldés gomb működése
sendBtn.addEventListener("click", () => {
  const text = userInput.value.trim();
  if (text === "") return;

  // Felhasználó üzenete
  addMessage("user", text);

  // Teszt válasz (később OpenAI API lesz itt)
  setTimeout(() => {
    addMessage("bot", "Ez egy teszt válasz 🤖 (hamarosan AI fogja adni)");
  }, 500);

  userInput.value = "";
});

// Enter gombbal is lehessen küldeni
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
