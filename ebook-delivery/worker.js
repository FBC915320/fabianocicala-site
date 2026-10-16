// Private EPUB delivery for Cloudflare Workers, D1 and R2.
// DO NOT DEPLOY before real R2 keys, Mercado Pago credentials and sandbox tests.
const CATALOG = Object.freeze({
  "a-estrategia-do-invisivel": { title: "A Estratégia do Invisível", cents: 2490, key: "ebooks/a-estrategia-do-invisivel.epub" },
  "posicione-se-e-venca-pela-fe": { title: "Posicione-se e Vença pela Fé", cents: 1490, key: "ebooks/posicione-se-e-venca-pela-fe.epub" },
  "corolla-cross-hybrid-13-problemas": { title: "Corolla Cross Hybrid + 13 Problemas", cents: 990, key: "ebooks/corolla-cross-hybrid-13-problemas.epub" },
  "quando-o-dia-termina": { title: "Quando o Dia Termina", cents: 2490, key: "ebooks/quando-o-dia-termina.epub" }
});

const encoder = new TextEncoder();
const DAY = 86400000;
const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });
const err = (message, status = 400) => json({ error: message }, status);
const valid = (value, limit = 200) => typeof value === "string" && value.length > 0 && value.length <= limit;
const hex = (bytes) => Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
const sha = async (value) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));

function configured(env) {
  return Boolean(
    env.ORDERS && env.PRIVATE_EBOOKS && env.MP_ACCESS_TOKEN && env.MP_WEBHOOK_SECRET &&
    env.MP_COLLECTOR_ID && env.RATE_LIMIT_SALT && env.CLAIM_SECRET && env.PUBLIC_SITE && env.PUBLIC_API
  );
}

function secureOrigin(request, env) {
  return request.headers.get("origin") === env.PUBLIC_SITE;
}

function cors(response, env) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", env.PUBLIC_SITE);
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

async function parseBody(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) throw new HttpError("Conteúdo inválido", 415);
  if (Number(request.headers.get("content-length") || 0) > 4096) throw new HttpError("Requisição muito grande", 413);
  const text = await request.text();
  if (text.length > 4096) throw new HttpError("Requisição muito grande", 413);
  try { return JSON.parse(text); } catch { throw new HttpError("JSON inválido", 400); }
}

class HttpError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

async function mpRequest(url, env, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError("Mercado Pago indisponível", 502);
  return data;
}

async function readOrder(env, id, claim) {
  if (!valid(id, 64) || !valid(claim, 128)) return null;
  const order = await env.ORDERS.prepare("SELECT * FROM orders WHERE id=?").bind(id).first();
  return order && order.claim_hash === await sha(claim) ? order : null;
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

const claimForOrder = (env, orderId, clientKey) => hmacHex(env.CLAIM_SECRET, `${orderId}|${clientKey}`);
const emailHash = (env, email) => hmacHex(env.CLAIM_SECRET, `email|${email}`);

async function rateLimit(request, env, bucket, limit, windowMs) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha(`${env.RATE_LIMIT_SALT}|${bucket}|${ip}`);
  const now = Date.now();
  const row = await env.ORDERS.prepare("SELECT count,reset_at FROM rate_limits WHERE key=?").bind(key).first();
  if (!row || Number(row.reset_at) <= now) {
    await env.ORDERS.prepare("INSERT INTO rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,reset_at=excluded.reset_at").bind(key, now + windowMs).run();
    return;
  }
  if (Number(row.count) >= limit) throw new HttpError("Muitas tentativas. Aguarde e tente novamente.", 429);
  await env.ORDERS.prepare("UPDATE rate_limits SET count=count+1 WHERE key=? AND reset_at>?").bind(key, now).run();
}

