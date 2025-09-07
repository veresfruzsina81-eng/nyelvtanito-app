export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.mode !== "storyGen") {
      return { statusCode: 400, body: JSON.stringify({ error: "Ismeretlen mód" }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const minutes = Math.max(1, Math.min(5, parseInt(body.minutes || 3, 10)));
    const targetWords = minutes * 120; // kb. 120 szó/perc

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content:
          "Gyerekbarát MAGYAR mesemondó vagy. Rövid, egyszerű mondatok. 3–6 bekezdés. Pozitív tanulság a végén. Teljesen ártalmatlan." },
        { role: "user", content:
          `Kérlek, írj kb. ${targetWords} szavas mesét (±15%) magyarul, ${minutes} perc felolvasáshoz.` }
      ]
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    const story = data?.choices?.[0]?.message?.content || "";

    return { statusCode: 200, body: JSON.stringify({ story }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
