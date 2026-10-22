import { createAstroAnalysis } from "../../../lib/astro-analysis";
import { buildCompatibility, type CompatPerson } from "../../../lib/compatibility";
import { getGuestReport, limitRequest, readStoredCompat, saveCompat } from "../../../lib/guest-reports";
import type { AnalysisResult } from "../../../lib/astro-analysis";

export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function person(analysis: AnalysisResult): CompatPerson {
  const byKey = Object.fromEntries(analysis.placements.map((placement) => [placement.key, placement]));
  return {
    name: analysis.person.fullName,
    sun: byKey.sun,
    moon: byKey.moon,
    mercury: byKey.mercury,
    venus: byKey.venus,
    mars: byKey.mars,
    ascendant: analysis.bigThree.ascendant,
    personalYear: analysis.numerology.personalYear,
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 4000) throw new Error("Solicitação muito grande.");
    const body = JSON.parse(raw) as {
      token?: string;
      consent?: boolean;
      partner?: { name?: unknown; birthDate?: unknown; birthTime?: unknown; city?: unknown; country?: unknown };
    };
    const report = await getGuestReport(body.token);
    if (!report.products.compat) throw new Error("A compatibilidade ainda não foi liberada neste mapa.");
    if (body.consent !== true) throw new Error("Confirme que a outra pessoa concorda em usar os dados dela.");
    const stored = await readStoredCompat(String(body.token));
    // Primeiro preenchimento + uma única correção. Nunca mais que isso.
    const usedSaves = stored?.saves ?? 0;
    if (usedSaves >= 2) throw new Error("A compatibilidade deste mapa já foi feita. Ela fica salva no seu link.");
    await limitRequest(request, "compat", 20);

    const partner = {
      name: clean(body.partner?.name, 80),
      birthDate: clean(body.partner?.birthDate, 10),
      birthTime: clean(body.partner?.birthTime, 5),
      city: clean(body.partner?.city, 80),
      country: clean(body.partner?.country, 60) || "Brasil",
    };
    if (!partner.name) throw new Error("Informe o nome da outra pessoa.");
    const partnerAnalysis = await createAstroAnalysis({
      ...partner,
      theme: "personalidade",
      recipientType: "partner",
      dataConsent: true,
      authorizationConfirmed: true,
      reportTier: "free",
    });
    if (partnerAnalysis.person.isMinor) throw new Error("A compatibilidade de casal é só para maiores de 18 anos.");

    const people = { a: person(report.analysis), b: person(partnerAnalysis) };
    const result = buildCompatibility(people.a, people.b);
    const saved = await saveCompat(String(body.token), usedSaves, {
      partner,
      people,
      result,
      saves: usedSaves + 1,
      updatedAt: Date.now(),
    });
    if (!saved) throw new Error("A compatibilidade deste mapa já foi feita. Ela fica salva no seu link.");
    return Response.json({ result, partnerName: partner.name, canEdit: usedSaves + 1 < 2 }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Não foi possível calcular a compatibilidade." }, { status: 400 });
  }
}
