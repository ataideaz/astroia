// PDF do AstroIA, com o mesmo visual do site: fundo azul-noite, detalhes em
// dourado e lilás, títulos em EB Garamond e texto em Manrope.
import fontkit from "@pdf-lib/fontkit";
import manropeBoldSource from "./fonts/Manrope-Bold.ttf?inline";
import manropeSource from "./fonts/Manrope-Regular.ttf?inline";
import garamondItalicSource from "./fonts/EBGaramond-MediumItalic.ttf?inline";
import garamondSource from "./fonts/EBGaramond-Medium.ttf?inline";
import garamondBoldSource from "./fonts/EBGaramond-SemiBold.ttf?inline";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import type { AnalysisResult, Placement, ThemeGuide } from "./astro-analysis";
import type { ExportTier } from "./report-export";
import type { CompatResult } from "./compatibility";
import type { PremiumReading } from "./premium-reading";

type Color = ReturnType<typeof rgb>;

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 46;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;
const TOP = A4[1] - 78;
const BOTTOM = 62;
const SITE = "meuastroia.com.br";

const hex = (value: string) =>
  rgb(
    parseInt(value.slice(1, 3), 16) / 255,
    parseInt(value.slice(3, 5), 16) / 255,
    parseInt(value.slice(5, 7), 16) / 255,
  );

const C = {
  bg: hex("#070916"),
  deep: hex("#0d1128"),
  panel: hex("#121530"),
  line: hex("#2c2a4d"),
  ink: hex("#f7f1e8"),
  body: hex("#ddd6ea"),
  muted: hex("#b6aec5"),
  gold: hex("#e4bc72"),
  goldLight: hex("#f0d69d"),
  violet: hex("#8068f2"),
  violetLight: hex("#b7a7ff"),
  chipViolet: hex("#24214a"),
  chipGold: hex("#2a2333"),
  goldSoft: hex("#1d1a2a"),
};

type Fonts = {
  body: PDFFont;
  bold: PDFFont;
  serif: PDFFont;
  serifBold: PDFFont;
  italic: PDFFont;
};

type Flow = {
  document: PDFDocument;
  fonts: Fonts;
  page: PDFPage;
  label: string;
  y: number;
};

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------
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
    .replace(/[^ -~ -ÿ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBirthDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function wrapText(value: unknown, font: PDFFont, size: number, width: number) {
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

function centerText(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: Color,
  centerX = A4[0] / 2,
) {
  const clean = pdfText(text);
  page.drawText(clean, {
    x: centerX - font.widthOfTextAtSize(clean, size) / 2,
    y,
    size,
    font,
    color,
  });
}

// ---------------------------------------------------------------------------
// Formas
// ---------------------------------------------------------------------------
function roundedRect(
  page: PDFPage,
  x: number,
  yTop: number,
  width: number,
  height: number,
  options: { fill?: Color; border?: Color; radius?: number; borderWidth?: number; opacity?: number },
) {
  const r = Math.min(options.radius ?? 14, height / 2, width / 2);
  const w = width;
  const h = height;
  const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  page.drawSvgPath(path, {
    x,
    y: yTop,
    color: options.fill,
    opacity: options.opacity,
    borderColor: options.border,
    borderWidth: options.border ? (options.borderWidth ?? 0.8) : 0,
  });
}

function paintBackground(page: PDFPage) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C.bg });
  page.drawCircle({ x: 40, y: height - 30, size: 240, color: C.violet, opacity: 0.07 });
  page.drawCircle({ x: width - 20, y: 60, size: 220, color: hex("#1f4f99"), opacity: 0.06 });
}

function drawStars(page: PDFPage, seed: number) {
  const { width, height } = page.getSize();
  let value = seed;
  const next = () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
  for (let index = 0; index < 46; index += 1) {
    page.drawCircle({
      x: next() * width,
      y: next() * height,
      size: 0.4 + next() * 1.1,
      color: next() > 0.7 ? C.goldLight : C.ink,
      opacity: 0.25 + next() * 0.45,
    });
  }
}

function drawChrome(document: PDFDocument, page: PDFPage, fonts: Fonts, label: string) {
  const { width, height } = page.getSize();
  paintBackground(page);
  page.drawCircle({ x: MARGIN + 6, y: height - 36, size: 6, color: C.goldLight });
  page.drawText("AstroIA", { x: MARGIN + 18, y: height - 40, size: 11, font: fonts.serifBold, color: C.ink });
  const cleanLabel = pdfText(label).toUpperCase();
  page.drawText(cleanLabel, {
    x: width - MARGIN - fonts.bold.widthOfTextAtSize(cleanLabel, 7),
    y: height - 39,
    size: 7,
    font: fonts.bold,
    color: C.gold,
  });
  page.drawLine({ start: { x: MARGIN, y: height - 54 }, end: { x: width - MARGIN, y: height - 54 }, color: C.line, thickness: 0.6 });
  page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: width - MARGIN, y: 42 }, color: C.line, thickness: 0.6 });
  page.drawText(String(document.getPageCount()).padStart(2, "0"), { x: MARGIN, y: 27, size: 7.5, font: fonts.bold, color: C.muted });
  page.drawText(SITE, {
    x: width - MARGIN - fonts.body.widthOfTextAtSize(SITE, 7.5),
    y: 27,
    size: 7.5,
    font: fonts.body,
    color: C.muted,
  });
}

function newPage(flow: Flow, label = flow.label) {
  const page = flow.document.addPage(A4);
  drawChrome(flow.document, page, flow.fonts, label);
  flow.page = page;
  flow.label = label;
  flow.y = TOP;
}

function ensureSpace(flow: Flow, height: number) {
  if (flow.y - height < BOTTOM) newPage(flow);
}

