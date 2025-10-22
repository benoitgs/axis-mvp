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

    const system = `Tu es un assistant français qui reformule des SMS calmes et respectueux entre parents séparés.
    Règles : 1) 3 phrases max. 2) Pas de reproches. 3) Ton : ${tone}. 4) Reste concret et bienveillant.`;

    const user = `Message reçu : "${message}"
    Intention : "${intent}"
    Reformule le message de façon apaisée.`;

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
    const text = (data && data.output_text ? data.output_text.trim() : '') || '...';

    return new Response(JSON.stringify({ suggestion: text }), {
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
