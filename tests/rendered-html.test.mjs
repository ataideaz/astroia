import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const sun = {
  key: "sun",
  label: "Sol",
  symbol: "☉",
  sign: "Leão",
  signKey: "leo",
  degree: "12° 30'",
  longitude: 132.5,
  house: 2,
  retrograde: false,
};

const moon = {
  key: "moon",
  label: "Lua",
  symbol: "☽",
  sign: "Touro",
  signKey: "taurus",
  degree: "8° 15'",
  longitude: 38.25,
  house: 11,
  retrograde: false,
};

const ascendant = {
  key: "ascendant",
  label: "Ascendente",
  symbol: "ASC",
  sign: "Câncer",
  signKey: "cancer",
  degree: "3° 10'",
  longitude: 93.17,
  house: 1,
  retrograde: false,
};

function theme(id, label) {
  return {
    id,
    label,
    headline: `${label}: um caminho que pode ser compreendido`,
    introduction:
      "Esta leitura mostra tendências de forma simples, acolhedora e prática.",
    sections: [
      {
        title: `O que fortalece ${label.toLowerCase()}`,
        text: "Você ganha clareza quando respeita seu ritmo e transforma intenção em atitude.",
      },
      {
        title: "O que observar",
        text: "Evite respostas automáticas e dê espaço para escolher com consciência.",
      },
    ],
    actionPrompt:
      "Escolha um passo pequeno e possível para colocar esta percepção em prática.",
  };
}

const sampleAnalysis = {
  person: {
    firstName: "Maria",
    fullName: "Maria de Teste",
    birthDate: "1992-08-05",
    birthTime: "14:30",
    location: "Curitiba, Brasil",
    latitude: -25.43,
    longitude: -49.27,
    timezone: "America/Sao_Paulo",
    exactTime: true,
    recipientType: "self",
    relationshipLabel: "Para mim",
    isMinor: false,
    age: 33,
  },
  bigThree: { sun, moon, ascendant },
  midheaven: null,
  placements: [sun, moon, ascendant],
  summary:
    "Você combina presença criativa, estabilidade emocional e uma forma cuidadosa de iniciar experiências.",
  pattern: {
    element: "Terra",
    mode: "Fixo",
    text: "Há constância para construir com calma e aprofundar o que realmente importa.",
    strengths: ["Persistência", "Lealdade", "Senso prático"],
    watchouts: ["Rigidez diante de mudanças", "Excesso de cobrança"],
  },
  readings: [
    {
      id: "essencia",
      kicker: "Essência",
      title: "O que move suas escolhas",
      text: "Você se sente mais inteira quando reconhece seu valor e age sem perder a delicadeza.",
    },
  ],
  themeFocus: {
    title: "Seu foco agora",
    text: "Organizar prioridades e escolher com segurança.",
  },
  themeDeepDive: theme("dinheiro", "Dinheiro"),
  allThemes: [
    theme("personalidade", "Personalidade"),
    theme("amor", "Amor"),
    theme("carreira", "Carreira"),
    theme("dinheiro", "Dinheiro"),
    theme("momento", "Momento atual"),
  ],
  currentSky: {
    dateLabel: "28 de julho de 2026",
    moonPhase: {
      label: "Lua crescente",
      angle: 93,
      text: "Uma fase favorável para ajustar planos e sustentar o que começou.",
    },
    summary: "O céu atual pede escolhas claras e continuidade.",
    highlights: [
      {
        title: "Sol em harmonia com seu mapa",
        orb: 2.1,
        text: "Há mais confiança para dar forma às suas prioridades.",
      },
    ],
  },
  numerology: {
    lifePath: 7,
    personalYear: 4,
    lifePathText: "Seu caminho valoriza profundidade, observação e significado.",
    personalYearText: "O ciclo atual favorece estrutura, constância e organização.",
  },
  aspects: [
    {
      title: "Sol em harmonia com a Lua",
      orb: 1.8,
      text: "Vontade e emoção encontram maneiras mais simples de colaborar.",
    },
  ],
  premium: {
    headline: "Uma leitura para entender e aplicar",
    introduction:
      "Os próximos capítulos conectam seus padrões com decisões concretas.",
    chapters: [
      {
        id: "recursos",
        kicker: "Recursos",
        title: "Sua relação com segurança e valor",
        summary:
          "Você tende a construir segurança quando enxerga progresso real e sustentável.",
        insights: [
          "Organização reduz ansiedade e melhora suas escolhas.",
          "Metas pequenas ajudam a manter constância.",
        ],
        highlight:
          "Seu melhor movimento começa quando clareza e tranquilidade caminham juntas.",
      },
    ],
    actionPlan: [
      {
        step: "01",
        title: "Escolha uma prioridade",
        text: "Defina o que merece atenção primeiro.",
      },
      {
        step: "02",
        title: "Crie um passo simples",
        text: "Transforme a prioridade em uma ação que caiba na semana.",
      },
      {
        step: "03",
        title: "Observe o resultado",
        text: "Ajuste sem abandonar o que está funcionando.",
      },
    ],
    reflectionQuestions: [
      "O que hoje representa segurança para você?",
      "Qual escolha pode trazer mais tranquilidade?",
    ],
  },
  notes: [
    "O horário informado permite calcular ascendente e casas.",
    "A astrologia descreve tendências, não determina escolhas.",
  ],
};