// ---------------------------------------------------------------------------
// Blocos (medidos antes de desenhar, para caberem em cartões)
// ---------------------------------------------------------------------------
type Block =
  | { type: "kicker"; text: string; color?: Color }
  | { type: "title"; text: string; size?: number; color?: Color }
  | { type: "text"; text: string; size?: number; color?: Color; bold?: boolean }
  | { type: "quote"; text: string; size?: number }
  | { type: "chips"; label: string; items: string[]; tone: "violet" | "gold" }
  | { type: "list"; items: string[]; color?: Color }
  | { type: "big"; text: string; caption: string }
  | { type: "gap"; size: number };

type Layout = { height: number; draw: (page: PDFPage, x: number, yTop: number) => void };

function layoutBlock(block: Block, fonts: Fonts, width: number): Layout {
  switch (block.type) {
    case "gap":
      return { height: block.size, draw: () => undefined };
    case "kicker": {
      const size = 8.2;
      const lines = wrapText(block.text.toUpperCase(), fonts.bold, size, width);
      const lineHeight = 11;
      return {
        height: lines.length * lineHeight + 6,
        draw: (page, x, yTop) => {
          lines.forEach((line, index) => {
            page.drawText(line, { x, y: yTop - size - index * lineHeight, size, font: fonts.bold, color: block.color ?? C.gold });
          });
        },
      };
    }
    case "title": {
      const size = block.size ?? 19;
      const lineHeight = size * 1.12;
      const lines = wrapText(block.text, fonts.serifBold, size, width);
      return {
        height: lines.length * lineHeight + 6,
        draw: (page, x, yTop) => {
          lines.forEach((line, index) => {
            page.drawText(line, { x, y: yTop - size * 0.86 - index * lineHeight, size, font: fonts.serifBold, color: block.color ?? C.ink });
          });
        },
      };
    }
    case "text": {
      const size = block.size ?? 12;
      const font = block.bold ? fonts.bold : fonts.body;
      const lineHeight = size * 1.55;
      const lines = wrapText(block.text, font, size, width);
      return {
        height: lines.length * lineHeight + 4,
        draw: (page, x, yTop) => {
          lines.forEach((line, index) => {
            page.drawText(line, { x, y: yTop - size - index * lineHeight, size, font, color: block.color ?? C.body });
          });
        },
      };
    }
    case "quote": {
      const size = block.size ?? 16.5;
      const lineHeight = size * 1.35;
      const lines = wrapText(block.text, fonts.italic, size, width);
      return {
        height: lines.length * lineHeight + 6,
        draw: (page, x, yTop) => {
          lines.forEach((line, index) => {
            page.drawText(line, { x, y: yTop - size * 0.9 - index * lineHeight, size, font: fonts.italic, color: C.ink });
          });
        },
      };
    }
    case "list": {
      const size = 11.4;
      const lineHeight = 17;
      const rows = block.items.map((item) => wrapText(item, fonts.body, size, width - 14));
      const total = rows.reduce((sum, lines) => sum + lines.length * lineHeight + 3, 0);
      return {
        height: total + 2,
        draw: (page, x, yTop) => {
          let y = yTop;
          rows.forEach((lines) => {
            page.drawCircle({ x: x + 3, y: y - size * 0.62, size: 2, color: C.gold });
            lines.forEach((line, index) => {
              page.drawText(line, { x: x + 12, y: y - size - index * lineHeight, size, font: fonts.body, color: block.color ?? C.body });
            });
            y -= lines.length * lineHeight + 3;
          });
        },
      };
    }
    case "big": {
      const size = 34;
      const captionLines = wrapText(block.caption, fonts.bold, 7.4, width);
      return {
        height: size + 6 + captionLines.length * 10,
        draw: (page, x, yTop) => {
          page.drawText(pdfText(block.text), { x, y: yTop - size * 0.82, size, font: fonts.serifBold, color: C.goldLight });
          captionLines.forEach((line, index) => {
            page.drawText(line.toUpperCase(), { x, y: yTop - size - 4 - index * 10, size: 7.4, font: fonts.bold, color: C.gold });
          });
        },
      };
    }
    case "chips": {
      const size = 10.4;
      const chipHeight = 22;
      const gap = 6;
      const padding = 9;
      const rows: Array<Array<{ text: string; width: number }>> = [[]];
      let rowWidth = 0;
      for (const raw of block.items) {
        const text = pdfText(raw);
        const chipWidth = Math.min(width, fonts.body.widthOfTextAtSize(text, size) + padding * 2);
        if (rowWidth && rowWidth + gap + chipWidth > width) {
          rows.push([]);
          rowWidth = 0;
        }
        rows[rows.length - 1].push({ text, width: chipWidth });
        rowWidth += (rowWidth ? gap : 0) + chipWidth;
      }
      const labelHeight = 17;
      return {
        height: labelHeight + rows.length * (chipHeight + gap) + 2,
        draw: (page, x, yTop) => {
          page.drawText(pdfText(block.label), { x, y: yTop - 10, size: 9.6, font: fonts.bold, color: C.ink });
          rows.forEach((row, rowIndex) => {
            let chipX = x;
            const chipTop = yTop - labelHeight - rowIndex * (chipHeight + gap);
            row.forEach((chip) => {
              roundedRect(page, chipX, chipTop, chip.width, chipHeight, {
                fill: block.tone === "violet" ? C.chipViolet : C.chipGold,
                radius: chipHeight / 2,
              });
              page.drawText(chip.text, {
                x: chipX + padding,
                y: chipTop - chipHeight / 2 - size * 0.35,
                size,
                font: fonts.body,
                color: block.tone === "violet" ? hex("#ece6ff") : hex("#f3e3c3"),
              });
              chipX += chip.width + gap;
            });
          });
        },
      };
    }
  }
}

