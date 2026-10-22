"use client";

// Stories em sequência, no estilo "retrospectiva do ano": cores fortes,
// letras enormes, formas geométricas e um gancho de curiosidade em cada
// imagem para quem vê ("E você, qual é o seu?").

import { useEffect, useState } from "react";
import type { CompatResult } from "../lib/compatibility";
import type { FreeReading } from "../lib/free-reading";
import type { PremiumReading } from "../lib/premium-reading";

const W = 1080;
const H = 1920;

type Fonts = { sans: string; serif: string };
type Draw = (ctx: CanvasRenderingContext2D, fonts: Fonts, host: string) => void;
export type StoryCard = { id: string; label: string; draw: Draw };

const COLORS = {
  navy: "#140a3a",
  violet: "#3b12a8",
  pink: "#ff3d8b",
  lime: "#c6f432",
  yellow: "#ffd23f",
  orange: "#ff6a1a",
  cyan: "#22d3ee",
  white: "#ffffff",
  cream: "#fff4e0",
};

// ---------------------------------------------------------------------------
// Ferramentas de desenho
// ---------------------------------------------------------------------------
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, points = 4) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.32;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(x - size * 0.5, y + size * 0.6, x, y + size * 0.78, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.78, x + size * 0.5, y + size * 0.6, x + size * 0.5, y + size * 0.3);
  ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
  ctx.fill();
}

/** Passa um texto escrito para "você" para a primeira pessoa (para a pessoa postar). */
function firstPerson(text: string) {
  // \b não funciona com letras acentuadas, por isso a busca é por "letra vizinha".
  const word = (value: string) => new RegExp(`(?<!\\p{L})${value}(?!\\p{L})`, "gu");
  const swaps: Array<[string, string]> = [
    ["Para você", "Para mim"], ["para você", "para mim"], ["com você", "comigo"],
    ["em você", "em mim"], ["de você", "de mim"], ["você", "eu"], ["Você", "Eu"],
    ["te", "me"], ["seus", "meus"], ["suas", "minhas"], ["seu", "meu"], ["sua", "minha"],
  ];
  return swaps.reduce((current, [from, to]) => current.replace(word(from), to), text);
}

/** Um story de uma ideia só: título grande + frase. */
function quoteCard(opts: {
  bg: string;
  ink: string;
  accent: string;
  tag: string;
  titleLines: string[];
  text: string;
  hook: string;
  decorate: (ctx: CanvasRenderingContext2D) => void;
}): Draw {
  return (ctx, fonts, host) => {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, W, H);
    opts.decorate(ctx);
    header(ctx, fonts, opts.ink, opts.tag);
    setFont(ctx, 800, 116, fonts.sans);
    ctx.fillStyle = opts.ink;
    ctx.textAlign = "left";
    let y = 760;
    for (const line of opts.titleLines) {
      fit(ctx, line, 800, 116, fonts.sans, W - 160);
      ctx.fillText(line, 80, y);
      y += 128;
    }
    const clean = opts.text.charAt(0).toLocaleUpperCase("pt-BR") + opts.text.slice(1);
    paragraph(ctx, clean, 80, y + 50, {
      weight: 600, size: clean.length > 150 ? 60 : 70, family: fonts.serif, color: opts.ink, max: W - 160,
      lineHeight: clean.length > 150 ? 70 : 82,
    });
    footer(ctx, fonts, host, opts.hook, opts.ink, opts.accent);
  };
}

function stripes(ctx: CanvasRenderingContext2D, y: number, height: number, color: string, angle = -0.18) {
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(-W, -height / 2, W * 2, height);
  ctx.restore();
}

function setFont(ctx: CanvasRenderingContext2D, weight: number | string, size: number, family: string) {
  ctx.font = `${weight} ${size}px ${family}`;
}