async function loadWorker(label) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${label}-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

const workerEnv = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const workerContext = {
  waitUntil() {},
  passThroughOnException() {},
};

test("renders development preview metadata", async () => {
  const worker = await loadWorker("html");

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    workerEnv,
    workerContext,
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.doesNotMatch(html, developmentPreviewMeta);
  assert.match(html, /Para quem é este mapa\?/);
  assert.match(html, /Meus Mapas/);
  assert.doesNotMatch(html, /Pacote Família/);
  assert.match(html, /Filho\(a\)/);
});

test("keeps the generated report visible when printing to PDF", async () => {
  const assetsDirectory = new URL("../dist/client/assets/", import.meta.url);
  const assetNames = await readdir(assetsDirectory);
  const cssName = assetNames.find((name) => name.endsWith(".css"));

  assert.ok(cssName, "expected a compiled CSS asset");

  const css = await readFile(new URL(cssName, assetsDirectory), "utf8");
  const printStyles = css.slice(css.indexOf("@media print"));

  assert.match(printStyles, /main\{overflow:visible\}/);
  assert.match(
    printStyles,
    /\.analysis-report\{[^}]*display:block!important[^}]*\}/,
  );
  assert.match(printStyles, /\.analysis-cover\{[^}]*break-after:page[^}]*\}/);
});

test("keeps the mobile vertical rhythm compact", async () => {
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const mobileStart = css.indexOf("@media (max-width: 760px)");
  const smallMobileStart = css.indexOf("@media (max-width: 470px)");

  assert.ok(mobileStart >= 0, "expected the mobile breakpoint");
  assert.ok(
    smallMobileStart > mobileStart,
    "expected the small mobile breakpoint",
  );

  const mobileStyles = css.slice(mobileStart, smallMobileStart);
  const smallMobileStyles = css.slice(smallMobileStart);

  assert.match(
    mobileStyles,
    /\.section,\s*\.preview-section,\s*\.analysis-report\s*\{[^}]*padding-bottom:\s*48px;[^}]*padding-top:\s*48px;/,
  );
  assert.match(
    mobileStyles,
    /\.pricing-section\s*\{[^}]*padding-bottom:\s*24px;/,
  );
  assert.match(
    mobileStyles,
    /\.faq-section\s*\{[^}]*padding-top:\s*28px;/,
  );
  assert.match(
    smallMobileStyles,
    /\.pricing-section\s*\{[^}]*padding-bottom:\s*22px;/,
  );
  assert.match(
    smallMobileStyles,
    /\.faq-section\s*\{[^}]*padding-top:\s*26px;/,
  );
});