function measure(blocks: Block[], fonts: Fonts, width: number) {
  const layouts = blocks.map((block) => layoutBlock(block, fonts, width));
  return { layouts, height: layouts.reduce((sum, layout) => sum + layout.height, 0) };
}

type CardStyle = { fill?: Color; border?: Color; padding?: number };

function cardHeight(blocks: Block[], fonts: Fonts, width: number, style: CardStyle = {}) {
  const padding = style.padding ?? 18;
  return measure(blocks, fonts, width - padding * 2).height + padding * 2;
}

function drawCardAt(
  page: PDFPage,
  fonts: Fonts,
  blocks: Block[],
  x: number,
  yTop: number,
  width: number,
  style: CardStyle = {},
  forcedHeight?: number,
) {
  const padding = style.padding ?? 18;
  const { layouts, height } = measure(blocks, fonts, width - padding * 2);
  const total = forcedHeight ?? height + padding * 2;
  roundedRect(page, x, yTop, width, total, { fill: style.fill ?? C.panel, border: style.border ?? C.line, radius: 16 });
  let y = yTop - padding;
  for (const layout of layouts) {
    layout.draw(page, x + padding, y);
    y -= layout.height;
  }
  return total;
}

/** Desenha um cartão no fluxo; se não couber na página, vai para a próxima. */
function card(flow: Flow, blocks: Block[], style: CardStyle = {}, spaceAfter = 14) {
  const height = cardHeight(blocks, flow.fonts, CONTENT_WIDTH, style);
  if (height > TOP - BOTTOM) {
    // Cartão maior que uma página: desenha os blocos soltos.
    loose(flow, blocks);
    return;
  }
  ensureSpace(flow, height + spaceAfter);
  drawCardAt(flow.page, flow.fonts, blocks, MARGIN, flow.y, CONTENT_WIDTH, style);
  flow.y -= height + spaceAfter;
}

/** Dois cartões lado a lado, com a mesma altura. */
function cardRow(flow: Flow, left: Block[], right: Block[], styles: [CardStyle, CardStyle] = [{}, {}]) {
  const gap = 12;
  const width = (CONTENT_WIDTH - gap) / 2;
  const height = Math.max(
    cardHeight(left, flow.fonts, width, styles[0]),
    cardHeight(right, flow.fonts, width, styles[1]),
  );
  ensureSpace(flow, height + 14);
  drawCardAt(flow.page, flow.fonts, left, MARGIN, flow.y, width, styles[0], height);
  drawCardAt(flow.page, flow.fonts, right, MARGIN + width + gap, flow.y, width, styles[1], height);
  flow.y -= height + 14;
}

/** Blocos soltos no fluxo (sem cartão), com quebra de página por linha. */
function loose(flow: Flow, blocks: Block[]) {
  for (const block of blocks) {
    if (block.type === "text" || block.type === "list") {
      // Quebra linha a linha para textos longos.
      const items = block.type === "text" ? [block.text] : block.items;
      for (const item of items) {
        const size = block.type === "text" ? (block.size ?? 12) : 11.4;
        const font = block.type === "text" && block.bold ? flow.fonts.bold : flow.fonts.body;
        const lineHeight = size * 1.55;
        const lines = wrapText(item, font, size, CONTENT_WIDTH - (block.type === "list" ? 14 : 0));
        lines.forEach((line, index) => {
          ensureSpace(flow, lineHeight);
          if (block.type === "list" && index === 0) {
            flow.page.drawCircle({ x: MARGIN + 3, y: flow.y - size * 0.62, size: 2, color: C.gold });
          }
          flow.page.drawText(line, {
            x: MARGIN + (block.type === "list" ? 12 : 0),
            y: flow.y - size,
            size,
            font,
            color: (block.type === "text" ? block.color : block.color) ?? C.body,
          });
          flow.y -= lineHeight;
        });
        flow.y -= block.type === "list" ? 3 : 6;
      }
      continue;
    }
    const layout = layoutBlock(block, flow.fonts, CONTENT_WIDTH);
    ensureSpace(flow, layout.height);
    layout.draw(flow.page, MARGIN, flow.y);
    flow.y -= layout.height;
  }
}

function sectionHeading(flow: Flow, kicker: string, title: string, intro?: string) {
  const blocks: Block[] = [
    { type: "kicker", text: kicker },
    { type: "title", text: title, size: 26 },
  ];
  if (intro) blocks.push({ type: "text", text: intro, color: C.muted, size: 11.6 });
  const { layouts, height } = measure(blocks, flow.fonts, CONTENT_WIDTH);
  ensureSpace(flow, height + 150);
  for (const layout of layouts) {
    layout.draw(flow.page, MARGIN, flow.y);
    flow.y -= layout.height;
  }
  flow.y -= 8;
}

// ---------------------------------------------------------------------------
// Roda do mapa
// ---------------------------------------------------------------------------
const PLANET_SHORT: Record<string, string> = {
  sun: "SOL", moon: "LUA", mercury: "MER", venus: "VEN", mars: "MAR",
  jupiter: "JUP", saturn: "SAT", uranus: "URA", neptune: "NET", pluto: "PLU",
};

const PLANET_SIMPLE: Record<string, string> = {
  sun: "quem você é por dentro",
  moon: "o que você sente",
  mercury: "como você pensa e conversa",
  venus: "como você ama",
  mars: "como você age e luta pelo que quer",
  jupiter: "onde a sorte e o crescimento aparecem",
  saturn: "onde você aprende com esforço",
  uranus: "onde você quer mudar e inovar",
  neptune: "onde você sonha e se inspira",
  pluto: "onde você se transforma",
};

