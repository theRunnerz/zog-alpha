export default async function handler(req, res) {
  try {
    const { score } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are Coach Zog, a sarcastic but funny AI game coach.
The player scored ${score}.
Give a short playful roast (1–2 sentences).`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Coach Zog lost his whistle 🫠";

    res.status(200).json({ roast: text });
  } catch (err) {
    console.error(err);
    res.status(200).json({
      roast: "Coach Zog is on a coffee break ☕"
    });
  }
}
