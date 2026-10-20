import { getDb } from "../db";
import { privacyRequests } from "../db/schema";
import { isValidEmail, normalizeEmail } from "./marketing-leads";

const ALLOWED_REQUESTS = new Set([
  "confirmacao",
  "acesso",
  "correcao",
  "eliminacao",
  "revogacao",
  "informacao",
  "outro",
]);

export async function savePrivacyRequest({
  email,
  requestType,
  details,
}: {
  email: string;
  requestType: string;
  details?: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Informe um e-mail válido.");
  }
  if (!ALLOWED_REQUESTS.has(requestType)) {
    throw new Error("Selecione um tipo de solicitação válido.");
  }

  const now = new Date();
  const id = crypto.randomUUID();
  await getDb().insert(privacyRequests).values({
    id,
    email: normalizedEmail,
    requestType,
    details: details?.trim().slice(0, 1200) || null,
    status: "recebida",
    createdAt: now,
    updatedAt: now,
  });

  return id;
}
