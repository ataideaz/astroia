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
  /** Ano pessoal (numerologia), para o "ano de vocês". */
  personalYear?: number;
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
  version: 1 | 2;
  names: [string, string];
  signs: Array<{ name: string; sun: string; moon: string; ascendant: string | null }>;
  score: number;
  headline: string;
  summary: string;
  areas: CompatArea[];
  together: string[];
  watch: string;
  /** Como cada um sente que é amado. */
  love: Array<{ name: string; text: string }>;
  /** Como fazer as pazes com cada um. */
  makeUp: Array<{ name: string; text: string }>;
  /** O que um ensina ao outro. */
  gifts: string[];
  /** Programa ideal para vocês. */
  date: string;
  /** O ano de vocês (numerologia do casal). */
  coupleYear: { number: number; text: string } | null;
  /** Arquétipo do casal (pelo elemento do Sol de cada um). */
  archetype?: { name: string; text: string };
  /** O que um viu primeiro no outro. */
  firstImpression?: string[];
  /** Ciúme e confiança. */
  trust?: string[];
  /** Dinheiro a dois. */
  money?: { lines: string[]; tip: string };
  /** Três combinados para o casal. */
  pacts?: string[];
  /** Perguntas para conversarem a dois. */
  questions?: string[];
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
  gemini: "seduz pela conversa",
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
      low: "Jeitos bem diferentes de sentir",
    },
    texts: {
      hi: "Vocês entendem do que a outra pessoa precisa quase sem palavras.",
      mid: "Vocês sentem de jeitos diferentes, mas se completam quando cada pessoa explica o que precisa.",
      low: "O que acalma uma pessoa pode não acalmar a outra. Isso pede paciência e muita conversa.",
    },
    tips: {
      hi: "Continuem com os pequenos rituais de carinho: eles são a base de vocês.",
      mid: "Combinem um sinal para dizer \"hoje eu preciso de colo\".",
      low: "Perguntem entre vocês: \"do que você precisa quando está triste?\". A resposta pode surpreender.",
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
      low: "Mal-entendidos podem acontecer, mas também é assim que vocês aprendem com a diferença.",
    },
    tips: {
      hi: "Usem essa facilidade para falar também dos assuntos difíceis, não só dos divertidos.",
      mid: "Quando o assunto for sério, uma pessoa fala e a outra só escuta. Depois troca.",
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
      hi: "O jeito de viver de cada pessoa ajuda a outra a ser melhor.",
      mid: "Vocês têm ritmos diferentes, mas dá para encontrar um meio-termo.",
      low: "Vocês funcionam de jeitos opostos. Às vezes cansa, mas também equilibra: um tem o que falta no outro.",
    },
    tips: {
      hi: "Dividam as tarefas pelo talento de cada pessoa.",
      mid: "Combinem as coisas importantes por escrito: quem faz o quê e quando.",
      low: "Respeitem o tempo do outro: nem todo mundo acorda, decide e descansa do mesmo jeito.",
    },
  },
};

const ELEMENT: Record<SignKey, "Fogo" | "Terra" | "Ar" | "Água"> = {
  aries: "Fogo", leo: "Fogo", sagittarius: "Fogo",
  taurus: "Terra", virgo: "Terra", capricorn: "Terra",
  gemini: "Ar", libra: "Ar", aquarius: "Ar",
  cancer: "Água", scorpio: "Água", pisces: "Água",
};

const FEEL_LOVED: Record<SignKey, string> = {
  aries: "recebe atitude: um convite surpresa, alguém que toma a frente e resolve",
  taurus: "tem presença e carinho: abraço demorado, comida gostosa e tempo junto sem pressa",
  gemini: "tem conversa boa: mensagens durante o dia, risadas e interesse pelo que pensa",
  cancer: "recebe cuidado: alguém que pergunta se chegou bem, lembra das datas e cria um cantinho a dois",
  leo: "recebe admiração: elogio sincero, orgulho na frente dos amigos e gestos que fazem se sentir especial",
  virgo: "recebe ajuda prática: alguém que divide as tarefas, cumpre o combinado e repara nos detalhes",
  libra: "tem gentileza e romance: palavras doces, programas bonitos e decisões tomadas a dois",
  scorpio: "tem verdade e entrega: lealdade total, conversas profundas e nenhum segredo",
  sagittarius: "tem liberdade e aventura: viagens, novidades e espaço para ser quem é",
  capricorn: "vê compromisso: planos de futuro, palavra cumprida e presença nas horas difíceis",
  aquarius: "tem amizade e espaço: alguém que respeita o seu jeito e apoia as suas ideias",
  pisces: "tem delicadeza: carinho sem motivo, uma música dedicada, um olhar que entende tudo",
};

