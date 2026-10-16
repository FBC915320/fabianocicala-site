import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "./worker.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

class FakeDB {
  constructor() { this.orders = new Map(); this.limits = new Map(); }
  prepare(sql) {
    const db = this;
    return {
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() {
        const a = this.args;
        if (sql.includes("FROM rate_limits")) return db.limits.get(a[0]) || null;
        if (sql.includes("WHERE client_key")) return [...db.orders.values()].find((o) => o.client_key === a[0]) || null;
        if (sql.includes("FROM orders WHERE id")) return db.orders.get(a[0]) || null;
        throw new Error("first SQL not mocked: " + sql);
      },
      async run() {
        const a = this.args;
        if (sql.startsWith("INSERT INTO rate_limits")) { db.limits.set(a[0], { count: 1, reset_at: a[1] }); return { meta: { changes: 1 } }; }
        if (sql.startsWith("UPDATE rate_limits SET count")) { const r = db.limits.get(a[0]); if (r && r.reset_at > a[1]) r.count++; return { meta: { changes: r ? 1 : 0 } }; }
        if (sql.startsWith("INSERT INTO orders")) {
          const [id, book_id, email, amount_cents, currency, claim_hash, client_key, created_at, updated_at] = a;
          db.orders.set(id, { id, book_id, email, amount_cents, currency, claim_hash, client_key, status: "pending", preference_id: null, checkout_url: null, payment_id: null, created_at, updated_at, download_count: 0 });
          return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE orders SET preference_id")) {
          const o = db.orders.get(a[3]); Object.assign(o, { preference_id: a[0], checkout_url: a[1], updated_at: a[2] }); return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE orders SET status='checkout_error'")) {
          const o = db.orders.get(a[1]); Object.assign(o, { status: "checkout_error", updated_at: a[0] }); return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE orders SET status=?")) {
          const o = db.orders.get(a[3]); Object.assign(o, { status: a[0], payment_id: a[1], updated_at: a[2] }); return { meta: { changes: 1 } };
        }
        if (sql.startsWith("UPDATE orders SET download_count")) {
          const o = db.orders.get(a[1]); const ok = o && o.download_count < 10 && o.status === "approved";
          if (ok) { o.download_count++; o.updated_at = a[0]; }
          return { meta: { changes: ok ? 1 : 0 } };
        }
        if (sql.startsWith("UPDATE orders SET claim_hash")) {
          const o = db.orders.get(a[3]); Object.assign(o, { claim_hash: a[0], status: "approved", payment_id: a[1], updated_at: a[2] }); return { meta: { changes: 1 } };
        }
        if (sql.startsWith("DELETE FROM")) return { meta: { changes: 0 } };
        throw new Error("run SQL not mocked: " + sql);
      }
    };
  }
}

const site = "https://fabianocicala.com";
function makeEnv({ enabled = "corolla-cross-hybrid-13-problemas", hasFile = true, live = false } = {}) {
  const db = new FakeDB();
  return {
    ORDERS: db,
    PRIVATE_EBOOKS: {
      async head() { return hasFile ? { size: 5199894 } : null; },
      async get() { return hasFile ? { body: new Uint8Array([80, 75, 3, 4]), size: 4 } : null; }
    },
    MP_ACCESS_TOKEN: "TEST-token",
    MP_WEBHOOK_SECRET: "webhook-secret",
    MP_COLLECTOR_ID: "123456",
    RATE_LIMIT_SALT: "rate-limit-secret",
    CLAIM_SECRET: "claim-secret",
    PUBLIC_SITE: site,
    PUBLIC_API: "https://worker.example",
    ENABLED_BOOKS: enabled,
    MP_LIVE_MODE: String(live),
    ORDER_RETENTION_DAYS: "120"
  };
}

