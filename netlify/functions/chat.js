// netlify/functions/chat.js
// AI-mesegenerálás (1–5 perc), magyar szöveggel, meta mezőkkel

function deRepeat(text = "") {
  // szószintű ismétlés: "mindig mindig mindig" -> "mindig"
  text = text.replace(/\b(\w+)(\s+\1){1,}\b/gi, "$1");
  // soronkénti duplák kiszedése
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (out.length && out[out.length - 1].toLowerCase() === lines[i].toLowerCase()) continue;
    out.push(lines[i]);
  }
  return out.join("\n\n");
}

async function callOpenAI(apiKey, payload) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenAI error ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || "";
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Only POST allowed" }) };
    }

    const body = JSON.parse(event.body || "{}");
    if (body.mode !== "storyGen") {
      return { statusCode: 400, body: JSON.stringify({ error: "Ismeretlen mód" }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Hiányzik az OPENAI_API_KEY" }) };
    }

    // Bemenetek
    let minutes = Math.max(1, Math.min(5, parseInt(body.minutes || 3, 10)));
    const targetWords = Math.round(minutes * 120); // kb. 120 szó / perc

    const m = body.meta || {};
    const name  = (m.name  || "Lili").toString().slice(0, 24);
    const age   = (m.age   || "kis").toString().slice(0, 8);
    const buddy = (m.buddy || "kis barát").toString().slice(0, 40);
    const world = (m.world || "erdei kaland").toString().slice(0, 40);

    // Prompt – magyar, rövid mondatok, 3–6 bekezdés, nincs ismételgetés
    const messages = [
      {
        role: "system",
        content:
`Gyerekbarát MAGYAR mesemondó vagy. Írj teljesen ártalmatlan, kedves, erőszakmentes történetet.
Használj rövid, egyszerű mondatokat. Tagold 3–6 bekezdésre (üres sorokkal). A végén legyen 1 mondatos pozitív tanulság.
Kérlek, NE ismételd ugyanazt a szót vagy mondatot többször egymás után.`,
      },
      {
        role: "user",
        content:
`Készíts kb. ${targetWords} szóból álló mesét (±15%) magyarul, kb. ${minutes} perc felolvasáshoz.
Főhős neve: ${name}, életkor: ${age}. Barát/állat: ${buddy}. Világ/téma: ${world}.
Ne írj képinstrukciókat, csak sima szöveget. Kerüld a szó- és mondatismétlést.`,
      },
    ];

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    };

    let story = await callOpenAI(apiKey, payload);
    story = deRepeat(story.trim());

    return {
      statusCode: 200,
      body: JSON.stringify({ story }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || String(error) }),
    };
  }
}
