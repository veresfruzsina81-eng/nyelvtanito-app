// netlify/functions/chat.js

export async function handler(event) {
  try {
    const { message, lang } = JSON.parse(event.body || "{}");

    // API kulcs környezeti változóból
    const apiKey = process.env.OPENAI_API_KEY;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",   // gyors és olcsó modell
        messages: [
          {
            role: "system",
            content: `Te egy barátságos nyelvtanító vagy. A felhasználó a következő nyelvet szeretné tanulni: ${lang}. 
                      Javítsd ki a hibáit, adj példákat és magyarázz érthetően.`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.choices[0].message.content
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
