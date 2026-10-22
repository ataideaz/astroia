import { limitRequest } from "./guest-reports";
import { readEnv } from "./runtime-env";

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** Confere a chave do painel. Devolve uma resposta de erro, ou null se estiver tudo certo. */
export async function checkAdmin(request: Request): Promise<Response | null> {
  const expected = readEnv("ADMIN_KEY");
  if (!expected || expected.length < 12) {
    return Response.json({ error: "Painel ainda não configurado: crie o segredo ADMIN_KEY na Cloudflare." }, { status: 503 });
  }
  try { await limitRequest(request, "painel", 120); } catch {
    return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  const [a, b] = await Promise.all([sha256(request.headers.get("x-admin-key") || ""), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0 ? null : Response.json({ error: "Chave incorreta." }, { status: 401 });
}