const MAKE_UP: Record<SignKey, string> = {
  aries: "esquenta rápido e esfria rápido. O melhor é conversar logo, sem deixar para amanhã.",
  taurus: "precisa de um tempo em silêncio. Insistir na hora piora; um carinho depois resolve mais que mil palavras.",
  gemini: "precisa falar. Uma conversa leve, até com uma piada para quebrar o gelo, já faz as pazes.",
  cancer: "se fecha para se proteger. Precisa ouvir que é importante antes de conseguir conversar.",
  leo: "precisa sentir que o orgulho foi respeitado. Um pedido de desculpas sincero abre a porta.",
  virgo: "quer entender o que deu errado. Conversar com calma e combinar o que muda acalma de vez.",
  libra: "quer paz o quanto antes, mas precisa de espaço para dizer o que realmente incomodou.",
  scorpio: "demora a baixar a guarda. Precisa de verdade total: meias palavras deixam a ferida aberta.",
  sagittarius: "quer virar a página rápido. Um programa a dois, com risada, faz as pazes melhor que uma DR longa.",
  capricorn: "fica sério e controlado. Precisa de tempo e de atitudes, não só de promessas.",
  aquarius: "se afasta para pensar. Respeitar esse tempo é o que faz voltar mais rápido.",
  pisces: "se magoa fundo e pode chorar ou sumir. Precisa de carinho e de uma conversa bem delicada.",
};

const GIFT: Record<SignKey, string> = {
  aries: "a ter coragem de começar",
  taurus: "a ter calma e aproveitar o agora",
  gemini: "a ver a vida com leveza e curiosidade",
  cancer: "a cuidar e a se deixar cuidar",
  leo: "a brilhar sem medo",
  virgo: "a organizar a vida e cuidar dos detalhes",
  libra: "a buscar equilíbrio e fazer as pazes",
  scorpio: "a ir fundo e confiar de verdade",
  sagittarius: "a ser otimista e sonhar alto",
  capricorn: "a ter foco e construir o futuro",
  aquarius: "a pensar diferente e ser livre",
  pisces: "a sentir mais e sonhar junto",
};

const DATE_IDEA: Record<string, string> = {
  "Fogo+Fogo": "um programa agitado: show, trilha, viagem de última hora ou qualquer coisa que tenha emoção.",
  "Terra+Terra": "um jantar caprichado em casa ou num lugar aconchegante, sem pressa nenhuma.",
  "Ar+Ar": "um passeio cheio de conversa: café, livraria, museu ou um bar com papo bom.",
  "Água+Água": "uma noite romântica e tranquila: filme abraçados, música e muito carinho.",
  "Fogo+Terra": "um passeio ao ar livre que termine numa comida gostosa: o agito de um com o conforto do outro.",
  "Ar+Fogo": "algo novo para vocês: uma aula diferente, um lugar que ninguém conhece, uma aventura com muita risada.",
  "Fogo+Água": "um programa com emoção e intimidade: um show e depois um tempo só de vocês.",
  "Ar+Terra": "uma feira, um passeio pela cidade ou uma receita nova cozinhada a dois.",
  "Terra+Água": "um fim de semana tranquilo: natureza, comida boa e tempo para conversar com calma.",
  "Ar+Água": "um cinema ou um teatro e depois uma conversa longa sobre o que sentiram.",
};

