import fontkit from "@pdf-lib/fontkit";
import interBoldSource from "dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?inline";
import interSource from "dejavu-fonts-ttf/ttf/DejaVuSans.ttf?inline";
import cormorantBoldSource from "dejavu-fonts-ttf/ttf/DejaVuSerif-Bold.ttf?inline";
import cormorantSource from "dejavu-fonts-ttf/ttf/DejaVuSerif.ttf?inline";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
} from "pdf-lib";
import type { AnalysisResult, Placement, ThemeGuide } from "./astro-analysis";
import type { ExportTier } from "./report-export";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;
const BOTTOM = 60;

const COLORS = {
  ink: rgb(0.13, 0.09, 0.2),
  muted: rgb(0.39, 0.35, 0.45),
  cream: rgb(0.985, 0.975, 0.945),
  paper: rgb(1, 1, 1),
  midnight: rgb(0.035, 0.025, 0.09),
  purple: rgb(0.34, 0.19, 0.56),
  violet: rgb(0.56, 0.42, 0.9),
  gold: rgb(0.84, 0.61, 0.27),
  goldLight: rgb(0.96, 0.81, 0.52),
  line: rgb(0.86, 0.82, 0.87),
};

type Fonts = {
  body: PDFFont;
  bold: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
};

type Flow = {
  document: PDFDocument;
  fonts: Fonts;
  page: PDFPage;
  pageLabel: string;
  y: number;
};