function drawChart(flow: Flow, analysis: AnalysisResult, size = 380) {
  const panelHeight = size + 30;
  ensureSpace(flow, panelHeight + 14);
  const page = flow.page;
  const fonts = flow.fonts;
  roundedRect(page, MARGIN, flow.y, CONTENT_WIDTH, panelHeight, { fill: C.deep, border: C.line, radius: 18 });
  const center = { x: A4[0] / 2, y: flow.y - panelHeight / 2 };
  const scale = size / 420;
  const R = (value: number) => value * scale;
  // Ascendente à esquerda e signos no sentido anti-horário, como num mapa astral comum.
  const ascendantLongitude = analysis.bigThree.ascendant?.longitude ?? 0;
  const point = (longitude: number, radius: number) => {
    const angle = Math.PI + ((longitude - ascendantLongitude) * Math.PI) / 180;
    return { x: center.x + R(radius) * Math.cos(angle), y: center.y + R(radius) * Math.sin(angle) };
  };
  const ring = (radius: number, color: Color, thickness = 0.8) =>
    page.drawCircle({ x: center.x, y: center.y, size: R(radius), borderColor: color, borderWidth: thickness });

  page.drawCircle({ x: center.x, y: center.y, size: R(205), color: C.violet, opacity: 0.08 });
  ring(205, C.line);
  ring(166, C.line);
  ring(121, C.line);

  const signs = ["ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "ESC", "SAG", "CAP", "AQU", "PEI"];
  signs.forEach((sign, index) => {
    const outer = point(index * 30, 166);
    const inner = point(index * 30, 121);
    page.drawLine({ start: outer, end: inner, color: C.line, thickness: 0.6 });
    const outerEdge = point(index * 30, 205);
    page.drawLine({ start: outerEdge, end: outer, color: C.line, thickness: 0.6 });
    const text = point(index * 30 + 15, 185);
    page.drawText(sign, {
      x: text.x - fonts.bold.widthOfTextAtSize(sign, 7.2) / 2,
      y: text.y - 2.6,
      size: 7.2,
      font: fonts.bold,
      color: C.goldLight,
    });
  });

  const cusps = (analysis.houseCusps ?? []).slice().sort((a, b) => a.house - b.house);
  if (analysis.person.exactTime && cusps.length === 12) {
    cusps.forEach((cusp, index) => {
      const accent = cusp.house === 1 || cusp.house === 10;
      page.drawLine({
        start: point(cusp.longitude, 121),
        end: point(cusp.longitude, 58),
        color: accent ? C.gold : C.line,
        thickness: accent ? 1.3 : 0.6,
      });
      const nextLongitude = cusps[(index + 1) % 12]?.longitude ?? cusp.longitude + 30;
      const midpoint = (cusp.longitude + ((nextLongitude - cusp.longitude + 360) % 360) / 2) % 360;
      const number = point(midpoint, 88);
      const text = String(cusp.house);
      page.drawText(text, {
        x: number.x - fonts.body.widthOfTextAtSize(text, 7.5) / 2,
        y: number.y - 2.6,
        size: 7.5,
        font: fonts.body,
        color: C.muted,
      });
    });
  }

  const positions = new Map(analysis.placements.map((item) => [item.key, point(item.longitude, 116)]));
  const aspectColors: Record<string, Color> = {
    conjunction: C.gold,
    opposition: hex("#d75c6e"),
    trine: hex("#3aa37c"),
    square: hex("#c0589a"),
    sextile: C.violetLight,
  };
  analysis.aspects.forEach((aspect) => {
    const first = aspect.point1Key ? positions.get(aspect.point1Key) : undefined;
    const second = aspect.point2Key ? positions.get(aspect.point2Key) : undefined;
    if (!first || !second) return;
    page.drawLine({ start: first, end: second, color: aspectColors[aspect.aspectKey ?? ""] ?? C.violetLight, thickness: 0.8, opacity: 0.7 });
  });

  // Afasta os nomes de planetas muito próximos para não se sobreporem.
  const sorted = [...analysis.placements].sort((a, b) => a.longitude - b.longitude);
  const minGap = 9;
  const shown = sorted.map((placement) => placement.longitude);
  for (let pass = 0; pass < 4; pass += 1) {
    for (let index = 1; index < shown.length; index += 1) {
      if (shown[index] - shown[index - 1] < minGap) shown[index] = shown[index - 1] + minGap;
    }
  }
  sorted.forEach((placement, index) => {
    const dot = point(placement.longitude, 121);
    page.drawCircle({ x: dot.x, y: dot.y, size: 2.2, color: C.gold });
    const label = PLANET_SHORT[placement.key] ?? placement.key.slice(0, 3).toUpperCase();
    const position = point(shown[index], 145);
    const stemEnd = point(shown[index], 134);
    page.drawLine({ start: point(placement.longitude, 123), end: stemEnd, color: C.line, thickness: 0.5 });
    page.drawText(label, {
      x: position.x - fonts.bold.widthOfTextAtSize(label, 7) / 2,
      y: position.y - 2.5,
      size: 7,
      font: fonts.bold,
      color: C.ink,
    });
  });

  page.drawCircle({ x: center.x, y: center.y, size: R(52), color: C.panel, borderColor: C.line, borderWidth: 0.8 });
  centerText(page, "ASTROIA", fonts.bold, 6.5, center.y + 6, C.gold, center.x);
  centerText(page, analysis.person.firstName, fonts.serifBold, 12, center.y - 9, C.ink, center.x);

  flow.y -= panelHeight + 14;
}

function planetList(flow: Flow, analysis: AnalysisResult) {
  const items: Array<{ title: string; text: string }> = [];
  if (analysis.bigThree.ascendant) {
    items.push({ title: `Ascendente em ${analysis.bigThree.ascendant.sign}`, text: "como os outros veem você" });
  }
  for (const placement of analysis.placements) {
    items.push({ title: `${placement.label} em ${placement.sign}`, text: PLANET_SIMPLE[placement.key] ?? "" });
  }
  const gap = 10;
  const width = (CONTENT_WIDTH - gap) / 2;
  const rowHeight = 38;
  for (let index = 0; index < items.length; index += 2) {
    ensureSpace(flow, rowHeight + 6);
    [items[index], items[index + 1]].forEach((item, column) => {
      if (!item) return;
      const x = MARGIN + column * (width + gap);
      roundedRect(flow.page, x, flow.y, width, rowHeight, { fill: C.deep, border: C.line, radius: 12 });
      flow.page.drawText(pdfText(item.title), { x: x + 12, y: flow.y - 16, size: 11, font: flow.fonts.bold, color: C.goldLight });
      flow.page.drawText(pdfText(item.text), { x: x + 12, y: flow.y - 30, size: 9.4, font: flow.fonts.body, color: C.muted });
    });
    flow.y -= rowHeight + 5;
  }
  flow.y -= 8;
}

// ---------------------------------------------------------------------------
// Capa
// ---------------------------------------------------------------------------
function cover(document: PDFDocument, fonts: Fonts, analysis: AnalysisResult, tier: ExportTier) {
  const page = document.addPage(A4);
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: 0, width, height, color: C.bg });
  page.drawCircle({ x: width / 2, y: height - 120, size: 330, color: C.violet, opacity: 0.12 });
  page.drawCircle({ x: width - 40, y: 70, size: 200, color: hex("#1f4f99"), opacity: 0.1 });
  drawStars(page, analysis.person.firstName.length * 97 + 13);

  page.drawCircle({ x: width / 2 - 34, y: height - 60, size: 7, color: C.goldLight });
  page.drawText("AstroIA", { x: width / 2 - 22, y: height - 65, size: 15, font: fonts.serifBold, color: C.ink });

  const reading = analysis.freeReading;
  centerText(page, tier === "premium" ? "SEU MAPA ASTRAL COMPLETO" : "SEU MAPA ASTRAL", fonts.bold, 8, height - 132, C.gold);

  let y = height - 182;
  for (const line of wrapText(analysis.person.firstName, fonts.serifBold, 50, CONTENT_WIDTH).slice(0, 2)) {
    centerText(page, line, fonts.serifBold, 50, y, C.ink);
    y -= 54;
  }
  const meta = `${formatBirthDate(analysis.person.birthDate)}  ·  ${analysis.person.birthTime || "horário não informado"}  ·  ${analysis.person.location}`;
  for (const line of wrapText(meta, fonts.body, 10.4, CONTENT_WIDTH)) {
    centerText(page, line, fonts.body, 10.4, y + 18, C.muted);
    y -= 13;
  }
  y -= 26;

  if (reading) {
    const panel: Block[] = [
      { type: "kicker", text: "Seu arquétipo" },
      { type: "title", text: reading.archetype.name, size: 34, color: C.goldLight },
      { type: "gap", size: 4 },
      { type: "text", text: reading.archetype.text, size: 12.6, color: C.body },
      { type: "gap", size: 4 },
      { type: "text", text: reading.archetype.combinations, size: 10, color: C.muted },
    ];
    const panelHeight = drawCardAt(page, fonts, panel, MARGIN + 20, y, CONTENT_WIDTH - 40, {
      fill: C.panel,
      border: C.gold,
      padding: 24,
    });
    y -= panelHeight + 22;

    const badges = reading.layers;
    const gap = 10;
    const badgeWidth = (CONTENT_WIDTH - 40 - gap * (badges.length - 1)) / badges.length;
    badges.forEach((layer, index) => {
      const x = MARGIN + 20 + index * (badgeWidth + gap);
      roundedRect(page, x, y, badgeWidth, 64, { fill: C.deep, border: C.line, radius: 14 });
      centerText(page, layer.role.replace(/^(Seu|Sua) /, "").toUpperCase(), fonts.bold, 7.2, y - 20, C.gold, x + badgeWidth / 2);
      centerText(page, layer.sign, fonts.serifBold, 18, y - 42, C.ink, x + badgeWidth / 2);
      centerText(page, layer.question.toLowerCase(), fonts.body, 7.4, y - 55, C.muted, x + badgeWidth / 2);
    });
  } else {
    drawCardAt(page, fonts, [
      { type: "kicker", text: "Um primeiro olhar" },
      { type: "text", text: analysis.summary, size: 12, color: C.ink },
    ], MARGIN + 20, y, CONTENT_WIDTH - 40, { padding: 24 });
  }

  const notes = [
    "Astrologia e numerologia para reflexão e entretenimento. Não substituem ajuda profissional.",
    analysis.person.isMinor
      ? "Leitura adaptada para criança ou adolescente: possibilidades, nunca rótulos."
      : `Zodíaco tropical e casas Placidus · céu atual calculado em ${analysis.currentSky.dateLabel}.`,
  ];
  centerText(page, notes[0], fonts.body, 8.2, 64, C.muted);
  centerText(page, notes[1], fonts.body, 8.2, 52, C.muted);
  centerText(page, SITE, fonts.bold, 9, 32, C.goldLight);
}