const COUPLE_YEAR: Record<number, string> = {
  1: "Um ano para começar algo a dois: um projeto, uma viagem, uma nova fase.",
  2: "Um ano para fortalecer a parceria: mais escuta, mais paciência, mais \"nós\".",
  3: "Um ano para se divertir a dois: sair mais, rir mais, celebrar.",
  4: "Um ano para construir a base: casa, planos e dinheiro organizado a dois.",
  5: "Um ano de novidades: mudanças, viagens e coisas que tiram vocês da rotina.",
  6: "Um ano de família e de cuidado: o lar de vocês fica no centro.",
  7: "Um ano para se conhecer mais fundo: conversas sinceras e tempo só de vocês.",
  8: "Um ano de conquistas a dois: metas em comum e esforço que dá resultado.",
  9: "Um ano para fechar ciclos: deixar para trás o que pesava e abrir espaço para o novo.",
};

// Quando o signo principal da área é o mesmo nos dois.
const SAME_TEXT: Record<CompatAreaId, { title: string; text: string; tip: string }> = {
  coracao: {
    title: "Corações no mesmo ritmo",
    text: "Isso aproxima muito: vocês se entendem quase sem palavras. O cuidado é vocês precisarem da mesma coisa ao mesmo tempo.",
    tip: "Revezem: num dia uma pessoa cuida, no outro dia é a vez da outra.",
  },
  atracao: {
    title: "Amam do mesmo jeito",
    text: "Quando vocês amam parecido, o carinho chega exatamente do jeito que cada pessoa gosta de receber.",
    tip: "Façam surpresas de vez em quando: fazer sempre igual também cansa.",
  },
  conversa: {
    title: "Falam a mesma língua",
    text: "Um termina a frase do outro. O desafio é pensarem igual até nos erros: às vezes vale ouvir uma terceira opinião.",
    tip: "Quando discordarem, lembrem que estão do mesmo lado.",
  },
  diaadia: {
    title: "Parecidos na rotina",
    text: "Vocês têm o mesmo jeito de viver, e isso facilita muito. Só cuidado para não disputarem o mesmo espaço.",
    tip: "Dividam os papéis: cada pessoa brilha numa coisa.",
  },
};

const COUPLE_ARCHETYPE: Record<string, { name: string; text: string }> = {
  "Fogo+Fogo": { name: "O Casal Fogueira", text: "Dois corações de fogo: muita paixão, energia e vontade de viver tudo a dois. Quando uma pessoa se anima, a outra já está pronta." },
  "Terra+Terra": { name: "O Casal Raiz", text: "Vocês constroem devagar e para durar: segurança, rotina gostosa e planos de verdade." },
  "Ar+Ar": { name: "O Casal Papo Bom", text: "Melhores amigos antes de tudo: conversa, risada e ideias que não acabam nunca." },
  "Água+Água": { name: "O Casal Oceano", text: "Vocês sentem fundo e se entendem pelo olhar. Um é o porto seguro do outro." },
  "Fogo+Terra": { name: "O Casal Vulcão", text: "Uma pessoa traz a faísca e a outra dá o chão. Quando acertam o ritmo, constroem coisas grandes." },
  "Ar+Fogo": { name: "O Casal Aventura", text: "O ar alimenta o fogo: lado a lado, vocês se animam, viajam, inventam e não param." },
  "Fogo+Água": { name: "O Casal Vapor", text: "Paixão e emoção na mesma medida. Intenso, às vezes quente demais, mas nunca morno." },
  "Ar+Terra": { name: "O Casal Projeto", text: "Uma pessoa sonha e a outra realiza: ideia vira plano, e plano vira realidade." },
  "Terra+Água": { name: "O Casal Jardim", text: "A água rega a terra: cuidado, carinho e algo bonito crescendo com o tempo." },
  "Ar+Água": { name: "O Casal Brisa do Mar", text: "Razão e emoção se encontram. Vocês se ajudam a entender o que sentem." },
};

// Como a pessoa aparece na primeira impressão (Ascendente).
const FIRST_LOOK: Record<SignKey, string> = {
  aries: "uma pessoa cheia de energia, que chega com tudo",
  taurus: "uma pessoa tranquila, que passa segurança",
  gemini: "uma pessoa de conversa fácil e olhar atento",
  cancer: "uma pessoa doce, que faz os outros se sentirem em casa",
  leo: "uma pessoa carismática, com brilho próprio",
  virgo: "uma pessoa discreta, que repara em tudo",
  libra: "uma pessoa charmosa, que agrada a todos",
  scorpio: "uma pessoa de olhar profundo e jeito misterioso",
  sagittarius: "uma pessoa alegre, que traz leveza para o grupo",
  capricorn: "uma pessoa séria e confiável, que passa respeito",
  aquarius: "uma pessoa original, que não segue a multidão",
  pisces: "uma pessoa suave, que acolhe sem esforço",
};

