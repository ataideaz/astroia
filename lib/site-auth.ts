import { cookies } from "next/headers";

const COOKIE = "astroia_session";
const day = 24 * 60 * 60 * 1000;

async function db() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("O banco de dados do AstroIA não está disponível.");
  return env.DB;
}

function base64Url(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomSecret() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return base64Url(new Uint8Array(hash));
}

export function normalizedEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function createLoginToken(email: string) {
  const now = Date.now();
  const database = await db();
  const account = await database.prepare("SELECT id FROM astro_accounts WHERE email = ?").bind(email).first<{ id: string }>();
  const accountId = account?.id ?? crypto.randomUUID();
  if (!account) {
    await database.prepare("INSERT INTO astro_accounts (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)").bind(accountId, email, now, now).run();
  } else {
    await database.prepare("UPDATE astro_accounts SET updated_at = ? WHERE id = ?").bind(now, accountId).run();
  }
  const rawToken = randomSecret();
  await database.prepare("INSERT INTO astro_login_tokens (id, account_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), accountId, await digest(rawToken), now + 15 * 60 * 1000, now).run();
  return rawToken;
}

export async function redeemLoginToken(rawToken: string) {
  const now = Date.now();
  const database = await db();
  const token = await database.prepare("SELECT id, account_id FROM astro_login_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?")
    .bind(await digest(rawToken), now).first<{ id: string; account_id: string }>();
  if (!token) return null;
  await database.prepare("UPDATE astro_login_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL").bind(now, token.id).run();
  const secret = randomSecret();
  const sessionId = crypto.randomUUID();
  const expiresAt = now + 30 * day;
  await database.prepare("INSERT INTO astro_sessions (id, account_id, secret_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(sessionId, token.account_id, await digest(secret), expiresAt, now).run();
  return { value: `${sessionId}.${secret}`, expiresAt };
}

export async function getSiteAccount() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const divider = value.indexOf(".");
  if (divider < 1) return null;
  const sessionId = value.slice(0, divider);
  const secret = value.slice(divider + 1);
  const row = await (await db()).prepare("SELECT a.id, a.email FROM astro_sessions s JOIN astro_accounts a ON a.id = s.account_id WHERE s.id = ? AND s.secret_hash = ? AND s.expires_at > ?")
    .bind(sessionId, await digest(secret), Date.now()).first<{ id: string; email: string }>();
  return row ?? null;
}

export async function setSiteSession(value: string, expiresAt: number) {
  (await cookies()).set(COOKIE, value, { httpOnly: true, secure: true, sameSite: "lax", expires: new Date(expiresAt), path: "/" });
}

export async function clearSiteSession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", expires: new Date(0), path: "/" });
}