function fontBytes(dataUrl: string) {
  const separator = dataUrl.indexOf(",");
  if (separator < 0) throw new Error("Não foi possível carregar a tipografia.");
  const binary = atob(dataUrl.slice(separator + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function pdfText(value: unknown) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•✦◇♡↗☼]/g, "-")
    .replace(/[^\u0020-\u007e\u00a0-\u00ff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBirthDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function wrapText(
  value: unknown,
  font: PDFFont,
  size: number,
  width: number,
) {
  const text = pdfText(value);
  if (!text) return [] as string[];

  const words = text.split(" ").flatMap((word) => {
    if (font.widthOfTextAtSize(word, size) <= width) return [word];
    const pieces: string[] = [];
    let piece = "";
    for (const character of word) {
      const candidate = `${piece}${character}`;
      if (piece && font.widthOfTextAtSize(candidate, size) > width) {
        pieces.push(piece);
        piece = character;
      } else {
        piece = candidate;
      }
    }
    if (piece) pieces.push(piece);
    return pieces;
  });
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(candidate, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawPageChrome(
  document: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  label: string,
) {
  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: COLORS.cream,
  });
  page.drawText("ASTROIA", {
    x: MARGIN,
    y: height - 38,
    size: 9,
    font: fonts.bold,
    color: COLORS.purple,
  });
  page.drawText(pdfText(label).toUpperCase(), {
    x: width - MARGIN - 170,
    y: height - 38,
    size: 7,
    font: fonts.bold,
    color: COLORS.muted,
    maxWidth: 170,
    lineHeight: 8,
  });
  page.drawLine({
    start: { x: MARGIN, y: height - 48 },
    end: { x: width - MARGIN, y: height - 48 },
    color: COLORS.line,
    thickness: 0.7,
  });
  page.drawLine({
    start: { x: MARGIN, y: 42 },
    end: { x: width - MARGIN, y: 42 },
    color: COLORS.line,
    thickness: 0.6,
  });
  page.drawText(
    `AstroIA  |  ${document.getPageCount().toString().padStart(2, "0")}`,
    {
      x: MARGIN,
      y: 27,
      size: 7,
      font: fonts.body,
      color: COLORS.muted,
    },
  );
  page.drawText("Autoconhecimento em linguagem simples", {
    x: width - MARGIN - 170,
    y: 27,
    size: 7,
    font: fonts.body,
    color: COLORS.muted,
    maxWidth: 170,
  });
}

function addContentPage(flow: Flow, label = flow.pageLabel) {
  const page = flow.document.addPage(A4);
  drawPageChrome(flow.document, page, flow.fonts, label);
  flow.page = page;
  flow.pageLabel = label;
  flow.y = A4[1] - 76;
}

function drawNatalChartPage(flow: Flow, analysis: AnalysisResult) {
  const label = "MAPA NATAL DESENHADO";
  addContentPage(flow, label);
  sectionHeading(flow, "SEU CÉU DE NASCIMENTO", "As posições reais dos planetas no mapa");
  paragraph(
    flow,
    "O anel de fora mostra os signos. Os números indicam as casas, que representam áreas da vida. Os pontos marcam os planetas; as linhas coloridas mostram como eles se relacionam.",
    { size: 10, spaceAfter: 4 },
  );

  const center = { x: A4[0] / 2, y: 430 };
  const point = (longitude: number, radius: number) => {
    const angle = ((longitude - 90) * Math.PI) / 180;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  };
  const circle = (radius: number, color: ReturnType<typeof rgb>, thickness = 0.8) => {
    flow.page.drawCircle({ x: center.x, y: center.y, size: radius, borderColor: color, borderWidth: thickness });
  };
  circle(205, COLORS.line);
  circle(166, COLORS.line);
  circle(121, COLORS.line);
  circle(2.4, COLORS.gold);

  const signs = ["ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "ESC", "SAG", "CAP", "AQU", "PEI"];
  signs.forEach((sign, index) => {
    const outer = point(index * 30, 166);
    const inner = point(index * 30, 121);
    const text = point(index * 30 + 15, 184);
    flow.page.drawLine({ start: outer, end: inner, color: COLORS.line, thickness: 0.6 });
    flow.page.drawText(sign, {
      x: text.x - flow.fonts.bold.widthOfTextAtSize(sign, 7) / 2,
      y: text.y - 2.5,
      size: 7,
      font: flow.fonts.bold,
      color: COLORS.purple,
    });
  });

  const cusps = (analysis.houseCusps ?? []).slice().sort((a, b) => a.house - b.house);
  if (analysis.person.exactTime && cusps.length === 12) {
    cusps.forEach((cusp, index) => {
      const end = point(cusp.longitude, 121);
      const start = point(cusp.longitude, 59);
      const nextLongitude = cusps[(index + 1) % 12]?.longitude ?? cusp.longitude + 30;
      const midpoint = (cusp.longitude + ((nextLongitude - cusp.longitude + 360) % 360) / 2) % 360;
      const number = point(midpoint, 89);
      flow.page.drawLine({
        start: end,
        end: start,
        color: cusp.house === 1 || cusp.house === 10 ? COLORS.gold : COLORS.line,
        thickness: cusp.house === 1 || cusp.house === 10 ? 1.4 : 0.65,
      });
      const text = String(cusp.house);
      flow.page.drawText(text, {
        x: number.x - flow.fonts.body.widthOfTextAtSize(text, 8) / 2,
        y: number.y - 2.7,
        size: 8,
        font: flow.fonts.body,
        color: COLORS.muted,
      });
    });
  }

  const planetShort: Record<string, string> = {
    sun: "SOL", moon: "LUA", mercury: "MER", venus: "VEN", mars: "MAR",
    jupiter: "JUP", saturn: "SAT", uranus: "URA", neptune: "NET", pluto: "PLU",
  };
  const planetPositions = new Map(analysis.placements.map((item) => [item.key, point(item.longitude, 98)]));
  const aspectColors: Record<string, ReturnType<typeof rgb>> = {
    conjunction: COLORS.gold,
    opposition: rgb(0.84, 0.36, 0.43),
    trine: rgb(0.22, 0.58, 0.48),
    square: rgb(0.72, 0.35, 0.52),
    sextile: COLORS.violet,
  };
  analysis.aspects.forEach((aspect) => {
    if (!aspect.point1Key || !aspect.point2Key) return;
    const first = planetPositions.get(aspect.point1Key);
    const second = planetPositions.get(aspect.point2Key);
    if (!first || !second) return;
    flow.page.drawLine({
      start: first,
      end: second,
      color: aspectColors[aspect.aspectKey ?? ""] ?? COLORS.violet,
      thickness: 0.9,
      opacity: 0.72,
    });
  });
  const sorted = [...analysis.placements].sort((a, b) => a.longitude - b.longitude);
  sorted.forEach((placement, index) => {
    const previous = sorted[(index + sorted.length - 1) % sorted.length];
    const next = sorted[(index + 1) % sorted.length];
    const previousGap = (placement.longitude - previous.longitude + 360) % 360;
    const nextGap = (next.longitude - placement.longitude + 360) % 360;
    const crowded = Math.min(previousGap, nextGap) < 10;
    const radius = crowded ? (index % 2 ? 150 : 137) : 143;
    const position = point(placement.longitude, radius);
    const short = planetShort[placement.key] ?? placement.key.slice(0, 3).toUpperCase();
    flow.page.drawCircle({ x: point(placement.longitude, 121).x, y: point(placement.longitude, 121).y, size: 2, color: COLORS.gold });
    flow.page.drawText(short, {
      x: position.x - flow.fonts.bold.widthOfTextAtSize(short, 7) / 2,
      y: position.y - 2.5,
      size: 7,
      font: flow.fonts.bold,
      color: COLORS.ink,
    });
  });
  flow.page.drawCircle({ x: center.x, y: center.y, size: 51, borderColor: COLORS.line, borderWidth: 0.8, color: COLORS.cream });
  const name = pdfText(analysis.person.firstName).toUpperCase();
  flow.page.drawText("ASTROIA", {
    x: center.x - flow.fonts.bold.widthOfTextAtSize("ASTROIA", 7) / 2,
    y: center.y + 5,
    size: 7,
    font: flow.fonts.bold,
    color: COLORS.gold,
  });
  flow.page.drawText(name, {
    x: center.x - flow.fonts.serif.widthOfTextAtSize(name, 11) / 2,
    y: center.y - 10,
    size: 11,
    font: flow.fonts.serif,
    color: COLORS.ink,
  });
  flow.y = 198;
  paragraph(
    flow,
    analysis.person.exactTime
      ? "Signos · planetas · casas Placidus · aspectos principais"
      : "Signos · posições planetárias. Sem horário confirmado, casas e Ascendente não são exibidos.",
    { size: 8.5, color: COLORS.muted, spaceAfter: 0 },
  );
  paragraph(
    flow,
    "Siglas dos planetas: SOL (Sol), LUA (Lua), MER (Mercúrio), VEN (Vênus), MAR (Marte), JUP (Júpiter), SAT (Saturno), URA (Urano), NET (Netuno) e PLU (Plutão).",
    { size: 8.2, color: COLORS.muted, spaceAfter: 0 },
  );
  paragraph(
    flow,
    "Siglas dos signos: ARI (Áries), TAU (Touro), GEM (Gêmeos), CAN (Câncer), LEO (Leão), VIR (Virgem), LIB (Libra), ESC (Escorpião), SAG (Sagitário), CAP (Capricórnio), AQU (Aquário), PEI (Peixes).",
    { size: 8.2, color: COLORS.muted, spaceAfter: 0 },
  );
}

function ensureSpace(flow: Flow, height: number) {
  if (flow.y - height < BOTTOM) addContentPage(flow);
}

function drawLines(
  flow: Flow,
  lines: string[],
  {
    font,
    size,
    color,
    lineHeight,
    indent = 0,
    spaceAfter = 8,
  }: {
    font: PDFFont;
    size: number;
    color: ReturnType<typeof rgb>;
    lineHeight: number;
    indent?: number;
    spaceAfter?: number;
  },
) {
  for (const line of lines) {
    ensureSpace(flow, lineHeight + 2);
    flow.page.drawText(line, {
      x: MARGIN + indent,
      y: flow.y - size,
      size,
      font,
      color,
      maxWidth: CONTENT_WIDTH - indent,
    });
    flow.y -= lineHeight;
  }
  flow.y -= spaceAfter;
}

function paragraph(
  flow: Flow,
  value: unknown,
  options: {
    bold?: boolean;
    color?: ReturnType<typeof rgb>;
    indent?: number;
    size?: number;
    spaceAfter?: number;
  } = {},
) {
  const font = options.bold ? flow.fonts.bold : flow.fonts.body;
  const size = options.size ?? 11.2;
  const indent = options.indent ?? 0;
  const lines = wrapText(value, font, size, CONTENT_WIDTH - indent);
  drawLines(flow, lines, {
    font,
    size,
    color: options.color ?? COLORS.ink,
    lineHeight: size * 1.48,
    indent,
    spaceAfter: options.spaceAfter ?? 9,
  });
}

function sectionHeading(flow: Flow, kicker: string, title: string) {
  ensureSpace(flow, 70);
  const kickerLines = wrapText(kicker.toUpperCase(), flow.fonts.bold, 7.5, 420);
  drawLines(flow, kickerLines, {
    font: flow.fonts.bold,
    size: 7.5,
    color: COLORS.gold,
    lineHeight: 9,
    spaceAfter: 7,
  });
  const titleLines = wrapText(title, flow.fonts.serifBold, 22, CONTENT_WIDTH);
  drawLines(flow, titleLines, {
    font: flow.fonts.serifBold,
    size: 22,
    color: COLORS.purple,
    lineHeight: 25,
    spaceAfter: 12,
  });
}

function subsection(flow: Flow, title: string, text?: string) {
  ensureSpace(flow, 48);
  const titleLines = wrapText(title, flow.fonts.bold, 11.5, CONTENT_WIDTH);
  drawLines(flow, titleLines, {
    font: flow.fonts.bold,
    size: 11.5,
    color: COLORS.ink,
    lineHeight: 15,
    spaceAfter: 5,
  });
  if (text) paragraph(flow, text, { color: COLORS.muted, spaceAfter: 12 });
}

function bullet(flow: Flow, value: unknown) {
  const lines = wrapText(value, flow.fonts.body, 10.6, CONTENT_WIDTH - 20);
  if (!lines.length) return;
  ensureSpace(flow, 18);
  flow.page.drawCircle({
    x: MARGIN + 4,
    y: flow.y - 6,
    size: 2.2,
    color: COLORS.gold,
  });
  drawLines(flow, lines, {
    font: flow.fonts.body,
    size: 10.6,
    color: COLORS.ink,
    lineHeight: 14,
    indent: 16,
    spaceAfter: 4,
  });
}

function callout(flow: Flow, value: unknown) {
  const lines = wrapText(value, flow.fonts.serif, 11.2, CONTENT_WIDTH - 34);
  const height = Math.max(54, lines.length * 16 + 28);
  ensureSpace(flow, height + 12);
  flow.page.drawRectangle({
    x: MARGIN,
    y: flow.y - height,
    width: CONTENT_WIDTH,
    height,
    color: rgb(0.95, 0.91, 0.8),
    borderColor: COLORS.gold,
    borderWidth: 0.8,
  });
  let lineY = flow.y - 20;
  for (const line of lines) {
    flow.page.drawText(line, {
      x: MARGIN + 17,
      y: lineY,
      size: 11.2,
      font: flow.fonts.serif,
      color: COLORS.purple,
      maxWidth: CONTENT_WIDTH - 34,
    });
    lineY -= 16;
  }
  flow.y -= height + 14;
}

function placementLabel(placement: Placement | null) {
  if (!placement) return "Horário não informado";
  return `${placement.sign} | ${placement.degree}${
    placement.house ? ` | Casa ${placement.house}` : ""
  }${placement.retrograde ? " | Retrógrado" : ""}`;
}

const PLANET_TOPICS: Record<string, string> = {
  sun: "identidade, vontade e direção",
  moon: "necessidades emocionais e o que traz segurança",
  mercury: "pensamento, aprendizagem e comunicação",
  venus: "afetos, vínculos e aquilo que você valoriza",
  mars: "iniciativa, ação e modo de enfrentar desafios",
  jupiter: "crescimento, confiança e busca de oportunidades",
  saturn: "responsabilidade, limites e aprendizados com o tempo",
  uranus: "independência, mudanças e ideias novas",
  neptune: "imaginação, sensibilidade e ideais",
  pluto: "mudanças profundas e reconstrução",
};

const HOUSE_TOPICS: Record<number, string> = {
  1: "identidade e começos",
  2: "valores pessoais e recursos",
  3: "conversas, estudos e cotidiano",
  4: "vida íntima, raízes e família",
  5: "criatividade, prazer e expressão pessoal",
  6: "rotina, trabalho diário e hábitos",
  7: "parcerias e relações próximas",
  8: "intimidade e recursos compartilhados",
  9: "estudos, crenças e novos horizontes",
  10: "carreira e objetivos de longo prazo",
  11: "amizades, grupos e planos de futuro",
  12: "vida interior e momentos de recolhimento",
};

const ASPECT_PLAIN_MEANINGS: Record<string, string> = {
  conjunction: "dois assuntos se misturam e ficam mais fortes juntos",
  opposition: "dois lados diferentes pedem equilíbrio",
  trine: "há facilidade natural entre esses assuntos",
  square: "há um desafio que pode pedir ajuste e iniciativa",
  sextile: "surge uma oportunidade que cresce com participação",
};

function planetTopic(placement: Placement) {
  return PLANET_TOPICS[placement.key] ?? "um tema importante da sua vida";
}

function drawPlacement(
  flow: Flow,
  label: string,
  placement: Placement | null,
  description: string,
) {
  subsection(flow, `${label}: ${placementLabel(placement)}`);
  paragraph(flow, description, { color: COLORS.muted, spaceAfter: 11 });
}

function drawTheme(flow: Flow, theme: ThemeGuide, main = false) {
  sectionHeading(
    flow,
    main ? `SUA PRIORIDADE | ${theme.label}` : `OUTRA ÁREA | ${theme.label}`,
    theme.headline,
  );
  paragraph(flow, theme.introduction, { size: 10.6, spaceAfter: 13 });
  for (const section of theme.sections) {
    subsection(flow, section.title, section.text);
  }
  callout(flow, theme.actionPrompt);
}

function cover(
  document: PDFDocument,
  fonts: Fonts,
  analysis: AnalysisResult,
  tier: ExportTier,
) {
  const page = document.addPage(A4);
  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: COLORS.midnight,
  });
  page.drawCircle({
    x: width - 72,
    y: height - 86,
    size: 110,
    color: COLORS.purple,
    opacity: 0.38,
  });
  page.drawCircle({
    x: 58,
    y: 94,
    size: 128,
    color: COLORS.violet,
    opacity: 0.12,
  });
  for (const [x, y, size] of [
    [70, 740, 2],
    [510, 648, 1.4],
    [436, 760, 1.8],
    [118, 184, 1.5],
    [480, 220, 2],
  ] as Array<[number, number, number]>) {
    page.drawCircle({ x, y, size, color: COLORS.goldLight });
  }

  page.drawText("ASTROIA", {
    x: MARGIN,
    y: height - 58,
    size: 12,
    font: fonts.bold,
    color: COLORS.goldLight,
  });
  page.drawText(
    tier === "premium" ? "RELATÓRIO PREMIUM" : "MAPA ESSENCIAL",
    {
      x: MARGIN,
      y: height - 116,
      size: 8,
      font: fonts.bold,
      color: COLORS.gold,
    },
  );

  const nameLines = wrapText(
    analysis.person.firstName,
    fonts.serifBold,
    43,
    width - MARGIN * 2,
  );
  let nameY = height - 180;
  for (const line of nameLines.slice(0, 2)) {
    page.drawText(line, {
      x: MARGIN,
      y: nameY,
      size: 43,
      font: fonts.serifBold,
      color: COLORS.paper,
    });
    nameY -= 48;
  }

  page.drawText(tier === "premium" ? "Seu mapa completo · cinco áreas" : "Sua prévia pessoal", {
    x: MARGIN,
    y: nameY - 10,
    size: 16,
    font: fonts.serif,
    color: COLORS.goldLight,
    maxWidth: CONTENT_WIDTH,
  });
  page.drawText(
    `${pdfText(formatBirthDate(analysis.person.birthDate))} | ${
      pdfText(analysis.person.birthTime) || "horário não informado"
    } | ${pdfText(analysis.person.location)}`,
    {
      x: MARGIN,
      y: nameY - 43,
      size: 8.5,
      font: fonts.body,
      color: rgb(0.76, 0.72, 0.83),
      maxWidth: CONTENT_WIDTH,
    },
  );

  const summaryLines = wrapText(
    analysis.summary,
    fonts.serif,
    12.5,
    CONTENT_WIDTH - 42,
  ).slice(0, 10);
  const summaryHeight = Math.max(145, summaryLines.length * 18 + 54);
  const summaryTop = Math.min(nameY - 84, 430);
  page.drawRectangle({
    x: MARGIN,
    y: summaryTop - summaryHeight,
    width: CONTENT_WIDTH,
    height: summaryHeight,
    color: rgb(0.09, 0.055, 0.18),
    opacity: 0.94,
    borderColor: COLORS.violet,
    borderWidth: 0.8,
  });
  page.drawText("UM PRIMEIRO OLHAR", {
    x: MARGIN + 21,
    y: summaryTop - 28,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.gold,
  });
  let summaryY = summaryTop - 55;
  for (const line of summaryLines) {
    page.drawText(line, {
      x: MARGIN + 21,
      y: summaryY,
      size: 12.5,
      font: fonts.serif,
      color: COLORS.paper,
      maxWidth: CONTENT_WIDTH - 42,
    });
    summaryY -= 18;
  }

  page.drawText(
    analysis.person.isMinor
      ? "Leitura infantojuvenil adaptada e de uso responsável."
      : "Astrologia, numerologia e ciclos em linguagem simples.",
    {
      x: MARGIN,
      y: 48,
      size: 8,
      font: fonts.body,
      color: rgb(0.69, 0.65, 0.76),
    },
  );
}

export async function createReportPdf(
  analysis: AnalysisResult,
  tier: ExportTier,
) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const fonts: Fonts = {
    body: await document.embedFont(fontBytes(interSource), { subset: true }),
    bold: await document.embedFont(fontBytes(interBoldSource), { subset: true }),
    serif: await document.embedFont(fontBytes(cormorantSource), {
      subset: true,
    }),
    serifBold: await document.embedFont(fontBytes(cormorantBoldSource), {
      subset: true,
    }),
  };

  document.setTitle(
    `AstroIA - ${tier === "premium" ? "Relatório Premium" : "Mapa Essencial"} - ${
      analysis.person.firstName
    }`,
  );
  document.setAuthor("AstroIA");
  document.setSubject(tier === "premium" ? "Mapa completo · cinco áreas" : "Prévia pessoal");
  document.setCreator("AstroIA");
  document.setProducer("AstroIA");

  cover(document, fonts, analysis, tier);

  const initialPage = document.addPage(A4);
  const flow: Flow = {
    document,
    fonts,
    page: initialPage,
    pageLabel: "SEU CÉU EM UM OLHAR",
    y: A4[1] - 76,
  };
  drawPageChrome(document, initialPage, fonts, flow.pageLabel);

  sectionHeading(flow, "TRÊS PONTOS CENTRAIS", "Seu céu em um olhar");
  drawPlacement(
    flow,
    "Sol | sua essência",
    analysis.bigThree.sun,
      "Mostra o que é importante para você, o que guia suas escolhas e o que ajuda você a se sentir com energia.",
  );
  drawPlacement(
    flow,
    "Lua | seu mundo emocional",
    analysis.bigThree.moon,
    "Mostra o que você sente, como costuma reagir e o que ajuda você a se sentir seguro.",
  );
  drawPlacement(
    flow,
    "Ascendente | sua expressão",
    analysis.bigThree.ascendant,
    analysis.bigThree.ascendant
      ? "Mostra como você costuma começar algo novo e a primeira impressão que pode passar."
      : "Sem o horário exato, este ponto não pode ser calculado com segurança.",
  );

  if (analysis.zodiacPortrait) {
    sectionHeading(flow, "SEU RETRATO ASTRAL", analysis.zodiacPortrait.headline);
    paragraph(flow, analysis.zodiacPortrait.introduction);

    for (const layer of analysis.zodiacPortrait.essentials) {
      subsection(flow, `${layer.kicker} | ${layer.title}`, layer.text);
      paragraph(
        flow,
        `${layer.strengthLabel}: ${layer.strengths.join("; ")}. ${layer.watchoutLabel}: ${layer.watchouts.join("; ")}.`,
        { size: 9.8, spaceAfter: 12 },
      );
    }

    if (tier === "premium") {
      subsection(
        flow,
        "Além do seu signo",
        "O Premium também explica como você se relaciona, se comunica e parte para a ação.",
      );
      for (const layer of analysis.zodiacPortrait.premiumLayers) {
        subsection(flow, `${layer.kicker} | ${layer.title}`, layer.text);
        paragraph(
          flow,
          `${layer.strengthLabel}: ${layer.strengths.join("; ")}. ${layer.watchoutLabel}: ${layer.watchouts.join("; ")}.`,
          { size: 9.8, spaceAfter: 12 },
        );
      }
    }
  }

  sectionHeading(
    flow,
    "PADRÃO DOMINANTE",
    `${analysis.pattern.element} + ${analysis.pattern.mode}`,
  );
  paragraph(flow, analysis.pattern.text);
  subsection(flow, "Pontos de força");
  analysis.pattern.strengths.forEach((item) => bullet(flow, item));
  subsection(flow, "Pontos de atenção");
  analysis.pattern.watchouts.forEach((item) => bullet(flow, item));

  sectionHeading(flow, "NUMEROLOGIA", "Seu caminho e o ciclo atual");
  subsection(
    flow,
    `Número de destino ${analysis.numerology.lifePath}`,
    analysis.numerology.lifePathText,
  );
  subsection(
    flow,
    `Ano pessoal ${analysis.numerology.personalYear}`,
    analysis.numerology.personalYearText,
  );

  for (const reading of analysis.readings) {
    subsection(flow, reading.title, reading.text);
  }

  addContentPage(flow, `FOCO | ${analysis.themeDeepDive.label}`);
  drawTheme(flow, analysis.themeDeepDive, true);

  if (tier === "premium") {
    sectionHeading(flow, "LEITURA EXCLUSIVA", analysis.premium.headline);
    paragraph(flow, analysis.premium.introduction, {
      size: 10.8,
      spaceAfter: 16,
    });

    for (const [index, chapter] of analysis.premium.chapters.entries()) {
      // Keep a chapter's closing thought with its title and interpretation.
      // Without this reserve, the final callout can spill by itself onto a new page.
      ensureSpace(flow, 260);
      sectionHeading(
        flow,
        `${String(index + 1).padStart(2, "0")} | ${chapter.kicker}`,
        chapter.title,
      );
      paragraph(flow, chapter.summary, { size: 10.6 });
      chapter.insights.forEach((insight) => bullet(flow, insight));
      callout(flow, chapter.highlight);
    }

    addContentPage(flow, "SEU MAPA EM CINCO ÁREAS");
    for (const theme of analysis.allThemes.filter(
      (item) => item.id !== analysis.themeDeepDive.id,
    )) {
      drawTheme(flow, theme);
    }

    sectionHeading(flow, "CÉU DE AGORA", "O momento que acompanha sua leitura");
    paragraph(flow, analysis.currentSky.summary);
    subsection(
      flow,
      analysis.currentSky.moonPhase.label,
      analysis.currentSky.moonPhase.text,
    );
    analysis.currentSky.highlights.forEach((highlight) => {
      subsection(flow, highlight.title, highlight.text);
    });

    sectionHeading(flow, "PLANO SIMPLES", "Três passos para colocar em prática");
    analysis.premium.actionPlan.forEach((action) => {
      subsection(flow, `${action.step} | ${action.title}`, action.text);
    });

    sectionHeading(flow, "PARA CONTINUAR PENSANDO", "Perguntas para levar com você");
    analysis.premium.reflectionQuestions.forEach((question) =>
      bullet(flow, question),
    );

    drawNatalChartPage(flow, analysis);
    addContentPage(flow, "POSIÇÕES DO MAPA");
    sectionHeading(flow, "POSIÇÕES DO MAPA", "Planetas, signos e casas");
    paragraph(
      flow,
      "Para entender o desenho: o planeta mostra qual assunto estamos olhando; o signo mostra o jeito como ele aparece; e a casa mostra em que parte da vida pode aparecer. Os graus são coordenadas, como um endereço, não notas. “Retrógrado” é como o movimento parece visto da Terra; não quer dizer que algo esteja errado.",
      { size: 11, color: COLORS.muted, spaceAfter: 13 },
    );
    analysis.placements.forEach((placement) => {
      subsection(flow, `${placement.label}: ${placementLabel(placement)}`);
      const houseText = placement.house
        ? ` Na vida diária, isso pode aparecer em assuntos como ${HOUSE_TOPICS[placement.house] ?? "uma área importante da vida"}.`
        : " Sem horário preciso, não dá para calcular a casa com segurança.";
      paragraph(
        flow,
        `${placement.label} fala de ${planetTopic(placement)}.${houseText}`,
        { size: 9.3, color: COLORS.muted, spaceAfter: 9 },
      );
    });

    if (analysis.aspects.length) {
      addContentPage(flow, "ASPECTOS PRINCIPAIS");
      sectionHeading(flow, "ASPECTOS PRINCIPAIS", "Como suas energias conversam");
      paragraph(
        flow,
        "Aspecto é uma ligação entre dois pontos do mapa. Ela pode mostrar assuntos que combinam, se misturam ou pedem equilíbrio. O número ao lado mostra o quanto essa ligação está perto do ponto exato: quanto menor, mais perto.",
        { size: 11, color: COLORS.muted, spaceAfter: 12 },
      );
      analysis.aspects.forEach((aspect) => {
        subsection(
          flow,
          `${aspect.title} | distância ${aspect.orb.toFixed(1)}°`,
          aspect.text,
        );
        const simpleMeaning = ASPECT_PLAIN_MEANINGS[aspect.aspectKey ?? ""];
        if (simpleMeaning) {
          paragraph(flow, `Em palavras simples: ${simpleMeaning}.`, {
            size: 9.2,
            color: COLORS.purple,
            spaceAfter: 10,
          });
        }
      });
    }
  } else {
    sectionHeading(flow, "PRÓXIMA DESCOBERTA", "Seu mapa completo continua daqui");
    paragraph(
      flow,
      "O Premium aprofunda o tema escolhido, abre as outras quatro áreas e termina com um plano simples para aplicar a leitura.",
    );
  }

  const closingNote = [
    `Nota: astrologia e numerologia servem aqui para reflexão e entretenimento. Não são ciência, não dizem com certeza o que vai acontecer e não substituem ajuda profissional. O mapa segue métodos comuns para calcular signos e casas. Para encontrar o Ascendente e as casas, é importante saber a hora de nascimento. Céu atual calculado em ${analysis.currentSky.dateLabel}.`,
    ...(analysis.person.isMinor
      ? ["Para crianças, leia o mapa como possibilidades, sem criar rótulos ou decidir o futuro por elas."]
      : []),
  ].join(" ");
  paragraph(flow, closingNote, {
    size: 8.7,
    color: COLORS.muted,
    spaceAfter: 4,
  });

  return document.save({ useObjectStreams: false });
}