function request(path, { method = "POST", body, headers = {}, origin = site } = {}) {
  return new Request("https://worker.example" + path, {
    method,
    headers: { ...(origin ? { Origin: origin } : {}), "cf-connecting-ip": "203.0.113.7", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

function preferenceFetch() {
  globalThis.fetch = async (url) => {
    assert.match(String(url), /checkout\/preferences$/);
    return Response.json({ id: "pref-1", init_point: "https://mp.example/live", sandbox_init_point: "https://mp.example/sandbox" });
  };
}

async function checkout(env, key = "checkout-key-123456789") {
  preferenceFetch();
  const response = await worker.fetch(request("/api/checkout", {
    headers: { "Idempotency-Key": key },
    body: { bookId: "corolla-cross-hybrid-13-problemas", email: "leitor@example.com" }
  }), env);
  return { response, data: await response.json() };
}

async function signature(secret, id, requestId, ts = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`id:${id};request-id:${requestId};ts:${ts};`));
  return `ts=${ts},v1=${Buffer.from(bytes).toString("hex")}`;
}

function payment(order, overrides = {}) {
  return {
    id: "90001", external_reference: order.id, metadata: { order_id: order.id },
    currency_id: "BRL", transaction_amount: order.amount_cents / 100,
    transaction_amount_refunded: 0, collector_id: "123456", live_mode: false,
    status: "approved", ...overrides
  };
}

async function webhook(env, order, overrides = {}, signatureOverride) {
  const id = String(overrides.id || "90001");
  const requestId = "request-abc";
  globalThis.fetch = async () => Response.json(payment(order, overrides));
  const sig = signatureOverride || await signature(env.MP_WEBHOOK_SECRET, id, requestId);
  return worker.fetch(request(`/api/mp-webhook?data.id=${id}`, {
    origin: null,
    headers: { "x-request-id": requestId, "x-signature": sig }
  }), env);
}

test("saúde informa configuração ausente sem expor segredos", async () => {
  const response = await worker.fetch(request("/health", { method: "GET", origin: null }), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "unconfigured" });
});

test("origem não autorizada é bloqueada", async () => {
  const response = await worker.fetch(request("/api/order-status", { origin: "https://evil.example", body: {} }), makeEnv());
  assert.equal(response.status, 403);
});

test("livro não habilitado não cria checkout", async () => {
  const env = makeEnv({ enabled: "" });
  const { response } = await checkout(env);
  assert.equal(response.status, 409);
  assert.equal(env.ORDERS.orders.size, 0);
});

test("arquivo ausente não cria checkout", async () => {
  const env = makeEnv({ hasFile: false });
  const { response } = await checkout(env);
  assert.equal(response.status, 409);
  assert.equal(env.ORDERS.orders.size, 0);
});

test("checkout de homologação usa URL sandbox e preço do catálogo", async () => {
  const env = makeEnv();
  const { response, data } = await checkout(env);
  assert.equal(response.status, 200);
  assert.equal(data.checkoutUrl, "https://mp.example/sandbox");
  assert.ok(data.orderId && data.claim);
  assert.equal([...env.ORDERS.orders.values()][0].amount_cents, 990);
});

test("idempotência reutiliza o mesmo checkout sem criar segunda cobrança", async () => {
  const env = makeEnv();
  const first = await checkout(env, "same-key-1234567890");
  const second = await checkout(env, "same-key-1234567890");
  assert.equal(second.response.status, 200);
  assert.equal(second.data.orderId, first.data.orderId);
  assert.equal(second.data.claim, first.data.claim);
  assert.equal(second.data.checkoutUrl, first.data.checkoutUrl);
  assert.equal(env.ORDERS.orders.size, 1);
});

test("webhook com assinatura adulterada é rejeitado", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const response = await webhook(env, order, {}, "ts=1,v1=" + "0".repeat(64));
  assert.equal(response.status, 401);
  assert.equal(order.status, "pending");
});

test("webhook com preço divergente é rejeitado", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const response = await webhook(env, order, { transaction_amount: 1 });
  assert.equal(response.status, 409);
  assert.equal(order.status, "pending");
});

test("webhook de outro recebedor é rejeitado", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const response = await webhook(env, order, { collector_id: "999999" });
  assert.equal(response.status, 403);
});

test("webhook de ambiente divergente é rejeitado", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const response = await webhook(env, order, { live_mode: true });
  assert.equal(response.status, 409);
});

