export const config = { runtime: "edge" };

export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "*",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const target = new URL(req.url).searchParams.get("url");
  if (!target) {
    return new Response(
      JSON.stringify({ ok: true, service: "ALVES PLAY Proxy CORS (Vercel)" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      throw new Error("Protocolo inválido");
    }
  } catch {
    return new Response(
      JSON.stringify({ error: true, message: "URL de destino inválida." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  const isBot = targetUrl.pathname.includes("/api/chatbot/") || req.method === "POST";
  const forwardHeaders = new Headers({
    "User-Agent": isBot
      ? "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      : "VLC/3.0.18 LibVLC/3.0.18",
    "Accept": isBot ? "application/json, text/plain, */*" : "*/*",
  });

  const incomingCt = req.headers.get("Content-Type");
  if (req.method !== "GET" && req.method !== "HEAD" && incomingCt) {
    forwardHeaders.set("Content-Type", incomingCt);
  }

  try {
    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined;
    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: "follow",
    });

    const responseHeaders = new Headers(corsHeaders);
    const upstreamCt = upstream.headers.get("Content-Type");
    if (upstreamCt) responseHeaders.set("Content-Type", upstreamCt);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: true, message: "Falha no destino: " + err.message }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