const TRUST: Record<SignKey, string> = {
  aries: "sente ciúme rápido, mas fala na hora e esquece logo.",
  taurus: "sente ciúme quando tem medo de perder. Precisa de constância para ficar em paz.",
  gemini: "quase não sente ciúme, mas se incomoda quando a conversa esfria.",
  cancer: "sente ciúme em silêncio. Precisa sentir que continua sendo prioridade.",
  leo: "sente ciúme quando a atenção vai para outra pessoa. Um elogio na hora certa resolve muito.",
  virgo: "repara nos detalhes e pode desconfiar deles. Combinados claros deixam tudo mais leve.",
  libra: "não gosta de cena, mas sente quando a outra pessoa fica distante. Precisa de gentileza e presença.",
  scorpio: "sente ciúme intenso. Transparência total é o que acalma o coração.",
  sagittarius: "detesta ciúme e controle. Confia mais quando recebe liberdade.",
  capricorn: "sente ciúme, mas não mostra. Confia em quem cumpre o que promete.",
  aquarius: "dá espaço e quer espaço. Cobrança demais afasta.",
  pisces: "pode imaginar coisas quando bate a insegurança. Uma palavra carinhosa acalma tudo.",
};

const MONEY_STYLE: Record<SignKey, string> = {
  aries: "gasta rápido, no impulso, com o que quer agora",
  taurus: "gosta de guardar e de gastar com conforto e qualidade",
  gemini: "gasta com várias coisinhas e gosta de ter mais de uma fonte de renda",
  cancer: "guarda pensando na casa e na família",
  leo: "gosta de presentear e de viver com um pouco de luxo",
  virgo: "controla os gastos e faz as contas direitinho",
  libra: "gasta com coisas bonitas e com programas a dois",
  scorpio: "é discreto com dinheiro e gosta de ter uma reserva",
  sagittarius: "gasta com viagens e experiências",
  capricorn: "planeja, investe e pensa no futuro",
  aquarius: "gasta com novidades e tecnologia, do seu jeito",
  pisces: "é generoso e às vezes esquece de olhar o saldo",
};

const PACTS: Record<CompatAreaId, string> = {
  coracao: "Uma vez por semana, perguntem entre vocês: \"como você está, de verdade?\"",
  atracao: "Um encontro por mês sem celular, só vocês.",
  conversa: "Assunto sério nunca por mensagem: conversa importante é ao vivo.",
  diaadia: "Uma lista das tarefas da casa, dividida e combinada entre vocês.",
};

const QUESTION_BY_AREA: Record<CompatAreaId, string> = {
  coracao: "Do que você precisa quando está triste?",
  atracao: "Que programa novo você gostaria de fazer comigo?",
  conversa: "Tem alguma coisa que você queria me dizer e nunca disse?",
  diaadia: "Que tarefa do dia a dia você gostaria que eu assumisse?",
};

const QUESTIONS = [
  "Em que momento você percebeu que gostava de mim?",
  "O que eu faço que mais faz você sentir que é amor?",
  "Qual sonho você quer realizar junto comigo nos próximos anos?",
  "O que eu poderia fazer diferente quando a gente briga?",
];

function band(score: number): Band {
  if (score >= 84) return "hi";
  if (score >= 72) return "mid";
  return "low";
}

function firstName(name: string) {
  const first = name.trim().split(/\s+/)[0] || name;
  return first.charAt(0).toLocaleUpperCase("pt-BR") + first.slice(1);
}

function reduce(value: number) {
  let current = value;
  while (current > 9) current = String(current).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return current;
}

/** "A faz X. B faz Y." ou, quando é igual, "Os dois fazem X." */
function describe(A: string, B: string, a: SignKey, b: SignKey, table: Record<SignKey, string>) {
  if (a === b) return `Vocês ${pluralize(table[a])}.`;
  return `${A} ${table[a]}. ${B} ${table[b]}.`;
}

