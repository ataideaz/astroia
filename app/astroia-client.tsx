"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type {
  AnalysisResult,
  Placement,
  RecipientType,
} from "../lib/astro-analysis";
import { CompatSample, CompatSection, PremiumReport, type CompatState } from "./premium-report";
import { StoryShare, nameCards, personalCards } from "./story-cards";
import { NameOffer, NameReadingView } from "./name-report";
import type { NameReading } from "../lib/name-numerology";
import { formatPersonName } from "../lib/name-format";
import { DirectPayment, type PixInfo } from "./direct-payment";
import { setTrackingReport, trackFunnel } from "../lib/ad-tracking";
import { adSignals, confirmPendingPurchase, currentAttribution, metaEvent, openCookiePreferences, rememberPendingPurchase } from "../lib/ad-tracking";
import type { PremiumReading } from "../lib/premium-reading";

const themes = [
  { id: "personalidade", label: "Personalidade", icon: "✦" },
  { id: "amor", label: "Amor", icon: "♡" },
  { id: "carreira", label: "Carreira", icon: "↗" },
  { id: "dinheiro", label: "Dinheiro", icon: "◇" },
  { id: "momento", label: "Momento atual", icon: "☼" },
];

const childThemes = [
  { id: "personalidade", label: "Jeito de ser", icon: "✦" },
  { id: "amor", label: "Afeto e vínculos", icon: "♡" },
  { id: "carreira", label: "Aprendizado", icon: "↗" },
  { id: "dinheiro", label: "Recursos e hábitos", icon: "◇" },
  { id: "momento", label: "Fase atual", icon: "☼" },
];

const recipients: Array<{
  id: RecipientType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "self",
    label: "Para mim",
    description: "Meu próprio mapa",
    icon: "✦",
  },
  {
    id: "partner",
    label: "Parceiro(a)",
    description: "Marido, esposa ou companheiro(a)",
    icon: "♡",
  },
  {
    id: "child",
    label: "Filho(a)",
    description: "Leitura adaptada quando for menor",
    icon: "☼",
  },
  {
    id: "other",
    label: "Outra pessoa",
    description: "Familiar ou alguém autorizado",
    icon: "◇",
  },
];

type ReportTier = "free" | "premium";
type OfferMode = "individual" | "additional";
type CheckoutStatus = "idle" | "processing" | "approved";
type CheckoutIntent = "generate" | "upgrade";
type AnalysisRequest = {
  name: string;
  birthDate: string;
  birthTime: string;
  city: string;
  country: string;
  theme: string;
  recipientType: RecipientType;
  dataConsent: boolean;
  authorizationConfirmed: boolean;
  email: string;
  marketingConsent: boolean;
  reportTier?: ReportTier;
};
type DeliveryStatus = {
  kind: "idle" | "loading" | "success" | "preview" | "error";
  message: string;
};
const mapOpeningMessages = [
  "Estamos preparando o seu mapa completo…",
  "Alinhando os cálculos do seu céu de nascimento…",
  "Organizando personalidade, amor, carreira, dinheiro e momento atual…",
  "Finalizando sua leitura personalizada…",
];

type SavedMap = {
  id: string;
  reportToken: string;
  personName: string;
  reportTier: ReportTier;
  createdAt: string;
  expiresAt: string;
};

type PendingCheckoutSession = {
  orderId: string;
  offerMode: OfferMode;
  checkoutIntent: CheckoutIntent;
  pendingAnalysis: AnalysisRequest | null;
  currentAnalysis: AnalysisResult | null;
  createdAt: number;
};

const PAYMENT_CHECKOUT_STORAGE_KEY = "astroia-payment-checkout-v1";
const DEVICE_MAPS_STORAGE_KEY = "astroia-device-maps-v1";
const DEVICE_MAPS_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const checkoutOffers: Record<
  OfferMode,
  {
    name: string;
    price: string;
    description: string;
    quantity: string;
  }
> = {
  individual: {
    name: "AstroIA Premium",
    price: "R$ 37,90",
    description: "Um mapa completo com os cinco temas",
    quantity: "1 mapa Premium",
  },
  additional: {
    name: "Novo Mapa Premium",
    price: "R$ 37,90",
    description: "Um perfil adicional com resultado separado",
    quantity: "1 perfil adicional",
  },
};

function formatBirthDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function isMinorBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDifference = today.getMonth() + 1 - month;
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age < 18;
}

type ThemeLens = {
  explanationKicker: string;
  explanationTitle: string;
  explanation: string;
  portraitKicker: string;
  portraitTitle: string;
  portraitIntroduction: string;
  strengthLabel: string;
  watchoutLabel: string;
  placements: Record<"sun" | "moon" | "ascendant", {
    plainMeaning: string;
    description: string;
    associations: string[];
  }>;
};

function buildThemeLens(
  theme: string,
  themeLabel: string,
  sunSign: string,
  moonSign: string,
  ascendantSign?: string,
): ThemeLens {
  const ascendant = ascendantSign ?? "seu Ascendente";
  const lenses: Record<string, ThemeLens> = {
    carreira: {
      explanationKicker: "Sol, Lua e Ascendente na sua carreira",
      explanationTitle: "Como você trabalha, precisa se sentir e é percebido profissionalmente",
      explanation: `O Sol em ${sunSign} mostra o que dá propósito ao seu trabalho, a Lua em ${moonSign} revela as condições emocionais de que você precisa para render bem e ${ascendantSign ? `o Ascendente em ${ascendant}` : "o Ascendente, quando calculado"} fala da imagem profissional que você transmite.`,
      portraitKicker: "Seu retrato profissional",
      portraitTitle: `${sunSign} no propósito, ${moonSign} nas necessidades e ${ascendant} na imagem profissional`,
      portraitIntroduction: "Estas três camadas mostram como seus talentos aparecem no trabalho, que ambiente favorece seu desempenho e como sua postura tende a ser percebida por colegas, clientes e lideranças.",
      strengthLabel: "TALENTOS NO TRABALHO",
      watchoutLabel: "DESAFIOS PROFISSIONAIS",
      placements: {
        sun: { plainMeaning: "O que dá propósito ao seu trabalho", description: `Com o Sol em ${sunSign}, sua identidade profissional ganha força quando você pode expressar seus valores, assumir responsabilidades coerentes e reconhecer sentido no que entrega.`, associations: ["Propósito", "Talentos", "Realização"] },
        moon: { plainMeaning: "Do que você precisa para render bem", description: `A Lua em ${moonSign} mostra suas necessidades emocionais no ambiente profissional: o tipo de clima, rotina e relação que ajuda você a manter segurança e constância.`, associations: ["Ambiente", "Motivação", "Bem-estar"] },
        ascendant: { plainMeaning: "A imagem profissional que transmite", description: `O Ascendente em ${ascendant} descreve sua postura ao entrar em equipes, reuniões e novos desafios — a primeira leitura que as pessoas podem fazer do seu estilo profissional.`, associations: ["Reputação", "Postura", "Iniciativa"] },
      },
    },
    amor: {
      explanationKicker: "Sol, Lua e Ascendente nos relacionamentos",
      explanationTitle: "Como você se entrega, cria segurança e inicia vínculos",
      explanation: `O Sol em ${sunSign} mostra o que você precisa preservar para ser você dentro de uma relação, a Lua em ${moonSign} revela sua segurança afetiva e ${ascendantSign ? `o Ascendente em ${ascendant}` : "o Ascendente, quando calculado"} mostra como você se aproxima e é percebido no começo dos vínculos.`,
      portraitKicker: "Seu retrato afetivo",
      portraitTitle: `${sunSign} na identidade, ${moonSign} no afeto e ${ascendant} na aproximação`,
      portraitIntroduction: "Estas camadas ajudam a entender suas necessidades afetivas, a forma como reage emocionalmente e a impressão que transmite ao iniciar uma conexão.",
      strengthLabel: "FORÇAS NOS VÍNCULOS",
      watchoutLabel: "PONTOS DE ATENÇÃO NO AMOR",
      placements: {
        sun: { plainMeaning: "Quem você precisa ser na relação", description: `O Sol em ${sunSign} indica os valores e formas de expressão que precisam continuar vivos para que você não se apague dentro de um vínculo.`, associations: ["Autenticidade", "Entrega", "Escolhas"] },
        moon: { plainMeaning: "O que traz segurança afetiva", description: `A Lua em ${moonSign} revela como você recebe cuidado, reage quando está vulnerável e do que precisa para confiar emocionalmente.`, associations: ["Acolhimento", "Reações", "Confiança"] },
        ascendant: { plainMeaning: "Como você inicia conexões", description: `O Ascendente em ${ascendant} mostra sua postura nos primeiros contatos e a impressão afetiva que pode transmitir antes de revelar camadas mais íntimas.`, associations: ["Aproximação", "Química", "Primeiro contato"] },
      },
    },
    dinheiro: {
      explanationKicker: "Sol, Lua e Ascendente na sua relação com dinheiro",
      explanationTitle: "Como valores, segurança e atitude influenciam suas escolhas materiais",
      explanation: `O Sol em ${sunSign} mostra os valores que orientam suas decisões, a Lua em ${moonSign} revela o que faz você buscar segurança e ${ascendantSign ? `o Ascendente em ${ascendant}` : "o Ascendente, quando calculado"} indica sua atitude diante de oportunidades e recursos.`,
      portraitKicker: "Seu retrato financeiro",
      portraitTitle: `${sunSign} nos valores, ${moonSign} na segurança e ${ascendant} nas decisões`,
      portraitIntroduction: "Estas três camadas ajudam a observar motivações, hábitos e reações ligados a recursos. São tendências para reflexão, não previsão ou orientação financeira.",
      strengthLabel: "RECURSOS NATURAIS",
      watchoutLabel: "HÁBITOS A OBSERVAR",
      placements: {
        sun: { plainMeaning: "Os valores por trás das suas escolhas", description: `O Sol em ${sunSign} mostra o que precisa fazer sentido para você ao ganhar, usar ou direcionar recursos — e onde reconhecimento pode influenciar decisões.`, associations: ["Valores", "Prioridades", "Objetivos"] },
        moon: { plainMeaning: "O que faz você se sentir seguro", description: `A Lua em ${moonSign} revela necessidades emocionais que podem aparecer nos hábitos de consumo, reserva, apego ou busca de estabilidade.`, associations: ["Segurança", "Hábitos", "Conforto"] },
        ascendant: { plainMeaning: "Como você reage às oportunidades", description: `O Ascendente em ${ascendant} mostra sua postura inicial diante de escolhas materiais, negociações e novas possibilidades.`, associations: ["Decisão", "Oportunidades", "Atitude"] },
      },
    },
    momento: {
      explanationKicker: "Sol, Lua e Ascendente no seu momento atual",
      explanationTitle: "O que sustenta você enquanto esta fase se movimenta",
      explanation: `O Sol em ${sunSign} indica o centro que você precisa preservar, a Lua em ${moonSign} mostra como cuidar do seu ritmo emocional e ${ascendantSign ? `o Ascendente em ${ascendant}` : "o Ascendente, quando calculado"} revela a postura com que você tende a entrar nas experiências atuais.`,
      portraitKicker: "Seu retrato nesta fase",
      portraitTitle: `${sunSign} como direção, ${moonSign} como ritmo e ${ascendant} como atitude`,
      portraitIntroduction: "Estas camadas mostram recursos internos para atravessar o ciclo atual com mais consciência, distinguindo impulso, necessidade emocional e forma de agir.",
      strengthLabel: "RECURSOS PARA ESTA FASE",
      watchoutLabel: "CUIDADOS NESTE MOMENTO",
      placements: {
        sun: { plainMeaning: "O centro que você precisa preservar", description: `O Sol em ${sunSign} aponta os valores e objetivos que ajudam você a não perder direção enquanto esta fase traz mudanças ou decisões.`, associations: ["Direção", "Propósito", "Vitalidade"] },
        moon: { plainMeaning: "O ritmo emocional de que precisa", description: `A Lua em ${moonSign} mostra como acolher suas reações e recuperar segurança para não transformar urgência em escolha automática.`, associations: ["Ritmo", "Reações", "Cuidado"] },
        ascendant: { plainMeaning: "A postura para começar o novo", description: `O Ascendente em ${ascendant} indica como você tende a abordar novidades e qual atitude aparece primeiro diante dos acontecimentos desta fase.`, associations: ["Movimento", "Adaptação", "Começos"] },
      },
    },
  };

  return lenses[theme] ?? {
    explanationKicker: "Sol, Lua e Ascendente sem complicação",
    explanationTitle: "Três partes diferentes de você",
    explanation: `O Sol em ${sunSign} mostra sua identidade, a Lua em ${moonSign} revela suas necessidades emocionais e ${ascendantSign ? `o Ascendente em ${ascendant}` : "o Ascendente, quando calculado"} mostra como você se apresenta ao mundo.`,
    portraitKicker: `Seu retrato em ${themeLabel.toLowerCase()}`,
    portraitTitle: `${sunSign} na essência, ${moonSign} nas emoções e ${ascendant} na primeira impressão`,
    portraitIntroduction: "Quando essas camadas são lidas juntas, fica mais fácil perceber o que move você, como reage e como chega aos ambientes.",
    strengthLabel: "FORÇAS NATURAIS",
    watchoutLabel: "PONTOS DE ATENÇÃO",
    placements: {
      sun: { plainMeaning: "Quem você é por dentro", description: "É a base da sua personalidade: seus valores, escolhas e aquilo que faz você se reconhecer.", associations: ["Identidade", "Escolhas", "Objetivos"] },
      moon: { plainMeaning: "Como você sente e reage", description: "É o seu lado emocional: mostra reações automáticas e o que ajuda você a se sentir seguro e acolhido.", associations: ["Emoções", "Reações", "Segurança"] },
      ascendant: { plainMeaning: "Como você se mostra ao mundo", description: "É o seu jeito de chegar às situações, a impressão que costuma causar e a postura diante do novo.", associations: ["Primeira impressão", "Atitude", "Começos"] },
    },
  };
}