/** Diminui a fonte até o texto caber na largura. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number | string, size: number, family: string, max: number) {
  let current = size;
  setFont(ctx, weight, current, family);
  while (ctx.measureText(text).width > max && current > 24) {
    current -= 4;
    setFont(ctx, weight, current, family);
  }
  return current;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > max) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}

function paragraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { weight: number | string; size: number; family: string; color: string; max: number; lineHeight?: number; align?: CanvasTextAlign },
) {
  setFont(ctx, opts.weight, opts.size, opts.family);
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? "left";
  const lineHeight = opts.lineHeight ?? opts.size * 1.18;
  const lines = wrap(ctx, text, opts.max);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fonts: Fonts, bg: string, fg: string, size = 40) {
  setFont(ctx, 800, size, fonts.sans);
  const width = ctx.measureText(text).width + size * 1.4;
  const height = size * 1.9;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.fillText(text, x + size * 0.7, y + height * 0.66);
  return width;
}

function header(ctx: CanvasRenderingContext2D, fonts: Fonts, color: string, text: string) {
  setFont(ctx, 800, 34, fonts.sans);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText("✦ ASTROIA", 80, 130);
  ctx.textAlign = "right";
  ctx.fillText(text.toUpperCase(), W - 80, 130);
}

function footer(ctx: CanvasRenderingContext2D, fonts: Fonts, host: string, hook: string, color: string, accent: string) {
  setFont(ctx, 800, 46, fonts.sans);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(hook, 80, H - 190);
  setFont(ctx, 800, 40, fonts.sans);
  ctx.fillStyle = accent;
  ctx.fillText(host, 80, H - 125);
}

function upper(text: string) {
  return text.toLocaleUpperCase("pt-BR");
}

// ---------------------------------------------------------------------------
// Stories do mapa
// ---------------------------------------------------------------------------
export function personalCards(reading: FreeReading, premium: PremiumReading | null): StoryCard[] {
  const year = new Date().getFullYear();
  const words = reading.archetype.name.split(" ");
  const nameLines = words.length >= 3 ? [words.slice(0, 2).join(" "), words.slice(2).join(" ")] : [reading.archetype.name];
  const combos = reading.layers.length >= 3 ? "1 em 1.728" : "1 em 144";

  const cards: StoryCard[] = [
    {
      id: "arquetipo",
      label: "Meu arquétipo",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.violet;
        ctx.fillRect(0, 0, W, H);
        circle(ctx, W - 20, 560, 300, COLORS.lime);
        circle(ctx, 60, H - 420, 300, COLORS.pink);
        stripes(ctx, 1260, 120, COLORS.orange, -0.12);
        star(ctx, 860, 1100, 70, COLORS.yellow);
        star(ctx, 940, 1600, 44, COLORS.white);
        header(ctx, fonts, COLORS.white, `meu céu ${year}`);
        setFont(ctx, 800, 96, fonts.sans);
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = "left";
        ctx.fillText("Eu sou", 80, 720);
        let y = 900;
        for (const line of nameLines) {
          const size = fit(ctx, upper(line), 800, 170, fonts.sans, W - 160);
          ctx.fillStyle = COLORS.navy;
          ctx.fillText(upper(line), 86, y + 6);
          ctx.fillStyle = COLORS.lime;
          ctx.fillText(upper(line), 80, y);
          y += size * 1.02;
        }
        pill(ctx, `${combos} combinações`, 80, y + 60, fonts, COLORS.white, COLORS.navy, 42);
        footer(ctx, fonts, host, "E você, qual é o seu?", COLORS.white, COLORS.lime);
      },
    },
    {
      id: "trio",
      label: "Meu trio",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.pink;
        ctx.fillRect(0, 0, W, H);
        circle(ctx, W + 60, 1500, 420, COLORS.yellow);
        circle(ctx, -80, 260, 220, COLORS.violet);
        star(ctx, 900, 330, 60, COLORS.navy);
        header(ctx, fonts, COLORS.navy, "meu trio");
        setFont(ctx, 800, 104, fonts.sans);
        ctx.fillStyle = COLORS.navy;
        ctx.textAlign = "left";
        ctx.fillText("Por dentro,", 80, 470);
        ctx.fillText("no coração", 80, 580);
        ctx.fillText("e por fora:", 80, 690);
        const labels: Record<string, string> = { sun: "SOL", moon: "LUA", ascendant: "ASCENDENTE" };
        const bars = [COLORS.navy, COLORS.violet, COLORS.orange];
        reading.layers.forEach((layer, index) => {
          const top = 820 + index * 250;
          ctx.save();
          ctx.translate(80, top);
          ctx.rotate(index % 2 === 0 ? -0.025 : 0.025);
          ctx.fillStyle = bars[index];
          ctx.beginPath();
          ctx.roundRect(0, 0, W - 160, 210, 30);
          ctx.fill();
          setFont(ctx, 800, 34, fonts.sans);
          ctx.fillStyle = COLORS.yellow;
          ctx.fillText(labels[layer.id] ?? layer.role, 44, 64);
          const size = fit(ctx, upper(layer.sign), 800, 110, fonts.sans, W - 260);
          ctx.fillStyle = COLORS.white;
          ctx.fillText(upper(layer.sign), 44, 64 + size * 0.95);
          ctx.restore();
        });
        footer(ctx, fonts, host, "Descubra o seu trio", COLORS.navy, COLORS.white);
      },
    },
    {
      id: "superpoder",
      label: "Meu superpoder",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.lime;
        ctx.fillRect(0, 0, W, H);
        star(ctx, W - 200, 520, 260, COLORS.orange, 8);
        circle(ctx, W + 10, H - 430, 230, COLORS.cyan);
        stripes(ctx, 300, 70, COLORS.navy, 0.1);
        header(ctx, fonts, COLORS.navy, "meu superpoder");
        setFont(ctx, 800, 120, fonts.sans);
        ctx.fillStyle = COLORS.navy;
        ctx.textAlign = "left";
        ctx.fillText("Meu", 80, 820);
        ctx.fillText("superpoder:", 80, 950);
        const power = reading.superpower.replace(/^Seu superpoder é /, "").replace(/\.$/, "");
        paragraph(ctx, upper(power.charAt(0)) + power.slice(1), 80, 1110, {
          weight: 600, size: 76, family: fonts.serif, color: COLORS.navy, max: W - 160, lineHeight: 86,
        });
        footer(ctx, fonts, host, "Qual é o seu?", COLORS.navy, COLORS.violet);
      },
    },
  ];

  cards.push({
    id: "ponto-fraco",
    label: "Meu ponto fraco",
    draw: quoteCard({
      bg: COLORS.yellow,
      ink: COLORS.navy,
      accent: COLORS.violet,
      tag: "sem filtro",
      titleLines: ["Meu ponto", "fraco 😅"],
      text: firstPerson(
        reading.attention
          .replace(/^Cuidado para não /, "às vezes eu posso ")
          .replace(/, nem /, " ou ")
          .replace(/o que sente/g, "o que sinto"),
      ),
      hook: "Confessa: qual é o seu?",
      decorate: (ctx) => {
        circle(ctx, W - 60, 420, 260, COLORS.orange);
        circle(ctx, W - 120, H - 520, 150, COLORS.pink);
        star(ctx, 860, 1500, 60, COLORS.navy);
      },
    }),
  });

  if (premium) {
    const loveIntro = premium.chapters.find((chapter) => chapter.id === "amor")?.intro;
    const mission = premium.chapters.find((chapter) => chapter.id === "missao")?.intro;
    if (loveIntro) {
      cards.push({
        id: "amor",
        label: "Como eu amo",
        draw: quoteCard({
          bg: COLORS.cyan,
          ink: COLORS.navy,
          accent: COLORS.violet,
          tag: "meu jeito de amar",
          titleLines: ["Como eu", "amo:"],
          text: firstPerson(loveIntro.replace(/^Com Vênus em [^,]+, você /, "")),
          hook: "E você, ama de que jeito?",
          decorate: (ctx) => {
            heart(ctx, W - 230, 230, 330, COLORS.pink);
            heart(ctx, 170, 1450, 150, COLORS.white);
          },
        }),
      });
    }
    if (mission) {
      cards.push({
        id: "missao",
        label: "Para que eu vim",
        draw: quoteCard({
          bg: COLORS.navy,
          ink: COLORS.white,
          accent: COLORS.yellow,
          tag: "minha missão",
          titleLines: ["Eu vim", "para..."],
          text: firstPerson(mission.replace(/^O seu mapa mostra que você veio para /, "").replace(/\. A sua missão é .*$/, ".")),
          hook: "Descubra a sua missão",
          decorate: (ctx) => {
            star(ctx, W - 220, 420, 230, COLORS.yellow, 8);
            circle(ctx, 60, H - 420, 230, COLORS.violet);
            stripes(ctx, 1560, 60, COLORS.pink, 0.12);
          },
        }),
      });
    }
    const pick = (id: string) => premium.months.find((month) => month.tags.some((tag) => tag.id === id));
    const love = pick("amor");
    const luck = pick("sorte");
    const energy = pick("energia");
    const number = premium.chapters.find((chapter) => chapter.id === "numero")?.symbol;
    cards.push({
      id: "meses",
      label: "Meus meses",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.orange;
        ctx.fillRect(0, 0, W, H);
        circle(ctx, W / 2, 470, 300, COLORS.navy);
        circle(ctx, W - 90, 1320, 160, COLORS.pink);
        star(ctx, 160, 1180, 60, COLORS.yellow);
        header(ctx, fonts, COLORS.navy, "meus próximos meses");
        if (number) {
          setFont(ctx, 800, 300, fonts.sans);
          ctx.fillStyle = COLORS.lime;
          ctx.textAlign = "center";
          ctx.fillText(number, W / 2, 570);
          setFont(ctx, 800, 34, fonts.sans);
          ctx.fillStyle = COLORS.white;
          ctx.fillText("MEU NÚMERO DE DESTINO", W / 2, 680);
        }
        const rows: Array<[string, string, string]> = [];
        if (love) rows.push(["♡ AMOR EM ALTA", love.label, COLORS.pink]);
        if (luck) rows.push(["✦ SORTE EM ALTA", luck.label, COLORS.yellow]);
        if (energy) rows.push(["⚡ ENERGIA DE SOBRA", energy.label, COLORS.cyan]);
        if (!rows.length) rows.push(["✦ MEU MÊS DE " + (premium.months[0]?.theme.replace(/^Mês de /, "").toUpperCase() ?? ""), premium.months[0]?.label ?? "", COLORS.yellow]);
        rows.forEach(([title, month, color], index) => {
          const top = 900 + index * 230;
          ctx.fillStyle = COLORS.navy;
          ctx.beginPath();
          ctx.roundRect(80, top, W - 160, 190, 28);
          ctx.fill();
          setFont(ctx, 800, 34, fonts.sans);
          ctx.fillStyle = color;
          ctx.textAlign = "left";
          ctx.fillText(title, 124, top + 64);
          fit(ctx, upper(month), 800, 76, fonts.sans, W - 260);
          ctx.fillStyle = COLORS.white;
          ctx.fillText(upper(month), 124, top + 150);
        });
        footer(ctx, fonts, host, "E os seus meses?", COLORS.navy, COLORS.white);
      },
    });
  }
  return cards;
}

// ---------------------------------------------------------------------------
// Stories da compatibilidade
// ---------------------------------------------------------------------------
export function compatCards(result: CompatResult): StoryCard[] {
  const [A, B] = result.names;
  const sorted = [...result.areas].sort((x, y) => y.score - x.score);
  return [
    {
      id: "placar",
      label: "Nossa sintonia",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.pink;
        ctx.fillRect(0, 0, W, H);
        circle(ctx, W / 2, 1250, 340, COLORS.yellow);
        circle(ctx, -60, 380, 200, COLORS.violet);
        star(ctx, 930, 300, 70, COLORS.white);
        star(ctx, 170, 1640, 50, COLORS.navy);
        header(ctx, fonts, COLORS.navy, "nossa sintonia");
        setFont(ctx, 800, 60, fonts.sans);
        ctx.fillStyle = COLORS.navy;
        ctx.textAlign = "left";
        ctx.fillText("A gente fez o teste:", 80, 400);
        fit(ctx, upper(A), 800, 150, fonts.sans, W - 160);
        ctx.fillStyle = COLORS.white;
        ctx.fillText(upper(A), 80, 560);
        setFont(ctx, 800, 110, fonts.sans);
        ctx.fillStyle = COLORS.navy;
        ctx.fillText("+", 80, 670);
        fit(ctx, upper(B), 800, 150, fonts.sans, W - 160);
        ctx.fillStyle = COLORS.white;
        ctx.fillText(upper(B), 80, 800);
        setFont(ctx, 800, 300, fonts.sans);
        ctx.fillStyle = COLORS.navy;
        ctx.textAlign = "center";
        ctx.fillText(`${result.score}%`, W / 2, 1250);
        setFont(ctx, 800, 44, fonts.sans);
        ctx.fillText("DE SINTONIA", W / 2, 1340);
        footer(ctx, fonts, host, "Teste a de vocês", COLORS.navy, COLORS.white);
      },
    },
    {
      id: "arquetipo-casal",
      label: "Nosso arquétipo",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.navy;
        ctx.fillRect(0, 0, W, H);
        circle(ctx, W - 100, 520, 330, COLORS.pink);
        circle(ctx, 120, 1450, 260, COLORS.violet);
        stripes(ctx, 1030, 90, COLORS.lime, -0.14);
        star(ctx, 860, 1380, 70, COLORS.yellow);
        header(ctx, fonts, COLORS.white, "nosso arquétipo");
        setFont(ctx, 800, 96, fonts.sans);
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = "left";
        ctx.fillText("Somos", 80, 660);
        const name = result.archetype?.name ?? result.headline;
        const words = name.split(" ");
        const lines = words.length >= 3 ? [words.slice(0, 2).join(" "), words.slice(2).join(" ")] : [name];
        let y = 830;
        for (const line of lines) {
          const size = fit(ctx, upper(line), 800, 160, fonts.sans, W - 160);
          ctx.fillStyle = COLORS.pink;
          ctx.fillText(upper(line), 86, y + 6);
          ctx.fillStyle = COLORS.yellow;
          ctx.fillText(upper(line), 80, y);
          y += size * 1.04;
        }
        if (result.archetype) {
          paragraph(ctx, result.archetype.text, 80, Math.max(y + 200, 1240), {
            weight: 600, size: 52, family: fonts.serif, color: COLORS.white, max: W - 160, lineHeight: 62,
          });
        }
        footer(ctx, fonts, host, "E vocês, que casal são?", COLORS.white, COLORS.lime);
      },
    },
    {
      id: "encontro",
      label: "Nosso encontro",
      draw: quoteCard({
        bg: COLORS.violet,
        ink: COLORS.white,
        accent: COLORS.lime,
        tag: `${A} + ${B}`,
        titleLines: ["Nosso encontro", "perfeito:"],
        text: result.date.replace(/^O encontro perfeito para vocês: /, ""),
        hook: "Marca quem topa 👀",
        decorate: (ctx) => {
          heart(ctx, W - 200, 250, 280, COLORS.pink);
          circle(ctx, 80, H - 440, 200, COLORS.lime);
          star(ctx, 880, 1520, 56, COLORS.yellow);
        },
      }),
    },
    {
      id: "areas",
      label: "O que une a gente",
      draw: (ctx, fonts, host) => {
        ctx.fillStyle = COLORS.lime;
        ctx.fillRect(0, 0, W, H);
        circle(ctx, W + 40, 260, 260, COLORS.orange);
        star(ctx, 150, 1560, 80, COLORS.violet);
        header(ctx, fonts, COLORS.navy, `${A} + ${B}`);
        setFont(ctx, 800, 110, fonts.sans);
        ctx.fillStyle = COLORS.navy;
        ctx.textAlign = "left";
        ctx.fillText("O que mais", 80, 470);
        ctx.fillText("une a gente:", 80, 590);
        const colors = [COLORS.pink, COLORS.violet, COLORS.orange, COLORS.navy];
        sorted.forEach((area, index) => {
          const top = 720 + index * 220;
          setFont(ctx, 800, 50, fonts.sans);
          ctx.fillStyle = COLORS.navy;
          ctx.textAlign = "left";
          ctx.fillText(`${index + 1}. ${upper(area.label)}`, 80, top + 50);
          ctx.textAlign = "right";
          ctx.fillText(`${area.score}%`, W - 80, top + 50);
          ctx.fillStyle = "rgba(20, 10, 58, 0.15)";
          ctx.beginPath();
          ctx.roundRect(80, top + 80, W - 160, 56, 28);
          ctx.fill();
          ctx.fillStyle = colors[index];
          ctx.beginPath();
          ctx.roundRect(80, top + 80, ((W - 160) * area.score) / 100, 56, 28);
          ctx.fill();
        });
        footer(ctx, fonts, host, "Descubra a sintonia de vocês", COLORS.navy, COLORS.violet);
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Gerar e compartilhar
// ---------------------------------------------------------------------------
async function loadFonts(): Promise<Fonts> {
  const root = getComputedStyle(document.documentElement);
  const fonts = {
    serif: root.getPropertyValue("--font-cormorant").trim() || "Georgia, serif",
    sans: root.getPropertyValue("--font-manrope").trim() || "Arial, sans-serif",
  };
  await Promise.all([
    document.fonts.load(`800 120px ${fonts.sans}`),
    document.fonts.load(`600 80px ${fonts.serif}`),
  ]).catch(() => undefined);
  return fonts;
}

async function renderCard(card: StoryCard, fonts: Fonts): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  card.draw(ctx, fonts, window.location.host);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/png"),
  );
}

function download(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

export function StoryShare({
  cards,
  title,
  subtitle,
  shareText,
  filePrefix,
}: {
  cards: StoryCard[];
  title: string;
  subtitle: string;
  shareText: string;
  filePrefix: string;
}) {
  const [images, setImages] = useState<Array<{ card: StoryCard; blob: Blob; url: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${siteUrl}`)}`;
  const cardKey = cards.map((card) => card.id).join(",");

  async function build() {
    const fonts = await loadFonts();
    const made: Array<{ card: StoryCard; blob: Blob; url: string }> = [];
    for (const card of cards) {
      const blob = await renderCard(card, fonts);
      made.push({ card, blob, url: URL.createObjectURL(blob) });
    }
    setImages((old) => {
      old.forEach((image) => URL.revokeObjectURL(image.url));
      return made;
    });
    return made;
  }

  // As imagens já aparecem prontas na tela: quem vê, quer postar.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) build().catch(() => setStatus("Não deu para criar as imagens neste navegador."));
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  async function shareAll(appName: string) {
    setBusy(true);
    setStatus("");
    try {
      const made = images.length ? images : await build();
      const files = made.map((image, index) => new File([image.blob], `${filePrefix}-${index + 1}.png`, { type: "image/png" }));
      if (navigator.canShare?.({ files })) {
        try {
          await navigator.share({ files, text: `${shareText} ${siteUrl}` });
          setStatus(appName ? `Pronto! Escolha o ${appName} e poste as imagens em sequência.` : "Pronto! Poste as imagens em sequência.");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      made.forEach((image, index) => download(image.blob, `${filePrefix}-${index + 1}.png`));
      setStatus("Imagens baixadas! Abra o app no celular e poste em sequência nos stories.");
    } catch {
      setStatus("Não deu para criar as imagens neste navegador. Tente pelo celular ou use o WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="st-share" aria-label={title}>
      <div className="st-share-head">
        <span className="st-badge">Novo · stories prontos</span>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="st-strip" role="list">
        {(images.length ? images : cards.map((card) => ({ card, blob: null, url: "" }))).map((image, index) => (
          <button
            className="st-thumb"
            disabled={!image.blob}
            key={image.card.id}
            onClick={() => image.blob && download(image.blob, `${filePrefix}-${index + 1}.png`)}
            role="listitem"
            type="button"
          >
            {image.url ? <img alt={image.card.label} src={image.url} /> : <span className="st-thumb-loading" aria-hidden="true" />}
            <span>{index + 1}. {image.card.label}</span>
          </button>
        ))}
      </div>
      <button className="st-main" disabled={busy || !images.length} onClick={() => shareAll("")} type="button">
        {busy ? "Preparando..." : `📲 Postar meus ${cards.length} stories`}
      </button>
      <div className="fr-share-buttons st-buttons">
        <a className="fr-social fr-social-whatsapp" href={whatsapp} rel="noreferrer" target="_blank">
          <img alt="" className="fr-social-glyph" src="/icons/whatsapp-glyph-white.svg" /> WhatsApp
        </a>
        <button className="fr-social fr-social-instagram" disabled={busy} onClick={() => shareAll("Instagram")} type="button">
          <img alt="" className="fr-social-glyph" src="/icons/instagram-glyph-white.svg" /> Instagram
        </button>
        <button className="fr-social fr-social-tiktok" disabled={busy} onClick={() => shareAll("TikTok")} type="button">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg> TikTok
        </button>
      </div>
      <p className="st-hint">Toque numa imagem para baixar só ela.</p>
      {status && <p className="st-status" role="status">{status}</p>}
    </section>
  );
}
