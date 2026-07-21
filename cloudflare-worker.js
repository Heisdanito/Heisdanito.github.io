// Cloudflare Worker proxy for the NVIDIA chat API.
//
// Why this exists: GitHub Pages only serves static files, and NVIDIA's API
// doesn't send CORS headers, so a browser can't call it directly from
// script.js — the request gets blocked. This Worker sits in between: your
// site calls the Worker (which allows CORS), the Worker calls NVIDIA using
// a key stored as a server-side secret, and forwards the reply back.
//
// SETUP (no CLI needed):
// 1. Go to https://dash.cloudflare.com -> sign up free -> Workers & Pages -> Create -> Create Worker.
// 2. Give it a name (e.g. "heisdanito-ai-proxy"), click Deploy.
// 3. Click "Edit code", delete the placeholder, paste this whole file, click Deploy again.
// 4. Go to Settings -> Variables -> add an "Environment Variable" named NVIDIA_API_KEY,
//    paste your (rotated) NVIDIA key, mark it as a Secret, save.
// 5. Copy the Worker's URL (looks like https://heisdanito-ai-proxy.<your-subdomain>.workers.dev).
// 6. In script.js, replace NVIDIA_API_URL with that Worker URL, and delete the
//    NVIDIA_API_KEY constant and the Authorization header line entirely —
//    the key now lives only in the Worker, never in your public repo.

const ALLOWED_ORIGIN = 'https://heisdanito.github.io';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: corsHeaders() });
    }

    // Basic guardrails so this can't be repurposed as an open relay.
    if (!Array.isArray(body.messages) || body.messages.length > 40) {
      return new Response('Invalid request', { status: 400, headers: corsHeaders() });
    }

    const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
        messages: body.messages,
        max_tokens: 600,
        reasoning_budget: 1024,
        stream: false,
        temperature: 0.6,
        top_p: 0.95
      })
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
    });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
