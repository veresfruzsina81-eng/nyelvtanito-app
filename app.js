// DOM elemek
const chatBox   = document.getElementById("chat-box");
const langSel   = document.getElementById("lang");
const levelSel  = document.getElementById("level");
const startBtn  = document.getElementById("start-lesson");
const nextBtn   = document.getElementById("next-step");
const checkBtn  = document.getElementById("check-answer");
const ansWrap   = document.getElementById("answer-area");
const ansInput  = document.getElementById("answer-input");

// állapot
let lesson = null;   // { title, steps:[{type, content, options?, answer?}] }
let stepIndex = 0;

// üzenet a chatbe
function addMessage(sender, html) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerHTML = html;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// UI módok
function setIdle(){
  nextBtn.disabled = true;
  checkBtn.disabled = true;
  ansWrap.classList.add("hidden");
  ansInput.value = "";
}
function setRead(){
  nextBtn.disabled = false;
  checkBtn.disabled = true;
  ansWrap.classList.add("hidden");
  ansInput.value = "";
}
function setAnswer(){
  nextBtn.disabled = true;
  checkBtn.disabled = false;
  ansWrap.classList.remove("hidden");
  ansInput.focus();
}

// lépés kirajzolása
function renderStep(){
  const step = lesson?.steps?.[stepIndex];
  if(!step) return;

  if (step.type === "explain"){
    addMessage("bot", step.content);
    setRead();
  } else if (step.type === "example"){
    addMessage("bot", `<strong>Példa:</strong> ${step.content}`);
    setRead();
  } else if (step.type === "quiz"){
    const opts = (step.options || []).map(o=>`<div>• ${o}</div>`).join("");
    addMessage("bot", `${step.content}${opts ? "<br><em>Írd be a helyes választ (betűt vagy szót):</em><br>"+opts : ""}`);
    setAnswer();
  } else if (step.type === "practice"){
    addMessage("bot", `${step.content} <em>Válaszolj a cél nyelven!</em>`);
    setAnswer();
  } else {
    addMessage("bot", step.content);
    setRead();
  }
}

// lecke indítása
startBtn.addEventListener("click", async ()=>{
  setIdle();
  chatBox.innerHTML = "";
  addMessage("bot","🎯 Lecke készítése…");

  try{
    const res = await fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        mode: "lesson",
        lang:  langSel.value,
        level: levelSel.value
      })
    });
    const data = await res.json();
    if(!data.lesson) throw new Error("Nincs 'lesson' a válaszban.");

    lesson = data.lesson;
    stepIndex = 0;

    chatBox.innerHTML = "";
    addMessage("bot", `<strong>${lesson.title}</strong>`);
    renderStep();

  }catch(e){
    addMessage("bot", "⚠️ Hiba a lecke létrehozásakor: " + e.message);
  }
});

// következő lépés
nextBtn.addEventListener("click", ()=>{
  if(!lesson) return;
  stepIndex++;
  if(stepIndex >= lesson.steps.length){
    addMessage("bot","✅ Kész a mai lecke! Indíts új leckét másik témában vagy szinten.");
    setIdle();
    return;
  }
  renderStep();
});

// válasz ellenőrzése
checkBtn.addEventListener("click", async ()=>{
  const userAns = ansInput.value.trim();
  if(!userAns) return;

  const step = lesson.steps[stepIndex];
  addMessage("user", userAns);
  setIdle();

  // helyben ellenőrizhető (van 'answer')
  if(step.answer){
    const ok = userAns.toLowerCase() === step.answer.toLowerCase();
    addMessage("bot", ok ? "✅ Helyes!" : `❌ Nem teljesen. Helyes válasz: <strong>${step.answer}</strong>`);
    nextBtn.disabled = false;
    return;
  }

  // AI feedback (practice típus)
  try{
    const res = await fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        mode: "check",
        lang:  langSel.value,
        level: levelSel.value,
        prompt: step.content,
        answer: userAns
      })
    });
    const data = await res.json();
    addMessage("bot", data.feedback || "Köszönöm! Lépjünk tovább.");
  }catch(e){
    addMessage("bot","⚠️ Nem sikerült ellenőrizni. Lépjünk tovább.");
  }
  nextBtn.disabled = false;
});
