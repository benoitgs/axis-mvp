export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { message = '', intent = '', tone = 'Apaisé' } = await req.json();

    const system = `Tu es un assistant français qui reformule des SMS brefs, posés et respectueux pour la coparentalité.
Règles : 1) 1–3 phrases max. 2) Pas de reproches. 3) Proposer une organisation concrète. 4) Ton : ${tone}.`;

    const user = `Message reçu: "${message}"
Intention: "${intent}"
Réponds uniquement par le SMS final (pas de préambule).`;

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    const data = await resp.json();

    // Extraction robuste du texte (format REST de l’API Responses)
    let text = '';
    if (Array.isArray(data?.output)) {
      const parts = data.output
        .flatMap(o => o?.content || [])
        .filter(p => p?.type === 'output_text')
        .map(p => p?.text || '');
      text = parts.join(' ').trim();
    }
    if (!text && typeof data?.output_text === 'string') text = data.output_text.trim();
    if (!text && data?.choices?.[0]?.message?.content) text = String(data.choices[0].message.content).trim();

    if (!resp.ok) {
      const err = data?.error?.message || `HTTP ${resp.status}`;
      return new Response(JSON.stringify({ error: err }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ suggestion: text || 'Réponse vide.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
