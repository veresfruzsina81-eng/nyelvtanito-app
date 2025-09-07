// netlify/functions/chat.js
export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const apiKey = process.env.OPENAI_API_KEY;

    const callOpenAI = async (messages, responseFormatJson = false) => {
      const payload = { model: "gpt-4o-mini", messages };
      if (responseFormatJson) payload.response_format = { type: "json_object" };

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || "";
    };

    // LECKE
    if (body.mode === "lesson") {
      const { lang = "en", level = "A1" } = body;

      const sys = `
Te egy nyelvtanító tutor vagy. Kizárólag szigorú JSON-t adj vissza 'lesson' kulccsal.
Struktúra:
{
  "lesson": {
    "title": "rövid, barátságos cím (${level})",
    "steps": [
      { "type":"explain", "content":"rövid magyar magyarázat a témáról" },
      { "type":"example", "content":"1-2 példa mondat a CÉL nyelven (${lang}), magyar magyarázattal zárójelben" },
      { "type":"quiz", "content":"egyszerű kérdés", "options":["A) ...","B) ...","C) ..."], "answer":"A" },
      { "type":"practice", "content":"Kérlek, írj egy mondatot a cél nyelven, használva ezt a szót: ..."}
    ]
  }
}
Ne írj semmi mást a JSON-on kívül!`;

      const user = `Készíts egy rövid (4-6 lépéses) ${level} szintű leckét a következő célnyelvre: ${lang}. Téma: mindennapi bemutatkozás / köszönés / alap szókincs.`;

      const raw = await callOpenAI(
        [{ role: "system", content: sys }, { role: "user", content: user }],
        true
      );

      let parsed; try { parsed = JSON.parse(raw); } catch {}
      if (!parsed?.lesson) throw new Error("Rossz JSON formátum a lecke generálásnál.");

      return { statusCode: 200, body: JSON.stringify(parsed) };
    }

    // ELLENŐRZÉS
    if (body.mode === "check") {
      const { lang = "en", level = "A1", prompt = "", answer = "" } = body;

      const sys = `Nyelvtanár vagy. Adj rövid, bátorító visszajelzést ${level} szinten, célnyelv: ${lang}. Ha hiba van, javítsd, és írj 1 tippet.`;
      const user = `Feladat: ${prompt}\nTanulói válasz: ${answer}\nAdj 1-3 mondatos visszajelzést magyarul, ha kell, mutasd a helyes célnyelvi mondatot is.`;

      const feedback = await callOpenAI(
        [{ role: "system", content: sys }, { role: "user", content: user }]
      );

      return { statusCode: 200, body: JSON.stringify({ feedback }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Ismeretlen mód" }) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
