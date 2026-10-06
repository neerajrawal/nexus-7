// Vercel Function: POST /api/chat
// Streams a chat completion from Gemini 3.8 Flash back to the browser.
// Supports multi-modal "contents" (text + inline images/files).
//
// Key resolution: if a GEMINI_API_KEY environment variable is set on the
// Vercel project, it's used for every request (one shared key for all
// signed-in users). Otherwise each request must include its own apiKey,
// supplied by the client from the Settings dialog.

const MODEL = 'gemini-3.8-flash';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY || body.apiKey;
  const { system, contents } = body;

  if (!apiKey) return json({ error: { message: 'Missing apiKey' } }, 400);
  if (!Array.isArray(contents) || contents.length === 0) {
    return json({ error: { message: 'Missing contents' } }, 400);
  }

  let upstream;
  try {
    upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        }),
      }
    );
  } catch (e) {
    return json({ error: { message: 'Could not reach Gemini API: ' + e.message } }, 502);
  }

  // On error Gemini returns plain JSON (not SSE) — forward it as-is, status included.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