function PlacementCard({
  placement,
  label,
  plainMeaning,
  description,
  associations,
}: {
  placement: Placement;
  label: string;
  plainMeaning: string;
  description: string;
  associations: string[];
}) {
  return (
    <article className="big-three-card">
      <span className="big-three-symbol" aria-hidden="true">
        {placement.symbol}
      </span>
      <div>
        <small>{label}</small>
        <h3>{placement.sign}</h3>
        <p className="placement-degree">
          {placement.degree}
          {placement.house ? ` · Casa ${placement.house}` : ""}
        </p>
        <p className="big-three-plain-meaning">{plainMeaning}</p>
        <p>{description}</p>
        <div className="big-three-associations">
          <strong>Você percebe isso em:</strong>
          <div>
            {associations.map((association) => (
              <span key={association}>{association}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

const signExpression: Record<string, string> = {
  aries: "com iniciativa, franqueza e necessidade de movimento",
  taurus: "com constância, pragmatismo e atenção ao que é seguro",
  gemini: "por perguntas, trocas e experimentação de possibilidades",
  cancer: "a partir de vínculos, memória e proteção do que importa",
  leo: "com presença, criatividade e desejo de deixar sua marca",
  virgo: "por observação, utilidade e aperfeiçoamento dos detalhes",
  libra: "buscando equilíbrio, diálogo e boas relações",
  scorpio: "com profundidade, estratégia e disposição para renovar",
  sagittarius: "com visão ampla, curiosidade e busca de significado",
  capricorn: "por responsabilidade, estratégia e construção gradual",
  aquarius: "com independência, originalidade e visão de futuro",
  pisces: "com imaginação, sensibilidade e leitura das entrelinhas",
};

const houseAreas: Record<number, string> = {
  1: "no seu jeito de agir e começar",
  2: "no dinheiro, nas coisas importantes e na segurança",
  3: "nas conversas, nos estudos e nas pessoas próximas",
  4: "na casa, na família e na vida particular",
  5: "nas brincadeiras, na criatividade e no que dá prazer",
  6: "nos hábitos, nas tarefas e na rotina",
  7: "nas amizades próximas, no namoro e nos acordos",
  8: "na confiança, nas mudanças e nas coisas divididas com alguém",
  9: "nas ideias, nos estudos, nas viagens e nas descobertas",
  10: "no trabalho, nos objetivos e no que você quer construir",
  11: "nas amizades, nos grupos e nos planos para o futuro",
  12: "na imaginação, no descanso e nos sentimentos guardados",
};

const planetInterpretations: Record<string, (sign: string, style: string) => string> = {
  sun: (sign, style) => `O Sol mostra o que é importante para você e ajuda a entender suas escolhas. Em ${sign}, você costuma mostrar isso ${style}.`,
  moon: (sign, style) => `A Lua fala do que você sente e do que ajuda você a se acalmar quando o dia fica difícil. Em ${sign}, isso pode acontecer ${style}.`,
  mercury: (sign, style) => `Mercúrio mostra como você pensa, aprende e conversa. Em ${sign}, sua mente funciona ${style}.`,
  venus: (sign, style) => `Vênus fala do que você gosta e de como demonstra carinho. Em ${sign}, isso aparece ${style}.`,
  mars: (sign, style) => `Marte mostra como você age quando quer alguma coisa ou precisa resolver um problema. Em ${sign}, você costuma agir ${style}.`,
  jupiter: (sign, style) => `Júpiter fala do que pode ajudar você a aprender e crescer. Em ${sign}, novas experiências podem chamar sua atenção ${style}.`,
  saturn: (sign, style) => `Saturno fala de coisas que você aprende aos poucos, com prática e paciência. Em ${sign}, isso pode acontecer ${style}.`,
  uranus: (sign, style) => `Urano fala de ideias diferentes e vontade de fazer mudanças. Em ${sign}, isso pode aparecer ${style}.`,
  neptune: (sign, style) => `Netuno fala de imaginação e sensibilidade. Em ${sign}, você pode perceber o que os outros sentem ${style}; tente também confirmar o que está pensando.`,
  pluto: (sign, style) => `Plutão fala de mudanças importantes e de como você pode ficar mais forte depois delas. Em ${sign}, isso pode acontecer ${style}.`,
};

const placementThemeContext: Record<string, Record<string, string>> = {
  personalidade: {
    sun: "Isso ajuda a entender o que faz você se sentir mais autêntico.", moon: "Isso ilumina reações que surgem antes de você racionalizar.", mercury: "Isso aparece no seu jeito de aprender, explicar e interpretar as situações.", venus: "Isso se reflete nos seus gostos, limites e prioridades.", mars: "Isso aparece no jeito como você parte para a ação.", jupiter: "Isso indica onde você cresce ao confiar mais em si.", saturn: "Isso aponta uma maturidade que é construída passo a passo.", uranus: "Isso explica por que certos padrões repetidos incomodam tanto.", neptune: "Isso ajuda a reconhecer onde sua sensibilidade fica mais ativa.", pluto: "Isso revela uma força que tende a nascer depois de mudanças profundas.",
  },
  amor: {
    sun: "Nos vínculos, isso mostra o que você não deve deixar de ser para caber numa relação.", moon: "No afeto, isso revela o que ajuda você a baixar a guarda.", mercury: "Nas conversas difíceis, isso influencia o que você precisa ouvir e dizer com clareza.", venus: "No amor, isso descreve o que faz você se sentir valorizado.", mars: "Na aproximação e nos conflitos, isso mostra como você age quando algo importa.", jupiter: "Isso sugere o tipo de troca que faz uma relação ganhar espaço e confiança.", saturn: "Isso indica onde compromisso e limites saudáveis fazem diferença.", uranus: "Isso mostra a necessidade de preservar liberdade e novidade nos vínculos.", neptune: "Isso pede atenção ao equilíbrio entre idealizar e conhecer a pessoa real.", pluto: "Isso revela como intimidade e confiança podem transformar a forma de se relacionar.",
  },
  carreira: {
    sun: "No trabalho, isso ajuda a entender que tipo de realização tem sentido para você.", moon: "Na rotina profissional, isso mostra o clima de que você precisa para render bem.", mercury: "Isso aparece na sua forma de organizar ideias, negociar e resolver problemas.", venus: "Isso influencia seu senso de valor, colaboração e critérios profissionais.", mars: "Isso descreve seu ritmo de execução e a forma como você enfrenta desafios.", jupiter: "Isso aponta onde aprendizado, visibilidade ou novas experiências podem abrir caminhos.", saturn: "Isso mostra uma competência que se torna sólida com prática e constância.", uranus: "Isso indica onde inovação e autonomia podem ser importantes na sua trajetória.", neptune: "Isso fala de propósito, criatividade e da necessidade de objetivos claros.", pluto: "Isso sugere uma área em que você pode se reinventar profissionalmente.",
  },
  dinheiro: {
    sun: "Nas escolhas materiais, isso mostra os valores que precisam fazer sentido para você.", moon: "Isso ajuda a perceber como emoção e segurança podem influenciar hábitos.", mercury: "Isso aparece no jeito de pesquisar, comparar e decidir antes de gastar ou negociar.", venus: "Isso revela seus critérios de conforto, prazer e valor percebido.", mars: "Isso influencia sua iniciativa para buscar recursos e defender prioridades.", jupiter: "Isso fala de expansão, oportunidades e da importância de avaliar riscos com calma.", saturn: "Isso aponta onde planejamento e repetição podem trazer mais tranquilidade.", uranus: "Isso mostra uma relação mais aberta a alternativas e mudanças de estratégia.", neptune: "Isso pede clareza para separar desejo, generosidade e realidade prática.", pluto: "Isso destaca aprendizados profundos sobre controle, partilha e autonomia.",
  },
  momento: {
    sun: "Nesta fase, isso lembra qual direção merece continuar sendo sua referência.", moon: "Isso mostra como respeitar seu ritmo emocional enquanto as coisas se movem.", mercury: "Isso ajuda a perceber a conversa ou decisão que está pedindo mais clareza agora.", venus: "Isso aponta o que pode trazer leveza, cuidado e reconexão neste momento.", mars: "Isso revela onde sua energia pode ser usada com mais intenção.", jupiter: "Isso indica uma possibilidade de crescimento que vale observar sem pressa.", saturn: "Isso destaca uma responsabilidade que pede consistência, não cobrança excessiva.", uranus: "Isso sinaliza onde uma mudança de rota pode fazer sentido.", neptune: "Isso convida a pausar e distinguir pressentimento de ansiedade.", pluto: "Isso sugere um desapego ou reposicionamento que pode liberar força.",
  },
};

function explainPlacement(placement: Placement, theme: string) {
  const style = signExpression[placement.signKey] ?? "de um jeito próprio";
  const planetText = (planetInterpretations[placement.key] ?? planetInterpretations.sun)(
    placement.sign,
    style,
  );
  const focus = placementThemeContext[theme]?.[placement.key] ?? placementThemeContext.personalidade[placement.key] ?? "Este ponto acrescenta uma camada própria à sua leitura.";
  const degreeText = "Os graus são coordenadas, como um endereço: ajudam a marcar o lugar exato deste ponto no mapa. Não são notas.";
  const houseText = placement.house
    ? `Na Casa ${placement.house}, esse padrão tende a ficar mais perceptível ${houseAreas[placement.house] ?? "em uma área importante da sua vida"}.`
    : "Como o horário não foi informado com exatidão, a casa não aparece; a leitura do planeta no signo continua válida.";
  const retrogradeText = placement.retrograde
    ? `Retrógrado quer dizer que o planeta parece andar para trás quando visto da Terra. Na astrologia, isso convida a pensar melhor neste assunto; não quer dizer que algo esteja errado.`
    : "";

  return [planetText, focus, houseText, degreeText, retrogradeText]
    .filter(Boolean)
    .join(" ");
}

const simpleAspectMeanings: Record<string, string> = {
  conjunction: "esses dois assuntos tendem a se misturar e ganhar força juntos",
  opposition: "dois lados diferentes pedem equilíbrio",
  trine: "há facilidade natural entre esses assuntos",
  square: "há um desafio que pode pedir ajuste e iniciativa",
  sextile: "há uma oportunidade que cresce quando você participa",
};

function simpleAspectMeaning(aspectKey?: string, title = "") {
  if (aspectKey && simpleAspectMeanings[aspectKey]) return simpleAspectMeanings[aspectKey];
  const aspectByName: Array<[string, string]> = [
    ["conjunção", "conjunction"], ["oposição", "opposition"],
    ["trígono", "trine"], ["quadratura", "square"], ["sextil", "sextile"],
  ];
  const key = aspectByName.find(([name]) => title.toLocaleLowerCase("pt-BR").includes(name))?.[1];
  return key ? simpleAspectMeanings[key] : "uma conversa importante entre duas partes do mapa";
}

const zodiacRing = [
  { key: "aries", label: "Áries", symbol: "♈" },
  { key: "taurus", label: "Touro", symbol: "♉" },
  { key: "gemini", label: "Gêmeos", symbol: "♊" },
  { key: "cancer", label: "Câncer", symbol: "♋" },
  { key: "leo", label: "Leão", symbol: "♌" },
  { key: "virgo", label: "Virgem", symbol: "♍" },
  { key: "libra", label: "Libra", symbol: "♎" },
  { key: "scorpio", label: "Escorpião", symbol: "♏" },
  { key: "sagittarius", label: "Sagitário", symbol: "♐" },
  { key: "capricorn", label: "Capricórnio", symbol: "♑" },
  { key: "aquarius", label: "Aquário", symbol: "♒" },
  { key: "pisces", label: "Peixes", symbol: "♓" },
];

const aspectLineColors: Record<string, string> = {
  conjunction: "#e7bf75",
  opposition: "#ef8792",
  trine: "#79cdb4",
  square: "#d98ca9",
  sextile: "#9b9de8",
};

function chartPoint(longitude: number, radius: number) {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return {
    x: 260 + radius * Math.cos(angle),
    y: 260 + radius * Math.sin(angle),
  };
}

function NatalChart({ analysis }: { analysis: AnalysisResult }) {
  const hasHouses = Boolean(analysis.person.exactTime && analysis.houseCusps?.length === 12);
  const ascendantLongitude = analysis.bigThree.ascendant?.longitude;
  const sortedPlacements = [...analysis.placements].sort(
    (a, b) => a.longitude - b.longitude,
  );
  const labels = sortedPlacements.map((placement, index) => {
    const previous = sortedPlacements[(index + sortedPlacements.length - 1) % sortedPlacements.length];
    const next = sortedPlacements[(index + 1) % sortedPlacements.length];
    const previousGap = (placement.longitude - previous.longitude + 360) % 360;
    const nextGap = (next.longitude - placement.longitude + 360) % 360;
    const crowded = Math.min(previousGap, nextGap) < 10;
    const point = chartPoint(placement.longitude, 145);
    const text = chartPoint(placement.longitude, crowded ? (index % 2 ? 177 : 163) : 164);
    return { placement, point, text };
  });
  const positions = new Map(labels.map(({ placement, point }) => [placement.key, point]));
  const aspects = analysis.aspects.filter(
    (aspect) => aspect.point1Key && aspect.point2Key && positions.has(aspect.point1Key) && positions.has(aspect.point2Key),
  );
  const cusps = (analysis.houseCusps ?? []).slice().sort((a, b) => a.house - b.house);

  return (
    <figure className="natal-chart premium-only">
      <svg className="natal-chart-svg" viewBox="0 0 520 520" role="img" aria-labelledby="natal-chart-title natal-chart-description">
        <title id="natal-chart-title">Mapa astral natal de {analysis.person.firstName}</title>
        <desc id="natal-chart-description">
          Roda zodiacal com os planetas posicionados segundo as longitudes calculadas para o nascimento
          {hasHouses ? ", doze casas astrológicas e linhas ligando os principais aspectos" : ". O horário de nascimento não foi confirmado; por isso a roda não mostra casas nem Ascendente"}.
        </desc>
        <circle className="natal-chart-disc" cx="260" cy="260" r="226" />
        <circle className="natal-chart-ring" cx="260" cy="260" r="190" />
        <circle className="natal-chart-ring" cx="260" cy="260" r="137" />
        {Array.from({ length: 12 }, (_, index) => {
          const boundary = chartPoint(index * 30, 190);
          const inner = chartPoint(index * 30, 137);
          const label = chartPoint(index * 30 + 15, 208);
          return (
            <g key={index}>
              <line className="natal-chart-zodiac-line" x1={boundary.x} y1={boundary.y} x2={inner.x} y2={inner.y} />
              <text className="natal-chart-zodiac" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" aria-label={zodiacRing[index].label}>
                {zodiacRing[index].symbol}
              </text>
            </g>
          );
        })}
        {hasHouses && cusps.map((cusp) => {
          const outer = chartPoint(cusp.longitude, 137);
          const inner = chartPoint(cusp.longitude, 72);
          const next = cusps[cusp.house % 12];
          const nextLongitude = next?.longitude ?? cusp.longitude + 30;
          const midpoint = (cusp.longitude + ((nextLongitude - cusp.longitude + 360) % 360) / 2) % 360;
          const label = chartPoint(midpoint, 103);
          return (
            <g key={cusp.house}>
              <line className={`natal-chart-house-line${cusp.house === 1 || cusp.house === 10 ? " natal-chart-angle-line" : ""}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} />
              <text className="natal-chart-house" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">{cusp.house}</text>
            </g>
          );
        })}
        {aspects.map((aspect) => {
          const first = positions.get(aspect.point1Key!);
          const second = positions.get(aspect.point2Key!);
          if (!first || !second) return null;
          return <line key={`${aspect.point1Key}-${aspect.aspectKey}-${aspect.point2Key}`} className="natal-chart-aspect" x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke={aspectLineColors[aspect.aspectKey ?? ""] ?? "#d0b8ee"}><title>{aspect.title} · órbita {aspect.orb.toFixed(1)}°</title></line>;
        })}
        <circle className="natal-chart-center" cx="260" cy="260" r={hasHouses ? 61 : 75} />
        <text className="natal-chart-center-kicker" x="260" y={hasHouses ? 254 : 251} textAnchor="middle">ASTROIA</text>
        <text className="natal-chart-center-name" x="260" y={hasHouses ? 274 : 273} textAnchor="middle">{analysis.person.firstName}</text>
        {analysis.bigThree.ascendant && (() => {
          const point = chartPoint(ascendantLongitude!, 191);
          const label = chartPoint(ascendantLongitude!, 174);
          return <g><circle className="natal-chart-asc-dot" cx={point.x} cy={point.y} r="4" /><text className="natal-chart-angle-label" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">ASC</text><title>Ascendente em {analysis.bigThree.ascendant!.sign}</title></g>;
        })()}
        {analysis.midheaven && (() => {
          const point = chartPoint(analysis.midheaven!.longitude, 191);
          const label = chartPoint(analysis.midheaven!.longitude, 174);
          return <g><circle className="natal-chart-asc-dot" cx={point.x} cy={point.y} r="4" /><text className="natal-chart-angle-label" x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central">MC</text><title>Meio do Céu em {analysis.midheaven!.sign}</title></g>;
        })()}
        {labels.map(({ placement, text }) => (
          <g key={placement.key}>
            <line className="natal-chart-planet-stem" x1={chartPoint(placement.longitude, 137).x} y1={chartPoint(placement.longitude, 137).y} x2={text.x} y2={text.y} />
            <circle className="natal-chart-planet-dot" cx={chartPoint(placement.longitude, 137).x} cy={chartPoint(placement.longitude, 137).y} r="2.4" />
            <text className="natal-chart-planet" x={text.x} y={text.y} textAnchor="middle" dominantBaseline="central"><title>{placement.label} em {placement.sign}, {placement.degree}{placement.house ? `, casa ${placement.house}` : ""}</title>{placement.symbol}</text>
          </g>
        ))}
      </svg>
      <figcaption>
        <strong>Este é o desenho do seu céu de nascimento.</strong>
        <span>Os símbolos mostram onde cada planeta estava{analysis.aspects.length > 0 ? "; as linhas coloridas ligam aspectos entre eles" : ""}. O anel externo marca os signos{hasHouses ? "; os números no anel interno são as casas." : "."}</span>
        {!hasHouses && <span className="natal-chart-time-note">Como o horário não foi informado com precisão, não exibimos Ascendente nem casas: eles dependem do horário.</span>}
      </figcaption>
      <div className="natal-chart-legend" aria-label="Legenda dos aspectos">
        {Object.entries({ conjunction: "Conjunção", opposition: "Oposição", trine: "Trígono", square: "Quadratura", sextile: "Sextil" }).map(([key, label]) => (
          <span key={key}><i style={{ backgroundColor: aspectLineColors[key] }} />{label}</span>
        ))}
      </div>
    </figure>
  );
}

type FreeReadingData = NonNullable<AnalysisResult["freeReading"]>;

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

function kidPlanetSimple(name: string): Record<string, string> {
  return {
    sun: `quem ${name} é por dentro`,
    moon: `o que ${name} sente`,
    mercury: `como ${name} aprende e conversa`,
    venus: "o carinho e as amizades",
    mars: "a energia e as birras",
    jupiter: "os talentos e dons",
    saturn: "onde precisa de mais apoio",
    uranus: "o lado criativo e diferente",
    neptune: "a imaginação",
    pluto: "a força interior",
  };
}

/** Conta "viu a oferta" quando o elemento aparece na tela (uma vez por sessão). */
function useOfferView() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { trackFunnel("offer_view"); observer.disconnect(); }
    // A oferta nova é bem alta: conta assim que o começo dela entra na tela
    // (antes exigia 25% do bloco inteiro visível, o que o celular nem sempre mostra).
    }, { threshold: 0, rootMargin: "0px 0px -35% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/** Primeiras frases de um texto (o resto fica no mapa completo). */
function firstPart(text: string, max = 170) {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let out = sentences[0] ?? clean;
  if (out.length > max * 1.4) out = `${out.slice(0, max).replace(/\s+\S*$/, "")}…`;
  return out;
}

function LockedMore({ onUnlock, label = "Continua no mapa completo" }: { onUnlock: () => void; label?: string }) {
  return (
    <button className="fr-locked-more" onClick={onUnlock} type="button">
      <span aria-hidden="true">🔒</span> {label} <span aria-hidden="true">→</span>
    </button>
  );
}

const GUARANTEE_LINE = "Pagamento único · Liberado na hora · Garantia de 7 dias";

/** O que o mapa completo entrega, só com o que existe de verdade em cada versão. */
function offerValue(audience: FreeReadingData["audience"], name: string) {
  if (audience === "child") {
    return [
      `As 4 partes completas: como ${name} aprende, faz amigos, gasta energia e os talentos`,
      `Como acalmar ${name} nos dias difíceis`,
      `O número de destino de ${name}`,
      "Dicas práticas para quem cuida, com exemplos do dia a dia",
      "PDF completo para guardar",
    ];
  }
  if (audience === "teen") {
    return [
      "As 4 partes completas: estudos, turma, conflitos e talentos",
      "O que fazer quando bate a bad",
      "O seu número de destino",
      "Dicas para quem cuida de você",
      "PDF completo para guardar",
    ];
  }
  return [
    "As 4 áreas completas: amor, trabalho, dinheiro e momento atual",
    "Os seus próximos 12 meses, mês a mês",
    "A sua missão, o seu dom e o seu número de destino",
    "Novos stories para postar",
    "PDF completo para guardar",
  ];
}

type OfferBonus = { price: string; separate: string };

const OFFER_V2_VALUE = [
  "Os seus próximos 12 meses, mês a mês: o que cada fase pede",
  "Amor: como você ama, o que te atrai e o que te afasta",
  "Trabalho e dinheiro: onde você brilha e como o dinheiro chega",
  "A sua missão, o seu dom e o seu número de destino",
  "PDF completo e stories prontos para Instagram, TikTok e WhatsApp",
];

/** Oferta logo depois do arquétipo: ganchos do próprio mapa, uma frase real do pago e o que vem junto. */
function EarlyOffer({
  reading,
  firstName,
  price,
  onUnlock,
  preview,
  bonus,
  months,
  couple,
}: {
  reading: FreeReadingData;
  firstName: string;
  price: string;
  onUnlock: () => void;
  preview?: AnalysisResult["premiumPreview"];
  bonus?: OfferBonus;
  months?: AnalysisResult["monthsPreview"];
  couple?: { total: string };
}) {
  const ref = useOfferView();
  const kid = reading.audience === "child";
  return (
    <section className="fr-offer" aria-labelledby="fr-offer-title" ref={ref}>
      <span className="fr-kicker">{kid ? `O mapa completo de ${firstName}` : bonus ? `${firstName}, o seu mapa completo` : "O seu mapa completo"}</span>
      <h2 id="fr-offer-title">{kid ? `Isso é só o começo do mapa de ${firstName}` : couple ? "Vocês combinam de verdade? O seu mapa completo responde" : bonus ? "O que os seus próximos 12 meses guardam, mês a mês" : "Isso é só o começo do seu mapa"}</h2>
      {couple && (
        <div className="fr-couple">
          <p className="fr-couple-lead">💞 <b>Mapa completo + compatibilidade do casal + Numerologia do Nome</b>: os 3 por {price}.</p>
          <CompatSample compact />
        </div>
      )}
      {bonus && months?.loveMask && (
        <div className="fr-hook-love" role="note">
          <small>Seu mês mais forte para o amor</small>
          <strong><span className="fr-hook-mask">{months.loveMask.split(" de ")[0]}</span> de {months.loveMask.split(" de ")[1]} <span aria-hidden="true">🔒</span></strong>
          <em>Já está calculado no seu mapa. Ele aparece no mapa completo.</em>
        </div>
      )}
      {bonus && <p className="fr-offer-sub">Pelo seu mapa e pela sua numerologia: o tema de cada mês, o que fazer nele e quais são os seus meses fortes para o amor e para a sorte. Os seus já estão calculados aqui. 🔒</p>}

      {bonus && months && (
        <article className="fr-offer-preview fr-months">
          <small>Seus próximos 12 meses</small>
          <strong>{months.first.label}</strong>
          <p><b>{months.first.theme}.</b> {months.first.tip}</p>
          <ul className="fr-months-locked">
            {months.labels.slice(0, 5).map((label) => <li key={label}><span>{label}</span> 🔒</li>)}
            <li className="fr-months-more"><span>+ {Math.max(0, months.labels.length - 5)} meses</span> 🔒</li>
          </ul>
          <span className="fr-offer-preview-lock">
            <span aria-hidden="true">🔒</span>{" "}
            {months.love ? `${months.love} ${months.love > 1 ? "meses fortes" : "mês forte"} para o amor` : "Os seus meses fortes"}
            {months.luck ? ` e ${months.luck} de sorte em alta` : ""} já marcados no seu mapa completo
          </span>
        </article>
      )}

      {bonus && months?.element && (
        <div className="fr-hook-element" role="note">
          <span aria-hidden="true">{months.element.name === "Fogo" ? "🔥" : months.element.name === "Água" ? "💧" : months.element.name === "Ar" ? "🌬️" : "🌿"}</span>
          <p><b>{months.element.count} dos seus 10 planetas estão em {months.element.name}.</b> Isso pesa em como você ama, trabalha e decide, e o mapa completo explica cada um. 🔒</p>
        </div>
      )}

      {preview && !(bonus && months) && (
        <article className="fr-offer-preview">
          <small>{preview.label} · {preview.title}</small>
          <strong>{preview.blockTitle}</strong>
          <p>{preview.text}</p>
          <div className="fr-offer-blur" aria-hidden="true"><i /><i /><i /><i style={{ width: "55%" }} /></div>
          <span className="fr-offer-preview-lock"><span aria-hidden="true">🔒</span> O resto deste capítulo está no mapa completo</span>
        </article>
      )}

      <ul className="fr-offer-hooks">
        {reading.teasers.map((teaser) => (
          <li key={teaser.id}>
            <span className="fr-offer-symbol" aria-hidden="true">{teaser.symbol}</span>
            <span>
              <small>{teaser.label}</small>
              <b>{teaser.title}</b>
              <em>{firstPart(teaser.opening, 110)} <span className="fr-offer-more">E tem mais… 🔒</span></em>
            </span>
          </li>
        ))}
      </ul>

      <div className="fr-offer-value">
        <strong>No mapa completo, você recebe:</strong>
        <ul>
          {(bonus ? OFFER_V2_VALUE : offerValue(reading.audience, firstName)).map((item) => (
            <li key={item}><span aria-hidden="true">✓</span> {item}</li>
          ))}
        </ul>
        {bonus && (
          <div className="fr-offer-bonus">
            <span aria-hidden="true">🎁</span>
            <p><b>{couple ? "Bônus: Compatibilidade do casal + Numerologia do Nome" : "Bônus: Numerologia do Nome completa"}</b> {couple ? "A sintonia de vocês no coração, na atração, na conversa e no dia a dia, e o que o seu nome revela sobre você. Vendidas à parte; aqui vêm junto." : <>O que o seu nome revela sobre você: alma, talentos, destino e dias de poder. Vendida à parte por {bonus.price}; aqui vem junto.</>}</p>
          </div>
        )}
      </div>

      <ActivityPill kind="sales" />
      <div className="fr-offer-pricebox">
        {couple
          ? <small>Separados, os 3 custam {couple.total}. Juntos, você leva tudo por</small>
          : bonus
          ? <small>Separados, os dois custam {bonus.separate}. Juntos, você leva tudo por</small>
          : <small>Uma consulta com astrólogo costuma custar bem mais. Aqui, o mapa completo sai por</small>}
        <strong>{price}</strong>
        <span>pagamento único · sem assinatura</span>
      </div>
      <button className="analysis-button primary-analysis-button fr-offer-button" onClick={onUnlock} type="button">
        {kid ? `Quero ler o mapa completo de ${firstName}` : couple ? "Quero ver a nossa compatibilidade" : bonus ? "Quero ver os meus 12 meses" : "Quero ler o meu mapa completo"} <span aria-hidden="true">→</span>
      </button>
      <p className="fr-guarantee"><span aria-hidden="true">✓</span> {GUARANTEE_LINE}</p>
      <p className="fr-offer-hint">Ou role para ver o que mais o seu mapa guarda <span aria-hidden="true">↓</span></p>
    </section>
  );
}

type SiteStats = { mapsToday: number; mapsWeek: number; mapsTotal?: number; salesWeek: number; salesTotal?: number };
let statsPromise: Promise<SiteStats | null> | null = null;
function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  useEffect(() => {
    statsPromise ??= fetch("/api/stats").then((r) => (r.ok ? r.json() as Promise<SiteStats> : null)).catch(() => null);
    let alive = true;
    void statsPromise.then((value) => { if (alive) setStats(value); });
    return () => { alive = false; };
  }, []);
  return stats;
}

/** Prova social honesta: só números reais, e só quando já são bons. */
function ActivityPill({ kind }: { kind: "maps" | "sales" }) {
  const stats = useSiteStats();
  if (!stats) return null;
  let text = "";
  if (kind === "sales") {
    const sold = stats.salesTotal ?? 0;
    if (sold === 1) text = "1 pessoa já desbloqueou o mapa completo";
    else if (sold > 1) text = `${sold} pessoas já desbloquearam o mapa completo`;
  } else if ((stats.mapsTotal ?? 0) >= 20) {
    return (
      <div className="activity-hero" role="status">
        <span className="activity-dot" aria-hidden="true" />
        <strong>{stats.mapsTotal}</strong>
        <span>mapas já feitos no AstroIA{stats.mapsToday >= 5 ? <em> · {stats.mapsToday} hoje</em> : null}</span>
      </div>
    );
  } else if (stats.mapsToday >= 5) {
    text = `${stats.mapsToday} mapas feitos hoje no AstroIA`;
  } else if (stats.mapsWeek >= 10) {
    text = `${stats.mapsWeek} mapas feitos nesta semana no AstroIA`;
  }
  if (!text) return null;
  return <p className="activity-pill"><span className="activity-dot" aria-hidden="true" /> {text}</p>;
}

/** Barra fixa de compra: aparece depois da primeira oferta e some perto da oferta final. */
function StickyBuyBar({ price, label, onUnlock, hidden, cta = "Quero ler", note }: { price: string; label: string; onUnlock: () => void; hidden: boolean; cta?: string; note?: string }) {
  const [show, setShow] = useState(false);
  const [lift, setLift] = useState(0);
  const shown = useRef(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const offer = document.querySelector(".fr-offer");
      const cookie = document.querySelector(".cookie-bar");
      // Com o aviso de cookies aberto, a barra sobe e fica logo acima dele.
      const cookieRect = cookie?.getBoundingClientRect();
      setLift(cookieRect && cookieRect.height > 0 ? Math.max(0, Math.min(window.innerHeight / 2, window.innerHeight - cookieRect.top + 10)) : 0);
      // Antes do mapa grátis a barra já aparece desde o primeiro acesso.
      if (!offer) { setShow(true); return; }
      // Aparece assim que o mapa grátis chega na tela e, a partir daí, fica fixa:
      // não some mais ao rolar para cima nem para baixo.
      const result = document.getElementById("analise");
      if (result && result.getBoundingClientRect().top < window.innerHeight * 0.6) shown.current = true;
      setShow(shown.current);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const timer = window.setInterval(update, 1500); // o aviso de cookies pode fechar sem rolagem
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearInterval(timer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  // Espaço no fim da página para a barra não cobrir o rodapé.
  useEffect(() => {
    document.body.classList.toggle("has-buy-bar", show && !hidden);
    return () => document.body.classList.remove("has-buy-bar");
  }, [show, hidden]);
  if (hidden || !show) return null;
  return (
    <div className="buy-bar" role="region" aria-label="Comprar o mapa completo" style={lift ? { bottom: lift } : undefined}>
      <div>
        <strong><span aria-hidden="true">✦</span> {label}</strong>
        <small>{note ?? `${price} · garantia de 7 dias`}</small>
      </div>
      <button onClick={onUnlock} type="button">{cta} <span aria-hidden="true">→</span></button>
    </div>
  );
}

function FreeReadingView({
  analysis,
  reading,
  premium,
  nameReading,
  offerPrice,
  onUnlock,
  bonus,
  couple,
}: {
  analysis: AnalysisResult;
  reading: FreeReadingData;
  premium?: PremiumReading | null;
  nameReading?: NameReading | null;
  /** Só na prévia grátis: mostra a oferta cedo e trava a continuação de alguns textos. */
  offerPrice?: string;
  onUnlock?: () => void;
  bonus?: OfferBonus;
  couple?: { total: string };
}) {
  const kid = reading.audience === "child";
  const kidName = analysis.person.firstName;
  const planetSimple = kid ? kidPlanetSimple(kidName) : PLANET_SIMPLE;
  // Prévia grátis enxuta: arquétipo, o trio em 1 linha, a oferta e 1 story.
  // Tudo o mais aparece só no mapa completo (que usa esta mesma tela, completa).
  const compact = Boolean(onUnlock && offerPrice);
  const storyCards = [...personalCards(reading, premium ?? null, analysis.person), ...(nameReading ? nameCards(nameReading) : [])];
  const shownCards = compact && !nameReading ? storyCards.filter((card) => card.id === "arquetipo") : storyCards;
  return (
    <div className="fr">
      <section className="fr-archetype" aria-labelledby="fr-archetype-title">
        <span className="fr-kicker">{kid ? `O arquétipo de ${kidName}` : "Seu arquétipo"}</span>
        <h2 id="fr-archetype-title">{reading.archetype.name}</h2>
        <p className="fr-archetype-text">{reading.archetype.text}</p>
        <p className="fr-archetype-combos">{reading.archetype.combinations}</p>
        {compact && (
          <ul className="fr-trio">
            {reading.layers.map((layer) => (
              <li key={layer.id}>
                <span className="fr-layer-symbol" aria-hidden="true">{layer.symbol}</span>
                <span>
                  <small>{layer.role} em {layer.sign}</small>
                  <b>{layer.headline}</b>
                </span>
              </li>
            ))}
          </ul>
        )}
        {compact && reading.noTimeNote && <p className="fr-note">{reading.noTimeNote}</p>}
      </section>

      {onUnlock && offerPrice && (
        <EarlyOffer couple={couple} months={analysis.monthsPreview} bonus={!reading.audience || reading.audience === "adult" ? bonus : undefined} firstName={kidName} onUnlock={onUnlock} preview={analysis.premiumPreview} price={offerPrice} reading={reading} />
      )}

      <div className="fr-stories">
        <StoryShare
          cards={shownCards}
          filePrefix="meu-mapa-astroia"
          shareText={
            kid
              ? `Aqui em casa mora ${reading.archetype.name} ✦ Descubra o da sua criança:`
              : `Meu arquétipo no AstroIA é ${reading.archetype.name} ✦ Descubra o seu:`
          }
          subtitle={
            compact && !nameReading
              ? kid
                ? `Poste o arquétipo de ${kidName} e veja quantos amigos vão querer descobrir o da criança deles 💛 No mapa completo vêm mais stories.`
                : "Poste o seu arquétipo e veja quantos amigos vão querer descobrir o deles 👀 No mapa completo vêm mais stories: o seu trio, o seu superpoder e outros."
              : kid
                ? `Stories com o arquétipo, o trio e o superpoder de ${kidName}. Mostre para a família e para os amigos 💛`
                : "Fizemos stories com o seu arquétipo, o seu trio e o seu superpoder. Poste e veja quantos amigos vão querer descobrir o deles 👀"
          }
          title={kid ? `Mostre o mapa de ${kidName}` : "Mostre o seu mapa para os amigos"}
        />
      </div>

      {!compact && (<>
      {analysis.placements.length > 0 && (
        <section className="fr-chart" aria-labelledby="fr-chart-title">
          <span className="fr-kicker">Seu céu de nascimento</span>
          <h2 id="fr-chart-title">{kid ? `Assim estava o céu quando ${kidName} nasceu` : "Assim estava o céu quando você nasceu"}</h2>
          <p>
            {kid
              ? `No dia e na hora em que ${kidName} nasceu, cada planeta estava passando por um signo do céu. Cada planeta cuida de uma parte do jeito de ser, e o signo mostra como essa parte aparece em ${kidName}.`
              : "No dia e na hora em que você nasceu, cada planeta estava passando por um signo do céu. Cada planeta cuida de uma parte da sua vida, e o signo mostra o jeito como essa parte funciona em você."}
          </p>
          <NatalChart analysis={analysis} />
          <ul className="fr-planet-list">
            {analysis.bigThree.ascendant && (
              <li>
                <span className="fr-planet-symbol" aria-hidden="true">↑</span>
                <span className="fr-planet-name">
                  Ascendente em <strong>{analysis.bigThree.ascendant.sign}</strong>
                </span>
                <small>{kid ? `como ${kidName} chega nos lugares` : "como os outros veem você"}</small>
              </li>
            )}
            {analysis.placements.map((placement) => (
              <li key={placement.key}>
                <span className="fr-planet-symbol" aria-hidden="true">{placement.symbol}</span>
                <span className="fr-planet-name">
                  {placement.label} em <strong>{placement.sign}</strong>
                </span>
                <small>{planetSimple[placement.key] ?? ""}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="fr-layers" aria-labelledby="fr-layers-title">
        <span className="fr-kicker">{kid ? `As partes mais importantes do mapa de ${kidName}` : "As partes mais importantes do seu mapa"}</span>
        <h2 id="fr-layers-title">{reading.mirror.title}</h2>
        <div className="fr-layer-grid">
          {reading.layers.map((layer) => (
            <article className={`fr-layer fr-layer-${layer.id}`} key={layer.id}>
              <div className="fr-layer-top">
                <span className="fr-layer-symbol" aria-hidden="true">
                  {layer.symbol}
                </span>
                <div>
                  <small>
                    {layer.role} em {layer.sign}
                  </small>
                  <span className="fr-layer-question">{layer.question}</span>
                </div>
              </div>
              <h3>{layer.headline}</h3>
              <p>{layer.text}</p>
              <div className="fr-traits">
                <div>
                  <strong>{kid ? "Pontos fortes" : "No seu melhor"}</strong>
                  <ul>
                    {layer.gifts.map((gift) => (
                      <li key={gift}>{gift}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>{kid ? "Pode ficar difícil" : "Quando pesa"}</strong>
                  <ul className="fr-shadow-list">
                    {layer.shadows.map((shadow) => (
                      <li key={shadow}>{shadow}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
        {reading.noTimeNote && <p className="fr-note">{reading.noTimeNote}</p>}
      </section>

      <section className="fr-mirror" aria-labelledby="fr-mirror-title">
        <span className="fr-kicker">Juntando tudo</span>
        <h2 id="fr-mirror-title">{kid ? `Como as partes de ${kidName} conversam` : "Como as suas partes conversam"}</h2>
        {onUnlock ? (
          <>
            <p className="fr-mirror-text">{firstPart(reading.mirror.text)}</p>
            <LockedMore onUnlock={onUnlock} />
          </>
        ) : (
          <>
            <p className="fr-mirror-text">{reading.mirror.text}</p>
            <p>{reading.mirror.harmony}</p>
          </>
        )}
        {!onUnlock && reading.mirror.sameSign && (
          <p className="fr-same-sign">
            <span aria-hidden="true">✦</span> {reading.mirror.sameSign}
          </p>
        )}
      </section>

      <section className="fr-duo" aria-label="Seu superpoder e seu ponto de atenção">
        <article className="fr-duo-power">
          <span aria-hidden="true">⚡</span>
          <h3>{kid ? `Superpoder de ${kidName}` : "Seu superpoder"}</h3>
          <p>{reading.superpower}</p>
        </article>
        <article className="fr-duo-attention">
          <span aria-hidden="true">◐</span>
          <h3>{kid ? "Fique de olho" : "Seu ponto de atenção"}</h3>
          <p>{reading.attention}</p>
        </article>
      </section>
      </>)}
    </div>
  );
}

function FreeTeasers({
  reading,
  firstName,
  price,
  onUnlock,
  compatPrice,
  onUnlockWithCompat,
}: {
  reading: FreeReadingData;
  firstName: string;
  price: string;
  onUnlock: () => void;
  compatPrice?: string;
  onUnlockWithCompat?: () => void;
}) {
  // "Viu a oferta": a parte com os cadeados apareceu na tela.
  const offerRef = useOfferView();
  return (
    <section className="fr-teasers" aria-labelledby="fr-teasers-title" ref={offerRef}>
      <span className="fr-kicker">
        {reading.audience === "child" ? `O que o mapa de ${firstName} ainda guarda` : "O que o seu mapa ainda guarda"}
      </span>
      <h2 id="fr-teasers-title">
        {reading.audience === "child" ? "Isso foi só o começo" : `${firstName}, isso foi só o começo`}
      </h2>
      <p className="fr-teasers-intro">
        {reading.audience === "child"
          ? `Olha o começo do que o mapa diz sobre como ${firstName} aprende, faz amigos, gasta energia e quais são os talentos.`
          : "Olha o começo do que o seu mapa diz sobre as outras áreas da sua vida."}
      </p>
      <div className="fr-teaser-grid">
        {reading.teasers.map((teaser) => (
          <article className={`fr-teaser fr-teaser-${teaser.id}`} key={teaser.id}>
            <div className="fr-teaser-top">
              <span aria-hidden="true">{teaser.symbol}</span>
              <small>{teaser.label}</small>
            </div>
            <h3>{teaser.title}</h3>
            <p>{teaser.opening}</p>
            <p className="fr-cliff" aria-hidden="true">
              {teaser.cliff}…
            </p>
            <ul className="fr-locked">
              {teaser.locked.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">🔒</span> {item}
                </li>
              ))}
            </ul>
            <button className="fr-teaser-unlock" onClick={onUnlock} type="button">
              Ler o resto
            </button>
          </article>
        ))}
      </div>
      {onUnlockWithCompat && compatPrice && (
        <article className="fr-compat-teaser">
          <div className="fr-teaser-top">
            <span aria-hidden="true">♡</span>
            <small>Compatibilidade do casal</small>
          </div>
          <h3>E como você combina com o seu par?</h3>
          <p>
            Cruze o seu mapa com o de quem você ama e descubra a porcentagem de
            sintonia de vocês, o arquétipo do casal, como cada pessoa se sente
            amada e como fazer as pazes depois de uma briga.
          </p>
          <ul className="fr-locked">
            <li><span aria-hidden="true">🔒</span> A sintonia de vocês, em porcentagem</li>
            <li><span aria-hidden="true">🔒</span> Coração, atração, conversa e dia a dia</li>
            <li><span aria-hidden="true">🔒</span> Stories do casal para postar</li>
          </ul>
          <button className="fr-teaser-unlock" onClick={onUnlockWithCompat} type="button">
            Quero o mapa + compatibilidade (+ {compatPrice})
          </button>
        </article>
      )}
      <div className="fr-unlock-box">
        <div>
          <strong>Mapa completo · {price}</strong>
          <p>
            {reading.audience === "teen"
              ? "Pagamento único, sem assinatura. Você recebe na hora as quatro partes completas, o que fazer quando bate a bad, o seu número de destino, dicas para quem cuida e o PDF para guardar."
              : reading.audience === "child"
              ? `Pagamento único, sem assinatura. Você recebe na hora as quatro partes completas, como acalmar ${firstName}, o número de destino e dicas práticas para quem cuida, com o PDF para guardar.`
              : "Pagamento único, sem assinatura. Você recebe na hora as quatro áreas completas, a sua missão, o seu dom, os próximos 12 meses e o PDF para guardar."}
          </p>
        </div>
        <button
          className="analysis-button primary-analysis-button"
          onClick={onUnlock}
          type="button"
        >
          {reading.audience === "child" ? `Quero ler o mapa completo de ${firstName}` : "Quero ler o meu mapa completo"}
        </button>
        <p className="fr-guarantee fr-guarantee-wide"><span aria-hidden="true">✓</span> Garantia de 7 dias: se não gostar, devolvemos o seu dinheiro.</p>
      </div>
    </section>
  );
}

type Products = { map: boolean; compat: boolean; name?: boolean };
type ReportPayload = {
  analysis: AnalysisResult;
  reportTier: ReportTier;
  products?: Products;
  orderId?: string | null;
  pendingItems?: string[];
  compat?: CompatState;
  nameReading?: NameReading | null;
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Repete a requisição se a rede falhar (comum no celular ao trocar de app/aba). */
async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
}

export default function Home({
  paymentAmountCents = 3790,
  compatAmountCents = 3200,
  compatEnabled = false,
  nameAmountCents = 1990,
  paymentsEnabled = true,
  directPayments = false,
  offerV2 = false,
}: {
  paymentAmountCents?: number;
  compatAmountCents?: number;
  compatEnabled?: boolean;
  nameAmountCents?: number;
  paymentsEnabled?: boolean;
  directPayments?: boolean;
  /** Oferta v2: foco nos próximos 12 meses + Numerologia do Nome de bônus. */
  offerV2?: boolean;
}) {
  const paymentPrice = formatPrice(paymentAmountCents);
  // Prévia da oferta nova só para o dono ver (?oferta=v2): mostra o texto, mas não vende.
  const [previewV2, setPreviewV2] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("oferta") === "v2") window.sessionStorage.setItem("astroia-preview-v2", "1");
      if (!offerV2 && window.sessionStorage.getItem("astroia-preview-v2") === "1") setPreviewV2(true);
    } catch { /* sem storage */ }
  }, [offerV2]);
  const compatPrice = formatPrice(compatAmountCents);
  const namePrice = formatPrice(nameAmountCents);
  const [nameReading, setNameReading] = useState<NameReading | null>(null);
  const [downsell, setDownsell] = useState(false);
  // Oferta de saída: quem ia fechar o pagamento do mapa ganha a compatibilidade de presente (uma vez).
  const [exitOffer, setExitOffer] = useState(false);
  const [products, setProducts] = useState<Products>({ map: false, compat: false });
  const [compat, setCompat] = useState<CompatState>(null);
  const [pendingItems, setPendingItems] = useState<string[]>([]);
  const [checkoutProduct, setCheckoutProduct] = useState<"map" | "compat" | "name">("map");
  const [addCompat, setAddCompat] = useState(false);
  const paymentTest = paymentAmountCents === 100;
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("personalidade");
  const [reportTier, setReportTier] = useState<ReportTier>("free");
  const [recipientType, setRecipientType] =
    useState<RecipientType>("self");
  const [offerMode, setOfferMode] = useState<OfferMode>("individual");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [reportToken, setReportToken] = useState("");
  useEffect(() => { setTrackingReport(reportToken); }, [reportToken]);
  const [accessStatus, setAccessStatus] = useState("");
  const [reportOpening, setReportOpening] = useState(false);
  const [reportOpeningStep, setReportOpeningStep] = useState(0);
  const [returnedFromPayment, setReturnedFromPayment] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState("");
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [emailPreviewHtml, setEmailPreviewHtml] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>({
    kind: "idle",
    message: "",
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] =
    useState<CheckoutStatus>("idle");
  const [checkoutIntent, setCheckoutIntent] =
    useState<CheckoutIntent>("generate");
  const [pendingAnalysis, setPendingAnalysis] =
    useState<AnalysisRequest | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  // Pagamento dentro do site (Pix/cartão sem login no Mercado Pago).
  const [directCheckout, setDirectCheckout] = useState<{ orderId: string; publicKey: string; amount: number; email: string; pix: boolean; initialPix?: PixInfo | null } | null>(null);
  const activeCheckoutOrderId = useRef<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    city: "",
    country: "Brasil",
    email: "",
  });

  // E-mail lembrado neste aparelho: volta preenchido no formulário e no pagamento.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("astroia-email") || "";
      if (saved) {
        setForm((current) => (current.email ? current : { ...current, email: saved }));
        setCheckoutEmail((current) => current || saved);
      }
    } catch { /* sem storage */ }
  }, []);

  const childAudience =
    (recipientType === "child" && !form.birthDate) ||
    Boolean(form.birthDate && isMinorBirthDate(form.birthDate));
  const visibleThemes = childAudience ? childThemes : themes;
  const checkoutOffer = { ...checkoutOffers[offerMode], price: paymentPrice };
  const checkoutTheme =
    visibleThemes.find((theme) => theme.id === selectedTheme)?.label ??
    "Personalidade";
  const checkoutPersonName =
    checkoutIntent === "upgrade"
      ? analysis?.person.fullName ?? form.name
      : pendingAnalysis?.name ?? form.name;
  const checkoutThemeLabel =
    checkoutIntent === "upgrade"
      ? analysis?.themeDeepDive.label ?? checkoutTheme
      : checkoutTheme;
  const themeLens = analysis
    ? buildThemeLens(
        analysis.themeDeepDive.id,
        analysis.themeDeepDive.label,
        analysis.bigThree.sun.sign,
        analysis.bigThree.moon.sign,
        analysis.bigThree.ascendant?.sign,
      )
    : null;
  const newFreeReading =
    reportTier === "free" && analysis?.freeReading ? analysis.freeReading : null;
  const newPremium =
    reportTier === "premium" && analysis?.premiumReading && analysis.freeReading
      ? analysis.premiumReading
      : null;
  const compatOffered =
    compatEnabled && paymentsEnabled && Boolean(analysis) && !analysis?.person.isMinor;
  // A numerologia do nome usa o mesmo meio de pagamento da compatibilidade.
  const nameOffered = compatOffered && !products.name;
  // Quem veio do anúncio do casal (utm_content com "casal") quer a compatibilidade:
  // a oferta principal já leva mapa + compatibilidade + numerologia por um preço só.
  const [coupleAd, setCoupleAd] = useState(false);
  useEffect(() => {
    try {
      // Na primeira visita o link ainda tem o utm_content; depois vale a origem guardada.
      const fromLink = new URLSearchParams(window.location.search).get("utm_content") ?? "";
      setCoupleAd(/casal/i.test(fromLink) || /casal/i.test(currentAttribution()?.content ?? ""));
    } catch { /* sem storage */ }
  }, []);
  const coupleOffer = offerV2 && coupleAd && compatOffered && !products.compat && !products.map;
  // Bônus real: a Numerologia do Nome é vendida à parte; aqui vem junto com o mapa.
  const bonus = (offerV2 || previewV2) && nameOffered && !products.map
    ? { price: namePrice, separate: formatPrice(paymentAmountCents + nameAmountCents) }
    : undefined;
  const checkoutItems: Array<"map" | "compat" | "name"> =
    checkoutProduct === "compat"
      ? ["compat"]
      : checkoutProduct === "name"
        ? ["name"]
        : exitOffer || (addCompat && compatOffered) ? ["map", "compat"] : ["map"];
  const checkoutTotalCents = exitOffer && checkoutProduct === "map"
    ? paymentAmountCents
    : checkoutItems.reduce(
      (sum, item) => sum + (item === "map" ? paymentAmountCents : item === "compat" ? compatAmountCents : nameAmountCents),
      0,
    );
  const checkoutTotal = formatPrice(checkoutTotalCents);

  function applyReport(payload: ReportPayload, token: string) {
    setAnalysis(payload.analysis);
    setReportTier(payload.reportTier);
    setProducts(payload.products ?? { map: payload.reportTier === "premium", compat: false });
    setCompat(payload.compat ?? null);
    setNameReading(payload.nameReading ?? null);
    setPendingItems(payload.pendingItems ?? []);
    saveMap(payload.analysis, payload.reportTier, token);
    confirmPendingPurchase({ ...(payload.products ?? {}), map: payload.reportTier === "premium" });
  }

  function openNameCheckout(fromDownsell = false) {
    setCheckoutProduct("name");
    setDownsell(fromDownsell);
    setCheckoutEmail((current) => current || form.email);
    openCheckout(null, "upgrade");
  }

  function openMapOffer() {
    setOfferMode("individual");
    setCheckoutProduct("map");
    setCheckoutEmail((current) => current || form.email);
    openCheckout(null, "upgrade");
    if (coupleOffer) {
      // Oferta do casal: já abre com os 3 produtos pelo preço do mapa (e fechar fecha de vez).
      try { window.sessionStorage.setItem("astroia-exit-offer", "1"); } catch { /* sem storage */ }
      setExitOffer(true);
    }
  }

  function openCompatCheckout() {
    setCheckoutProduct("compat");
    setCheckoutEmail((current) => current || form.email);
    openCheckout(null, "upgrade");
  }

  async function loadPrivateReport(token: string, refresh = true) {
    setReportOpeningStep(0);
    setReportOpening(true);
    setAccessStatus("Consultando seu relatório e a confirmação de pagamento...");
    try {
      const response = await fetch("/api/report", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token, refresh})});
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setReportToken(token); applyReport(payload, token); setAwaitingPayment(Boolean(payload.orderId));
      setAccessStatus(payload.reportTier === "premium" ? "Seu mapa completo está aberto. Guarde este link para voltar quando quiser." : payload.orderId ? "Pagamento ainda não confirmado. Guarde este link e consulte novamente em instantes." : "Sua prévia está disponível. Guarde seu link privado.");
      window.setTimeout(() => document.getElementById("analise")?.scrollIntoView({behavior:"smooth"}), 100);
    } catch(error) { setAccessStatus(error instanceof Error ? error.message : "Não foi possível abrir o mapa."); }
    finally { window.setTimeout(() => setReportOpening(false), 2200); }
  }
  useEffect(() => {
    if (!reportOpening) return;
    const timer = window.setInterval(() => setReportOpeningStep((step) => (step + 1) % mapOpeningMessages.length), 650);
    return () => window.clearInterval(timer);
  }, [reportOpening]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DEVICE_MAPS_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) as SavedMap[] : [];
      const now = Date.now();
      setSavedMaps(stored.filter((item) => typeof item.reportToken === "string" && Date.parse(item.expiresAt) > now));
    } catch { setSavedMaps([]); }
    setMapsLoaded(true);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const token = hash.get("report");
    setReturnedFromPayment(hash.get("payment") === "success");
    if (token) void loadPrivateReport(token);
  }, []);

  useEffect(() => {
    if (!mapsLoaded) return;
    window.localStorage.setItem(DEVICE_MAPS_STORAGE_KEY, JSON.stringify(savedMaps));
  }, [mapsLoaded, savedMaps]);

  useEffect(() => {
    if (!awaitingPayment || !reportToken) return;
    let checks = 0;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      if (++checks > 360) { window.clearInterval(timer); return; }
      try {
        const response = await fetch("/api/report", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({token:reportToken, refresh: checks % 6 === 0})});
        if (!response.ok) return;
        const payload = await response.json() as ReportPayload;
        if (cancelled) return;
        const unlockedMap = payload.reportTier === "premium" && !products.map;
        const unlockedCompat = Boolean(payload.products?.compat) && !products.compat;
        const unlockedName = Boolean(payload.products?.name) && !products.name;
        if (unlockedMap || unlockedCompat || unlockedName || !payload.orderId) {
          applyReport(payload, reportToken);
          if (unlockedMap || unlockedCompat || unlockedName) { setDirectCheckout(null); setCheckoutOpen(false); setCheckoutStatus("idle"); }
          if (!payload.orderId) setAwaitingPayment(false);
          if (unlockedMap) setAccessStatus("Pagamento confirmado! Seu mapa completo e o PDF estão liberados.");
          else if (unlockedCompat) {
            setAccessStatus("Pagamento confirmado! Agora é só preencher os dados do seu par.");
            window.setTimeout(() => document.getElementById("compatibilidade")?.scrollIntoView({ behavior: "smooth" }), 150);
          } else if (unlockedName) {
            setAccessStatus("Pagamento confirmado! A Numerologia do Nome está liberada.");
            window.setTimeout(() => document.getElementById("numerologia-nome")?.scrollIntoView({ behavior: "smooth" }), 150);
          }
        }
      } catch { /* Manual consultation remains available. */ }
    }, 5000);
    return () => {cancelled = true; window.clearInterval(timer);};
  }, [awaitingPayment, reportToken, products.map, products.compat, products.name]);

  useEffect(() => {
    if (!checkoutOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && checkoutStatus !== "processing") {
        setCheckoutOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [checkoutOpen, checkoutStatus]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveMap(result: AnalysisResult, tier: ReportTier, token = reportToken) {
    if (!token) return;
    const now = Date.now();
    const existing = savedMaps.find((item) => item.reportToken === token);
    const nextMap: SavedMap = {
      id:
        existing?.id ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      reportToken: token,
      personName: result.person.fullName,
      reportTier: tier,
      createdAt: existing?.createdAt ?? new Date(now).toISOString(),
      expiresAt: new Date(now + DEVICE_MAPS_RETENTION_MS).toISOString(),
    };
    setSavedMaps((current) => [nextMap, ...current.filter((item) => item.id !== nextMap.id)]);

  }

  function openSavedMap(savedMap: SavedMap) {
    window.history.replaceState({}, "", `/#report=${savedMap.reportToken}`);
    void loadPrivateReport(savedMap.reportToken);
  }

  function deleteSavedMap(id: string) {
    setSavedMaps((current) => current.filter((item) => item.id !== id));
  }

  function prepareNewMap(
    nextRecipient: RecipientType,
    nextOffer: OfferMode,
    nextTier: ReportTier = "premium",
  ) {
    activeCheckoutOrderId.current = null;
    window.sessionStorage.removeItem(PAYMENT_CHECKOUT_STORAGE_KEY);
    setReportToken("");
    window.history.replaceState({}, "", "/#criar");
    setAnalysis(null);
    setRecipientType(nextRecipient);
    setOfferMode(nextOffer);
    setReportTier(nextTier);
    setSelectedTheme("personalidade");
    setPdfStatus("");
    setEmailPanelOpen(false);
    setEmailPreviewHtml("");
    setDeliveryStatus({ kind: "idle", message: "" });
    setCheckoutOpen(false);
    setCheckoutStatus("idle");
    setPendingAnalysis(null);
    setForm((current) => ({
      name: "",
      birthDate: "",
      birthTime: "",
      city: "",
      country: "Brasil",
      email: current.email,
    }));
    window.setTimeout(() => {
      document
        .getElementById("criar")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function readApiError(response: Response, fallback: string) {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function handlePdfDownload() {
    if (!analysis || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setPdfStatus("Preparando seu PDF...");

    try {
      const response = await fetch("/api/report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: reportToken }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(
            response,
            "Não foi possível criar o PDF agora.",
          ),
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename =
        filenameMatch?.[1] ??
        `AstroIA-${analysis.person.firstName}-${
          reportTier === "premium" ? "Premium" : "Essencial"
        }.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      const mobileLike =
        window.matchMedia("(max-width: 760px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
      let browserCanShareFile = false;
      if (mobileLike && typeof navigator.share === "function") {
        try {
          browserCanShareFile =
            typeof navigator.canShare !== "function" ||
            navigator.canShare({ files: [file] });
        } catch {
          browserCanShareFile = false;
        }
      }
      const canShareFile =
        mobileLike &&
        typeof navigator.share === "function" &&
        browserCanShareFile;

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            text: `Meu mapa AstroIA sobre ${analysis.themeDeepDive.label}.`,
            title: filename.replace(/\.pdf$/i, ""),
          });
          setPdfStatus("PDF pronto para salvar ou compartilhar.");
          return;
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            shareError.name === "AbortError"
          ) {
            setPdfStatus("Compartilhamento cancelado. Toque novamente quando quiser.");
            return;
          }
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setPdfStatus("PDF gerado. Confira os downloads do seu aparelho.");
    } catch (error) {
      setPdfStatus(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o PDF agora.",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleEmailDelivery(action: "preview" | "send") {
    if (!analysis || deliveryStatus.kind === "loading") return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryEmail.trim())) {
      setDeliveryStatus({
        kind: "error",
        message: "Informe um e-mail válido para continuar.",
      });
      return;
    }

    setDeliveryStatus({
      kind: "loading",
      message:
        action === "preview"
          ? "Montando a prévia do e-mail..."
          : "Preparando o envio do mapa...",
    });

    try {
      const response = await fetch("/api/email-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          analysis,
          deliveryId:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          email: deliveryEmail.trim(),
          reportTier,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        mode?: "preview" | "preview-only" | "sent";
        previewHtml?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível preparar o e-mail.");
      }

      if (payload.previewHtml) setEmailPreviewHtml(payload.previewHtml);
      setDeliveryStatus({
        kind: payload.mode === "sent" ? "success" : "preview",
        message:
          payload.message ||
          (payload.mode === "sent"
            ? "Mapa enviado com sucesso."
            : "Prévia pronta para conferir."),
      });
    } catch (error) {
      setDeliveryStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível preparar o e-mail agora.",
      });
    }
  }

  async function generateAnalysis(
    request: AnalysisRequest,
    tier: ReportTier,
  ) {
    setReportTier(tier);
    setIsAnalyzing(true);
    setAnalysis(null);
    setAnalysisError("");
    setPdfStatus("");
    setEmailPanelOpen(false);
    setEmailPreviewHtml("");
    setDeliveryEmail(request.email);
    setDeliveryStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, reportTier: tier, attribution: currentAttribution() }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "Não foi possível calcular sua análise agora.",
        );
      }

      setReportToken(payload.reportToken);
      // Valor estimado de um mapa grátis para a Meta (~10% do preço do mapa completo).
      metaEvent("Lead", { content_name: "mapa_gratis", currency: "BRL", value: Math.round(paymentAmountCents * 0.1) / 100 }, `lead_${String(payload.reportToken).slice(0, 24)}`);
      window.history.replaceState({}, "", `/#report=${payload.reportToken}`);
      setReturnedFromPayment(false);
      const result = payload as AnalysisResult;
      setAnalysis(result);
      setProducts({ map: tier === "premium", compat: false });
      setCompat(null);
      setNameReading(null);
      setPendingItems([]);
      saveMap(result, tier, payload.reportToken);
      window.setTimeout(() => {
        document
          .getElementById("analise")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return true;
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular sua análise agora.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function openCheckout(
    request: AnalysisRequest | null,
    intent: CheckoutIntent,
  ) {
    activeCheckoutOrderId.current = null;
    setDirectCheckout(null);
    setExitOffer(false);
    trackFunnel("offer_view"); // quem abriu a compra viu a oferta (o contador de "viu" não perde ninguém)
    trackFunnel("offer_open");
    // Sinal de intenção de compra para a Meta (abrir a tela de compra), mais forte que o Lead.
    try {
      if (!window.sessionStorage.getItem("astroia-atc")) {
        window.sessionStorage.setItem("astroia-atc", "1");
        metaEvent("AddToCart", { currency: "BRL", value: paymentAmountCents / 100, content_ids: ["map"], content_type: "product" });
      }
    } catch { /* sem storage */ }
    window.sessionStorage.removeItem(PAYMENT_CHECKOUT_STORAGE_KEY);
    setPendingAnalysis(request);
    setCheckoutIntent(intent);
    setCheckoutStatus("idle");
    setCheckoutError("");
    setCheckoutOpen(true);
  }

  // Botão "voltar" do celular com a compra aberta: fecha a compra (e mostra a oferta de
  // presente, uma vez) em vez de sair da página.
  const closeCheckoutRef = useRef<() => void>(() => {});
  const checkoutOpenRef = useRef(false);
  checkoutOpenRef.current = checkoutOpen;
  useEffect(() => {
    if (!checkoutOpen) return;
    const mark = () => window.history.pushState({ ...(window.history.state || {}), astroiaCheckout: true }, "");
    mark();
    const onPop = () => {
      closeCheckoutRef.current();
      // Se a compra continuou aberta (apareceu a oferta de presente), o próximo "voltar" fecha.
      window.setTimeout(() => { if (checkoutOpenRef.current) mark(); }, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Fechou pelo X/botão: tira a marca do histórico (o "voltar" seguinte volta ao normal).
      if (window.history.state?.astroiaCheckout) window.history.back();
    };
  }, [checkoutOpen]);

  function closeCheckout() {
    if (checkoutStatus === "processing") return;
    if (directCheckout) {
      // Quem já abriu o pagamento (ex.: gerou o Pix) não vê oferta nova ao fechar.
      setDirectCheckout(null);
      setDownsell(false);
      setExitOffer(false);
      setCheckoutOpen(false);
      setCheckoutStatus("idle");
      setCheckoutError("");
      return;
    }
    // Oferta de saída (oferta v2): quem ia fechar o pagamento do mapa vê, uma única vez,
    // tudo por R$ 19,90 com a compatibilidade de presente.
    if (offerV2 && checkoutProduct === "map" && !products.map && !products.compat && compatOffered && !exitOffer) {
      let exitShown = false;
      try { exitShown = window.sessionStorage.getItem("astroia-exit-offer") === "1"; } catch { /* sem storage */ }
      if (!exitShown) {
        try { window.sessionStorage.setItem("astroia-exit-offer", "1"); } catch { /* sem storage */ }
        setExitOffer(true);
        trackFunnel("exit_view");
        setCheckoutError("");
        return;
      }
    }
    if (exitOffer) {
      setExitOffer(false);
      setCheckoutOpen(false);
      setCheckoutStatus("idle");
      setCheckoutError("");
      return;
    }
    // Downsell honesto: quem desiste do mapa completo vê, uma única vez,
    // a opção menor (Numerologia do Nome).
    let alreadyShown = false;
    try { alreadyShown = window.sessionStorage.getItem("astroia-downsell-name") === "1"; } catch { /* sem storage */ }
    if (checkoutProduct === "map" && !products.map && nameOffered && !downsell && !alreadyShown) {
      try { window.sessionStorage.setItem("astroia-downsell-name", "1"); } catch { /* sem storage */ }
      setCheckoutProduct("name");
      setDownsell(true);
      setCheckoutError("");
      return;
    }
    setDownsell(false);
    setCheckoutOpen(false);
    setCheckoutStatus("idle");
    setCheckoutError("");
  }

  closeCheckoutRef.current = closeCheckout;

  async function startAsaasCheckout(mode?: "redirect", method: "pix" | "card" = "pix") {
    if (checkoutStatus !== "idle") return;
    if (previewV2) {
      setCheckoutError("Isto é só uma prévia da oferta nova: o pagamento está desligado aqui.");
      return;
    }
    if (mode === "redirect") setDirectCheckout(null);
    if (!paymentsEnabled) {
      setCheckoutError("");
      setCheckoutStatus("approved");
      return;
    }
    // No celular, abrir outra aba antes da resposta faz o Safari pausar esta página
    // e a requisição falha ("Load failed"). Lá o pagamento abre na mesma aba.
    const sameTab = (directPayments && mode !== "redirect") || window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth < 820;
    const paymentWindow = sameTab ? null : window.open("about:blank", "_blank");
    if (paymentWindow) paymentWindow.opener = null;
    activeCheckoutOrderId.current = null;
    window.sessionStorage.removeItem(PAYMENT_CHECKOUT_STORAGE_KEY);
    setCheckoutStatus("processing");
    setCheckoutError("");
    try { const typed = (checkoutEmail || pendingAnalysis?.email || form.email || "").trim(); if (typed) window.localStorage.setItem("astroia-email", typed); } catch { /* sem storage */ }

    try {
      const response = await fetchWithRetry("/api/checkout", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          reportToken,
          customerEmail: checkoutEmail || pendingAnalysis?.email || form.email,
          personName: checkoutPersonName,
          themeLabel: checkoutThemeLabel,
          attribution: currentAttribution(),
          ad: adSignals(),
          ...(mode ? { mode } : {}),
          ...(exitOffer && checkoutProduct === "map" ? { exitOffer: true } : {}),
          ...(method === "pix" && mode !== "redirect" ? { pix: true } : {}),
        }),
      });
      const payload = (await response.json()) as {
        orderId?: string;
        checkoutUrl?: string;
        error?: string;
        mode?: string;
        publicKey?: string;
        amount?: number;
        email?: string;
        pix?: PixInfo;
        approved?: boolean;
      };
      if (response.ok && payload.orderId && payload.mode === "direct" && payload.publicKey) {
        activeCheckoutOrderId.current = payload.orderId;
        rememberPendingPurchase(payload.orderId, checkoutTotalCents / 100, checkoutItems);
        metaEvent("InitiateCheckout", { currency: "BRL", value: checkoutTotalCents / 100, content_ids: checkoutItems, content_type: "product", num_items: checkoutItems.length }, `ic_${payload.orderId}`);
        if (payload.approved) { setPendingItems(checkoutItems); setCheckoutStatus("idle"); void handleDirectApproved(); return; }
        setDirectCheckout({ orderId: payload.orderId, publicKey: payload.publicKey, amount: payload.amount ?? checkoutTotalCents / 100, email: payload.email || checkoutEmail, pix: method === "pix", initialPix: payload.pix ?? null });
        setPendingItems(checkoutItems);
        if (payload.pix?.code) setAwaitingPayment(true);
        setCheckoutStatus("idle");
        return;
      }
      if (!response.ok || !payload.orderId || !payload.checkoutUrl) {
        throw new Error(payload.error || "Não foi possível abrir o pagamento.");
      }

      const checkoutSession: PendingCheckoutSession = {
        orderId: payload.orderId,
        offerMode,
        checkoutIntent,
        pendingAnalysis,
        currentAnalysis: checkoutIntent === "upgrade" ? analysis : null,
        createdAt: Date.now(),
      };
      activeCheckoutOrderId.current = payload.orderId;
      rememberPendingPurchase(payload.orderId, checkoutTotalCents / 100, checkoutItems);
      metaEvent("InitiateCheckout", { currency: "BRL", value: checkoutTotalCents / 100, content_ids: checkoutItems, content_type: "product", num_items: checkoutItems.length }, `ic_${payload.orderId}`);
      window.sessionStorage.setItem(
        PAYMENT_CHECKOUT_STORAGE_KEY,
        JSON.stringify(checkoutSession),
      );
      if (paymentWindow) paymentWindow.location.replace(payload.checkoutUrl);
      else { window.location.assign(payload.checkoutUrl); return; }
      setCheckoutStatus("idle"); setCheckoutOpen(false); setAwaitingPayment(true); setPendingItems(checkoutItems);
      setAccessStatus(
        checkoutProduct === "compat"
          ? "Conclua o pagamento na aba do Mercado Pago. Assim que ele for confirmado, a compatibilidade abre aqui sozinha."
          : checkoutProduct === "name"
            ? "Conclua o pagamento na aba do Mercado Pago. Assim que ele for confirmado, a Numerologia do Nome abre aqui sozinha."
          : "Conclua o pagamento na aba do Mercado Pago. Esta página espera a confirmação e libera o seu mapa sozinha. Guarde o seu link.",
      );
    } catch (error) {
      paymentWindow?.close();
      activeCheckoutOrderId.current = null;
      window.sessionStorage.removeItem(PAYMENT_CHECKOUT_STORAGE_KEY);
      setCheckoutStatus("idle");
      const message = error instanceof Error ? error.message : "";
      setCheckoutError(
        !message || /load failed|failed to fetch|networkerror|network request/i.test(message)
          ? "A conexão falhou por um instante. Toque em \"Tentar de novo\"."
          : message,
      );
    }
  }

  async function handleDirectApproved() {
    const product = checkoutProduct;
    setDirectCheckout(null);
    setCheckoutOpen(false);
    setCheckoutStatus("idle");
    setAccessStatus("Pagamento aprovado! Abrindo o seu conteúdo…");
    try {
      const response = await fetchWithRetry("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: reportToken, refresh: true }) });
      const payload = await response.json() as ReportPayload;
      if (!response.ok) throw new Error();
      applyReport(payload, reportToken);
      setAwaitingPayment(Boolean(payload.orderId));
      if (product === "compat") {
        setAccessStatus("Pagamento aprovado! Agora é só preencher os dados do seu par.");
        window.setTimeout(() => document.getElementById("compatibilidade")?.scrollIntoView({ behavior: "smooth" }), 150);
      } else if (product === "name") {
        setAccessStatus("Pagamento aprovado! A Numerologia do Nome está liberada.");
        window.setTimeout(() => document.getElementById("numerologia-nome")?.scrollIntoView({ behavior: "smooth" }), 150);
      } else {
        setAccessStatus("Pagamento aprovado! Seu mapa completo e o PDF estão liberados. Guarde o seu link.");
        window.setTimeout(() => document.getElementById("analise")?.scrollIntoView({ behavior: "smooth" }), 150);
      }
    } catch {
      setAwaitingPayment(true);
      setAccessStatus("Pagamento aprovado! Liberando o seu conteúdo em instantes…");
    }
  }

  async function finishCheckout() {
    if (checkoutStatus !== "approved") return;
    const request = pendingAnalysis;
    const intent = checkoutIntent;
    window.sessionStorage.removeItem(PAYMENT_CHECKOUT_STORAGE_KEY);
    activeCheckoutOrderId.current = null;
    setCheckoutOpen(false);
    setCheckoutStatus("idle");

    if (intent === "upgrade" && analysis) {
      setReportTier("premium");
      saveMap(analysis, "premium");
      window.setTimeout(() => {
        document
          .getElementById("analise")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

    if (request) await generateAnalysis(request, "premium");
  }

  async function continueWithFreeMap() {
    if (!pendingAnalysis || checkoutStatus === "processing") return;
    const request = pendingAnalysis;
    setCheckoutOpen(false);
    setCheckoutStatus("idle");
    window.sessionStorage.removeItem(PAYMENT_CHECKOUT_STORAGE_KEY);
    activeCheckoutOrderId.current = null;
    setReportTier("free");
    await generateAnalysis(request, "free");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const nextForm = {
      name: String(data.get("name") ?? ""),
      birthDate: String(data.get("birthDate") ?? ""),
      birthTime: String(data.get("birthTime") ?? ""),
      city: String(data.get("city") ?? ""),
      country: String(data.get("country") ?? ""),
      email: String(data.get("email") ?? ""),
    };
    const nextTheme = "personalidade";
    const nextRecipientType = String(
      data.get("recipientType") ?? "self",
    ) as RecipientType;
    const request: AnalysisRequest = {
      ...nextForm,
      theme: nextTheme,
      recipientType: nextRecipientType,
      dataConsent: data.get("dataConsent") === "on",
      authorizationConfirmed:
        data.get("authorizationConfirmed") === "on",
      marketingConsent,
    };

    setForm(nextForm);
    try { if (nextForm.email) window.localStorage.setItem("astroia-email", nextForm.email.trim()); } catch { /* sem storage */ }
    setSelectedTheme(nextTheme);
    setRecipientType(nextRecipientType);
    setAnalysis(null);
    setAnalysisError("");
    setPdfStatus("");
    setEmailPanelOpen(false);
    setEmailPreviewHtml("");
    setDeliveryEmail(nextForm.email);
    setDeliveryStatus({ kind: "idle", message: "" });

    if (reportTier === "premium") {
      if (!paymentsEnabled) {
        await generateAnalysis(request, "premium");
        return;
      }
      const generated = await generateAnalysis(request, "free");
      if (!generated) return;
      setCheckoutEmail(request.email);
      setCheckoutProduct("map");
      openCheckout(request, "upgrade");
      return;
    }

    await generateAnalysis(request, "free");
  }

  return (
    <main>
      {previewV2 && <div className="preview-v2-banner" role="status">👀 Prévia da oferta nova: só você vê, e o pagamento está desligado.</div>}
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="AstroIA — início">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>AstroIA</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#seu-mapa">Seu mapa</a>
          <a href="#meus-mapas">Meus mapas</a>
          <a href="#planos">Planos</a>
        </nav>

        <a className="header-cta" href="#criar">Criar minha prévia</a>
      </header>

      <section className="hero shell" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow">
            <span aria-hidden="true">✦</span>
            Cálculo astronômico real + leitura em linguagem simples
          </div>

          {coupleAd ? (
            <>
              <h1>
                Vocês combinam
                <span> de verdade?</span>
              </h1>
              <p className="hero-description">
                Comece pelo seu mapa astral grátis em 1 minuto. Depois, veja a
                compatibilidade com quem você ama: coração, atração, conversa e
                dia a dia.
              </p>
              <div className="hero-couple"><CompatSample compact /></div>
            </>
          ) : (
            <>
              <h1>
                Há mais em você
                <span> do que o seu signo conta.</span>
              </h1>

              <p className="hero-description">
                As posições exatas dos planetas no dia, na hora e na cidade em que
                você nasceu, junto com a sua numerologia, traduzidas em palavras
                simples: como você sente, ama, trabalha e atravessa seus ciclos.
              </p>
            </>
          )}

          <div className="hero-actions">
            <a className="primary-button" href="#criar">
              {coupleAd ? "Começar pelo meu mapa grátis" : "Descobrir meu mapa grátis"}
              <span aria-hidden="true">→</span>
            </a>
            <a className="text-button" href="#como-funciona">
              Entender como funciona
            </a>
          </div>

          <ActivityPill kind="maps" />

          <div className="trust-row" aria-label="Benefícios">
            <span>✓ Posições reais dos planetas</span>
            <span>✓ Leitura simples e pessoal</span>
            <span>✓ Resultado na hora</span>
          </div>
        </div>

        <div className="cosmic-visual" aria-label="Exemplo visual do seu mapa">
          <div className="orbit orbit-outer" aria-hidden="true">
            <span className="orbit-symbol symbol-one">♈</span>
            <span className="orbit-symbol symbol-two">♎</span>
            <span className="orbit-symbol symbol-three">♒</span>
            <span className="orbit-symbol symbol-four">♌</span>
          </div>
          <div className="orbit orbit-middle" aria-hidden="true" />
          <div className="cosmic-center" aria-hidden="true">
            <span>☉</span>
            <small>seu mapa</small>
          </div>

          <article className="floating-card card-sun">
            <span className="card-icon sun-icon" aria-hidden="true">
              ☉
            </span>
            <div>
              <small>Essência</small>
              <strong>Sol</strong>
            </div>
          </article>

          <article className="floating-card card-moon">
            <span className="card-icon moon-icon" aria-hidden="true">
              ☾
            </span>
            <div>
              <small>Emoções</small>
              <strong>Lua</strong>
            </div>
          </article>

          <article className="floating-card card-rise">
            <span className="card-icon rise-icon" aria-hidden="true">
              ↑
            </span>
            <div>
              <small>Expressão</small>
              <strong>Ascendente</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="signal-strip" aria-label="O que você vai descobrir">
        <span>Sem sorteio</span>
        <span aria-hidden="true">✦</span>
        <span>Data, hora, cidade e fuso</span>
        <span aria-hidden="true">✦</span>
        <span>Zodíaco tropical</span>
        <span aria-hidden="true">✦</span>
        <span>Casas Placidus</span>
      </section>

      <section className="section shell" id="como-funciona">
        <div className="section-heading centered-heading">
          <span className="section-kicker">Simples, profundo e pessoal</span>
          <h2>Do seu nascimento a uma leitura que faz sentido</h2>
          <p>
            Primeiro calculamos o mapa. Depois conectamos os pontos e
            transformamos símbolos complexos em uma leitura fácil de entender.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon" aria-hidden="true">
              ◷
            </div>
            <h3>Conte sobre seu nascimento</h3>
            <p>
              Informe data, horário e cidade para calcularmos as posições do
              seu céu com precisão.
            </p>
          </article>
          <article className="step-card featured-step">
            <span className="step-number">02</span>
            <div className="step-icon" aria-hidden="true">
              ✦
            </div>
            <h3>Conheça seus primeiros traços</h3>
            <p>
              Veja seus três pilares e seu padrão pessoal sem cadastro.
            </p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon" aria-hidden="true">
              ⌁
            </div>
            <h3>Receba sua interpretação</h3>
            <p>
              Leia o essencial grátis ou explore os cinco temas no Premium e
              salve tudo em PDF.
            </p>
          </article>
        </div>
      </section>

      <section className="map-showcase section shell" id="seu-mapa">
        <div className="map-copy">
          <span className="section-kicker">Muito além do signo solar</span>
          <h2>Não é um horóscopo pronto com seu nome no começo</h2>
          <p>
            Cada texto nasce das posições do seu mapa: signos, casas, aspectos,
            numerologia e, agora, o céu do dia cruzado com seu nascimento.
          </p>

          <ul className="feature-list">
            <li>
              <span>☉</span>
              <div>
                <strong>Sol, Lua e Ascendente</strong>
                <small>Essência, emoções e a forma como você se apresenta.</small>
              </div>
            </li>
            <li>
              <span>◇</span>
              <div>
                <strong>Amor, carreira e dinheiro</strong>
                <small>Seus padrões e potenciais em áreas importantes.</small>
              </div>
            </li>
            <li>
              <span>∞</span>
              <div>
                <strong>Numerologia e ciclos</strong>
                <small>Número de destino, ano pessoal e momento atual.</small>
              </div>
            </li>
          </ul>
        </div>

        <article
          className="report-card"
          aria-label="Prévia de um mapa pessoal AstroIA"
        >
          <div className="report-top">
            <span className="report-brand">
              <i aria-hidden="true">✦</i>
              ASTROIA
            </span>
            <small>PRÉVIA DO SEU MAPA</small>
          </div>
          <div className="report-person">
            <span className="mini-orbit" aria-hidden="true">
              <i>♉</i>
            </span>
            <div>
              <small>MAPA PESSOAL DE</small>
              <strong>Marina</strong>
              <p>12 de maio de 1994 · 08:42</p>
            </div>
            <span className="report-status">
              <i aria-hidden="true">✓</i>
              Calculado
            </span>
          </div>
          <div className="report-trio-heading">
            <strong>Seus três pilares</strong>
            <span>quem você é, sente e mostra</span>
          </div>
          <div className="report-trio">
            <div>
              <span className="report-sign-symbol" aria-hidden="true">♉</span>
              <small>☉ SOL · QUEM É</small>
              <strong>Touro</strong>
              <span>Essência e escolhas</span>
            </div>
            <div>
              <span className="report-sign-symbol" aria-hidden="true">♊</span>
              <small>☾ LUA · COMO SENTE</small>
              <strong>Gêmeos</strong>
              <span>Emoções e segurança</span>
            </div>
            <div>
              <span className="report-sign-symbol" aria-hidden="true">♋</span>
              <small>↑ ASC · COMO SE MOSTRA</small>
              <strong>Câncer</strong>
              <span>Atitude e impressão</span>
            </div>
          </div>
          <div className="report-insight">
            <span className="report-insight-mark" aria-hidden="true">✦</span>
            <div>
              <small>SUA SÍNTESE</small>
              <blockquote>
                “Você constrói segurança com calma, mas sua mente precisa de
                movimento, conversa e novas descobertas.”
              </blockquote>
            </div>
          </div>
          <div className="report-bottom">
            <div className="report-tags" aria-label="Traços de destaque">
              <span>Estável</span>
              <span>Curiosa</span>
              <span>Intuitiva</span>
            </div>
            <small>Leitura pessoal · PDF</small>
          </div>
        </article>
      </section>

      <section className="form-section section" id="criar">
        <div className="shell form-shell">
          <div className="form-intro">
            <span className="section-kicker">Comece pelo que importa agora</span>
            <h2>Um mapa para você ou alguém importante</h2>
            <p>
              A versão grátis entrega uma descoberta real. O Premium mostra o
              mapa inteiro, com os cinco temas. Você também pode testar mapas
              separados para parceiro, filhos e familiares.
            </p>
            <div className="privacy-note">
              <span aria-hidden="true">⌾</span>
              <p>
                <strong>Privacidade em primeiro lugar.</strong>
                Para outra pessoa, use apenas dados que você está autorizado a
                informar. Mapas de menores recebem uma leitura adaptada.
              </p>
            </div>
          </div>

          <form className="birth-form" onSubmit={handleSubmit}>
            {offerMode !== "individual" && (
              <div className="offer-context" role="status">
                <span aria-hidden="true">✦</span>
                <div>
                  <strong>Teste de mapa adicional</strong>
                  <small>
                    Este será um novo perfil Premium, separado dos mapas que você já gerou.
                  </small>
                </div>
              </div>
            )}

            <fieldset className="recipient-fieldset">
              <legend>Para quem é este mapa?</legend>
              <div className="recipient-options">
                {recipients.map((recipient) => (
                  <label
                    className={
                      recipientType === recipient.id
                        ? "recipient-option selected-recipient"
                        : "recipient-option"
                    }
                    key={recipient.id}
                  >
                    <input
                      checked={recipientType === recipient.id}
                      name="recipientType"
                      onChange={() => setRecipientType(recipient.id)}
                      type="radio"
                      value={recipient.id}
                    />
                    <span aria-hidden="true">{recipient.icon}</span>
                    <strong>{recipient.label}</strong>
                    <small>{recipient.description}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            {childAudience && (
              <div className="child-profile-note">
                <span aria-hidden="true">☼</span>
                <div>
                  <strong>Leitura cuidadosa para menores</strong>
                  <p>
                    O relatório troca previsões adultas por personalidade,
                    emoções, aprendizado, talentos, hábitos e orientações para
                    quem cuida — sempre sem rótulos.
                  </p>
                </div>
              </div>
            )}

            <div className="form-row">
              <label className="field full-field">
                <span>
                  {recipientType === "self"
                    ? "Seu nome completo"
                    : "Nome completo da pessoa"}
                </span>
                <input
                  required
                  name="name"
                  type="text"
                  autoCapitalize="words"
                  placeholder={
                    recipientType === "self"
                      ? "Seu nome completo"
                      : "Nome completo de quem receberá o mapa"
                  }
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  onBlur={(event) => updateField("name", formatPersonName(event.target.value))}
                />
              </label>
            </div>

            <div className="form-row two-columns">
              <label className="field">
                <span>Data de nascimento</span>
                <input
                  required
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) =>
                    updateField("birthDate", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>Horário de nascimento</span>
                <input
                  name="birthTime"
                  type="time"
                  value={form.birthTime}
                  onChange={(event) =>
                    updateField("birthTime", event.target.value)
                  }
                />
                <small>Não sabe? Você poderá continuar sem o horário.</small>
              </label>
            </div>

            <div className="form-row two-columns">
              <label className="field">
                <span>Cidade de nascimento</span>
                <input
                  required
                  name="city"
                  type="text"
                  placeholder="Ex.: Curitiba"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </label>
              <label className="field">
                <span>País</span>
                <input
                  required
                  name="country"
                  type="text"
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                />
              </label>
            </div>

            <label className="field">
              <span>Seu e-mail</span>
              <input
                autoComplete="email"
                inputMode="email"
                name="email"
                required
                type="email"
                placeholder="voce@exemplo.com"
                value={form.email}
                onChange={(event) => {
                  updateField("email", event.target.value);
                  setDeliveryEmail(event.target.value);
                  if (!event.target.value) setMarketingConsent(false);
                }}
              />
              <small>
                Para identificar o seu mapa e uma futura compra. Sem senha e sem cadastro. Ofertas só serão enviadas se você marcar a opção abaixo.
              </small>
            </label>

            <label
              className={`consent marketing-consent ${
                !form.email ? "disabled-consent" : ""
              }`}
            >
              <input
                checked={marketingConsent}
                disabled={!form.email}
                name="marketingConsent"
                type="checkbox"
                onChange={(event) =>
                  setMarketingConsent(event.target.checked)
                }
              />
              <span>
                Quero receber por e-mail conteúdos, novidades, lançamentos,
                ofertas e promoções do AstroIA e de produtos relacionados.
                Este consentimento é opcional e pode ser cancelado a qualquer
                momento.
              </span>
            </label>

            <details className="data-use-note">
              <summary>Como o e-mail poderá ser utilizado?</summary>
              <p>
                O e-mail é pedido para identificar o seu mapa e uma eventual compra. O acesso continua pelo link privado. Se você marcar a opção acima, o AstroIA também
                poderá guardar o e-mail para enviar comunicações, novidades e
                ofertas. Essa autorização é opcional e pode ser cancelada a
                qualquer momento.
              </p>
              <p>
                Consulte a <a href="/privacidade">Política de Privacidade</a> ou
                faça o <a href="/descadastrar">descadastro automático</a>.
              </p>
            </details>

            <fieldset className="plan-fieldset">
              <legend>Como você quer começar?</legend>
              <div className="plan-options">
                <label
                  className={
                    reportTier === "premium"
                      ? "plan-option premium-plan plan-hero selected-plan"
                      : "plan-option premium-plan plan-hero"
                  }
                >
                  <input
                    type="radio"
                    name="reportTier"
                    value="premium"
                    checked={reportTier === "premium"}
                    onChange={() => { setAnalysis(null); setReportTier("premium"); }}
                  />
                  <span className="plan-badge">MAIS COMPLETO</span>
                  <strong>Mapa astral completo</strong>
                  <b className="plan-price">{paymentPrice}<em>pagamento único · sem assinatura</em></b>
                  <ul className="plan-list">
                    {offerV2 ? (
                      <>
                        <li>Os seus próximos 12 meses, mês a mês</li>
                        <li>Amor: como você ama e o que te atrai</li>
                        <li>Trabalho e dinheiro: onde você brilha</li>
                        <li>Missão, dom e número de destino</li>
                        <li>PDF completo e stories para Instagram, TikTok e WhatsApp</li>
                        <li className="plan-bonus">🎁 Bônus: Numerologia do Nome (vendida à parte por {namePrice})</li>
                      </>
                    ) : (
                      <>
                        <li>As cinco áreas: personalidade, amor, carreira, dinheiro e momento atual</li>
                        <li>Os seus próximos 12 meses</li>
                        <li>PDF completo e stories para Instagram, TikTok e WhatsApp</li>
                      </>
                    )}
                  </ul>
                  <small className="plan-guarantee">✓ Liberado na hora · Garantia de 7 dias</small>
                </label>
                <label
                  className={
                    reportTier === "free"
                      ? "plan-option selected-plan"
                      : "plan-option"
                  }
                >
                  <input
                    type="radio"
                    name="reportTier"
                    value="free"
                    checked={reportTier === "free"}
                    onChange={() => { setAnalysis(null); setReportTier("free"); }}
                  />
                  <span>GRÁTIS</span>
                  <strong>Prévia gratuita</strong>
                  <small>
                    Seu arquétipo, Sol, Lua e Ascendente e um trecho do mapa completo.
                  </small>
                </label>
              </div>
            </fieldset>

            <p className="theme-help">O bônus da Numerologia do Nome vale para mapas de adultos. Escolhendo o completo, você vê o mapa e o pagamento abre logo em seguida.</p>

            <label className="consent">
              <input required name="dataConsent" type="checkbox" />
              <span>
                {recipientType === "self"
                  ? "Concordo com o uso dos meus dados para gerar e guardar meu relatório."
                  : "Concordo com o uso destes dados para gerar e guardar o relatório solicitado."}
              </span>
            </label>

            {recipientType !== "self" && (
              <label className="consent authorization-consent">
                <input
                  required
                  name="authorizationConfirmed"
                  type="checkbox"
                />
                <span>
                  {childAudience
                    ? "Declaro que sou responsável legal ou que possuo autorização do responsável para utilizar os dados desta pessoa."
                    : "Confirmo que tenho autorização para utilizar os dados desta pessoa na geração do mapa."}
                </span>
              </label>
            )}

            <p className="local-storage-note">Sem cadastro ou senha. Guarde o link privado para consultar seu mapa em qualquer aparelho. Quem tiver esse link poderá acessar o relatório.</p>

            {analysisError && (
              <p className="analysis-error" role="alert">
                {analysisError}
              </p>
            )}

            {reportTier === "premium" && (
              <p className="checkout-next-step">
                <span aria-hidden="true">◇</span>
                Você verá sua prévia e poderá continuar para o pagamento. O mapa completo só é liberado após a confirmação.
              </p>
            )}

            <button
              className="submit-button"
              disabled={isAnalyzing}
              type="submit"
            >
              {isAnalyzing
                ? "Calculando seu céu..."
                : reportTier === "free"
                  ? "Descobrir meu mapa grátis"
                  : "Continuar para o Premium"}
              <span aria-hidden="true">{isAnalyzing ? "◌" : "✦"}</span>
            </button>
          </form>
        </div>
      </section>

      {reportOpening && (
        <section className="map-opening shell" aria-live="polite" aria-label="Preparando seu mapa">
          <span className="section-kicker">AstroIA Premium</span>
          <h2>{mapOpeningMessages[reportOpeningStep]}</h2>
          <div className="map-opening-track" aria-hidden="true"><span style={{width: `${((reportOpeningStep + 1) / mapOpeningMessages.length) * 100}%`}} /></div>
          <p>Seu acesso e leitura serão abertos em instantes.</p>
        </section>
      )}
      {accessStatus && !reportOpening && <p className="shell analysis-action-feedback" role="status">{accessStatus}</p>}
      {analysis && (
        <section
          className={`analysis-report shell ${
            reportTier === "premium" ? "premium-report" : "free-report"
          }`}
          id="analise"
          aria-live="polite"
        >
          {reportTier === "premium" && (
            <aside className="payment-success-banner" role="status">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{returnedFromPayment ? "Pagamento confirmado — bem-vindo de volta!" : "Pagamento confirmado"}</strong>
                <p>Seu Mapa Premium está liberado e salvo neste link privado. Você pode fechar a página e voltar quando quiser.</p>
              </div>
            </aside>
          )}
          <div className="print-brand">
            <strong>ASTROIA</strong>
            <span>
              {reportTier === "premium"
                ? "RELATÓRIO PREMIUM"
                : "MAPA ESSENCIAL"}
            </span>
          </div>
          <div className="analysis-cover">
            <div>
              <span className="section-kicker">
                {analysis.person.isMinor
                  ? "Leitura infantojuvenil · uso responsável"
                  : reportTier === "premium"
                    ? "Mapa completo"
                    : "Mapa essencial gratuito"}
              </span>
              <h2>
                {analysis.person.isMinor && analysis.freeReading?.audience === "teen" ? (
                  reportTier === "premium" ? `${analysis.person.firstName}, este é o seu mapa completo.` : `${analysis.person.firstName}, este é o seu mapa.`
                ) : analysis.person.isMinor && analysis.freeReading ? (
                  reportTier === "premium" ? `O mapa completo de ${analysis.person.firstName}.` : `O mapa de ${analysis.person.firstName}.`
                ) : (<>
                {analysis.person.firstName},{" "}
                {analysis.person.isMinor
                  ? `este é um olhar cuidadoso sobre ${analysis.themeDeepDive.label.toLowerCase()}.`
                  : reportTier === "premium"
                    ? newPremium
                      ? "este é o seu mapa completo."
                      : `este é seu mapa completo: personalidade, amor, carreira, dinheiro e momento atual.`
                    : newFreeReading
                      ? "este é o seu mapa."
                      : `esta é sua leitura essencial sobre ${analysis.themeDeepDive.label.toLowerCase()}.`}
                </>)}
              </h2>
              <p className="profile-context-label">
                {analysis.person.relationshipLabel}
                {analysis.person.isMinor
                  ? ` · ${analysis.person.age} anos · conteúdo adaptado`
                  : ""}
              </p>
              <p className="analysis-meta">
                {formatBirthDate(analysis.person.birthDate)}
                {analysis.person.birthTime
                  ? ` · ${analysis.person.birthTime}`
                  : " · horário não informado"}
                {` · ${analysis.person.location}`}
              </p>
              <p className="analysis-summary">{analysis.summary}</p>
            </div>
            <div className="analysis-actions">
              {reportTier === "free" && paymentsEnabled && !products.name ? (
                <button
                  className="analysis-button primary-analysis-button"
                  onClick={openMapOffer}
                  type="button"
                >
                  <span aria-hidden="true">🔒</span> PDF completo no mapa completo
                </button>
              ) : (
                <button
                  className="analysis-button primary-analysis-button"
                  disabled={isGeneratingPdf}
                  onClick={handlePdfDownload}
                  type="button"
                >
                  {isGeneratingPdf
                    ? "Gerando PDF..."
                    : reportTier === "premium"
                      ? "Baixar ou compartilhar PDF"
                      : "Salvar resumo em PDF"}
                </button>
              )}
              <button
                className="analysis-button"
                onClick={() => prepareNewMap("partner", "individual", "free")}
                type="button"
              >
                Adicionar outra pessoa
              </button>
              {pdfStatus && (
                <p className="analysis-action-feedback" role="status">
                  {pdfStatus}
                </p>
              )}
            </div>
          </div>

          {emailPanelOpen && (
            <section className="email-delivery-panel" aria-label="Enviar mapa por e-mail">
              <div className="email-delivery-copy">
                <span className="section-kicker">Entrega AstroIA</span>
                <h2>Seu mapa, bonito também na caixa de entrada</h2>
                <p>
                  O e-mail leva um resumo personalizado e o mapa completo em
                  PDF. Este envio não ativa promoções; o consentimento
                  comercial continua separado.
                </p>
              </div>
              <div className="email-delivery-form">
                <label className="field">
                  <span>E-mail para receber o mapa</span>
                  <input
                    aria-describedby="email-delivery-note"
                    inputMode="email"
                    onChange={(event) => setDeliveryEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    type="email"
                    value={deliveryEmail}
                  />
                </label>
                <p id="email-delivery-note">
                  Use o e-mail da pessoa adulta que solicitou o mapa.
                </p>
                <div className="email-delivery-actions">
                  <button
                    className="analysis-button"
                    disabled={deliveryStatus.kind === "loading"}
                    onClick={() => handleEmailDelivery("preview")}
                    type="button"
                  >
                    Ver como ficará
                  </button>
                  <button
                    className="analysis-button primary-analysis-button"
                    disabled={deliveryStatus.kind === "loading"}
                    onClick={() => handleEmailDelivery("send")}
                    type="button"
                  >
                    {deliveryStatus.kind === "loading"
                      ? "Preparando..."
                      : "Enviar meu mapa"}
                  </button>
                </div>
                {deliveryStatus.message && (
                  <p
                    className={`delivery-message ${deliveryStatus.kind}`}
                    role="status"
                  >
                    {deliveryStatus.message}
                  </p>
                )}
              </div>
              {emailPreviewHtml && (
                <div className="email-preview">
                  <div className="email-preview-heading">
                    <div>
                      <span>PRÉVIA REAL</span>
                      <strong>Assim o e-mail chegará</strong>
                    </div>
                    <button
                      aria-label="Fechar prévia do e-mail"
                      onClick={() => setEmailPreviewHtml("")}
                      type="button"
                    >
                      Fechar
                    </button>
                  </div>
                  <iframe
                    sandbox=""
                    srcDoc={emailPreviewHtml}
                    title="Prévia do e-mail AstroIA"
                  />
                </div>
              )}
            </section>
          )}

          {newPremium && analysis.freeReading && (
            <>
              <FreeReadingView analysis={analysis} nameReading={nameReading} premium={newPremium} reading={analysis.freeReading} />
              <PremiumReport
                analysis={analysis}
                compat={compat}
                compatOffered={compatOffered}
                compatOwned={products.compat}
                compatPending={awaitingPayment && pendingItems.includes("compat")}
                compatPrice={compatPrice}
                onBuyCompat={openCompatCheckout}
                onCompatSaved={(saved) => {
                  setCompat(saved);
                  setAccessStatus("");
                }}
                reading={newPremium}
                reportToken={reportToken}
                nameSlot={
                  nameReading ? (
                    <NameReadingView reading={nameReading} />
                  ) : nameOffered ? (
                    <NameOffer
                      context="premium"
                      onBuy={() => openNameCheckout(false)}
                      pending={awaitingPayment && pendingItems.includes("name")}
                      price={namePrice}
                    />
                  ) : null
                }
              />
            </>
          )}

          {!newPremium && (<>
          {reportTier === "premium" && (
            <article
              className={`theme-deep-dive theme-${analysis.themeDeepDive.id}`}
              id="foco-escolhido"
            >
              <div className="theme-deep-heading">
                <div>
                  <span className="section-kicker">
                    Uma das cinco áreas · {analysis.themeDeepDive.label}
                  </span>
                  <h2>{analysis.themeDeepDive.headline}</h2>
                  <p>{analysis.themeDeepDive.introduction}</p>
                </div>
                <span className="all-topics-badge">
                  Todos os 5 temas incluídos
                </span>
              </div>
              <blockquote>{analysis.themeDeepDive.actionPrompt}</blockquote>
            </article>
          )}

          {newFreeReading && (
            <FreeReadingView
              analysis={analysis}
              nameReading={nameReading}
              bonus={bonus}
              couple={coupleOffer && bonus ? { total: formatPrice(paymentAmountCents + nameAmountCents + compatAmountCents) } : undefined}
              offerPrice={paymentsEnabled ? paymentPrice : undefined}
              onUnlock={paymentsEnabled ? openMapOffer : undefined}
              reading={newFreeReading}
            />
          )}
          {newFreeReading && nameReading && <NameReadingView reading={nameReading} />}

          {reportTier === "free" && !newFreeReading && (
            <article
              className={`theme-focus-card theme-${analysis.themeDeepDive.id}`}
              id="foco-escolhido"
            >
              <div className="theme-deep-heading">
                <div>
                  <span className="section-kicker">
                    Sua escolha · {analysis.themeDeepDive.label}
                  </span>
                  <h2>{analysis.themeDeepDive.headline}</h2>
                  <p>{analysis.themeDeepDive.introduction}</p>
                </div>
                <span className="portrait-badge">FOCO DO RELATÓRIO</span>
              </div>
              <div className="free-theme-points">
                {analysis.themeDeepDive.sections.map((section) => (
                  <div key={section.title}>
                    <strong>{section.title}</strong>
                    <p>{section.text}</p>
                  </div>
                ))}
              </div>
              <blockquote>{analysis.themeDeepDive.actionPrompt}</blockquote>
            </article>
          )}

          {reportTier === "premium" && (
            <article className="premium-introduction">
              <div>
                <span className="premium-seal" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <span className="section-kicker">Leitura exclusiva</span>
                  <h2>{analysis.premium.headline}</h2>
                  <p>{analysis.premium.introduction}</p>
                </div>
              </div>
              <nav className="report-index" aria-label="Capítulos do relatório">
                {analysis.premium.chapters.map((chapter, index) => (
                  <a href={`#premium-${chapter.id}`} key={chapter.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {chapter.title}
                  </a>
                ))}
              </nav>
            </article>
          )}

          {!newFreeReading && (<>
          <section className="big-three-explanation" aria-labelledby="big-three-title">
            <span className="section-kicker">{themeLens?.explanationKicker}</span>
            <h2 id="big-three-title">{themeLens?.explanationTitle}</h2>
            <p>{themeLens?.explanation}</p>
          </section>

          <div
            className={
              analysis.bigThree.ascendant
                ? "big-three-grid"
                : "big-three-grid two-cards"
            }
          >
            <PlacementCard
              placement={analysis.bigThree.sun}
              label="Sol"
              plainMeaning={themeLens?.placements.sun.plainMeaning ?? "Quem você é por dentro"}
              description={themeLens?.placements.sun.description ?? ""}
              associations={themeLens?.placements.sun.associations ?? []}
            />
            <PlacementCard
              placement={analysis.bigThree.moon}
              label="Lua"
              plainMeaning={themeLens?.placements.moon.plainMeaning ?? "Como você sente e reage"}
              description={themeLens?.placements.moon.description ?? ""}
              associations={themeLens?.placements.moon.associations ?? []}
            />
            {analysis.bigThree.ascendant && (
              <PlacementCard
                placement={analysis.bigThree.ascendant}
                label="Ascendente"
                plainMeaning={themeLens?.placements.ascendant.plainMeaning ?? "Como você se mostra ao mundo"}
                description={themeLens?.placements.ascendant.description ?? ""}
                associations={themeLens?.placements.ascendant.associations ?? []}
              />
            )}
          </div>

          {analysis.zodiacPortrait && (
            <section className="zodiac-portrait" aria-labelledby="zodiac-portrait-title">
              <div className="zodiac-portrait-heading">
                <div>
                  <span className="section-kicker">{themeLens?.portraitKicker}</span>
                  <h2 id="zodiac-portrait-title">
                    {themeLens?.portraitTitle}
                  </h2>
                  <p>{themeLens?.portraitIntroduction}</p>
                </div>
                <span className="portrait-badge">
                  {reportTier === "premium"
                    ? "6 CAMADAS EXPLICADAS"
                    : "DESCOBERTA GRÁTIS"}
                </span>
              </div>

              <div className="zodiac-portrait-grid">
                {analysis.zodiacPortrait.essentials.map((layer) => (
                  <article className="zodiac-layer-card" key={layer.id}>
                    <div className="zodiac-layer-top">
                      <span aria-hidden="true">{layer.symbol}</span>
                      <small>{layer.kicker}</small>
                    </div>
                    <h3>{layer.title}</h3>
                    <p>{layer.text}</p>
                    <div className="zodiac-traits">
                      <div>
                        <strong>{layer.strengthLabel}</strong>
                        <div className="zodiac-trait-list">
                          {layer.strengths.map((strength) => (
                            <span key={strength}>{strength}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong>{layer.watchoutLabel}</strong>
                        <div className="zodiac-trait-list zodiac-watch-list">
                          {layer.watchouts.map((watchout) => (
                            <span key={watchout}>{watchout}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {reportTier === "premium" ? (
                <div className="zodiac-premium-layers">
                  <div className="zodiac-premium-heading">
                    <span className="section-kicker">Além do seu signo</span>
                    <h3>Como você se relaciona, se comunica e parte para a ação</h3>
                  </div>
                  <div className="zodiac-portrait-grid premium-layers-grid">
                    {analysis.zodiacPortrait.premiumLayers.map((layer) => (
                      <article className="zodiac-layer-card premium-layer-card" key={layer.id}>
                        <div className="zodiac-layer-top">
                          <span aria-hidden="true">{layer.symbol}</span>
                          <small>{layer.kicker}</small>
                        </div>
                        <h3>{layer.title}</h3>
                        <p>{layer.text}</p>
                        <div className="zodiac-traits compact-traits">
                          <div>
                            <strong>{layer.strengthLabel}</strong>
                            <div className="zodiac-trait-list">
                              {layer.strengths.slice(0, 2).map((strength) => (
                                <span key={strength}>{strength}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <strong>{layer.watchoutLabel}</strong>
                            <div className="zodiac-trait-list zodiac-watch-list">
                              {layer.watchouts.slice(0, 2).map((watchout) => (
                                <span key={watchout}>{watchout}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="zodiac-premium-preview">
                  <div>
                    <span aria-hidden="true">♀</span>
                    <strong>Vênus</strong>
                    <small>carinho e vínculos</small>
                  </div>
                  <div>
                    <span aria-hidden="true">☿</span>
                    <strong>Mercúrio</strong>
                    <small>mente e comunicação</small>
                  </div>
                  <div>
                    <span aria-hidden="true">♂</span>
                    <strong>Marte</strong>
                    <small>ação e iniciativa</small>
                  </div>
                  <p>Essas três camadas recebem explicações completas no Premium.</p>
                </div>
              )}
            </section>
          )}
          </>)}

          {!newFreeReading && (<>
          <article className="pattern-card">
            <div>
              <span className="section-kicker">Seu padrão dominante</span>
              <h3>
                {analysis.pattern.element} + {analysis.pattern.mode}
              </h3>
              <p>{analysis.pattern.text}</p>
            </div>
            <div className="pattern-lists">
              <div>
                <small>PONTOS DE FORÇA</small>
                <div className="tag-list">
                  {analysis.pattern.strengths.map((strength) => (
                    <span key={strength}>{strength}</span>
                  ))}
                </div>
              </div>
              <div>
                <small>PONTOS DE ATENÇÃO</small>
                <div className="tag-list watch-list">
                  {analysis.pattern.watchouts.map((watchout) => (
                    <span key={watchout}>{watchout}</span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="current-sky-card premium-only">
            <div className="current-sky-heading">
              <div>
                <span className="section-kicker">Seu mapa + céu de agora</span>
                <h2>{analysis.currentSky.moonPhase.label}</h2>
                <p>
                  {analysis.currentSky.dateLabel} ·{" "}
                  {analysis.currentSky.moonPhase.text}
                </p>
              </div>
              <span className="sky-live-badge">CÁLCULO ATUAL</span>
            </div>
            <div className="current-sky-highlights">
              {analysis.currentSky.highlights.length === 0 && (
                <div>
                  <span>{analysis.currentSky.moonPhase.angle.toFixed(0)}°</span>
                  <h3>O ritmo da Lua hoje</h3>
                  <p>{analysis.currentSky.summary}</p>
                </div>
              )}
              {analysis.currentSky.highlights
                .slice(0, reportTier === "premium" ? 4 : 1)
                .map((highlight) => (
                  <div key={highlight.title}>
                    <span>{highlight.orb.toFixed(1)}°</span>
                    <h3>{highlight.title}</h3>
                    <p>{highlight.text}</p>
                  </div>
                ))}
            </div>
            {reportTier === "free" &&
              analysis.currentSky.highlights.length > 1 && (
                <p className="sky-locked-note">
                  + {analysis.currentSky.highlights.length - 1} movimentos do
                  céu explicados no Premium.
                </p>
              )}
          </article>

          <div className="analysis-section-heading premium-only">
            <span className="section-kicker">
              Pontos que falam de {analysis.themeDeepDive.label}
            </span>
            <h2>
              O que mais influencia sua leitura sobre{" "}
              {analysis.themeDeepDive.label.toLowerCase()}
            </h2>
          </div>
          <div className="reading-grid premium-only">
            {analysis.readings.map((reading) => (
              <article className="reading-card" key={reading.id}>
                <small>{reading.kicker}</small>
                <h3>{reading.title}</h3>
                <p>{reading.text}</p>
              </article>
            ))}
          </div>

          {reportTier === "premium" && (
            <div className="premium-deliverable">
              <div className="analysis-section-heading">
                <span className="section-kicker">
                  Relatório Premium · {analysis.themeDeepDive.label}
                </span>
                <h2>
                  Sua leitura completa sobre{" "}
                  {analysis.themeDeepDive.label.toLowerCase()}
                </h2>
              </div>

              <div className="premium-chapters">
                {analysis.premium.chapters.map((chapter, index) => (
                  <article
                    className="premium-chapter"
                    id={`premium-${chapter.id}`}
                    key={chapter.id}
                  >
                    <div className="chapter-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="chapter-content">
                      <span className="section-kicker">{chapter.kicker}</span>
                      <h2>{chapter.title}</h2>
                      <p className="chapter-summary">{chapter.summary}</p>
                      <div className="chapter-insights">
                        {chapter.insights.map((insight, insightIndex) => (
                          <p key={`${chapter.id}-${insightIndex}`}>
                            <span aria-hidden="true">✦</span>
                            {insight}
                          </p>
                        ))}
                      </div>
                      <blockquote>{chapter.highlight}</blockquote>
                    </div>
                  </article>
                ))}
              </div>

              <article className="action-plan">
                <span className="section-kicker">Plano simples</span>
                <h2>Três passos para colocar a leitura em prática</h2>
                <div className="action-plan-grid">
                  {analysis.premium.actionPlan.map((action) => (
                    <div key={action.step}>
                      <span>{action.step}</span>
                      <h3>{action.title}</h3>
                      <p>{action.text}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="reflection-card">
                <div>
                  <span className="section-kicker">Para continuar pensando</span>
                  <h2>Perguntas sobre {analysis.themeDeepDive.label.toLowerCase()}</h2>
                  <p>
                    Responda no seu tempo. Não existe resposta certa: o objetivo
                    é perceber o que faz sentido para você.
                  </p>
                </div>
                <ol>
                  {analysis.premium.reflectionQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </article>
            </div>
          )}

          {reportTier === "premium" && (
            <article className="all-themes-report">
              <div className="all-themes-heading">
                <span className="section-kicker">Seu mapa em cinco áreas</span>
                <h2>Seu Mapa Premium reúne todas as áreas da sua vida</h2>
                <p>
                  Aqui não existe apenas um tema principal. Personalidade,
                  amor, carreira, dinheiro e momento atual fazem parte da sua
                  leitura completa, cada um com interpretações próprias.
                </p>
              </div>
              <div className="all-themes-grid">
                {analysis.allThemes
                  .filter((theme) => theme.id !== analysis.themeDeepDive.id)
                  .map((theme) => (
                    <article
                      className={`theme-guide-card theme-${theme.id}`}
                      key={theme.id}
                    >
                      <span className="theme-guide-label">{theme.label}</span>
                      <h3>{theme.headline}</h3>
                      <p>{theme.introduction}</p>
                      <div className="theme-guide-sections">
                        {theme.sections.map((section) => (
                          <div key={section.title}>
                            <strong>{section.title}</strong>
                            <p>{section.text}</p>
                          </div>
                        ))}
                      </div>
                      <blockquote>{theme.actionPrompt}</blockquote>
                    </article>
                  ))}
              </div>
            </article>
          )}

          <div className="analysis-section-heading">
            <span className="section-kicker">Numerologia</span>
            <h2>Seu caminho e o ciclo atual</h2>
          </div>
          <div className="numerology-grid">
            <article className="number-card">
              <span>{analysis.numerology.lifePath}</span>
              <div>
                <small>NÚMERO DE DESTINO</small>
                <h3>Seu caminho principal</h3>
                <p>{newFreeReading ? firstPart(analysis.numerology.lifePathText, 150) : analysis.numerology.lifePathText}</p>
                {newFreeReading && <LockedMore label="O seu número completo está no mapa" onUnlock={openMapOffer} />}
              </div>
            </article>
            <article className="number-card">
              <span>{analysis.numerology.personalYear}</span>
              <div>
                <small>ANO PESSOAL</small>
                <h3>O tom do seu ciclo</h3>
                <p>{newFreeReading ? firstPart(analysis.numerology.personalYearText, 150) : analysis.numerology.personalYearText}</p>
                {newFreeReading && <LockedMore label="Os próximos 12 meses estão no mapa" onUnlock={openMapOffer} />}
              </div>
            </article>
          </div>
          </>)}

          {newFreeReading && (
            <FreeTeasers
              firstName={analysis.person.firstName}
              onUnlock={openMapOffer}
              price={paymentPrice}
              reading={newFreeReading}
              compatPrice={compatOffered ? compatPrice : undefined}
              onUnlockWithCompat={
                compatOffered
                  ? () => {
                      setOfferMode("individual");
                      setCheckoutProduct("map");
                      setAddCompat(true);
                      setCheckoutEmail(form.email);
                      openCheckout(null, "upgrade");
                    }
                  : undefined
              }
            />
          )}

          {reportTier === "free" && !newFreeReading && (
            <article className="free-upgrade-card">
              <div>
                <span className="section-kicker">Você viu o padrão</span>
                <h2>Agora falta entender onde ele aparece — e o que fazer</h2>
                <p>
                  O Premium transforma esta primeira descoberta em uma leitura
                  completa: aprofunda as cinco áreas da sua vida e termina com um plano simples para aplicar o que você
                  leu.
                </p>
                <div className="locked-preview-list">
                  {analysis.themeDeepDive.sections.map((section) => (
                    <span key={section.title}>
                      <i aria-hidden="true">◇</i>
                      {section.title}
                      <small>NO PREMIUM</small>
                    </span>
                  ))}
                </div>
                <p className="upgrade-price">
                  Mapa completo · <strong>{paymentPrice}</strong>
                </p>
              </div>
              <button
                className="analysis-button primary-analysis-button"
                onClick={() => {
                  setOfferMode("individual");
                  setCheckoutProduct("map");
                  setCheckoutEmail(form.email);
                  openCheckout(null, "upgrade");
                }}
                type="button"
              >
                Desbloquear meu mapa completo
              </button>
            </article>
          )}

          {analysis.aspects.length > 0 && (
            <>
              <div className="analysis-section-heading premium-only">
                <span className="section-kicker">Aspectos principais</span>
                <h2>Como suas energias conversam</h2>
                <p className="placements-introduction">
                  Um aspecto é a ligação entre dois planetas. Ela pode mostrar
                  facilidade, uma mistura de talentos ou um ponto que pede
                  equilíbrio. “Órbita” é a distância até o ângulo exato; quanto
                  menor o número, mais perto desse ângulo ficou o cálculo.
                </p>
              </div>
              <div className="aspects-list premium-only">
                {analysis.aspects.map((aspect) => (
                  <article className="aspect-card" key={aspect.title}>
                    <span>{aspect.orb.toFixed(1)}°</span>
                    <div>
                      <h3>{aspect.title}</h3>
                      <small className="aspect-plain-meaning">Em palavras simples: {simpleAspectMeaning(aspect.aspectKey, aspect.title)}.</small>
                      <p>{aspect.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="analysis-section-heading premium-only">
            <span className="section-kicker">Posições do mapa</span>
            <h2>O desenho do seu céu de nascimento</h2>
            <p className="placements-introduction">
              Este desenho mostra onde estavam os planetas quando você nasceu.
              O planeta conta qual assunto estamos olhando; o signo mostra o
              jeito como ele aparece; e a casa mostra em que parte da vida isso
              pode aparecer. Os graus são coordenadas, como um endereço, não
              uma nota. “Retrógrado” é só como o movimento parece visto da
              Terra; não significa que haja algo errado.
            </p>
          </div>
          {!newFreeReading && <NatalChart analysis={analysis} />}
          <div className="placements-grid premium-only">
            {analysis.placements.map((placement) => (
              <article className="placement-pill" key={placement.key}>
                <span aria-hidden="true">{placement.symbol}</span>
                <div>
                  <small>{placement.label}</small>
                  <strong>{placement.sign}</strong>
                  <p>
                    {placement.degree}
                    {placement.house ? ` · Casa ${placement.house}` : ""}
                    {placement.retrograde ? " · Retrógrado" : ""}
                  </p>
                  <details className="placement-explanation">
                    <summary>Entenda esta posição</summary>
                    <p>
                      {explainPlacement(placement, analysis.themeDeepDive.id)}
                    </p>
                    <small>
                      Os graus são coordenadas que marcam o lugar exato no mapa. Não são notas.
                    </small>
                  </details>
                </div>
              </article>
            ))}
          </div>

          {reportTier === "premium" && (
            <article className="next-discoveries">
              <div>
                <span className="section-kicker">Continue quando fizer sentido</span>
                <h2>Este mapa abre novas perguntas</h2>
                <p>
                  Você pode criar mapas separados para pessoas importantes.
                  Cada perfil mantém seus próprios dados e os cinco temas,
                  sem misturar resultados.
                </p>
              </div>
              <div className="next-discoveries-grid">
                <div>
                  <span>NOVO MAPA · {paymentPrice}</span>
                  <h3>Mapa de outra pessoa</h3>
                  <p>Um novo Premium completo, salvo como perfil separado.</p>
                </div>
                <div>
                  <span>{products.compat ? "LIBERADA" : `+ ${compatPrice}`}</span>
                  <h3>Compatibilidade</h3>
                  <p><a href="#compatibilidade">O encontro entre dois mapas: sintonia, pontos fortes e dicas para o casal.</a></p>
                </div>
                <div>
                  <span>EM BREVE</span>
                  <h3>Atualização anual</h3>
                  <p>Um novo olhar para seu ciclo pessoal e prioridades.</p>
                </div>
              </div>
            </article>
          )}

          {reportTier === "premium" && !newPremium && (
            <CompatSection
              compat={compat}
              compatOffered={compatOffered}
              compatOwned={products.compat}
              compatPending={awaitingPayment && pendingItems.includes("compat")}
              compatPrice={compatPrice}
              onBuyCompat={openCompatCheckout}
              onCompatSaved={(saved) => {
                setCompat(saved);
                setAccessStatus("");
              }}
              reportToken={reportToken}
            />
          )}

          </>)}

          <div className="analysis-notes">
            {analysis.notes.map((note) => (
              <p key={note}>✦ {note}</p>
            ))}
            <p>
              ✦ Conteúdo voltado a entretenimento e autoconhecimento; não
              substitui orientação profissional.
            </p>
          </div>
        </section>
      )}

      <section className="maps-section section shell" id="meus-mapas">
        <div className="maps-heading"><div><span className="section-kicker">Salvos neste navegador</span><h2>Meus mapas neste dispositivo</h2><p>Seus mapas ficam disponíveis aqui por 3 meses. Baixe o PDF para guardar sua leitura com você.</p></div>{mapsLoaded && <span className="maps-count">{savedMaps.length} {savedMaps.length === 1 ? "mapa" : "mapas"}</span>}</div>
        {mapsLoaded && savedMaps.length > 0 ? (
          <div className="saved-maps-grid">
            {savedMaps.map((savedMap) => (
              <article className="saved-map-card" key={savedMap.id}>
                <div className="saved-map-top"><span aria-hidden="true">✦</span><small>DISPONÍVEL ATÉ {new Intl.DateTimeFormat("pt-BR", {day:"2-digit", month:"short", year:"numeric"}).format(new Date(savedMap.expiresAt))}</small><strong>{savedMap.reportTier === "premium" ? "PREMIUM" : "ESSENCIAL"}</strong></div>
                <h3>{savedMap.personName}</h3>
                <p>Mapa salvo neste dispositivo. Abra para continuar sua leitura ou baixar o PDF.</p>
                <div className="saved-map-actions"><button className="analysis-button primary-analysis-button" type="button" onClick={() => openSavedMap(savedMap)}>Abrir mapa</button><button className="delete-map-button" type="button" onClick={() => deleteSavedMap(savedMap.id)}>Remover</button></div>
              </article>
            ))}
          </div>
        ) : mapsLoaded ? (
          <div className="maps-empty"><span aria-hidden="true">✦</span><div><h3>Seu próximo mapa aparecerá aqui</h3><p>Quando você criar um mapa, ele ficará disponível neste dispositivo por 3 meses.</p></div></div>
        ) : null}
        <p className="local-storage-note">Em outro dispositivo, o mapa não aparece automaticamente. Baixe o PDF para manter uma cópia da sua leitura.</p>
        <div className="add-profile-panel"><div><span className="section-kicker">Pessoas importantes para você</span><h3>Como será o mapa de alguém da sua família?</h3><p>Crie uma prévia com os dados dessa pessoa. Cada mapa completo tem uma compra separada de {paymentPrice} e seu próprio link privado.</p></div><button className="primary-button" type="button" onClick={() => prepareNewMap("other", "individual", "free")}>Criar mapa de um familiar</button></div>
      </section>

      <section className="pricing-section section shell" id="planos">
        <div className="section-heading centered-heading">
          <span className="section-kicker">{paymentTest ? "Validação do pagamento · R$ 1,00 real" : "Seu mapa completo"}</span>
          <h2>Comece por você e continue com quem importa</h2>
          <p>
            Prévia sem cadastro. Compra única por mapa completo, com pagamento pelo Mercado Pago (Pix ou cartão) e acesso por link privado. {paymentTest && "Durante esta validação, a cobrança real é de R$ 1,00. O preço normal será R$ 37,90."}
          </p>
        </div>

        <div className="pricing-grid">
          <article className="price-card">
            <span className="plan-label">COMECE AQUI</span>
            <h3>Mapa Essencial</h3>
            <div className="price">
              <strong>R$ 0</strong>
            </div>
            <p>Uma descoberta pessoal de verdade, sem cobrança.</p>
            <ul>
              <li>✓ Signo solar, Lua e Ascendente explicados</li>
              <li>✓ Forças naturais e pontos de atenção</li>
              <li>✓ Primeira leitura da personalidade</li>
              <li>✓ Padrão dominante do mapa</li>
              <li>✓ Numerologia e ano pessoal</li>
              <li>✓ Link privado para consultar novamente</li>
              <li>✓ Relatório essencial em PDF</li>
            </ul>
            <button
              className="secondary-button"
              onClick={() => prepareNewMap("self", "individual", "free")}
              type="button"
            >
              Testar gratuitamente
            </button>
          </article>

          <article className="price-card premium-card">
            <span className="popular-badge">CINCO ÁREAS DA VIDA</span>
            <span className="plan-label">MAPA COMPLETO</span>
            <h3>AstroIA Premium</h3>
            <div className="price">
              <strong>{paymentPrice}</strong>
              <small>por mapa individual</small>
            </div>
            <p>
              O Premium libera os cinco temas do mesmo mapa.
            </p>
            <ul>
              <li>✓ Tudo do Mapa Essencial</li>
              <li>✓ Como você ama, pensa e conversa</li>
              <li>✓ Trabalho e dinheiro, com exemplos do dia a dia</li>
              <li>✓ Sua missão e o seu dom escondido</li>
              <li>✓ O que este momento pede de você</li>
              <li>✓ Seus próximos 12 meses</li>
              <li>✓ PDF completo para guardar</li>
            </ul>
            {compatEnabled && (
              <p className="price-addon">
                ♡ Na hora de pagar, você pode incluir a <strong>compatibilidade do casal</strong> por + {compatPrice}.
              </p>
            )}
            <button
              className="primary-button"
              onClick={() => prepareNewMap("self", "individual")}
              type="button"
            >
              Conhecer meu mapa completo
            </button>
          </article>


        </div>
      </section>

      <section className="faq-section section shell">
        <div className="section-heading centered-heading">
          <span className="section-kicker">Dúvidas frequentes</span>
          <h2>Antes de olhar para o céu</h2>
        </div>
        <div className="faq-grid">
          <details>
            <summary>Preciso saber o horário exato?</summary>
            <p>
              Você pode continuar sem ele, mas o horário é necessário para
              calcular com precisão o ascendente e as casas astrológicas.
            </p>
          </details>
          <details>
            <summary>E se eu não gostar?</summary>
            <p>
              Você tem garantia de 7 dias: escreva para
              contato@meuastroia.com.br com o e-mail da compra e o nome do mapa,
              e devolvemos 100% do valor pelo Mercado Pago, sem perguntas. Veja
              os detalhes nos <a href="/termos#garantia">Termos de Uso</a>.
            </p>
          </details>
          <details>
            <summary>Usa inteligência artificial?</summary>
            <p>
              O cálculo do mapa é astronômico, feito com a posição real dos
              planetas no dia, na hora e na cidade do seu nascimento, com o fuso
              e o horário de verão da época. Os textos foram escritos com apoio
              de inteligência artificial e revisados por nós, para ficarem
              simples e fáceis de entender. Nada é sorteado: cada parte da
              leitura vem do seu mapa.
            </p>
          </details>
          <details>
            <summary>O valor de {paymentPrice} será cobrado por tema?</summary>
            <p>
              Não. O pagamento será por mapa individual e incluirá
              personalidade, amor, carreira, dinheiro e momento atual. Todas as áreas estão incluídas no Premium.
            </p>
          </details>
          {compatEnabled && (
            <details>
              <summary>O que é a compatibilidade do casal?</summary>
              <p>
                É uma leitura que cruza o seu mapa com o mapa de quem você ama e
                mostra a sintonia de vocês no coração, na atração, na conversa e
                no dia a dia, com uma dica para cada área. Ela custa + {compatPrice} e
                pode ser incluída na hora de pagar o mapa completo ou depois, dentro
                do seu mapa. É para conversar e se divertir: não decide o futuro de
                ninguém.
              </p>
            </details>
          )}
          <details>
            <summary>Posso criar mapas para marido, filhos ou familiares?</summary>
            <p>
              Sim. Cada pessoa tem seu próprio mapa, cinco temas, PDF e link privado. Cada mapa Premium custa {paymentPrice}. Não é preciso criar conta.
            </p>
          </details>
          <details>
            <summary>Por quanto tempo meu mapa fica disponível?</summary>
            <p>O mapa fica salvo neste dispositivo por 3 meses. Em outro aparelho ele não aparece automaticamente; por isso, recomendamos baixar o PDF para manter sua leitura guardada.</p>
          </details>
          <details>
            <summary>Como funciona o mapa de uma criança ou adolescente?</summary>
            <p>
              Quando a data indicar uma pessoa menor de idade, o relatório
              adapta a linguagem e troca previsões adultas por personalidade,
              emoções, aprendizado, talentos, hábitos e sugestões para quem
              cuida. O responsável deve confirmar que pode utilizar os dados, e
              a leitura nunca deve ser usada para rotular ou decidir o futuro
              da pessoa.
            </p>
          </details>
          <details>
            <summary>O conteúdo substitui orientação profissional?</summary>
            <p>
              Não. O AstroIA é voltado a entretenimento e autoconhecimento, não
              substituindo aconselhamento médico, psicológico, jurídico ou
              financeiro.
            </p>
          </details>
          <details>
            <summary>Onde ficam os meus mapas?</summary>
            <p>
              Os relatórios ficam guardados no servidor e podem ser abertos pelo link privado. Guarde esse endereço: quem o tiver poderá acessar o mapa. Apagar os cookies não apaga o relatório. Para solicitar exclusão, use a página de privacidade.
            </p>
          </details>
        </div>
      </section>

      {checkoutOpen && (
        <div
          className="checkout-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCheckout();
          }}
        >
          <section
            aria-labelledby="checkout-title"
            aria-modal="true"
            className={`checkout-dialog ck-dialog${exitOffer && checkoutStatus !== "approved" && !directCheckout ? " ck-dialog-exit" : ""}`}
            role="dialog"
          >
            <header className="checkout-header ck-header">
              <a className="checkout-brand" href="#inicio" onClick={closeCheckout}>
                <span aria-hidden="true">✦</span>
                AstroIA
              </a>
              {!paymentsEnabled && <span className="checkout-demo-badge">Pagamento desligado</span>}
              <button
                aria-label="Fechar pagamento"
                className="checkout-close"
                disabled={checkoutStatus === "processing"}
                onClick={closeCheckout}
                type="button"
              >
                ×
              </button>
            </header>

            {checkoutStatus === "approved" ? (
              <div className="checkout-approved">
                <span className="approved-symbol" aria-hidden="true">
                  ✓
                </span>
                <span className="section-kicker">Pagamento aprovado</span>
                <h2>Pronto! Seu acesso ao {checkoutOffer.name} foi liberado.</h2>
                <p>
                  Agora falta apenas gerar a leitura personalizada com os dados que você já informou.
                </p>
                <div className="approved-order">
                  <span>{checkoutPersonName || "Perfil AstroIA"}</span>
                  <strong>{paymentPrice}</strong>
                </div>
                <button
                  className="checkout-primary"
                  onClick={finishCheckout}
                  type="button"
                >
                  {checkoutIntent === "upgrade"
                    ? "Abrir meu Premium completo"
                    : "Gerar meu mapa agora"}
                  <span aria-hidden="true">→</span>
                </button>
                <small>
                  Confirmação de pagamento recebida.
                </small>
              </div>
            ) : (
              <div className="ck-body">
                {checkoutProduct === "name" ? (
                  <>
                    <span className="ck-kicker">
                      {downsell ? "Antes de você ir" : "Numerologia do Nome"}
                      {checkoutPersonName ? ` · ${checkoutPersonName.split(/\s+/)[0]}` : ""}
                    </span>
                    <h2 className="ck-title" id="checkout-title">
                      {downsell
                        ? "Ainda não é a hora do mapa completo? Comece pelo seu nome"
                        : "Descubra o que o seu nome revela"}
                    </h2>
                    <div className="ck-price">
                      <strong>{namePrice}</strong>
                      <span>pagamento único · sem assinatura</span>
                    </div>
                    <ul className="ck-includes">
                      <li>O que você deseja lá no fundo (Número da Alma)</li>
                      <li>Como os outros te veem (Personalidade)</li>
                      <li>Os seus talentos (Expressão)</li>
                      <li>Destino, Maturidade e o seu Desafio</li>
                      <li>Seus dias de poder e o número da sorte</li>
                      <li>Stories coloridos para postar</li>
                    </ul>
                  </>
                ) : checkoutProduct === "compat" ? (
                  <>
                    <span className="ck-kicker">
                      Compatibilidade{checkoutPersonName ? ` de ${checkoutPersonName.split(/\s+/)[0]}` : ""}
                    </span>
                    <h2 className="ck-title" id="checkout-title">
                      Descubra como vocês combinam
                    </h2>
                    <div className="ck-price">
                      <strong>{compatPrice}</strong>
                      <span>pagamento único · sem assinatura</span>
                    </div>
                    <ul className="ck-includes">
                      <li>A porcentagem de sintonia de vocês</li>
                      <li>Coração, atração, conversa e dia a dia</li>
                      <li>Uma dica prática para cada área</li>
                      <li>Imagem para postar nos stories</li>
                    </ul>
                  </>
                ) : exitOffer ? (
                  <div className="ck-exit">
                    <span className="ck-exit-gift" aria-hidden="true">{coupleOffer ? "💞" : "🎁"}</span>
                    <span className="ck-exit-kicker">{coupleOffer ? "Para você e o seu par" : "Espera! Separamos um presente para você"}</span>
                    <h2 className="ck-exit-title" id="checkout-title">{coupleOffer ? "Mapa completo + compatibilidade do casal: os 3 pelo preço de 1" : "Só nesta tela: leve os 3 pelo preço de 1"}</h2>
                    <ul className="ck-exit-items">
                      <li><span aria-hidden="true">🌙</span><b>Mapa completo + seus 12 meses</b><em>{paymentPrice}</em></li>
                      <li><span aria-hidden="true">🔢</span><b>Numerologia do Nome</b><em><s>{namePrice}</s> <strong>GRÁTIS</strong></em></li>
                      <li><span aria-hidden="true">💞</span><b>Compatibilidade do casal<small>você preenche os dados do seu par depois</small></b><em><s>{compatPrice}</s> <strong>GRÁTIS</strong></em></li>
                    </ul>
                    <div className="ck-exit-sample">
                      <span>💞 Assim fica a compatibilidade de vocês:</span>
                      <CompatSample compact />
                    </div>
                    <div className="ck-exit-total">
                      <span>Total: <s>{formatPrice(paymentAmountCents + nameAmountCents + compatAmountCents)}</s></span>
                      <strong>{paymentPrice}</strong>
                      <em>Você economiza {formatPrice(nameAmountCents + compatAmountCents)}</em>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="ck-kicker">
                      Mapa completo{checkoutPersonName ? ` de ${checkoutPersonName.split(/\s+/)[0]}` : ""}
                    </span>
                    <h2 className="ck-title" id="checkout-title">
                      {analysis?.person.isMinor && analysis.freeReading?.audience !== "teen" ? `Desbloqueie tudo o que o mapa de ${analysis.person.firstName} guarda` : bonus ? "Os seus próximos 12 meses + o seu mapa completo" : "Desbloqueie tudo o que o seu mapa guarda"}
                    </h2>
                    <div className="ck-price">
                      <strong>{paymentPrice}</strong>
                      <span>pagamento único · sem assinatura</span>
                    </div>
                    {analysis?.freeReading?.audience === "teen" ? (
                      <ul className="ck-includes">
                        <li>Como você aprende e um truque para estudar melhor</li>
                        <li>Você e a turma: o seu papel e o que pode pesar</li>
                        <li>Conflitos em casa: como reagir melhor</li>
                        <li>O que fazer quando bate a bad</li>
                        <li>Talentos, dicas para quem cuida e PDF</li>
                      </ul>
                    ) : analysis?.person.isMinor ? (
                      <ul className="ck-includes">
                        <li>Como {analysis.person.firstName} aprende e o que ajuda nos estudos</li>
                        <li>Amizades, energia e como lidar com as birras</li>
                        <li>Como acalmar {analysis.person.firstName} nas horas difíceis</li>
                        <li>Talentos para incentivar e onde precisa de apoio</li>
                        <li>Dicas práticas para quem cuida e PDF para guardar</li>
                      </ul>
                    ) : bonus ? (
                      <ul className="ck-includes">
                        {OFFER_V2_VALUE.map((item) => <li key={item}>{item}</li>)}
                        <li><b>🎁 Bônus: Numerologia do Nome completa</b> (vendida à parte por {bonus.price})</li>
                      </ul>
                    ) : (
                      <ul className="ck-includes">
                        <li>Como você ama, pensa e conversa</li>
                        <li>Onde você brilha no trabalho e como o dinheiro chega</li>
                        <li>Para que você veio e o seu dom escondido</li>
                        <li>O que este momento pede e os seus próximos 12 meses</li>
                        <li>PDF completo para guardar</li>
                      </ul>
                    )}
                    {compatOffered && (
                      <label className={`ck-bump ${addCompat ? "ck-bump-on" : ""}`}>
                        <input
                          checked={addCompat}
                          onChange={(event) => setAddCompat(event.target.checked)}
                          type="checkbox"
                        />
                        <span className="ck-bump-text">
                          <strong>Sim! Quero também a compatibilidade do casal por + {compatPrice}</strong>
                          <small>
                            Veja como o seu mapa combina com o de quem você ama: a
                            porcentagem de sintonia e uma dica para cada área. Você
                            preenche os dados da outra pessoa depois.
                          </small>
                        </span>
                      </label>
                    )}
                  </>
                )}

                {directCheckout ? (
                  <DirectPayment
                    amount={directCheckout.amount}
                    autoPix={directCheckout.pix}
                    initialPix={directCheckout.initialPix}
                    email={directCheckout.email}
                    key={directCheckout.orderId}
                    onApproved={handleDirectApproved}
                    onFallback={() => void startAsaasCheckout("redirect")}
                    onPix={() => setAwaitingPayment(true)}
                    orderId={directCheckout.orderId}
                    publicKey={directCheckout.publicKey}
                    reportToken={reportToken}
                  />
                ) : (
                <>
                <label className="ck-field">
                  <span>Seu e-mail</span>
                  <input
                    autoComplete="email"
                    inputMode="email"
                    onChange={(event) => setCheckoutEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    type="email"
                    value={checkoutEmail}
                  />
                  <small>Só para identificar a compra. Sem criar conta e sem login.</small>
                </label>

                {checkoutError && (
                  <p className="checkout-payment-message" role="alert">
                    {checkoutError}
                  </p>
                )}

                <button
                  className="checkout-primary ck-pay"
                  disabled={checkoutStatus === "processing"}
                  onClick={() => void startAsaasCheckout()}
                  type="button"
                >
                  {checkoutStatus === "processing"
                    ? "Abrindo o pagamento..."
                    : checkoutError
                      ? "Tentar de novo"
                      : paymentsEnabled
                        ? exitOffer ? (coupleOffer ? `💞 Quero tudo por ${checkoutTotal} com Pix` : `🎁 Quero meu presente: tudo por ${checkoutTotal}`) : `Pagar ${checkoutTotal} com Pix`
                        : "Abrir mapa completo (teste)"}
                  <span aria-hidden="true">{checkoutStatus === "processing" ? "◌" : "→"}</span>
                </button>
                {paymentsEnabled && directPayments && (
                  <button
                    className="ck-card"
                    disabled={checkoutStatus === "processing"}
                    onClick={() => void startAsaasCheckout(undefined, "card")}
                    type="button"
                  >
                    Prefiro pagar com cartão
                  </button>
                )}
                </>
                )}

                <ul className="ck-trust" aria-label="Garantias do pagamento">
                  <li>
                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                    Pagamento seguro pelo Mercado Pago
                  </li>
                  <li>Pix ou cartão</li>
                  <li>Liberado na hora</li>
                  <li>Garantia de 7 dias</li>
                </ul>
                {exitOffer && !directCheckout ? <p className="ck-exit-note">✓ Pix na hora · ✓ Garantia de 7 dias{coupleOffer ? "" : " · Esta oferta aparece só agora"}</p> : null}
                <p className="ck-terms">
                  Não gostou? Devolvemos o seu dinheiro em até 7 dias. Ao pagar, você concorda com os{" "}
                  <a href="/termos" rel="noreferrer" target="_blank">Termos de Uso</a>.
                </p>

                <button
                  className="checkout-free-button ck-back"
                  disabled={checkoutStatus === "processing"}
                  onClick={checkoutIntent === "generate" && checkoutProduct === "map" ? continueWithFreeMap : closeCheckout}
                  type="button"
                >
                  {exitOffer
                    ? "Não, obrigado"
                    : checkoutProduct === "name"
                    ? downsell
                      ? "Não, obrigado"
                      : "Agora não, voltar ao meu mapa"
                    : checkoutProduct === "compat"
                    ? "Agora não, voltar ao meu mapa"
                    : checkoutIntent === "generate"
                      ? "Prefiro continuar com o mapa grátis"
                      : "Voltar ao meu mapa grátis"}
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {paymentsEnabled && !products.map && (newFreeReading ? (
        <StickyBuyBar
          hidden={checkoutOpen}
          label={newFreeReading.audience === "child" ? `Mapa completo de ${analysis?.person.firstName ?? ""}` : coupleOffer ? "Mapa + compatibilidade do casal" : "Seu mapa completo"}
          onUnlock={openMapOffer}
          price={paymentPrice}
        />
      ) : null)}

      <footer>
        <div className="shell footer-content">
          <a className="brand" href="#inicio">
            <span className="brand-mark" aria-hidden="true">
              ✦
            </span>
            <span>AstroIA</span>
          </a>
          <p>Seu céu, traduzido para você.</p>
          <small>
            Conteúdo para entretenimento e autoconhecimento.
          </small>
          <div className="footer-links">
            <a href="/termos">Termos de Uso</a>
            <a href="/termos#garantia">Garantia de 7 dias</a>
            <a href="/privacidade">Política de Privacidade</a>
            <button className="footer-cookie-link" onClick={openCookiePreferences} type="button">Preferências de cookies</button>
            <a href="/descadastrar">Cancelar e-mails</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