// ---------------------------------------------------------------------------
// Seções
// ---------------------------------------------------------------------------
function chartSection(flow: Flow, analysis: AnalysisResult) {
  if (!analysis.placements.length) return;
  newPage(flow, "Seu céu de nascimento");
  sectionHeading(
    flow,
    "Seu céu de nascimento",
    "Assim estava o céu quando você nasceu",
    "No dia e na hora em que você nasceu, cada planeta estava passando por um signo do céu. Cada planeta cuida de uma parte da sua vida, e o signo mostra o jeito como essa parte funciona em você.",
  );
  drawChart(flow, analysis, 262);
  planetList(flow, analysis);
}

function freeReadingSections(flow: Flow, analysis: AnalysisResult) {
  const reading = analysis.freeReading;
  if (!reading) return;

  newPage(flow, reading.mirror.title);
  sectionHeading(flow, "As partes mais importantes do seu mapa", reading.mirror.title);
  for (const layer of reading.layers) {
    card(flow, [
      { type: "kicker", text: `${layer.role} em ${layer.sign}  ·  ${layer.question}` },
      { type: "title", text: layer.headline, size: 20 },
      { type: "text", text: layer.text },
      { type: "gap", size: 6 },
      { type: "chips", label: "No seu melhor", items: layer.gifts, tone: "violet" },
      { type: "chips", label: "Quando pesa", items: layer.shadows, tone: "gold" },
    ]);
  }
  if (reading.noTimeNote) loose(flow, [{ type: "text", text: reading.noTimeNote, color: C.muted, size: 9.4 }]);

  sectionHeading(flow, "Juntando tudo", "Como as suas partes conversam");
  const mirror: Block[] = [
    { type: "quote", text: reading.mirror.text },
    { type: "gap", size: 6 },
    { type: "text", text: reading.mirror.harmony },
  ];
  card(flow, mirror);
  if (reading.mirror.sameSign) {
    card(flow, [{ type: "text", text: reading.mirror.sameSign, color: hex("#f3e3c3") }], { fill: C.goldSoft, border: C.gold });
  }

  cardRow(
    flow,
    [
      { type: "kicker", text: "Seu superpoder", color: C.violetLight },
      { type: "text", text: reading.superpower, size: 11.6 },
    ],
    [
      { type: "kicker", text: "Seu ponto de atenção" },
      { type: "text", text: reading.attention, size: 11.6 },
    ],
    [{ border: C.violet }, { border: C.gold }],
  );
}

