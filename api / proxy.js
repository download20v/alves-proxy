module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const target = req.query.url;
  if (!target) {
    return res.status(200).json({
      ok: true,
      service: "ALVES PLAY Proxy CORS (Vercel)",
    });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
      throw new Error("Protocolo inválido");
    }
  } catch {
    return res.status(400).json({ error: true, message: "URL de destino inválida." });
  }

  const isBot = targetUrl.pathname.includes("/api/chatbot/") || req.method === "POST";
  const headers = {
    "User-Agent": isBot
      ? "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      : "VLC/3.0.18 LibVLC/3.0.18",
    Accept: isBot ? "application/json, text/plain, */*" : "*/*",
  };

  let body;
  if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      body = req.body;
    } else {
      body = JSON.stringify(req.body);
    }
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body,
      redirect: "follow",
    });

    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buffer);
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: "Falha no destino: " + err.message,
    });
  }
};