// Passa os verbos da frase para o plural ("ama" -> "amam"), para "Vocês dois ...".
const PLURAL: Record<string, string> = {
  sente: "sentem", precisa: "precisam", acalma: "acalmam", mostra: "mostram",
  ama: "amam", vai: "vão", desiste: "desistem", conquista: "conquistam",
  age: "agem", evita: "evitam", busca: "buscam", fala: "falam", muda: "mudam",
  adora: "adoram", escolhe: "escolhem", vive: "vivem", quer: "querem", seduz: "seduzem",
};
function pluralize(phrase: string) {
  return phrase
    .split(" ")
    .map((word) => {
      const clean = word.replace(/[,.]$/, "");
      const ending = word.slice(clean.length);
      return PLURAL[clean] ? PLURAL[clean] + ending : word;
    })
    .join(" ");
}

export function buildCompatibility(a: CompatPerson, b: CompatPerson): CompatResult {
  const A = firstName(a.name);
  const B = firstName(b.name);

  const venusLine = (person: CompatPerson) => `${VENUS_STYLE[person.venus.signKey]} e, na conquista, ${MARS_STYLE[person.mars.signKey]}`;
  const attractionSame = a.venus.signKey === b.venus.signKey && a.mars.signKey === b.mars.signKey;

  const raw: Record<CompatAreaId, { score: number; detail: string; same: boolean }> = {
    coracao: {
      score: average([pair(a.moon, b.moon), pair(a.moon, b.venus), pair(a.venus, b.moon), pair(a.moon, b.moon)]),
      detail: describe(A, B, a.moon.signKey, b.moon.signKey, MOON_STYLE),
      same: a.moon.signKey === b.moon.signKey,
    },
    atracao: {
      score: average([pair(a.venus, b.mars), pair(a.mars, b.venus), pair(a.venus, b.venus)]),
      detail: attractionSame
        ? `Vocês ${pluralize(VENUS_STYLE[a.venus.signKey])} e, na conquista, ${pluralize(MARS_STYLE[a.mars.signKey])}.`
        : `${A} ${venusLine(a)}. ${B} ${venusLine(b)}.`,
      same: attractionSame,
    },
    conversa: {
      score: average([pair(a.mercury, b.mercury), pair(a.mercury, b.mercury), pair(a.sun, b.mercury), pair(a.mercury, b.sun)]),
      detail: describe(A, B, a.mercury.signKey, b.mercury.signKey, MERCURY_STYLE),
      same: a.mercury.signKey === b.mercury.signKey,
    },
    diaadia: {
      score: average([pair(a.sun, b.moon), pair(a.moon, b.sun), pair(a.sun, b.sun)]),
      detail: describe(A, B, a.sun.signKey, b.sun.signKey, SUN_STYLE),
      same: a.sun.signKey === b.sun.signKey,
    },
  };

  const areas: CompatArea[] = (Object.keys(raw) as CompatAreaId[]).map((id) => {
    const info = AREA_TEXT[id];
    const level = band(raw[id].score);
    const same = raw[id].same ? SAME_TEXT[id] : null;
    return {
      id,
      symbol: info.symbol,
      label: info.label,
      score: raw[id].score,
      title: same ? same.title : info.titles[level],
      text: `${raw[id].detail} ${same ? same.text : info.texts[level]}`,
      tip: same ? same.tip : info.tips[level],
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

  const sameSun = a.sun.signKey === b.sun.signKey;
  const gifts = sameSun
    ? [`Vocês se ensinam ${GIFT[a.sun.signKey]}. Lado a lado, isso fica em dobro.`]
    : [`Com ${A}, ${B} aprende ${GIFT[a.sun.signKey]}.`, `Com ${B}, ${A} aprende ${GIFT[b.sun.signKey]}.`];
  const dateKey = [ELEMENT[a.venus.signKey], ELEMENT[b.venus.signKey]].sort().join("+");
  const archetypeKey = [ELEMENT[a.sun.signKey], ELEMENT[b.sun.signKey]].sort().join("+");
  const lowest = [...areas].sort((x, y) => x.score - y.score);
  const firstLook = (person: CompatPerson) =>
    person.ascendant ? FIRST_LOOK[person.ascendant.signKey] : `alguém que ${SUN_STYLE[person.sun.signKey]}`;
  const firstImpression =
    a.ascendant && b.ascendant && a.ascendant.signKey === b.ascendant.signKey
      ? [`Vocês se reconheceram logo de cara: vocês passam a imagem de ${FIRST_LOOK[a.ascendant.signKey]}.`]
      : [
          `O que ${A} viu primeiro em ${B}: ${firstLook(b)}.`,
          `O que ${B} viu primeiro em ${A}: ${firstLook(a)}.`,
        ];
  const trust =
    a.venus.signKey === b.venus.signKey
      ? [`Vocês funcionam igual aqui: cada pessoa ${TRUST[a.venus.signKey]}`]
      : [`${A} ${TRUST[a.venus.signKey]}`, `${B} ${TRUST[b.venus.signKey]}`];
  const sameMoney = a.venus.signKey === b.venus.signKey;
  const money = {
    lines: sameMoney
      ? [`Com dinheiro, cada pessoa ${MONEY_STYLE[a.venus.signKey]}.`]
      : [`${A} ${MONEY_STYLE[a.venus.signKey]}.`, `${B} ${MONEY_STYLE[b.venus.signKey]}.`],
    tip:
      sameMoney || ELEMENT[a.venus.signKey] === ELEMENT[b.venus.signKey]
        ? "Como vocês pensam parecido, o cuidado é um não incentivar o exagero do outro. Combinem um limite para os gastos do mês."
        : "Como vocês lidam com dinheiro de jeitos diferentes, façam uma \"caixinha do casal\" para os sonhos a dois e deixem um dinheiro livre para cada pessoa, sem precisar dar explicação.",
  };
  const coupleNumber =
    typeof a.personalYear === "number" && typeof b.personalYear === "number"
      ? reduce(a.personalYear + b.personalYear)
      : null;

  return {
    version: 2 as const,
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
    love:
      a.moon.signKey === b.moon.signKey
        ? [{ name: `${A} e ${B}`, text: `Para cada pessoa, é amor de verdade quando ${FEEL_LOVED[a.moon.signKey]}.` }]
        : [a, b].map((person) => ({
            name: firstName(person.name),
            text: `${firstName(person.name)} sente que é amor de verdade quando ${FEEL_LOVED[person.moon.signKey]}.`,
          })),
    makeUp:
      a.mars.signKey === b.mars.signKey
        ? [{ name: `${A} e ${B}`, text: `Vocês reagem do mesmo jeito: depois de uma briga, cada pessoa ${MAKE_UP[a.mars.signKey]}` }]
        : [a, b].map((person) => ({
            name: firstName(person.name),
            text: `Depois de uma briga, ${firstName(person.name)} ${MAKE_UP[person.mars.signKey]}`,
          })),
    gifts,
    date: `O encontro perfeito para vocês: ${DATE_IDEA[dateKey] ?? DATE_IDEA["Ar+Fogo"]}`,
    coupleYear: coupleNumber ? { number: coupleNumber, text: COUPLE_YEAR[coupleNumber] } : null,
    archetype: COUPLE_ARCHETYPE[archetypeKey] ?? COUPLE_ARCHETYPE["Ar+Fogo"],
    firstImpression,
    trust,
    money,
    pacts: [
      PACTS[lowest[0].id],
      PACTS[lowest[1].id],
      "Nunca dormir depois de uma briga sem, pelo menos, um \"amanhã a gente conversa\".",
    ],
    questions: [QUESTION_BY_AREA[lowest[0].id], ...QUESTIONS],
    shareText: `${A} + ${B}: ${score}% de sintonia no AstroIA. Somos ${(COUPLE_ARCHETYPE[archetypeKey] ?? COUPLE_ARCHETYPE["Ar+Fogo"]).name} ✦ Descubra a sua:`,
    note: "Este número é uma brincadeira séria: mostra como os dois mapas conversam, mas não decide o futuro de ninguém. Quem faz a relação dar certo são vocês.",
  };
}
