// Compatibilidade de casal do AstroIA.
//
// Compara os signos de Sol, Lua, Mercúrio, Vênus e Marte das duas pessoas.
// A "sintonia" vem da distância entre os signos (signos que se entendem bem
// ficam a 4 ou 2 casas de distância; signos opostos se atraem; vizinhos e
// signos em ângulo reto pedem mais ajuste). É uma leitura para conversar e
// se divertir: nunca uma sentença sobre a relação.

import type { SignKey } from "./free-reading";

type PlacementLike = { sign: string; signKey: SignKey };

export type CompatPerson = {
  name: string;
  sun: PlacementLike;
  moon: PlacementLike;
  mercury: PlacementLike;
  venus: PlacementLike;
  mars: PlacementLike;
  ascendant: PlacementLike | null;
};

export type CompatAreaId = "coracao" | "atracao" | "conversa" | "diaadia";

export type CompatArea = {
  id: CompatAreaId;
  symbol: string;
  label: string;
  score: number;
  title: string;
  text: string;
  tip: string;
};

export type CompatResult = {
  version: 1;
  names: [string, string];
  signs: Array<{ name: string; sun: string; moon: string; ascendant: string | null }>;
  score: number;
  headline: string;
  summary: string;
  areas: CompatArea[];
  together: string[];
  watch: string;
  shareText: string;
  note: string;
};