test("stages Premium generation behind the Mercado Pago test checkout", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    page,
    /if \(reportTier === "premium"\) \{\s*openCheckout\(request, "generate"\);/,
  );
  assert.match(page, /Continuar para pagamento/);
  assert.match(page, /MERCADO PAGO · TESTE/);
  assert.match(page, /fetch\("\/api\/checkout"/);
  assert.match(page, /Ir para o Mercado Pago \(teste\)/);
  assert.match(page, /\/api\/payments\/status\?order=/);
  assert.match(page, /Prefiro continuar com o mapa grátis/);
  assert.match(page, /Não informe cartão real/);
  assert.match(page, /PAYMENT_CHECKOUT_STORAGE_KEY/);
  assert.match(
    page,
    /function prepareNewMap[\s\S]*?sessionStorage\.removeItem\(PAYMENT_CHECKOUT_STORAGE_KEY\)/,
  );
  assert.match(
    page,
    /function openCheckout[\s\S]*?sessionStorage\.removeItem\(PAYMENT_CHECKOUT_STORAGE_KEY\)/,
  );
  assert.match(page, /fetch\("\/api\/checkout", \{[\s\S]*?cache: "no-store"/);
  assert.match(page, /Abrir um novo checkout de teste/);
  assert.match(css, /\.checkout-overlay\s*\{[^}]*position:\s*fixed;/);
  assert.match(css, /\.mercado-pago-card\s*\{/);
  assert.match(
    css,
    /@media \(max-width: 760px\)[\s\S]*?\.checkout-layout\s*\{[^}]*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media print[\s\S]*?\.checkout-overlay\s*\{[^}]*display:\s*none !important;/,
  );
});

test("does not identify a real payer while Mercado Pago is in test mode", async () => {
  const paymentSource = await readFile(
    new URL("../lib/mercado-pago.ts", import.meta.url),
    "utf8",
  );

  assert.match(paymentSource, /function isTestMode\(\)/);
  assert.match(
    paymentSource,
    /!isTestMode\(\) && customerEmail[\s\S]*?payer: \{ email: customerEmail \}/,
  );
});

test("creates a real downloadable PDF for mobile", async () => {
  const worker = await loadWorker("pdf");
  const response = await worker.fetch(
    new Request("http://localhost/api/report-pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        analysis: sampleAnalysis,
        reportTier: "premium",
      }),
    }),
    workerEnv,
    workerContext,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/pdf/);
  assert.match(
    response.headers.get("content-disposition") ?? "",
    /AstroIA-Maria-Premium\.pdf/,
  );
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "%PDF");
  assert.ok(bytes.byteLength > 10_000, "expected a complete PDF document");
  if (process.env.ASTROIA_PDF_QA === "1") {
    const qaDirectory = new URL("../tmp/pdfs/", import.meta.url);
    await mkdir(qaDirectory, { recursive: true });
    await writeFile(new URL("astroia-premium-qa.pdf", qaDirectory), bytes);
  }

  const { PDFDocument } = await import("pdf-lib");
  const document = await PDFDocument.load(bytes);
  assert.ok(document.getPageCount() >= 4, "expected a multi-page report");
});

test("renders the branded transactional email without subscribing to marketing", async () => {
  const worker = await loadWorker("email");
  const response = await worker.fetch(
    new Request("http://localhost/api/email-map", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "preview",
        analysis: sampleAnalysis,
        deliveryId: "delivery-test-1234",
        email: "maria@example.com",
        reportTier: "premium",
      }),
    }),
    workerEnv,
    workerContext,
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.mode, "preview");
  assert.match(payload.previewHtml, /AstroIA/);
  assert.match(payload.previewHtml, /Maria, há mais no seu céu/);
  assert.match(payload.previewHtml, /não ativa comunicações promocionais/);
  assert.match(payload.previewHtml, /O mapa completo também está no PDF/);
  if (process.env.ASTROIA_EMAIL_QA === "1") {
    const qaDirectory = new URL("../public/", import.meta.url);
    await writeFile(
      new URL("email-preview-qa.html", qaDirectory),
      payload.previewHtml,
      "utf8",
    );
  }

  const sendWithoutProvider = await worker.fetch(
    new Request("http://localhost/api/email-map", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "send",
        analysis: sampleAnalysis,
        deliveryId: "delivery-test-no-provider",
        email: "maria@example.com",
        reportTier: "premium",
      }),
    }),
    workerEnv,
    workerContext,
  );
  assert.equal(sendWithoutProvider.status, 200);
  const sendPayload = await sendWithoutProvider.json();
  assert.equal(sendPayload.mode, "preview-only");
  assert.match(sendPayload.message, /falta somente conectar o remetente AstroIA/i);
});