function legacyPortrait(flow: Flow, analysis: AnalysisResult) {
  if (!analysis.zodiacPortrait) return;
  newPage(flow, "Seu retrato astral");
  sectionHeading(flow, "Seu retrato astral", analysis.zodiacPortrait.headline, analysis.zodiacPortrait.introduction);
  for (const layer of analysis.zodiacPortrait.essentials) {
    card(flow, [
      { type: "kicker", text: layer.kicker },
      { type: "title", text: layer.title, size: 18 },
      { type: "text", text: layer.text },
      { type: "chips", label: layer.strengthLabel, items: layer.strengths, tone: "violet" },
      { type: "chips", label: layer.watchoutLabel, items: layer.watchouts, tone: "gold" },
    ]);
  }
}

function patternAndNumbers(flow: Flow, analysis: AnalysisResult) {
  sectionHeading(flow, "Seu padrão dominante", `${analysis.pattern.element} + ${analysis.pattern.mode}`);
  const patternBlocks: Block[] = [{ type: "text", text: analysis.pattern.text }];
  if (analysis.pattern.strengths.length) patternBlocks.push({ type: "chips", label: "Pontos de força", items: analysis.pattern.strengths, tone: "violet" });
  if (analysis.pattern.watchouts.length) patternBlocks.push({ type: "chips", label: "Pontos de atenção", items: analysis.pattern.watchouts, tone: "gold" });
  card(flow, patternBlocks);

  sectionHeading(flow, "Numerologia", "Seu caminho e o ciclo atual");
  cardRow(
    flow,
    [
      { type: "big", text: String(analysis.numerology.lifePath), caption: "Número de destino" },
      { type: "text", text: analysis.numerology.lifePathText, size: 11.2 },
    ],
    [
      { type: "big", text: String(analysis.numerology.personalYear), caption: "Ano pessoal" },
      { type: "text", text: analysis.numerology.personalYearText, size: 11.2 },
    ],
  );
}

function teaserSection(flow: Flow, analysis: AnalysisResult) {
  const reading = analysis.freeReading;
  if (!reading) return;
  newPage(flow, "O que o seu mapa ainda guarda");
  sectionHeading(
    flow,
    "O que o seu mapa ainda guarda",
    `${analysis.person.firstName}, isso foi só o começo`,
    "Olha o começo do que o seu mapa diz sobre as outras áreas da sua vida.",
  );
  for (const teaser of reading.teasers) {
    card(flow, [
      { type: "kicker", text: teaser.label },
      { type: "title", text: teaser.title, size: 19 },
      { type: "text", text: teaser.opening },
      { type: "text", text: `${teaser.cliff}...`, color: C.muted },
      { type: "gap", size: 4 },
      { type: "list", items: teaser.locked.map((item) => `${item} (no mapa completo)`), color: C.muted },
    ]);
  }
  card(
    flow,
    [
      { type: "title", text: "Quer ler o resto?", size: 20, color: C.goldLight },
      {
        type: "text",
        text: `Volte ao seu mapa no site e toque em "Desbloquear meu mapa completo". Pagamento único, sem assinatura. Você recebe na hora as quatro áreas completas, a sua missão, o seu dom, os próximos 12 meses e o PDF completo.`,
      },
      { type: "text", text: SITE, bold: true, color: C.goldLight },
    ],
    { fill: C.goldSoft, border: C.gold, padding: 22 },
  );
}

function drawTheme(flow: Flow, theme: ThemeGuide, main = false) {
  sectionHeading(flow, main ? `Seu foco · ${theme.label}` : theme.label, theme.headline, theme.introduction);
  for (const section of theme.sections) {
    card(flow, [
      { type: "title", text: section.title, size: 15 },
      { type: "text", text: section.text },
    ]);
  }
  card(flow, [{ type: "quote", text: theme.actionPrompt, size: 13 }], { fill: C.goldSoft, border: C.gold });
}

