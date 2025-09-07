// Netlify Function – automata mese (1–5 perc)
export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const apiKey = process.env.OPENAI_API_KEY;

    const callOpenAI = async (messages) => {
      const payload = { model: "gpt-4o-mini", messages };
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || "";
    };

    if (body.mode === "storyGen") {
      let minutes = Math.max(1, Math.min(5, parseInt(body.minutes || 3, 10)));
      const targetWords = minutes * 120; // kb. 120 szó/perc

      const sys = `Gyerekbarát MAGYAR mesemondó vagy. Írj teljesen ártalmatlan, kedves mesét.
Használj rövid, egyszerű mondatokat. A mese legyen 3–6 bekezdésre tördelve (üres sorokkal).
Végén 1 mondatos pozitív tanulság.`;
      const user = `Készíts kb. ${targetWords} szóból álló mesét magyarul (±15%), ${minutes} perc felolvasáshoz.
Téma lehet bármilyen kedves, gyerekbarát (erdei kaland, tengerpart, űrutazás, barátság).
NE írj képinstrukciót, csak sima szöveget.`;

      const story = await callOpenAI([
        { role: "system", content: sys },
        { role: "user", content: user }
      ]);

      return { statusCode: 200, body: JSON.stringify({ story }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "Ismeretlen mód" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