const ORDER: SignKey[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

// Distância entre signos (0 a 6) -> sintonia.
const DISTANCE_SCORE = [90, 70, 86, 66, 95, 64, 80];

function pair(a: PlacementLike, b: PlacementLike) {
  const raw = Math.abs(ORDER.indexOf(a.signKey) - ORDER.indexOf(b.signKey));
  const distance = Math.min(raw, 12 - raw);
  return DISTANCE_SCORE[distance] ?? 70;
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

const MOON_STYLE: Record<SignKey, string> = {
  aries: "sente tudo na hora e quer resolver logo",
  taurus: "precisa de calma, rotina e colo",
  gemini: "precisa conversar para entender o que sente",
  cancer: "sente fundo e precisa de carinho e cuidado",
  leo: "precisa de atenção e de elogio sincero",
  virgo: "se acalma quando tudo está em ordem",
  libra: "precisa de paz e de gentileza",
  scorpio: "sente tudo em dobro e precisa de confiança total",
  sagittarius: "precisa de espaço, risada e liberdade",
  capricorn: "sente muito, mas mostra pouco",
  aquarius: "precisa de espaço para sentir do seu jeito",
  pisces: "sente o clima no ar e precisa de delicadeza",
};

const VENUS_STYLE: Record<SignKey, string> = {
  aries: "ama com pressa e atitude",
  taurus: "ama com presença, toque e fidelidade",
  gemini: "ama conversando e fazendo rir",
  cancer: "ama cuidando, como quem cuida de um lar",
  leo: "ama com generosidade e gestos grandes",
  virgo: "ama nos detalhes e nas atitudes práticas",
  libra: "ama com romance e gentileza",
  scorpio: "ama com intensidade e entrega total",
  sagittarius: "ama com liberdade e aventura",
  capricorn: "ama com seriedade e planos de futuro",
  aquarius: "ama sendo amizade e parceria",
  pisces: "ama de um jeito romântico e sonhador",
};

const MARS_STYLE: Record<SignKey, string> = {
  aries: "vai direto ao ponto",
  taurus: "vai devagar, mas não desiste",
  gemini: "conquista na conversa",
  cancer: "age para proteger quem ama",
  leo: "age com orgulho e paixão",
  virgo: "age com cuidado e capricho",
  libra: "evita conflito e busca acordo",
  scorpio: "age com intensidade e estratégia",
  sagittarius: "age com entusiasmo e pressa de viver",
  capricorn: "age com foco e paciência",
  aquarius: "age do seu próprio jeito",
  pisces: "age seguindo o coração",
};

const MERCURY_STYLE: Record<SignKey, string> = {
  aries: "fala direto e rápido",
  taurus: "fala pouco e com calma",
  gemini: "fala de tudo e muda de assunto rápido",
  cancer: "fala com o coração",
  leo: "fala com entusiasmo e adora contar histórias",
  virgo: "fala com detalhes e precisão",
  libra: "escolhe as palavras com cuidado",
  scorpio: "fala pouco e vai fundo",
  sagittarius: "fala com sinceridade total",
  capricorn: "fala de forma prática e objetiva",
  aquarius: "fala de ideias diferentes",
  pisces: "fala com imaginação e sensibilidade",
};

const SUN_STYLE: Record<SignKey, string> = {
  aries: "vive com pressa de começar",
  taurus: "vive no seu tempo, sem pressa",
  gemini: "vive buscando novidades",
  cancer: "vive cuidando de quem ama",
  leo: "vive para brilhar e animar",
  virgo: "vive organizando e melhorando tudo",
  libra: "vive buscando harmonia",
  scorpio: "vive tudo com intensidade",
  sagittarius: "vive atrás de aventura e liberdade",
  capricorn: "vive com metas e responsabilidade",
  aquarius: "vive do seu jeito, sem seguir a multidão",
  pisces: "vive sonhando e sentindo",
};

type Band = "hi" | "mid" | "low";

const AREA_TEXT: Record<CompatAreaId, {
  symbol: string;
  label: string;
  article: string;
  titles: Record<Band, string>;
  texts: Record<Band, string>;
  tips: Record<Band, string>;
}> = {
  coracao: {
    article: "o coração",
    symbol: "♡",
    label: "Coração",
    titles: {
      hi: "Os corações falam a mesma língua",
      mid: "Corações diferentes que se completam",
      low: "Dois jeitos bem diferentes de sentir",
    },
    texts: {
      hi: "Um entende o que o outro precisa quase sem palavras.",
      mid: "Vocês sentem de jeitos diferentes, mas se completam quando cada um explica o que precisa.",
      low: "O que acalma um pode não acalmar o outro. Isso pede paciência e muita conversa.",
    },
    tips: {
      hi: "Continuem com os pequenos rituais de carinho: eles são a base de vocês.",
      mid: "Combinem um sinal para dizer \"hoje eu preciso de colo\".",
      low: "Perguntem um ao outro: \"do que você precisa quando está triste?\". A resposta pode surpreender.",
    },
  },
  atracao: {
    article: "a atração",
    symbol: "✦",
    label: "Atração",
    titles: {
      hi: "Tem faísca!",
      mid: "Uma atração que cresce com o tempo",
      low: "Uma atração mais de carinho do que de faísca",
    },
    texts: {
      hi: "A atração entre vocês é forte e natural.",
      mid: "A atração existe e fica mais forte quando vocês se conhecem melhor.",
      low: "A química de vocês gosta de novidade: surpresas e programas diferentes fazem muito bem.",
    },
    tips: {
      hi: "Cuidado para a paixão não virar disputa: atração forte também esquenta as brigas.",
      mid: "Saiam da rotina de vez em quando: um programa novo acende a chama.",
      low: "Planejem encontros diferentes e surpresas. O desejo de vocês cresce com o novo.",
    },
  },
  conversa: {
    article: "a conversa",
    symbol: "☿",
    label: "Conversa",
    titles: {
      hi: "Papo que não acaba",
      mid: "Bom entendimento, ritmos diferentes",
      low: "Jeitos bem diferentes de falar",
    },
    texts: {
      hi: "Vocês podem passar horas conversando e nem ver o tempo passar.",
      mid: "Vocês se entendem bem, mas às vezes falam em ritmos diferentes.",
      low: "Mal-entendidos podem acontecer, mas também é assim que um aprende com o outro.",
    },
    tips: {
      hi: "Usem essa facilidade para falar também dos assuntos difíceis, não só dos divertidos.",
      mid: "Quando o assunto for sério, um fala e o outro só escuta. Depois troca.",
      low: "Antes de brigar por causa de uma frase, perguntem: \"o que você quis dizer?\".",
    },
  },
  diaadia: {
    article: "o dia a dia",
    symbol: "☼",
    label: "Dia a dia",
    titles: {
      hi: "Combinam na rotina",
      mid: "Ritmos diferentes, meio-termo possível",
      low: "Opostos que se equilibram",
    },
    texts: {
      hi: "O jeito de viver de um ajuda o outro a ser melhor.",
      mid: "Vocês têm ritmos diferentes, mas dá para encontrar um meio-termo.",
      low: "Vocês funcionam de jeitos opostos. Às vezes cansa, mas também equilibra: um tem o que falta no outro.",
    },
    tips: {
      hi: "Dividam as tarefas pelo talento de cada um.",
      mid: "Combinem as coisas importantes por escrito: quem faz o quê e quando.",
      low: "Respeitem o tempo do outro: nem todo mundo acorda, decide e descansa do mesmo jeito.",
    },
  },
};

function band(score: number): Band {
  if (score >= 84) return "hi";
  if (score >= 72) return "mid";
  return "low";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function buildCompatibility(a: CompatPerson, b: CompatPerson): CompatResult {
  const A = firstName(a.name);
  const B = firstName(b.name);

  const raw: Record<CompatAreaId, { score: number; detail: string }> = {
    coracao: {
      score: average([pair(a.moon, b.moon), pair(a.moon, b.venus), pair(a.venus, b.moon), pair(a.moon, b.moon)]),
      detail: `${A} ${MOON_STYLE[a.moon.signKey]}. ${B} ${MOON_STYLE[b.moon.signKey]}.`,
    },
    atracao: {
      score: average([pair(a.venus, b.mars), pair(a.mars, b.venus), pair(a.venus, b.venus)]),
      detail: `${A} ${VENUS_STYLE[a.venus.signKey]} e, na conquista, ${MARS_STYLE[a.mars.signKey]}. ${B} ${VENUS_STYLE[b.venus.signKey]} e, na conquista, ${MARS_STYLE[b.mars.signKey]}.`,
    },
    conversa: {
      score: average([pair(a.mercury, b.mercury), pair(a.mercury, b.mercury), pair(a.sun, b.mercury), pair(a.mercury, b.sun)]),
      detail: `${A} ${MERCURY_STYLE[a.mercury.signKey]}. ${B} ${MERCURY_STYLE[b.mercury.signKey]}.`,
    },
    diaadia: {
      score: average([pair(a.sun, b.moon), pair(a.moon, b.sun), pair(a.sun, b.sun)]),
      detail: `${A} ${SUN_STYLE[a.sun.signKey]}. ${B} ${SUN_STYLE[b.sun.signKey]}.`,
    },
  };

  const areas: CompatArea[] = (Object.keys(raw) as CompatAreaId[]).map((id) => {
    const info = AREA_TEXT[id];
    const level = band(raw[id].score);
    return {
      id,
      symbol: info.symbol,
      label: info.label,
      score: raw[id].score,
      title: info.titles[level],
      text: `${raw[id].detail} ${info.texts[level]}`,
      tip: info.tips[level],
    };
  });

  const score = Math.max(55, Math.min(97, average(areas.map((area) => area.score))));
  const sorted = [...areas].sort((x, y) => y.score - x.score);
  const article = (area: CompatArea) => AREA_TEXT[area.id].article;
  const headline =
    score >= 86
      ? "Uma combinação que brilha"
      : score >= 79
        ? "Uma dupla que se completa"
        : score >= 72
          ? "Diferentes que se atraem"
          : "Um encontro que ensina muito";

  return {
    version: 1,
    names: [A, B],
    signs: [a, b].map((person) => ({
      name: firstName(person.name),
      sun: person.sun.sign,
      moon: person.moon.sign,
      ascendant: person.ascendant?.sign ?? null,
    })),
    score,
    headline,
    summary: `${A} e ${B} têm ${score}% de sintonia. O que mais une vocês é ${article(sorted[0])} e ${article(sorted[1])}. O ponto que pede mais atenção é ${article(sorted[3])}.`,
    areas,
    together: sorted.slice(0, 2).map((area) => `${area.label}: ${area.title.toLowerCase()}.`),
    watch: `${sorted[3].label}: ${sorted[3].tip}`,
    shareText: `${A} + ${B}: ${score}% de sintonia no AstroIA ✦ Descubra a sua:`,
    note: "Este número é uma brincadeira séria: mostra como os dois mapas conversam, mas não decide o futuro de ninguém. Quem faz a relação dar certo são vocês.",
  };
}