test("webhook aprovado libera o pedido", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const response = await webhook(env, order);
  assert.equal(response.status, 200);
  assert.equal(order.status, "approved");
  assert.equal(order.payment_id, "90001");
});

test("Pix pendente só libera depois da aprovação", async () => {
  const env = makeEnv(); const checked = await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const pending = await webhook(env, order, { status: "pending" });
  assert.equal(pending.status, 200);
  assert.equal(order.status, "pending");
  const blocked = await worker.fetch(request("/api/download", { body: { orderId: order.id, claim: checked.data.claim } }), env);
  assert.equal(blocked.status, 403);
  await webhook(env, order, { status: "approved" });
  assert.equal(order.status, "approved");
});

test("cartão recusado mantém download bloqueado", async () => {
  const env = makeEnv(); const checked = await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  await webhook(env, order, { status: "rejected" });
  const response = await worker.fetch(request("/api/download", { body: { orderId: order.id, claim: checked.data.claim } }), env);
  assert.equal(order.status, "rejected");
  assert.equal(response.status, 403);
});

test("webhook aprovado repetido é idempotente", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  const first = await webhook(env, order);
  const second = await webhook(env, order);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(order.status, "approved");
  assert.equal(order.payment_id, "90001");
});

test("notificação pendente fora de ordem não rebaixa pedido aprovado", async () => {
  const env = makeEnv(); await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  await webhook(env, order);
  const response = await webhook(env, order, { status: "pending" });
  assert.equal(response.status, 200);
  assert.equal(order.status, "approved");
});

test("estorno revoga download", async () => {
  const env = makeEnv(); const checked = await checkout(env); const order = [...env.ORDERS.orders.values()][0];
  await webhook(env, order);
  await webhook(env, order, { status: "refunded", transaction_amount_refunded: 9.9 });
  const response = await worker.fetch(request("/api/download", { body: { orderId: order.id, claim: checked.data.claim } }), env);
  assert.equal(order.status, "revoked");
  assert.equal(response.status, 403);
});

test("token ausente bloqueia consulta do pedido", async () => {
  const env = makeEnv(); const checked = await checkout(env);
  const response = await worker.fetch(request("/api/order-status", { body: { orderId: checked.data.orderId, claim: "" } }), env);
  assert.equal(response.status, 404);
});

test("limite de dez downloads é atômico", async () => {
  const env = makeEnv(); const checked = await checkout(env); const order = [...env.ORDERS.orders.values()][0]; order.status = "approved"; order.download_count = 9;
  const first = await worker.fetch(request("/api/download", { body: { orderId: order.id, claim: checked.data.claim } }), env);
  const second = await worker.fetch(request("/api/download", { body: { orderId: order.id, claim: checked.data.claim } }), env);
  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
});

test("arquivo ausente não consome download", async () => {
  const env = makeEnv({ hasFile: false }); env.PRIVATE_EBOOKS.head = async () => ({ size: 1000 });
  const checked = await checkout(env); const order = [...env.ORDERS.orders.values()][0]; order.status = "approved";
  const response = await worker.fetch(request("/api/download", { body: { orderId: order.id, claim: checked.data.claim } }), env);
  assert.equal(response.status, 503);
  assert.equal(order.download_count, 0);
});

test("recuperação valida pagamento e gira o token", async () => {
  const env = makeEnv(); const checked = await checkout(env); const order = [...env.ORDERS.orders.values()][0]; const oldHash = order.claim_hash;
  globalThis.fetch = async () => Response.json(payment(order));
  const response = await worker.fetch(request("/api/recover", { body: { email: "leitor@example.com", paymentId: "90001" } }), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.orderId, order.id);
  assert.notEqual(order.claim_hash, oldHash);
  assert.equal(order.status, "approved");
});

test("preflight CORS permite somente cabeçalhos necessários", async () => {
  const response = await worker.fetch(request("/api/checkout", { method: "OPTIONS" }), makeEnv());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), site);
  assert.equal(response.headers.get("access-control-allow-headers"), "Content-Type, Idempotency-Key");
});
