// DOM
const chatBox = document.getElementById("chat-box");
const langSelect = document.getElementById("lang");
const levelSelect = document.getElementById("level");
const startBtn = document.getElementById("start-lesson");
const nextBtn = document.getElementById("next-step");
const checkBtn = document.getElementById("check-answer");
const answerWrap = document.getElementById("answer-area");
const answerInput = document.getElementById("answer-input");

// állapot
let lesson = null;          // { title, steps:[{type, content, options?, answer?}] }
let stepIndex = 0;

// segéd: üzenet a chatbe
function addMessage(sender, html) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = html;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// UI kapcsolók
function setModeIdle() {
  nextBtn.disabled = true;
  checkBtn.disabled = true;
  answerWrap.classList.add("hidden");
  answerInput.value = "";
}
function setModeRead() {
  nextBtn.disabled = false;
  checkBtn.disabled = true;
  answerWrap.classList.add("hidden");
  answerInput.value = "";
}
function setModeAnswer() {
  nextBtn.disabled = true;
  checkBtn.disabled = false;
  answerWrap.classList.remove("hidden");
  answerInput.focus();
}

// lecke megjelenítése adott lépés szerint
function renderStep() {
  const step = lesson.steps[stepIndex];
  if (!step) return;

  if (step.type === "explain") {
    addMessage("bot", step.content);
    setModeRead();
  } else if (step.type === "example") {
    addMessage("bot", `<strong>Példa:</strong> ${step.content}`);
    setModeRead();
  } else if (step.type === "quiz") {
    if (step.options && step.options.length) {
      const opts = step.options.map((o,i)=>`<div>• ${o}</div>`).join("");
      addMessage("bot", `${step.content}<br><em>Írd be a helyes választ (a szót vagy betűt):</em><br>${opts}`);
    } else {
      addMessage("bot", `${step.content} <em>Írd be a választ!</em>`);
    }
    setModeAnswer();
  } else if (step.type === "practice") {
    addMessage("bot", `${step.content} <em>Válaszolj a cél nyelven!</em>`);
    setModeAnswer();
  } else {
    addMessage("bot", step.content);
    setModeRead();
  }
}

// indítás
startBtn.addEventListener("click", async () => {
  setModeIdle();
  chatBox.innerHTML = "";
  addMessage("bot", "🎯 Lecke készítése…");

  try {
    const lang = langSelect.value;
    const level = levelSelect.value;

    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "lesson", lang, level })
    });
    const data = await res.json();

    lesson = data.lesson;
    stepIndex = 0;

    chatBox.innerHTML = "";
    addMessage("bot", `<strong>${lesson.title}</strong>`);
    renderStep();

  } catch (e) {
    addMessage("bot", "⚠️ Hiba a lecke létrehozásakor: " + e.message);
  }
});

// következő lépés
nextBtn.addEventListener("click", () => {
  if (!lesson) return;
  stepIndex++;
  if (stepIndex >= lesson.steps.length) {
    addMessage("bot", "✅ Kész a mai lecke! Szeretnél új leckét indítani másik témában?");
    setModeIdle();
    return;
  }
  renderStep();
});

// ellenőrzés
checkBtn.addEventListener("click", async () => {
  const userAnswer = answerInput.value.trim();
  if (!userAnswer) return;

  const step = lesson.steps[stepIndex];
  addMessage("user", userAnswer);
  setModeIdle();

  // lokális ellenőrzés, ha van „answer” mező
  if (step.answer) {
    const correct = userAnswer.toLowerCase().trim() === step.answer.toLowerCase().trim();
    addMessage("bot", correct ? "✅ Helyes!" : `❌ Nem teljesen. Helyes válasz: <strong>${step.answer}</strong>`);
    nextBtn.disabled = false;
    return;
  }

  // ha nincs beépített válasz (pl. practice), kérjünk AI feedbacket
  try {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "check",
        lang: langSelect.value,
        level: levelSelect.value,
        prompt: step.content,
        answer: userAnswer
      })
    });
    const data = await res.json();
    addMessage("bot", data.feedback || "Köszönöm, lépjünk tovább!");
  } catch (e) {
    addMessage("bot", "⚠️ Nem sikerült ellenőrizni. Lépjünk tovább.");
  }
  nextBtn.disabled = false;
});