async function verifyWebhook(request, env, id) {
  const raw = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const parts = {};
  for (const part of raw.split(",")) {
    const index = part.indexOf("=");
    if (index > 0) parts[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  if (!valid(parts.ts, 32) || !/^[a-f0-9]{64}$/i.test(parts.v1 || "") || !valid(requestId, 128)) return false;
  const timestamp = Number(parts.ts);
  if (!Number.isFinite(timestamp)) return false;
  const issuedAt = timestamp > 1e12 ? timestamp / 1000 : timestamp;
  if (Math.abs(Date.now() / 1000 - issuedAt) > 600) return false;
  const manifest = `id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.MP_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const actual = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(manifest)));
  let difference = actual.length ^ parts.v1.length;
  for (let i = 0; i < Math.min(actual.length, parts.v1.length); i++) difference |= actual.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return difference === 0;
}

function paymentState(payment) {
  if (["refunded", "charged_back"].includes(payment.status) || Number(payment.transaction_amount_refunded || 0) > 0) return "revoked";
  if (["cancelled", "rejected"].includes(payment.status)) return "rejected";
  return payment.status === "approved" ? "approved" : "pending";
}

function validatePayment(payment, order, env, requestedId) {
  if (requestedId && String(payment.id) !== String(requestedId)) throw new HttpError("Identificador do pagamento divergente", 409);
  if (String(payment.external_reference || "") !== String(order.id)) throw new HttpError("Referência do pedido divergente", 409);
  if (String(payment.metadata?.order_id || "") !== String(order.id)) throw new HttpError("Metadado do pedido divergente", 409);
  if (String(payment.currency_id || "") !== String(order.currency)) throw new HttpError("Moeda divergente", 409);
  if (!Number.isFinite(Number(payment.transaction_amount)) || Math.round(Number(payment.transaction_amount) * 100) !== Number(order.amount_cents)) throw new HttpError("Divergência de valor", 409);
  if (String(payment.collector_id || "") !== String(env.MP_COLLECTOR_ID)) throw new HttpError("Recebedor não autorizado", 403);
  const expectedLive = String(env.MP_LIVE_MODE || "false").toLowerCase() === "true";
  if (Boolean(payment.live_mode) !== expectedLive) throw new HttpError("Ambiente de pagamento divergente", 409);
  if (order.payment_id && String(order.payment_id) !== String(payment.id)) throw new HttpError("Pedido vinculado a outro pagamento", 409);
}

async function checkout(request, env) {
  await rateLimit(request, env, "checkout", 12, 10 * 60 * 1000);
  const body = await parseBody(request);
  const id = body.bookId;
  const email = String(body.email || "").trim().toLowerCase();
  const idempotencyKey = request.headers.get("idempotency-key") || "";
  if (!Object.hasOwn(CATALOG, id) || !valid(email, 254) || !/^.+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError("Livro ou e-mail inválido");
  if (!/^[A-Za-z0-9._:-]{16,100}$/.test(idempotencyKey)) throw new HttpError("Identificador da tentativa inválido");
  if (!String(env.ENABLED_BOOKS || "").split(",").map((value) => value.trim()).includes(id)) throw new HttpError("Livro ainda indisponível", 409);
  const book = CATALOG[id];
  const object = await env.PRIVATE_EBOOKS.head(book.key);
  if (!object || Number(object.size || 0) < 100) throw new HttpError("Arquivo final não cadastrado", 409);
  const duplicate = await env.ORDERS.prepare("SELECT * FROM orders WHERE client_key=?").bind(idempotencyKey).first();
  if (duplicate) {
    const reusable = duplicate.status === "pending" && valid(duplicate.checkout_url, 1000) && Date.now() - Number(duplicate.created_at) < 15 * 60 * 1000;
    if (!reusable) throw new HttpError("Esta tentativa de compra já foi processada. Não efetue um segundo pagamento.", 409);
    return json({ orderId: duplicate.id, claim: await claimForOrder(env, duplicate.id, idempotencyKey), checkoutUrl: duplicate.checkout_url });
  }

  const orderId = crypto.randomUUID();
  const claim = await claimForOrder(env, orderId, idempotencyKey);
  const now = Date.now();
  await env.ORDERS.prepare("INSERT INTO orders(id,book_id,email_hash,amount_cents,currency,claim_hash,client_key,status,created_at,updated_at,access_expires_at,download_count) VALUES(?,?,?,?,?,?,?,'pending',?,?,?,0)")
    .bind(orderId, id, await emailHash(env, email), book.cents, "BRL", await sha(claim), idempotencyKey, now, now, now + 30 * DAY).run();

  try {
    const preference = await mpRequest("https://api.mercadopago.com/checkout/preferences", env, {
      method: "POST",
      headers: { "X-Idempotency-Key": orderId },
      body: JSON.stringify({
        items: [{ id, title: book.title, quantity: 1, currency_id: "BRL", unit_price: book.cents / 100 }],
        payer: { email },
        external_reference: orderId,
        metadata: { order_id: orderId, book_id: id },
        notification_url: `${env.PUBLIC_API}/api/mp-webhook`,
        back_urls: {
          success: `${env.PUBLIC_SITE}/livros/compra/?pedido=${encodeURIComponent(orderId)}`,
          failure: `${env.PUBLIC_SITE}/livros/compra/?pedido=${encodeURIComponent(orderId)}`,
          pending: `${env.PUBLIC_SITE}/livros/compra/?pedido=${encodeURIComponent(orderId)}`
        }
      })
    });
    const checkoutUrl = String(env.MP_LIVE_MODE || "false").toLowerCase() === "true" ? preference.init_point : preference.sandbox_init_point;
    if (!preference.id || !checkoutUrl) throw new Error("checkout ausente");
    await env.ORDERS.prepare("UPDATE orders SET preference_id=?,checkout_url=?,updated_at=? WHERE id=?").bind(String(preference.id), String(checkoutUrl), Date.now(), orderId).run();
    return json({ orderId, claim, checkoutUrl });
  } catch {
    await env.ORDERS.prepare("UPDATE orders SET status='checkout_error',updated_at=? WHERE id=?").bind(Date.now(), orderId).run();
    throw new HttpError("Falha ao iniciar pagamento. Nenhuma entrega foi liberada.", 502);
  }
}

async function webhook(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get("data.id") || url.searchParams.get("data_id");
  if (url.searchParams.get("type") !== "payment" || !valid(id, 40) || !/^[0-9]+$/.test(id)) throw new HttpError("Notificação inválida");
  if (!await verifyWebhook(request, env, id)) throw new HttpError("Assinatura inválida", 401);
  const payment = await mpRequest(`https://api.mercadopago.com/v1/payments/${id}`, env);
  const orderId = String(payment.external_reference || "");
  if (!valid(orderId, 64)) throw new HttpError("Referência inválida");
  const order = await env.ORDERS.prepare("SELECT * FROM orders WHERE id=?").bind(orderId).first();
  if (!order) throw new HttpError("Pedido não encontrado", 404);
  validatePayment(payment, order, env, id);
  const state = paymentState(payment);
  if (order.status === "revoked" && state !== "revoked") throw new HttpError("Pedido revogado", 409);
  if (order.status === "approved" && state === "pending") return json({ received: true });
  await env.ORDERS.prepare("UPDATE orders SET status=?,payment_id=?,updated_at=? WHERE id=?")
    .bind(state, String(payment.id), Date.now(), orderId).run();
  return json({ received: true });
}

async function status(request, env) {
  await rateLimit(request, env, "status", 60, 60 * 1000);
  const body = await parseBody(request);
  const order = await readOrder(env, body.orderId, body.claim);
  if (!order) throw new HttpError("Pedido não encontrado", 404);
  return json({ status: order.status, bookTitle: CATALOG[order.book_id]?.title || "E-book", downloads: order.download_count });
}

async function download(request, env) {
  await rateLimit(request, env, "download", 30, 60 * 1000);
  const body = await parseBody(request);
  const order = await readOrder(env, body.orderId, body.claim);
  if (!order || order.status !== "approved") throw new HttpError("Pagamento ainda não confirmado", 403);
  if (Number(order.access_expires_at || 0) < Date.now()) throw new HttpError("O prazo de download expirou; solicite recuperação", 410);
  const book = CATALOG[order.book_id];
  if (!book) throw new HttpError("Livro indisponível", 404);
  const object = await env.PRIVATE_EBOOKS.get(book.key);
  if (!object) throw new HttpError("Arquivo temporariamente indisponível", 503);
  const updated = await env.ORDERS.prepare("UPDATE orders SET download_count=download_count+1,updated_at=? WHERE id=? AND download_count<10 AND status='approved'")
    .bind(Date.now(), order.id).run();
  if (updated.meta.changes !== 1) throw new HttpError("Limite de downloads; solicite suporte", 429);
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/epub+zip",
      "Content-Disposition": `attachment; filename="${order.book_id}.epub"`,
      "Content-Length": String(object.size),
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function recover(request, env) {
  await rateLimit(request, env, "recover", 6, 60 * 60 * 1000);
  const body = await parseBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const paymentId = String(body.paymentId || "").trim();
  if (!valid(email, 254) || !/^.+@[^@\s]+\.[^@\s]+$/.test(email) || !/^[0-9]{4,40}$/.test(paymentId)) throw new HttpError("Dados de recuperação inválidos");
  const payment = await mpRequest(`https://api.mercadopago.com/v1/payments/${paymentId}`, env);
  const orderId = String(payment.external_reference || "");
  const order = valid(orderId, 64) ? await env.ORDERS.prepare("SELECT * FROM orders WHERE id=?").bind(orderId).first() : null;
  if (!order || String(order.email_hash) !== await emailHash(env, email)) throw new HttpError("Pagamento não localizado", 404);
  validatePayment(payment, order, env, paymentId);
  if (paymentState(payment) !== "approved") throw new HttpError("Pagamento não aprovado", 403);
  const claim = crypto.randomUUID() + crypto.randomUUID();
  const now = Date.now();
  await env.ORDERS.prepare("UPDATE orders SET claim_hash=?,status='approved',payment_id=?,updated_at=?,access_expires_at=? WHERE id=?")
    .bind(await sha(claim), paymentId, now, now + 30 * DAY, orderId).run();
  return json({ orderId, claim, bookId: order.book_id, bookTitle: CATALOG[order.book_id]?.title || "E-book" });
}

async function handleRequest(request, env) {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/health") return json({ status: configured(env) ? "ready" : "unconfigured" });
  if (!configured(env)) return err("Entrega digital ainda não configurada", 503);
  if (request.method === "OPTIONS") {
    if (!secureOrigin(request, env)) return err("Origem não autorizada", 403);
    return cors(new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
      "Access-Control-Max-Age": "3600"
    } }), env);
  }
  if (request.method === "POST" && path === "/api/mp-webhook") return webhook(request, env);
  if (!secureOrigin(request, env)) return err("Origem não autorizada", 403);
  let response;
  if (request.method === "POST" && path === "/api/checkout") response = await checkout(request, env);
  else if (request.method === "POST" && path === "/api/order-status") response = await status(request, env);
  else if (request.method === "POST" && path === "/api/download") response = await download(request, env);
  else if (request.method === "POST" && path === "/api/recover") response = await recover(request, env);
  else response = err("Rota não encontrada", 404);
  return cors(response, env);
}

export default {
  async fetch(request, env) {
    try { return await handleRequest(request, env); }
    catch (error) {
      const response = err(error instanceof HttpError ? error.message : "Não foi possível concluir a operação", error instanceof HttpError ? error.status : 500);
      return secureOrigin(request, env) ? cors(response, env) : response;
    }
  },
  async scheduled(_event, env) {
    const retentionDays = Math.max(30, Math.min(365, Number(env.ORDER_RETENTION_DAYS || 120)));
    const now = Date.now();
    await env.ORDERS.prepare("DELETE FROM orders WHERE created_at<?").bind(now - retentionDays * DAY).run();
    await env.ORDERS.prepare("DELETE FROM rate_limits WHERE reset_at<?").bind(now).run();
  }
};
