import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };
  const { message = "", intent = "", tone = "Apaisé" } = JSON.parse(event.body || "{}");

  const system = `Tu es un assistant français qui reformule des SMS posés et respectueux entre parents séparés.`;
  const user = `Message reçu: "${message}"\nIntention: "${intent}"\nTonalité: ${tone}\nRéponds uniquement par le SMS final.`;

  try {
    const r = await client.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "system", content: system }, { role: "user", content: user }]
    });
    return { statusCode: 200, body: JSON.stringify({ suggestion: r.output_text.trim() }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