function placementLabel(placement: Placement) {
  return `${placement.sign} · ${placement.degree}${placement.house ? ` · casa ${placement.house}` : ""}${
    placement.retrograde ? " · retrógrado" : ""
  }`;
}

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

function premiumSections(flow: Flow, analysis: AnalysisResult) {
  newPage(flow, `Foco · ${analysis.themeDeepDive.label}`);
  drawTheme(flow, analysis.themeDeepDive, true);

  if (analysis.premium.chapters.length) {
    newPage(flow, "Leitura exclusiva");
    sectionHeading(flow, "Leitura exclusiva", analysis.premium.headline, analysis.premium.introduction);
    analysis.premium.chapters.forEach((chapter, index) => {
      card(flow, [
        { type: "kicker", text: `${String(index + 1).padStart(2, "0")} · ${chapter.kicker}` },
        { type: "title", text: chapter.title, size: 18 },
        { type: "text", text: chapter.summary },
        { type: "list", items: chapter.insights },
        { type: "gap", size: 4 },
        { type: "quote", text: chapter.highlight, size: 12.5 },
      ]);
    });
  }

  const others = analysis.allThemes.filter((item) => item.id !== analysis.themeDeepDive.id);
  if (others.length) {
    newPage(flow, "Seu mapa em cinco áreas");
    for (const theme of others) drawTheme(flow, theme);
  }

  if (analysis.currentSky.summary || analysis.currentSky.highlights.length) {
    sectionHeading(flow, "Céu de agora", "O momento que acompanha sua leitura", analysis.currentSky.summary);
    if (analysis.currentSky.moonPhase.label) {
      card(flow, [
        { type: "title", text: analysis.currentSky.moonPhase.label, size: 15 },
        { type: "text", text: analysis.currentSky.moonPhase.text },
      ]);
    }
    for (const highlight of analysis.currentSky.highlights) {
      card(flow, [
        { type: "title", text: highlight.title, size: 15 },
        { type: "text", text: highlight.text },
      ]);
    }
  }

  if (analysis.premium.actionPlan.length) {
    sectionHeading(flow, "Plano simples", "Três passos para colocar em prática");
    for (const action of analysis.premium.actionPlan) {
      card(flow, [
        { type: "kicker", text: action.step },
        { type: "title", text: action.title, size: 15 },
        { type: "text", text: action.text },
      ]);
    }
  }

  if (analysis.premium.reflectionQuestions.length) {
    sectionHeading(flow, "Para continuar pensando", "Perguntas para levar com você");
    card(flow, [{ type: "list", items: analysis.premium.reflectionQuestions }]);
  }

  if (analysis.placements.length) {
    newPage(flow, "Posições do mapa");
    sectionHeading(
      flow,
      "Posições do mapa",
      "Planetas, signos e casas",
      "O planeta mostra o assunto; o signo mostra o jeito; e a casa mostra em que parte da vida isso aparece. Os graus são como um endereço no céu, não uma nota.",
    );
    for (const placement of analysis.placements) {
      const houseText = placement.house
        ? ` Na vida diária, aparece em assuntos como ${HOUSE_TOPICS[placement.house] ?? "uma área importante da vida"}.`
        : " Sem horário preciso, não dá para calcular a casa.";
      card(flow, [
        { type: "title", text: `${placement.label}: ${placementLabel(placement)}`, size: 13.5 },
        { type: "text", text: `${placement.label} fala de ${PLANET_SIMPLE[placement.key] ?? "um tema importante"}.${houseText}`, size: 9.8, color: C.muted },
      ], { padding: 14 }, 8);
    }
  }

  if (analysis.aspects.length) {
    newPage(flow, "Aspectos principais");
    sectionHeading(
      flow,
      "Aspectos principais",
      "Como suas energias conversam",
      "Aspecto é uma ligação entre dois pontos do mapa. O número mostra o quanto essa ligação está perto do ponto exato: quanto menor, mais forte.",
    );
    for (const aspect of analysis.aspects) {
      const blocks: Block[] = [
        { type: "title", text: `${aspect.title} · ${aspect.orb.toFixed(1)}°`, size: 14 },
        { type: "text", text: aspect.text },
      ];
      const simple = ASPECT_PLAIN_MEANINGS[aspect.aspectKey ?? ""];
      if (simple) blocks.push({ type: "text", text: `Em palavras simples: ${simple}.`, color: C.violetLight, size: 9.6 });
      card(flow, blocks);
    }
  }
}

function newPremiumSections(flow: Flow, analysis: AnalysisResult, reading: PremiumReading, compat: CompatResult | null) {
  newPage(flow, "Seu mapa completo");
  sectionHeading(flow, "Seu mapa completo", reading.letter.title, reading.letter.text);

  reading.chapters.forEach((chapter, index) => {
    flow.label = chapter.label;
    flow.y -= 10;
    sectionHeading(flow, `${String(index + 1).padStart(2, "0")} · ${chapter.label}`, chapter.title);
    loose(flow, [{ type: "text", text: chapter.intro, size: 12.6, color: C.ink }]);
    if (chapter.payoff) {
      card(
        flow,
        [
          { type: "text", text: chapter.payoff.lead, color: C.muted },
          { type: "text", text: chapter.payoff.rest, bold: true, color: C.goldLight },
        ],
        { fill: C.goldSoft, border: C.gold },
      );
    }
    for (const block of chapter.blocks) {
      const blocks: Block[] = [
        { type: "title", text: block.title, size: 16 },
        { type: "text", text: block.text },
      ];
      if (block.example) blocks.push({ type: "text", text: block.example, color: C.violetLight, size: 11.4 });
      if (block.tip) blocks.push({ type: "text", text: `Experimente: ${block.tip}`, color: C.goldLight, size: 11.4 });
      card(flow, blocks);
    }
    loose(flow, [{ type: "text", text: `De onde vem: ${chapter.source}`, color: C.muted, size: 9.4 }]);

    if (chapter.id === "amor" && compat) compatSection(flow, compat);
    if (chapter.id === "agora" && reading.months.length) monthsSection(flow, reading);
  });

  card(flow, [{ type: "quote", text: reading.closing, size: 14 }], { fill: C.goldSoft, border: C.gold, padding: 22 });
}

