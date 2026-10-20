import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { marketingLeads, marketingSuppressions } from "../db/schema";

const CONSENT_VERSION = "marketing-email-v1-2026-07";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function saveMarketingLead({
  email,
  selectedTheme,
}: {
  email: string;
  selectedTheme: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) return;

  const db = getDb();
  const [suppression] = await db
    .select({ id: marketingSuppressions.id })
    .from(marketingSuppressions)
    .where(eq(marketingSuppressions.email, normalizedEmail))
    .limit(1);

  if (suppression) return;

  const now = new Date();
  await db
    .insert(marketingLeads)
    .values({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      marketingConsent: true,
      consentVersion: CONSENT_VERSION,
      source: "astroia-map-form",
      selectedTheme,
      consentedAt: now,
      revokedAt: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: marketingLeads.email,
      set: {
        marketingConsent: true,
        consentVersion: CONSENT_VERSION,
        source: "astroia-map-form",
        selectedTheme,
        consentedAt: now,
        revokedAt: null,
        updatedAt: now,
      },
    });
}

export async function unsubscribeMarketing(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Informe um e-mail válido.");
  }

  const now = new Date();
  const db = getDb();

  await db
    .insert(marketingSuppressions)
    .values({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      reason: "user-unsubscribe",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: marketingSuppressions.email,
      set: {
        reason: "user-unsubscribe",
        updatedAt: now,
      },
    });

  await db
    .update(marketingLeads)
    .set({
      marketingConsent: false,
      revokedAt: now,
      updatedAt: now,
    })
    .where(eq(marketingLeads.email, normalizedEmail));
}
