// Lê configurações e segredos do Worker. Secrets do painel da Cloudflare
// chegam pelo objeto env de "cloudflare:workers"; process.env é o reserva.
import { env } from "cloudflare:workers";

export function readEnv(name: string): string | undefined {
  const fromBinding = (env as unknown as Record<string, unknown>)[name];
  if (typeof fromBinding === "string" && fromBinding.trim()) return fromBinding.trim();
  const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return fromProcess?.trim() || undefined;
}