function monthsSection(flow: Flow, reading: PremiumReading) {
  flow.label = "Seus próximos 12 meses";
  flow.y -= 10;
  sectionHeading(
    flow,
    "Seus próximos 12 meses",
    "O tema de cada mês",
    "Cada mês tem um número (pela numerologia) e, em alguns, os planetas dão uma ajudinha extra. Use como um calendário de intenções.",
  );
  for (let index = 0; index < reading.months.length; index += 2) {
    const monthBlocks = (month: PremiumReading["months"][number]): Block[] => {
      const blocks: Block[] = [
        { type: "kicker", text: `${month.label} · mês ${month.number}` },
        { type: "text", text: month.theme, bold: true, color: C.ink, size: 11.4 },
      ];
      if (month.tip) blocks.push({ type: "text", text: month.tip, color: C.muted, size: 10 });
      if (month.tags.length) blocks.push({ type: "text", text: month.tags.map((tag) => tag.label).join(" · "), color: C.goldLight, size: 10 });
      return blocks;
    };
    const left = reading.months[index];
    const right = reading.months[index + 1];
    if (right) cardRow(flow, monthBlocks(left), monthBlocks(right));
    else card(flow, monthBlocks(left));
  }
}

function compatSection(flow: Flow, compat: CompatResult) {
  flow.label = "Compatibilidade";
  flow.y -= 10;
  sectionHeading(flow, "Compatibilidade do casal", `${compat.names[0]} + ${compat.names[1]}: ${compat.score}% de sintonia`, compat.summary);
  card(
    flow,
    [
      { type: "big", text: `${compat.score}%`, caption: "de sintonia" },
      { type: "title", text: compat.headline, size: 18 },
      {
        type: "list",
        items: compat.signs.map((person) => `${person.name}: Sol em ${person.sun}, Lua em ${person.moon}${person.ascendant ? `, Ascendente em ${person.ascendant}` : ""}`),
      },
    ],
    { fill: C.goldSoft, border: C.gold, padding: 22 },
  );
  for (const area of compat.areas) {
    card(flow, [
      { type: "kicker", text: `${area.label} · ${area.score}%` },
      { type: "title", text: area.title, size: 16 },
      { type: "text", text: area.text },
      { type: "text", text: `Dica para vocês: ${area.tip}`, color: C.goldLight, size: 11.4 },
    ]);
  }
  const extras: Array<[string, string[]]> = [
    ["Como cada um se sente amado", (compat.love ?? []).map((item) => item.text)],
    ["Como fazer as pazes", (compat.makeUp ?? []).map((item) => item.text)],
    ["O que um ensina ao outro", compat.gifts ?? []],
    ["O encontro perfeito", compat.date ? [compat.date.replace(/^O encontro perfeito para vocês: /, "")] : []],
    ["O ano de vocês", compat.coupleYear ? [`Ano ${compat.coupleYear.number}: ${compat.coupleYear.text}`] : []],
  ];
  for (const [title, lines] of extras) {
    if (!lines.length) continue;
    card(flow, [{ type: "title", text: title, size: 15 }, ...lines.map((text) => ({ type: "text" as const, text }))]);
  }
  loose(flow, [{ type: "text", text: compat.note, color: C.muted, size: 9.4 }]);
}

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------
export async function createReportPdf(analysis: AnalysisResult, tier: ExportTier, compat: CompatResult | null = null) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  const fonts: Fonts = {
    body: await document.embedFont(fontBytes(manropeSource), { subset: true }),
    bold: await document.embedFont(fontBytes(manropeBoldSource), { subset: true }),
    serif: await document.embedFont(fontBytes(garamondSource), { subset: true }),
    serifBold: await document.embedFont(fontBytes(garamondBoldSource), { subset: true }),
    italic: await document.embedFont(fontBytes(garamondItalicSource), { subset: true }),
  };

  document.setTitle(`AstroIA - ${tier === "premium" ? "Mapa completo" : "Mapa essencial"} - ${analysis.person.firstName}`);
  document.setAuthor("AstroIA");
  document.setSubject(tier === "premium" ? "Mapa completo" : "Mapa essencial");
  document.setCreator("AstroIA");
  document.setProducer("AstroIA");

  cover(document, fonts, analysis, tier);

  // Começa "sem espaço" na capa: o primeiro conteúdo sempre abre uma página nova.
  const flow: Flow = { document, fonts, page: document.getPage(0), label: "Seu mapa", y: BOTTOM };

  chartSection(flow, analysis);
  if (analysis.freeReading) {
    freeReadingSections(flow, analysis);
  } else {
    legacyPortrait(flow, analysis);
  }
  const newPremium = tier === "premium" && analysis.freeReading && analysis.premiumReading ? analysis.premiumReading : null;
  if (!newPremium) patternAndNumbers(flow, analysis);

  if (newPremium) {
    newPremiumSections(flow, analysis, newPremium, compat);
  } else if (tier === "premium") {
    premiumSections(flow, analysis);
  } else if (analysis.freeReading) {
    teaserSection(flow, analysis);
  } else {
    sectionHeading(flow, "Próxima descoberta", "Seu mapa completo continua daqui");
    loose(flow, [{ type: "text", text: "O mapa completo abre as outras áreas da sua vida e termina com um plano simples para aplicar a leitura." }]);
  }

  return document.save({ useObjectStreams: false });
}
