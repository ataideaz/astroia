import astroPackage from "circular-natal-horoscope-js";
import {
  Body,
  Ecliptic,
  GeoVector,
  MoonPhase,
} from "astronomy-engine";
import { buildFreeReading, type FreeReading } from "./free-reading";
import { formatPersonName } from "./name-format";
export { formatPersonName };
import { buildKidFreeReading, buildKidPremiumReading } from "./kid-reading";
import { buildTeenFreeReading, buildTeenPremiumReading } from "./teen-reading";
import {
  buildPremiumReading,
  type MonthSky,
  type PremiumReading,
  type SkyMove,
} from "./premium-reading";

type SignKey =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type ThemeKey =
  | "personalidade"
  | "amor"
  | "carreira"
  | "dinheiro"
  | "momento";

export type RecipientType = "self" | "partner" | "child" | "other";

export type ThemeGuide = {
  id: ThemeKey;
  label: string;
  headline: string;
  introduction: string;
  sections: Array<{
    title: string;
    text: string;
  }>;
  actionPrompt: string;
};

type SignProfile = {
  label: string;
  symbol: string;
  element: "Fogo" | "Terra" | "Ar" | "Água";
  mode: "Cardinal" | "Fixo" | "Mutável";
  essence: string;
  emotions: string;
  presence: string;
  mind: string;
  love: string;
  action: string;
  strengths: string[];
  watchouts: string[];
};

export type AnalyzeRequest = {
  name: string;
  birthDate: string;
  birthTime?: string;
  city: string;
  country: string;
  theme: ThemeKey;
  recipientType?: RecipientType;
  dataConsent?: boolean;
  authorizationConfirmed?: boolean;
  email?: string;
  marketingConsent?: boolean;
  reportTier?: "free" | "premium";
};

export type Placement = {
  key: string;
  label: string;
  symbol: string;
  sign: string;
  signKey: SignKey;
  degree: string;
  longitude: number;
  house: number | null;
  retrograde: boolean;
};

export type AnalysisResult = {
  person: {
    firstName: string;
    fullName: string;
    birthDate: string;
    birthTime: string | null;
    location: string;
    latitude: number;
    longitude: number;
    timezone: string;
    exactTime: boolean;
    recipientType: RecipientType;
    relationshipLabel: string;
    isMinor: boolean;
    age: number;
  };
  bigThree: {
    sun: Placement;
    moon: Placement;
    ascendant: Placement | null;
  };
  midheaven: Placement | null;
  placements: Placement[];
  houseCusps?: Array<{ house: number; longitude: number }>;
  summary: string;
  pattern: {
    element: string;
    mode: string;
    text: string;
    strengths: string[];
    watchouts: string[];
  };
  zodiacPortrait?: {
    headline: string;
    introduction: string;
    essentials: Array<{
      id: "sun" | "moon" | "ascendant";
      symbol: string;
      kicker: string;
      title: string;
      text: string;
      strengthLabel: string;
      watchoutLabel: string;
      strengths: string[];
      watchouts: string[];
    }>;
    premiumLayers: Array<{
      id: "venus" | "mercury" | "mars";
      symbol: string;
      kicker: string;
      title: string;
      text: string;
      strengthLabel: string;
      watchoutLabel: string;
      strengths: string[];
      watchouts: string[];
    }>;
  };
  readings: Array<{
    id: string;
    kicker: string;
    title: string;
    text: string;
  }>;
  themeFocus: {
    title: string;
    text: string;
  };
  themeDeepDive: ThemeGuide;
  allThemes: ThemeGuide[];
  currentSky: {
    dateLabel: string;
    moonPhase: {
      label: string;
      angle: number;
      text: string;
    };
    summary: string;
    highlights: Array<{
      title: string;
      orb: number;
      text: string;
    }>;
    moves?: SkyMove[];
  };
  numerology: {
    lifePath: number;
    personalYear: number;
    lifePathText: string;
    personalYearText: string;
  };
  aspects: Array<{
    title: string;
    orb: number;
    text: string;
    point1Key?: string;
    point2Key?: string;
    aspectKey?: string;
  }>;
  premium: {
    headline: string;
    introduction: string;
    chapters: Array<{
      id: string;
      kicker: string;
      title: string;
      summary: string;
      insights: string[];
      highlight: string;
    }>;
    actionPlan: Array<{
      step: string;
      title: string;
      text: string;
    }>;
    reflectionQuestions: string[];
  };
  notes: string[];
  /** Leitura grátis nova (ausente em relatórios antigos e em mapas de menores). */
  freeReading?: FreeReading | null;
  /** Leitura nova do mapa completo (ausente em relatórios antigos e em mapas de menores). */
  premiumReading?: PremiumReading | null;
  /** Só na prévia grátis: 1 frase real do mapa completo, para mostrar o que vem depois. */
  premiumPreview?: { label: string; title: string; blockTitle: string; text: string } | null;
  /** Só na prévia grátis: o 1º mês aberto e os demais trancados (oferta dos 12 meses). */
  monthsPreview?: { first: { label: string; theme: string; tip: string }; labels: string[]; love: number; luck: number } | null;
};

const { Origin, Horoscope } = astroPackage as unknown as {
  Origin: new (input: {
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
  }) => unknown;
  Horoscope: new (input: {
    origin: unknown;
    houseSystem: string;
    zodiac: string;
    aspectPoints: string[];
    aspectWithPoints: string[];
    aspectTypes: string[];
    customOrbs: Record<string, number>;
    language: string;
  }) => {
    SunSign: { key: SignKey };
    Ascendant: Record<string, unknown>;
    Midheaven: Record<string, unknown>;
    CelestialBodies: Record<string, Record<string, unknown>>;
    CelestialPoints: Record<string, Record<string, unknown>>;
    Houses: Array<Record<string, unknown>>;
    Aspects: {
      all: Array<{
        point1Key: string;
        point2Key: string;
        aspectKey: string;
        orb: number;
      }>;
    };
    origin: { timezone?: { name?: string } };
  };
};

const SIGNS: Record<SignKey, SignProfile> = {
  aries: {
    label: "Áries",
    symbol: "♈",
    element: "Fogo",
    mode: "Cardinal",
    essence:
      "Você gosta de começar coisas, testar ideias e abrir caminhos. Ter liberdade para agir ajuda você a se sentir mais animado.",
    emotions:
      "Você costuma mostrar o que sente logo. Conversar com clareza ou fazer algo prático pode ajudar a se acalmar.",
    presence:
      "Ao chegar a um lugar novo, você pode parecer corajoso e direto. As pessoas notam quando você toma a iniciativa.",
    mind:
      "Você pensa rápido e gosta de ir direto ao ponto. Antes de decidir, vale parar um pouco e conferir os detalhes.",
    love:
      "Nas relações, você valoriza sinceridade, carinho e espaço para ser você. O vínculo fica melhor quando os dois podem tomar iniciativa.",
    action:
      "Um desafio pode dar energia para você agir. Metas pequenas e claras ajudam a terminar o que começou.",
    strengths: ["coragem", "iniciativa", "franqueza"],
    watchouts: ["impaciência", "agir com pressa", "querer vencer toda discussão"],
  },
  taurus: {
    label: "Touro",
    symbol: "♉",
    element: "Terra",
    mode: "Fixo",
    essence:
      "Você gosta de construir as coisas com calma e segurança. Ter conforto e ver resultados de verdade ajuda você a escolher.",
    emotions:
      "Você pode precisar de tempo para entender o que sente. Lugares tranquilos e pessoas de confiança ajudam você a relaxar.",
    presence:
      "Você pode parecer calmo, firme e prático. Costuma mostrar que se importa ficando por perto e cumprindo o que combina.",
    mind:
      "Você gosta de pensar com calma e lembrar do que já aprendeu. Quando muda de ideia, geralmente é porque encontrou um bom motivo.",
    love:
      "Nas relações, você valoriza lealdade, carinho e presença. Pequenos gestos constantes podem valer mais do que grandes promessas.",
    action:
      "Você costuma avançar passo a passo. Uma rotina simples e uma meta importante ajudam seu esforço a dar resultado.",
    strengths: ["constância", "lealdade", "praticidade"],
    watchouts: ["teimosia", "dificuldade de desapegar", "medo de mudar"],
  },
  gemini: {
    label: "Gêmeos",
    symbol: "♊",
    element: "Ar",
    mode: "Mutável",
    essence:
      "Você gosta de aprender, conversar e descobrir coisas novas. Juntar ideias e conhecer pessoas ajuda você a se sentir bem.",
    emotions:
      "Conversar ou escrever pode ajudar você a entender o que sente. Dar nome à emoção evita ficar tentando resolver tudo só na cabeça.",
    presence:
      "Você pode parecer curioso, atento e fácil de conversar. Muitas vezes encontra rápido um assunto em comum com as pessoas.",
    mind:
      "Sua mente gosta de novidades e aprende rápido. Escolher uma coisa de cada vez ajuda você a não perder o foco.",
    love:
      "Nas relações, conversa, bom humor e curiosidade são importantes. Você gosta de descobrir coisas novas junto da outra pessoa.",
    action:
      "Você prefere testar um caminho e mudar se precisar. Tarefas variadas e etapas curtas podem ajudar a manter o interesse.",
    strengths: ["comunicação", "versatilidade", "curiosidade"],
    watchouts: ["perder o foco", "começar sem terminar", "pensar demais antes de sentir"],
  },
  cancer: {
    label: "Câncer",
    symbol: "♋",
    element: "Água",
    mode: "Cardinal",
    essence:
      "Família, amizades e lembranças podem ter grande importância para você. Cuidar de quem ama também pode mostrar sua coragem.",
    emotions:
      "Você percebe quando alguém está chateado e pode guardar isso para si. Um tempo quieto e o carinho de alguém de confiança ajudam.",
    presence:
      "Você pode parecer carinhoso e cuidadoso. Primeiro observa se o lugar é seguro; depois mostra seu lado mais sensível.",
    mind:
      "Você lembra de detalhes e pensa em como as situações afetam as pessoas. Uma explicação com exemplos pode fazer mais sentido para você.",
    love:
      "Nas relações, você valoriza carinho, cuidado e confiança. Estar presente no dia a dia mostra que alguém se importa.",
    action:
      "Quando alguém importante precisa de ajuda, você pode encontrar força para agir. Saber por que algo importa ajuda você a continuar.",
    strengths: ["sensibilidade", "proteção", "memória"],
    watchouts: ["se fechar quando se magoa", "ficar preso a lembranças", "carregar o sentimento dos outros"],
  },
  leo: {
    label: "Leão",
    symbol: "♌",
    element: "Fogo",
    mode: "Fixo",
    essence:
      "Você gosta de criar, se expressar e colocar carinho no que faz. Ser reconhecido pelo seu esforço pode deixar você contente.",
    emotions:
      "Você pode sentir tudo com bastante intensidade e demonstrar carinho com generosidade. Respeito ajuda você a falar quando está vulnerável.",
    presence:
      "Você pode chamar atenção por ser caloroso e expressivo. Mesmo sem tentar, às vezes acaba virando o centro do grupo.",
    mind:
      "Você gosta de defender suas ideias e explicar o que pensa. Ouvir opiniões diferentes também pode ajudar você a aprender.",
    love:
      "Nas relações, você valoriza carinho, admiração e lealdade. O afeto funciona melhor quando os dois se elogiam e se apoiam.",
    action:
      "Você gosta de fazer algo de que possa se orgulhar. Dividir tarefas ajuda a não carregar tudo sozinho.",
    strengths: ["criatividade", "lealdade", "confiança"],
    watchouts: ["dificuldade de admitir um erro", "depender muito de elogios", "reagir de forma exagerada"],
  },
  virgo: {
    label: "Virgem",
    symbol: "♍",
    element: "Terra",
    mode: "Mutável",
    essence:
      "Você gosta de organizar, aprender a fazer melhor e ajudar de forma prática. Saber que está fazendo um bom trabalho traz segurança.",
    emotions:
      "Você pode tentar entender os sentimentos pensando neles. Uma rotina tranquila e pequenas tarefas podem ajudar a colocar as ideias em ordem.",
    presence:
      "Você pode parecer atento, discreto e confiável. Costuma notar detalhes que outras pessoas deixam passar.",
    mind:
      "Você presta atenção aos detalhes e gosta de encontrar soluções. Lembre-se de que melhorar algo não exige que tudo fique perfeito.",
    love:
      "Nas relações, você pode mostrar carinho ajudando e lembrando de pequenos detalhes. Também é importante deixar que cuidem de você.",
    action:
      "Você costuma planejar antes de agir e corrigir o que não deu certo. Instruções claras ajudam seu trabalho a render.",
    strengths: ["discernimento", "organização", "utilidade"],
    watchouts: ["cobrar demais de si", "querer que tudo fique perfeito", "se preocupar antes da hora"],
  },
  libra: {
    label: "Libra",
    symbol: "♎",
    element: "Ar",
    mode: "Cardinal",
    essence:
      "Você gosta de estar com as pessoas e procura tratar todos com justiça. Ter escolhas equilibradas ajuda você a decidir.",
    emotions:
      "Conversar com calma pode ajudar você a se sentir melhor. Evitar toda discussão, porém, pode deixar um problema sem solução.",
    presence:
      "Você pode parecer gentil e bom de conversa. Costuma pensar em mais de um lado antes de escolher o que fazer.",
    mind:
      "Você compara opções e procura uma solução justa. Definir o que é mais importante pode ajudar a decidir mais rápido.",
    love:
      "Nas relações, você valoriza parceria e respeito. É importante que os dois possam falar e tomar decisões juntos.",
    action:
      "Trabalhar junto com outras pessoas pode ajudar você a avançar. Lembrar do que você quer evita aceitar tudo só para agradar.",
    strengths: ["diplomacia", "senso de justiça", "cooperação"],
    watchouts: ["demorar para escolher", "evitar conversas difíceis", "precisar sempre que aprovem sua escolha"],
  },
  scorpio: {
    label: "Escorpião",
    symbol: "♏",
    element: "Água",
    mode: "Fixo",
    essence:
      "Você gosta de entender o que está por trás das coisas. Respostas rápidas nem sempre bastam; você prefere descobrir o motivo.",
    emotions:
      "Você pode sentir tudo com força, mas nem sempre contar logo. Confiar em alguém ajuda a falar sobre o que é difícil.",
    presence:
      "Você pode parecer atento e observador. Às vezes percebe que algo não combina, mesmo antes de alguém explicar.",
    mind:
      "Você gosta de investigar causas e motivos. Antes de ter certeza, vale conferir se existe outra explicação possível.",
    love:
      "Nas relações, você valoriza sinceridade e confiança. Gostar de alguém não significa controlar o que essa pessoa faz.",
    action:
      "Quando decide se dedicar a algo, você pode continuar mesmo em fases difíceis. Mudar o plano quando preciso também é uma força.",
    strengths: ["profundidade", "resiliência", "percepção"],
    watchouts: ["querer controlar tudo", "demorar a confiar", "guardar sentimentos até explodir"],
  },
  sagittarius: {
    label: "Sagitário",
    symbol: "♐",
    element: "Fogo",
    mode: "Mutável",
    essence:
      "Você gosta de aprender, conhecer lugares e ter liberdade para escolher. Ter algo novo para descobrir pode animar você.",
    emotions:
      "Quando está chateado, pode ajudar olhar a situação por outro lado ou sair um pouco da rotina. Isso pode trazer esperança.",
    presence:
      "Você pode parecer aberto, sincero e animado. Muitas vezes ajuda os outros a imaginar novas possibilidades.",
    mind:
      "Você gosta de entender a ideia geral e o motivo das coisas. Conferir os detalhes ajuda seus planos a dar certo.",
    love:
      "Nas relações, você valoriza sinceridade, diversão e espaço para crescer. Liberdade também precisa vir com respeito e acordos.",
    action:
      "Uma ideia importante pode dar energia para você agir. Dividir um grande objetivo em passos pequenos ajuda a chegar lá.",
    strengths: ["otimismo", "visão", "franqueza"],
    watchouts: ["exagerar nas promessas", "se irritar com limites", "começar mais do que consegue terminar"],
  },
  capricorn: {
    label: "Capricórnio",
    symbol: "♑",
    element: "Terra",
    mode: "Cardinal",
    essence:
      "Você gosta de ter objetivos e trabalhar para alcançá-los. Um desafio pode mostrar sua capacidade de se organizar e continuar.",
    emotions:
      "Você pode guardar o que sente e tentar resolver tudo sozinho. Pedir ajuda não diminui sua força nem sua capacidade.",
    presence:
      "Você pode parecer sério, responsável e organizado. As pessoas confiam mais quando percebem que você conhece o assunto.",
    mind:
      "Você costuma pensar no que pode acontecer depois de cada escolha. Se o plano não funcionar, mudar a rota também é inteligente.",
    love:
      "Nas relações, você valoriza respeito, compromisso e confiança. Cuidar da outra pessoa com constância pode ser seu jeito de demonstrar carinho.",
    action:
      "Você pode planejar e persistir até alcançar um resultado. Comemorar cada etapa ajuda o caminho a não parecer só obrigação.",
    strengths: ["disciplina", "estratégia", "responsabilidade"],
    watchouts: ["não aceitar outros planos", "cobrar demais de si", "trabalhar sem descansar"],
  },
  aquarius: {
    label: "Aquário",
    symbol: "♒",
    element: "Ar",
    mode: "Fixo",
    essence:
      "Você gosta de pensar por conta própria e encontrar soluções diferentes. Ter espaço para dar ideias é importante para você.",
    emotions:
      "Você pode preferir pensar no sentimento antes de falar dele. Fazer parte de um grupo sem deixar de ser você também importa.",
    presence:
      "Você pode parecer original e independente. Costuma questionar regras quando elas não parecem ter um bom motivo.",
    mind:
      "Você gosta de pensar no futuro e ligar ideias diferentes. Explicar como sua ideia pode funcionar no dia a dia ajuda os outros a entender.",
    love:
      "Nas relações, você valoriza amizade, sinceridade e espaço. Um vínculo pode ser próximo sem que as duas pessoas precisem ser iguais.",
    action:
      "Uma ideia ou causa pode motivar você a agir. Trabalhar junto com outras pessoas ajuda a transformar planos em mudanças reais.",
    strengths: ["originalidade", "independência", "visão coletiva"],
    watchouts: ["se afastar quando sente demais", "achar que só sua ideia está certa", "mudar os planos sem avisar"],
  },
  pisces: {
    label: "Peixes",
    symbol: "♓",
    element: "Água",
    mode: "Mutável",
    essence:
      "Você pode ter muita imaginação e perceber como as pessoas estão se sentindo. Fazer algo que tenha significado ajuda você a se envolver.",
    emotions:
      "Você pode sentir o clima das pessoas ao redor. Um tempo em silêncio, música ou desenho pode ajudar a separar o que você sente do que os outros sentem.",
    presence:
      "Você pode parecer gentil e compreensivo. Às vezes se adapta tanto aos outros que precisa lembrar do que você mesmo quer.",
    mind:
      "Você pode pensar por imagens e ideias que aparecem de repente. Anotar as ideias ajuda a explicar para os outros o que está imaginando.",
    love:
      "Nas relações, você valoriza carinho, cuidado e imaginação. Dizer o que você aceita e o que não aceita ajuda a proteger seus sentimentos.",
    action:
      "Você pode se animar quando acredita no que está fazendo. Uma rotina simples ajuda a transformar uma ideia em algo pronto.",
    strengths: ["empatia", "imaginação", "intuição"],
    watchouts: ["imaginar que alguém é perfeito", "dizer sim quando queria dizer não", "fugir de uma conversa difícil"],
  },
};

const PLANETS: Record<
  string,
  { label: string; symbol: string; role: string }
> = {
  sun: { label: "Sol", symbol: "☉", role: "identidade e direção" },
  moon: { label: "Lua", symbol: "☾", role: "emoções e necessidades" },
  mercury: { label: "Mercúrio", symbol: "☿", role: "mente e comunicação" },
  venus: { label: "Vênus", symbol: "♀", role: "afeto, valores e vínculos" },
  mars: { label: "Marte", symbol: "♂", role: "ação, desejo e iniciativa" },
  jupiter: { label: "Júpiter", symbol: "♃", role: "expansão e confiança" },
  saturn: { label: "Saturno", symbol: "♄", role: "limites e maturidade" },
  uranus: { label: "Urano", symbol: "♅", role: "mudança e originalidade" },
  neptune: { label: "Netuno", symbol: "♆", role: "imaginação e sensibilidade" },
  pluto: { label: "Plutão", symbol: "♇", role: "poder e transformação" },
};

function buildZodiacPortrait(
  placements: Record<string, Placement>,
  ascendant: Placement | null,
  isMinor: boolean,
): NonNullable<AnalysisResult["zodiacPortrait"]> {
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const mercury = SIGNS[placements.mercury.signKey];
  const venus = SIGNS[placements.venus.signKey];
  const mars = SIGNS[placements.mars.signKey];
  const rising = ascendant ? SIGNS[ascendant.signKey] : null;

  const layerAxis: Record<
    "sun" | "moon" | "ascendant" | "venus" | "mercury" | "mars",
    {
      strength: string;
      watchout: string;
      strengthLabel: string;
      watchoutLabel: string;
    }
  > = {
    sun: {
      strength: "Na expressão pessoal",
      watchout: "Na forma de afirmar quem você é",
      strengthLabel: "FORÇA NA EXPRESSÃO",
      watchoutLabel: "CUIDADO COM A AUTOEXPRESSÃO",
    },
    moon: {
      strength: "No cuidado emocional",
      watchout: "Ao lidar com o que sente",
      strengthLabel: "RECURSO EMOCIONAL",
      watchoutLabel: "CUIDADO COM AS EMOÇÕES",
    },
    ascendant: {
      strength: "Na primeira impressão",
      watchout: "Ao chegar a ambientes novos",
      strengthLabel: "FORÇA NA SUA PRESENÇA",
      watchoutLabel: "CUIDADO NA PRIMEIRA IMPRESSÃO",
    },
    venus: {
      strength: "Na construção de vínculos",
      watchout: "Nas trocas afetivas",
      strengthLabel: "RECURSO NOS VÍNCULOS",
      watchoutLabel: "CUIDADO NAS RELAÇÕES",
    },
    mercury: {
      strength: "No jeito de pensar e conversar",
      watchout: "Na hora de organizar ideias",
      strengthLabel: "RECURSO NA COMUNICAÇÃO",
      watchoutLabel: "CUIDADO COM AS IDEIAS",
    },
    mars: {
      strength: "Na iniciativa e na ação",
      watchout: "Ao perseguir o que deseja",
      strengthLabel: "FORÇA PARA AGIR",
      watchoutLabel: "CUIDADO NA AÇÃO",
    },
  };
  const contextualTraits = (
    id: keyof typeof layerAxis,
    sign: SignProfile,
  ) => ({
    strengthLabel: layerAxis[id].strengthLabel,
    watchoutLabel: layerAxis[id].watchoutLabel,
    strengths: sign.strengths.map(
      (trait) => `${layerAxis[id].strength}: ${trait}`,
    ),
    watchouts: sign.watchouts.map(
      (trait) => `${layerAxis[id].watchout}: ${trait}`,
    ),
  });

  return {
    headline: ascendant
      ? `${sun.label} na essência, ${moon.label} nas emoções e ${rising?.label} na primeira impressão`
      : `${sun.label} na essência e ${moon.label} nas emoções`,
    introduction: isMinor
      ? "Essas camadas ajudam a observar qualidades, necessidades e formas de reagir. Elas mostram possibilidades, não rótulos ou limites para o desenvolvimento."
      : "Seu signo solar é só o começo. Quando Sol, Lua e Ascendente são lidos juntos, fica mais fácil entender o que move você, do que precisa emocionalmente e como costuma chegar aos ambientes.",
    essentials: [
      {
        id: "sun",
        symbol: placements.sun.symbol,
        kicker: `Seu signo solar · ${placements.sun.sign}`,
        title: "O que fortalece sua essência",
        text: sun.essence,
        ...contextualTraits("sun", sun),
      },
      {
        id: "moon",
        symbol: placements.moon.symbol,
        kicker: `Sua Lua · ${placements.moon.sign}`,
        title: "O que você sente e precisa",
        text: moon.emotions,
        ...contextualTraits("moon", moon),
      },
      ...(ascendant && rising
        ? [
            {
              id: "ascendant" as const,
              symbol: ascendant.symbol,
              kicker: `Seu Ascendente · ${ascendant.sign}`,
              title: "A impressão que você transmite",
              text: `${rising.presence} O Ascendente fala especialmente da sua postura em situações novas; com intimidade, Sol e Lua revelam outras camadas.`,
              ...contextualTraits("ascendant", rising),
            },
          ]
        : []),
    ],
    premiumLayers: [
      {
        id: "venus",
        symbol: placements.venus.symbol,
        kicker: `Vênus · ${placements.venus.sign}`,
        title: isMinor
          ? "Como demonstra afeto e cria vínculos"
          : "Como demonstra carinho e se relaciona",
        text: venus.love,
        ...contextualTraits("venus", venus),
      },
      {
        id: "mercury",
        symbol: placements.mercury.symbol,
        kicker: `Mercúrio · ${placements.mercury.sign}`,
        title: "Como pensa e se comunica",
        text: mercury.mind,
        ...contextualTraits("mercury", mercury),
      },
      {
        id: "mars",
        symbol: placements.mars.symbol,
        kicker: `Marte · ${placements.mars.sign}`,
        title: "Como age e defende o que quer",
        text: mars.action,
        ...contextualTraits("mars", mars),
      },
    ],
  };
}

const HOUSE_AREAS: Record<number, string> = {
  1: "seu jeito de agir e começar",
  2: "dinheiro, coisas importantes e segurança",
  3: "conversas, estudos e pessoas próximas",
  4: "casa, família e vida particular",
  5: "brincadeiras, criatividade e o que dá prazer",
  6: "hábitos, tarefas e rotina",
  7: "amizades próximas, namoro e acordos",
  8: "confiança, mudanças e coisas divididas com alguém",
  9: "ideias, estudos, viagens e descobertas",
  10: "trabalho, objetivos e o que você quer construir",
  11: "amizades, grupos e planos para o futuro",
  12: "imaginação, descanso e sentimentos guardados",
};

const ASPECTS: Record<string, { label: string; meaning: string }> = {
  conjunction: {
    label: "Conjunção",
    meaning:
      "Esses dois assuntos aparecem juntos e podem ficar mais fortes. Vale perceber como um influencia o outro.",
  },
  opposition: {
    label: "Oposição",
    meaning:
      "Dois lados diferentes podem puxar você para direções opostas. O desafio é ouvir os dois e buscar equilíbrio.",
  },
  trine: {
    label: "Trígono",
    meaning:
      "Esses dois assuntos costumam combinar com facilidade. Use essa facilidade, lembrando que praticar também faz diferença.",
  },
  square: {
    label: "Quadratura",
    meaning:
      "Pode surgir um desafio entre esses assuntos. Pensar em outro jeito de agir ajuda a transformar o desafio em aprendizado.",
  },
  sextile: {
    label: "Sextil",
    meaning:
      "Há uma chance de esses assuntos se ajudarem. Ela cresce quando você tenta, pratica e participa.",
  },
  quincunx: {
    label: "Quincúncio",
    meaning:
      "Esses assuntos podem funcionar em ritmos diferentes. Talvez você precise fazer pequenos ajustes de tempos em tempos.",
  },
};

const LIFE_PATHS: Record<number, string> = {
  1: "O caminho 1 fala de começar coisas e confiar nas próprias ideias. Lidere quando fizer sentido, mas lembre que também é bom pedir ajuda.",
  2: "O caminho 2 fala de parceria e atenção ao que as pessoas sentem. Cuide dos outros sem esquecer do que você precisa.",
  3: "O caminho 3 fala de criar, conversar e mostrar suas ideias. Escolher uma ideia e levá-la adiante ajuda seus planos a sair do papel.",
  4: "O caminho 4 fala de organização e de construir passo a passo. Ter rotina ajuda, mas deixe espaço para mudar de ideia quando precisar.",
  5: "O caminho 5 fala de novidades e vontade de experimentar. Você pode mudar e explorar, lembrando de cuidar dos combinados importantes.",
  6: "O caminho 6 fala de cuidar e criar um ambiente acolhedor. Ajudar é bom, e dizer ‘agora não posso’ também pode ser necessário.",
  7: "O caminho 7 fala de fazer perguntas, estudar e pensar com calma. Compartilhar o que aprende pode aproximar você das pessoas.",
  8: "O caminho 8 fala de planejar, organizar e realizar objetivos. Ter sucesso também significa agir com honestidade e respeito.",
  9: "O caminho 9 fala de empatia e de terminar etapas da vida. Você pode ajudar sem tentar resolver tudo por todo mundo.",
  11: "O caminho mestre 11 une sensibilidade, inspiração e influência. Seu desafio é transformar percepção intensa em comunicação clara e ação possível.",
  22: "O caminho mestre 22 combina visão ampla e capacidade de construir. Seu desafio é dividir grandes projetos em estruturas sustentáveis.",
  33: "O caminho mestre 33 enfatiza cuidado, ensino e responsabilidade afetiva. Seu desafio é oferecer presença sem assumir a vida de todos.",
};

const PERSONAL_YEARS: Record<number, string> = {
  1: "Um ano bom para começar algo e escolher uma direção. Dê o primeiro passo em um plano que você queira ver crescer.",
  2: "Um ano para ter paciência e aprender a trabalhar junto. Ouvir com atenção pode ajudar nas amizades e nos planos.",
  3: "Um ano para criar, conversar e dividir ideias. Escolha no que quer focar para não começar coisas demais ao mesmo tempo.",
  4: "Um ano para organizar a rotina e avançar um passo de cada vez. Pequenos esforços repetidos podem trazer bons resultados.",
  5: "Um ano com vontade de mudar e experimentar coisas novas. Pense no que pode mudar e no que é importante manter.",
  6: "Um ano para cuidar das relações e cumprir combinados. Conversas claras ajudam cada pessoa a saber o que pode fazer.",
  7: "Um ano para estudar, pensar e entender melhor o que você sente. Não precisa responder tudo correndo.",
  8: "Um ano para trabalhar por objetivos e cuidar bem do dinheiro e das responsabilidades. Planejar ajuda a escolher melhor.",
  9: "Um ano para terminar tarefas e deixar para trás o que já não combina com você. Assim, sobra espaço para novos planos.",
};

const ELEMENT_TEXT: Record<string, string> = {
  Fogo:
    "No mapa, muito Fogo pode mostrar entusiasmo e vontade de agir. Você pode se animar com desafios e ideias que parecem importantes.",
  Terra:
    "No mapa, muita Terra pode mostrar que você gosta de coisas práticas e de ver resultados. Planejar e seguir passos conhecidos pode dar segurança.",
  Ar:
    "No mapa, muito Ar pode mostrar curiosidade e vontade de conversar e aprender. Trocar ideias pode ajudar você a entender melhor as coisas.",
  Água:
    "No mapa, muita Água pode mostrar sensibilidade ao que você e as outras pessoas sentem. Fazer pausas e falar sobre isso pode ajudar.",
};

const MODE_TEXT: Record<string, string> = {
  Cardinal:
    "Cardinal quer dizer começar: no mapa, isso pode mostrar vontade de dar o primeiro passo e colocar planos em movimento.",
  Fixo:
    "Fixo quer dizer continuar: no mapa, isso pode mostrar força para manter o foco e terminar o que começou.",
  Mutável:
    "Mutável quer dizer se adaptar: no mapa, isso pode mostrar facilidade para aprender e mudar de plano quando necessário.",
};

const PATTERN_TRAITS: Record<
  string,
  { strength: string; watchout: string }
> = {
  Fogo: {
    strength: "mobilizar energia e entusiasmo",
    watchout: "medir o ritmo antes de assumir novos desafios",
  },
  Terra: {
    strength: "transformar planos em resultados concretos",
    watchout: "abrir espaço para rever métodos que já não ajudam",
  },
  Ar: {
    strength: "conectar ideias e encontrar alternativas",
    watchout: "reservar tempo para aprofundar e concluir cada assunto",
  },
  Água: {
    strength: "perceber nuances e responder com sensibilidade",
    watchout: "distinguir suas necessidades do clima ao redor",
  },
  Cardinal: {
    strength: "dar o primeiro passo quando algo importa",
    watchout: "confirmar prioridades antes de iniciar várias frentes",
  },
  Fixo: {
    strength: "sustentar compromissos até ganhar consistência",
    watchout: "considerar alternativas quando as circunstâncias mudam",
  },
  Mutável: {
    strength: "ajustar a rota diante de novas informações",
    watchout: "escolher um foco para não se dividir entre possibilidades",
  },
};

const COUNTRY_CODES: Record<string, string> = {
  brasil: "BR",
  brazil: "BR",
  portugal: "PT",
  frança: "FR",
  france: "FR",
  espanha: "ES",
  spain: "ES",
  itália: "IT",
  italy: "IT",
  argentina: "AR",
  chile: "CL",
  uruguai: "UY",
  paraguai: "PY",
  "estados unidos": "US",
  usa: "US",
  canadá: "CA",
  canada: "CA",
  suíça: "CH",
  switzerland: "CH",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function reduceNumber(value: number, preserveMasters = true) {
  let current = value;
  while (
    current > 9 &&
    (!preserveMasters || ![11, 22, 33].includes(current))
  ) {
    current = String(current)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return current;
}

function calculateLifePath(date: string) {
  return reduceNumber(
    date
      .replaceAll("-", "")
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0),
  );
}

function calculatePersonalYear(date: string) {
  const [, month, day] = date.split("-").map(Number);
  const yearSum = String(new Date().getUTCFullYear())
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
  return reduceNumber(month + day + yearSum, false);
}

function getSignKey(value: unknown): SignKey {
  const key = String(value || "aries") as SignKey;
  return key in SIGNS ? key : "aries";
}

function placementFrom(
  key: string,
  body: Record<string, unknown>,
  exactTime: boolean,
  forceNoHouse = false,
): Placement {
  const planet = PLANETS[key] ?? {
    label: key,
    symbol: "✦",
    role: "expressão",
  };
  const signObject = body.Sign as { key?: SignKey } | undefined;
  const chart = body.ChartPosition as
    | {
        Ecliptic?: {
          ArcDegreesFormatted30?: string;
          DecimalDegrees?: number;
        };
      }
    | undefined;
  const houseObject = body.House as { id?: number } | undefined;
  const signKey = getSignKey(signObject?.key);

  return {
    key,
    label: planet.label,
    symbol: planet.symbol,
    sign: SIGNS[signKey].label,
    signKey,
    degree: chart?.Ecliptic?.ArcDegreesFormatted30 ?? "—",
    longitude: chart?.Ecliptic?.DecimalDegrees ?? 0,
    house:
      exactTime && !forceNoHouse && typeof houseObject?.id === "number"
        ? houseObject.id
        : null,
    retrograde: body.isRetrograde === true,
  };
}

function anglePlacement(
  key: string,
  label: string,
  symbol: string,
  angle: Record<string, unknown>,
): Placement {
  const signObject = angle.Sign as { key?: SignKey } | undefined;
  const chart = angle.ChartPosition as
    | {
        Ecliptic?: {
          ArcDegreesFormatted30?: string;
          DecimalDegrees?: number;
        };
      }
    | undefined;
  const signKey = getSignKey(signObject?.key);
  return {
    key,
    label,
    symbol,
    sign: SIGNS[signKey].label,
    signKey,
    degree: chart?.Ecliptic?.ArcDegreesFormatted30 ?? "—",
    longitude: chart?.Ecliptic?.DecimalDegrees ?? 0,
    house: null,
    retrograde: false,
  };
}

const TRANSIT_PLANETS = [
  {
    key: "sun",
    body: Body.Sun,
    label: "Sol",
    meaning: "coloca luz e atenção sobre",
  },
  {
    key: "venus",
    body: Body.Venus,
    label: "Vênus",
    meaning: "aproxima, harmoniza e ajuda a rever",
  },
  {
    key: "mars",
    body: Body.Mars,
    label: "Marte",
    meaning: "ativa, acelera e pede atitude em",
  },
  {
    key: "jupiter",
    body: Body.Jupiter,
    label: "Júpiter",
    meaning: "amplia possibilidades e confiança em",
  },
  {
    key: "saturn",
    body: Body.Saturn,
    label: "Saturno",
    meaning: "pede estrutura, limite e amadurecimento em",
  },
] as const;

const TRANSIT_ASPECTS = [
  {
    angle: 0,
    key: "conjunction",
    label: "conjunção",
    meaning: "O assunto fica concentrado e mais difícil de ignorar.",
  },
  {
    angle: 60,
    key: "sextile",
    label: "sextil",
    meaning: "Existe uma abertura favorável, desde que você participe.",
  },
  {
    angle: 90,
    key: "square",
    label: "quadratura",
    meaning: "Um atrito pode mostrar o ajuste que estava faltando.",
  },
  {
    angle: 120,
    key: "trine",
    label: "trígono",
    meaning: "Há um fluxo mais natural que pode ser bem aproveitado.",
  },
  {
    angle: 180,
    key: "opposition",
    label: "oposição",
    meaning: "Dois lados pedem equilíbrio antes de uma decisão.",
  },
] as const;

const NATAL_POINT_MEANINGS: Record<string, string> = {
  sun: "sua identidade e suas escolhas conscientes",
  moon: "suas necessidades emocionais e seu ritmo interno",
  mercury: "sua comunicação e sua forma de decidir",
  venus: "seus valores, vínculos e relação com prazer",
  mars: "sua iniciativa, seus desejos e sua força de ação",
  jupiter: "sua confiança e seu jeito de crescer",
  saturn: "seus limites, compromissos e aprendizados",
};

function circularDistance(first: number, second: number) {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function buildCurrentSky(
  placements: Record<string, Placement>,
): AnalysisResult["currentSky"] {
  const now = new Date();
  const phaseAngle = MoonPhase(now);
  const phaseIndex = Math.floor(((phaseAngle + 22.5) % 360) / 45);
  const moonPhases = [
    {
      label: "Lua Nova",
      text: "Um ritmo de começo, intenção e escolha do que merece energia.",
    },
    {
      label: "Lua Crescente",
      text: "Um ritmo de primeiros passos, teste e construção de confiança.",
    },
    {
      label: "Quarto Crescente",
      text: "Um ritmo de decisão, movimento e correção de obstáculos.",
    },
    {
      label: "Lua Gibosa Crescente",
      text: "Um ritmo de aperfeiçoamento antes de mostrar um resultado.",
    },
    {
      label: "Lua Cheia",
      text: "Um ritmo de clareza, percepção e resultado do que vinha crescendo.",
    },
    {
      label: "Lua Gibosa Minguante",
      text: "Um ritmo de compartilhar, entender e aproveitar aprendizados.",
    },
    {
      label: "Quarto Minguante",
      text: "Um ritmo de revisão, corte de excessos e mudança de estratégia.",
    },
    {
      label: "Lua Minguante",
      text: "Um ritmo de encerramento, descanso e preparação para recomeçar.",
    },
  ];
  const moonPhase = moonPhases[phaseIndex] ?? moonPhases[0];
  const natalKeys = Object.keys(NATAL_POINT_MEANINGS);

  const candidates = TRANSIT_PLANETS.flatMap((planet) => {
    const longitude = Ecliptic(GeoVector(planet.body, now, true)).elon;

    return natalKeys.flatMap((natalKey) => {
      const natal = placements[natalKey];
      if (!natal) return [];
      const distance = circularDistance(longitude, natal.longitude);
      const nearest = TRANSIT_ASPECTS.map((aspect) => ({
        ...aspect,
        orb: Math.abs(distance - aspect.angle),
      })).sort((first, second) => first.orb - second.orb)[0];

      if (!nearest || nearest.orb > 3) return [];

      return [
        {
          planet: planet.label,
          transitKey: planet.key,
          kind: nearest.key,
          natalKey,
          title: `${planet.label} em ${nearest.label} com seu ${natal.label}`,
          orb: nearest.orb,
          text: `${planet.label} ${planet.meaning} ${
            NATAL_POINT_MEANINGS[natalKey]
          }. ${nearest.meaning}`,
        },
      ];
    });
  }).sort((first, second) => first.orb - second.orb);

  const selected: typeof candidates = [];
  for (const candidate of candidates) {
    const samePlanet = selected.filter(
      (item) => item.planet === candidate.planet,
    ).length;
    const sameNatalPoint = selected.some(
      (item) => item.natalKey === candidate.natalKey,
    );
    if (samePlanet < 2 && !sameNatalPoint) selected.push(candidate);
    if (selected.length === 4) break;
  }

  const highlights = selected.map(({ title, orb, text }) => ({
    title,
    orb,
    text,
  }));
  const moves = selected.map(({ transitKey, natalKey, kind }) => ({
    transit: transitKey,
    natal: natalKey,
    kind,
  }));
  const summary = highlights[0]
    ? `No céu de agora, o destaque mais próximo é ${highlights[0].title.toLowerCase()}. ${highlights[0].text}`
    : `O céu de agora está em ${moonPhase.label}. ${moonPhase.text}`;

  return {
    dateLabel: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeZone: "America/Sao_Paulo",
    }).format(now),
    moonPhase: {
      label: moonPhase.label,
      angle: phaseAngle,
      text: moonPhase.text,
    },
    summary,
    highlights,
    moves,
  };
}

function buildMonthSky(): MonthSky[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + index;
    const at = (day: number) => new Date(Date.UTC(year, month, day, 12));
    const lon = (body: Body, date: Date) => Ecliptic(GeoVector(body, date, true)).elon;
    const days = [4, 11, 18, 25];
    const middle = at(15);
    return {
      year: middle.getUTCFullYear(),
      month: middle.getUTCMonth() + 1,
      venus: days.map((day) => lon(Body.Venus, at(day))),
      mars: days.map((day) => lon(Body.Mars, at(day))),
      jupiter: lon(Body.Jupiter, middle),
    };
  });
}

function addCurrentSkyToMoment(
  guide: ThemeGuide,
  currentSky: AnalysisResult["currentSky"],
): ThemeGuide {
  if (guide.id !== "momento") return guide;

  return {
    ...guide,
    headline: `Seu momento agora: ${currentSky.moonPhase.label}`,
    introduction: `${guide.introduction} ${currentSky.summary}`,
    sections: [
      ...guide.sections,
      {
        title: "O céu de hoje cruzado com seu mapa",
        text:
          currentSky.highlights[0]?.text ??
          `${currentSky.moonPhase.label}: ${currentSky.moonPhase.text}`,
      },
    ],
  };
}

function planetReading(placement: Placement, kind: string) {
  const profile = SIGNS[placement.signKey];
  const core =
    kind === "sun"
      ? profile.essence
      : kind === "moon"
        ? profile.emotions
        : kind === "ascendant"
          ? profile.presence
          : kind === "mercury"
            ? profile.mind
            : kind === "venus"
              ? profile.love
              : kind === "mars"
                ? profile.action
                : kind === "jupiter"
                  ? `Em ${profile.label}, sua expansão cresce por ${profile.strengths.join(
                      ", ",
                    )}. Suas ideias podem avançar quando você transforma a vontade em passos simples.`
                  : `Em ${profile.label}, maturidade pede que você trabalhe ${profile.watchouts.join(
                      ", ",
                    )} sem abrir mão de ${profile.strengths[0]}.`;
  const house =
    placement.house && HOUSE_AREAS[placement.house]
      ? ` Na casa ${placement.house}, isso aparece especialmente em ${HOUSE_AREAS[placement.house]}.`
      : "";
  const retrograde = placement.retrograde
    ? " Retrógrado quer dizer que, visto da Terra, o planeta parece andar para trás. Na astrologia, isso é usado como um convite para pensar melhor nesse assunto; não quer dizer que algo esteja errado."
    : "";
  return `${core}${house}${retrograde}`;
}

function themeReading(
  theme: ThemeKey,
  placements: Record<string, Placement>,
  midheaven: Placement | null,
  secondHouseSign: SignKey | null,
  personalYear: number,
) {
  if (theme === "amor") {
    return {
      title: "Seu foco em amor e relacionamentos",
      text: `${planetReading(placements.venus, "venus")} Sua Lua em ${
        placements.moon.sign
      } acrescenta a necessidade emocional de ${SIGNS[
        placements.moon.signKey
      ].strengths.slice(0, 2).join(" e ")}. O ponto de equilíbrio está em comunicar necessidades antes que elas virem expectativa silenciosa.`,
    };
  }

  if (theme === "carreira") {
    const direction = midheaven
      ? `Seu Meio do Céu em ${midheaven.sign} sugere uma direção pública que valoriza ${
          SIGNS[midheaven.signKey].strengths[0]
        }, ${SIGNS[midheaven.signKey].strengths[1]} e ${
          SIGNS[midheaven.signKey].strengths[2]
        }.`
      : "Com o horário de nascimento será possível calcular o Meio do Céu e aprofundar sua direção profissional.";
    return {
      title: "Seu foco em carreira e realização",
      text: `${direction} ${planetReading(
        placements.saturn,
        "saturn",
      )} A melhor estratégia combina a iniciativa do seu Sol em ${
        placements.sun.sign
      } com metas que possam ser acompanhadas no tempo.`,
    };
  }

  if (theme === "dinheiro") {
    const resources = secondHouseSign
      ? `A entrada da casa 2 em ${SIGNS[secondHouseSign].label} relaciona recursos pessoais a ${SIGNS[
          secondHouseSign
        ].strengths.join(", ")}.`
      : "Com o horário de nascimento será possível calcular a casa 2 e aprofundar sua relação com recursos.";
    return {
      title: "Seu foco em dinheiro e recursos",
      text: `${resources} Júpiter em ${
        placements.jupiter.sign
      } mostra expansão por ${
        SIGNS[placements.jupiter.signKey].strengths[0]
      }, enquanto Saturno em ${
        placements.saturn.sign
      } pede planejamento. O mapa aponta tendências de comportamento, não previsões financeiras.`,
    };
  }

  if (theme === "momento") {
    return {
      title: "Seu foco no momento atual",
      text: `Pela numerologia, você está em um Ano Pessoal ${personalYear}. ${
        PERSONAL_YEARS[personalYear]
      } O movimento mais produtivo é combinar esse ciclo com a forma de agir de Marte em ${
        placements.mars.sign
      }: ${SIGNS[placements.mars.signKey].action.toLowerCase()}`,
    };
  }

  return {
    title: "Seu foco em personalidade",
    text: `Seu Sol em ${placements.sun.sign}, sua Lua em ${
      placements.moon.sign
    } e ${
      placements.ascendant
        ? `seu Ascendente em ${placements.ascendant.sign}`
        : "o ascendente ainda não calculado"
    } mostram três camadas diferentes: direção consciente, necessidade emocional e forma de entrar no mundo. O autoconhecimento cresce quando nenhuma delas precisa anular as outras.`,
  };
}

function buildThemeDeepDive(
  theme: ThemeKey,
  placements: Record<string, Placement>,
  ascendant: Placement | null,
  midheaven: Placement | null,
  secondHouseSign: SignKey | null,
  personalYear: number,
): AnalysisResult["themeDeepDive"] {
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const venus = SIGNS[placements.venus.signKey];
  const mars = SIGNS[placements.mars.signKey];
  const jupiter = SIGNS[placements.jupiter.signKey];
  const saturn = SIGNS[placements.saturn.signKey];

  if (theme === "amor") {
    return {
      id: theme,
      label: "Amor",
      headline: "Seu jeito de amar e se conectar",
      introduction: `Vênus em ${placements.venus.sign} mostra como você demonstra carinho. A Lua em ${placements.moon.sign} fala do que você precisa sentir. Marte em ${placements.mars.sign} mostra como você se aproxima e reage.`,
      sections: [
        {
          title: "Sua linguagem afetiva",
          text: `Você tende a demonstrar carinho com ${venus.strengths
            .slice(0, 2)
            .join(" e ")}. Relações funcionam melhor quando isso pode circular dos dois lados.`,
        },
        {
          title: "O que traz segurança emocional",
          text: `Você se sente melhor quando encontra ${moon.strengths
            .slice(0, 2)
            .join(" e ")}. Falar sobre essa necessidade evita que ela vire uma expectativa silenciosa.`,
        },
        {
          title: "Iniciativa e conflitos",
          text: `Você costuma agir com ${mars.strengths
            .slice(0, 2)
            .join(" e ")}. Em conflitos, tenha atenção a ${mars.watchouts
            .slice(0, 2)
            .join(" e ")}.`,
        },
      ],
      actionPrompt:
        "Para pensar: o que você precisa falar com mais clareza em vez de esperar que a outra pessoa perceba sozinha?",
    };
  }

  if (theme === "carreira") {
    return {
      id: theme,
      label: "Carreira",
      headline: "Seus talentos e seu caminho profissional",
      introduction: `Esta parte reúne ${
        midheaven
          ? `Meio do Céu em ${midheaven.sign}`
          : "os pontos disponíveis sem o Meio do Céu"
      }, Júpiter em ${placements.jupiter.sign}, Saturno em ${
        placements.saturn.sign
      } e Marte em ${placements.mars.sign}. Ela mostra seu jeito de trabalhar, crescer e construir resultados.`,
      sections: [
        {
          title: "Direção e imagem profissional",
          text: midheaven
            ? `O Meio do Céu em ${midheaven.sign} mostra uma imagem profissional ligada a ${SIGNS[
                midheaven.signKey
              ].strengths.join(", ")}. Isso fala de um estilo, não de uma profissão obrigatória.`
            : "Com o horário exato, será possível calcular o Meio do Céu e aprofundar sua direção profissional.",
        },
        {
          title: "Onde a confiança pode crescer",
          text: `Júpiter em ${placements.jupiter.sign} favorece ${jupiter.strengths
            .slice(0, 2)
            .join(" e ")} quando há oportunidade de expansão.`,
        },
        {
          title: "Disciplina e consistência",
          text: `Na carreira, Saturno em ${placements.saturn.sign} pede atenção a ${saturn.watchouts
            .slice(0, 2)
            .join(" e ")}. Responsabilidade funciona melhor quando não vira excesso de cobrança.`,
        },
      ],
      actionPrompt:
        "Para pensar: qual talento seu já traz resultado, mas ainda não está visível como uma competência profissional?",
    };
  }

  if (theme === "dinheiro") {
    return {
      id: theme,
      label: "Dinheiro",
      headline: "Seu jeito de lidar com dinheiro e segurança",
      introduction: `Esta leitura fala de hábitos e escolhas. Ela reúne ${
        secondHouseSign
          ? `a casa do dinheiro em ${SIGNS[secondHouseSign].label}`
          : "os pontos disponíveis sem a casa do dinheiro"
      }, Vênus em ${placements.venus.sign}, Júpiter em ${
        placements.jupiter.sign
      } e Saturno em ${placements.saturn.sign}. Ela não prevê ganhos nem substitui orientação financeira.`,
      sections: [
        {
          title: "Sua base de segurança material",
          text: secondHouseSign
            ? `Sua casa do dinheiro em ${SIGNS[secondHouseSign].label} liga segurança a ${SIGNS[
                secondHouseSign
              ].strengths.join(", ")}. Tenha atenção a ${SIGNS[
                secondHouseSign
              ].watchouts.slice(0, 2).join(" e ")}.`
            : "Sem horário, a casa do dinheiro não pode ser calculada. A leitura usa Vênus, Júpiter e Saturno.",
        },
        {
          title: "Expansão e oportunidades",
          text: `Júpiter em ${placements.jupiter.sign} favorece crescimento por ${jupiter.strengths.join(
            ", ",
          )}. Oportunidade funciona melhor quando vem junto de informação e limite.`,
        },
        {
          title: "Limites, reserva e planejamento",
          text: `Saturno em ${placements.saturn.sign} pede organização e constância. Observe se ${saturn.watchouts
            .slice(0, 2)
            .join(" e ")} interferem na relação com dinheiro.`,
        },
      ],
      actionPrompt:
        "Para pensar: qual objetivo deve orientar melhor seu dinheiro — e qual comportamento precisa de um limite claro?",
    };
  }

  if (theme === "momento") {
    return {
      id: theme,
      label: "Momento atual",
      headline: `Seu ciclo atual: Ano Pessoal ${personalYear}`,
      introduction: `${PERSONAL_YEARS[personalYear]} Marte em ${placements.mars.sign} mostra como agir. A Lua em ${placements.moon.sign} mostra o ritmo que ajuda você a continuar bem.`,
      sections: [
        {
          title: "O tema central deste ciclo",
          text: PERSONAL_YEARS[personalYear],
        },
        {
          title: "Como transformar intenção em movimento",
          text: `Sua iniciativa cresce com ${mars.strengths
            .slice(0, 2)
            .join(" e ")} quando existe uma meta clara.`,
        },
        {
          title: "Como respeitar seu ritmo emocional",
          text: `Sua Lua pede espaço para ${moon.strengths
            .slice(0, 2)
            .join(" e ")} durante mudanças e decisões.`,
        },
      ],
      actionPrompt:
        "Para pensar: qual passo pequeno representa melhor este momento nos próximos 30 dias?",
    };
  }

  return {
    id: "personalidade",
    label: "Personalidade",
    headline: "Sua personalidade em três partes",
    introduction: `Sol em ${placements.sun.sign}, Lua em ${
      placements.moon.sign
    }${
      ascendant ? ` e Ascendente em ${ascendant.sign}` : ""
    } mostram quem você busca ser, o que sente e como chega ao mundo.`,
    sections: [
      {
        title: "Essência e direção",
        text: `Sua força central combina ${sun.strengths
          .slice(0, 2)
          .join(" e ")}. Você ganha energia quando pode usar essas qualidades.`,
      },
      {
        title: "Emoções e necessidades",
        text: `Você tende a buscar ${moon.strengths
          .slice(0, 2)
          .join(" e ")} para recuperar equilíbrio.`,
      },
      {
        title: "Presença e primeira impressão",
        text: ascendant
          ? `Seu Ascendente em ${ascendant.sign} pode transmitir ${SIGNS[
              ascendant.signKey
            ].strengths.slice(0, 2).join(" e ")} no primeiro contato.`
          : "Sem horário, o Ascendente não é apresentado. Observe como você costuma agir em situações novas.",
      },
    ],
    actionPrompt:
      "Para pensar: em quais situações aquilo que você quer e aquilo que sente trabalham juntos?",
  };
}

function buildMinorThemeGuide(
  theme: ThemeKey,
  placements: Record<string, Placement>,
  ascendant: Placement | null,
  personalYear: number,
): ThemeGuide {
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const mercury = SIGNS[placements.mercury.signKey];
  const venus = SIGNS[placements.venus.signKey];
  const mars = SIGNS[placements.mars.signKey];
  const jupiter = SIGNS[placements.jupiter.signKey];
  const saturn = SIGNS[placements.saturn.signKey];

  if (theme === "amor") {
    return {
      id: theme,
      label: "Afeto e vínculos",
      headline: "Como demonstra carinho e cria confiança",
      introduction: `A Lua em ${placements.moon.sign} ajuda a entender necessidades emocionais, enquanto Vênus em ${placements.venus.sign} mostra maneiras naturais de demonstrar afeto. A leitura considera família, amizades e convivência.`,
      sections: [
        {
          title: "O que traz segurança emocional",
          text: `A tendência é se sentir mais à vontade quando existe ${moon.strengths
            .slice(0, 2)
            .join(" e ")}. Rotina, conversa e acolhimento podem ajudar essa segurança a crescer.`,
        },
        {
          title: "Como o carinho aparece",
          text: `Vênus em ${placements.venus.sign} pode demonstrar carinho com ${venus.strengths
            .slice(0, 2)
            .join(" e ")}. Nem sempre isso aparece em palavras; vale observar também pequenos gestos.`,
        },
        {
          title: "Como lidar com incômodos",
          text: `Marte em ${placements.mars.sign} reage com ${mars.strengths[0]}. Quando surgir ${mars.watchouts[0]}, uma pausa e uma pergunta simples podem facilitar a conversa.`,
        },
      ],
      actionPrompt:
        "Para quem cuida: qual situação faz essa pessoa se sentir ouvida, segura e respeitada?",
    };
  }

  if (theme === "carreira") {
    return {
      id: theme,
      label: "Aprendizado e talentos",
      headline: "Como aprende, experimenta e desenvolve habilidades",
      introduction: `Mercúrio em ${placements.mercury.sign} fala da forma de pensar. Marte em ${placements.mars.sign} mostra como parte para a prática, e Júpiter em ${placements.jupiter.sign} aponta onde a curiosidade pode crescer.`,
      sections: [
        {
          title: "Jeito de aprender",
          text: `Mercúrio em ${placements.mercury.sign} aprende melhor quando pode usar ${mercury.strengths
            .slice(0, 2)
            .join(" e ")}. Explicações no ritmo certo ajudam mais do que comparações.`,
        },
        {
          title: "Talentos que merecem espaço",
          text: `Júpiter em ${placements.jupiter.sign} favorece experiências com ${jupiter.strengths
            .slice(0, 2)
            .join(" e ")}. O objetivo não é escolher uma profissão cedo, mas perceber o que desperta interesse real.`,
        },
        {
          title: "Como incentivar a constância",
          text: `Saturno em ${placements.saturn.sign} desenvolve segurança com ${saturn.strengths[0]} e tempo. Metas pequenas e elogios ao esforço podem funcionar melhor que cobrança por perfeição.`,
        },
      ],
      actionPrompt:
        "Para quem cuida: qual atividade prende a atenção sem precisar de muita cobrança?",
    };
  }

  if (theme === "dinheiro") {
    return {
      id: theme,
      label: "Recursos e hábitos",
      headline: "Como aprende sobre valor, escolha e organização",
      introduction: `Esta parte não prevê dinheiro. Ela observa como Vênus em ${placements.venus.sign}, Mercúrio em ${placements.mercury.sign} e Saturno em ${placements.saturn.sign} podem aparecer no aprendizado sobre escolhas e cuidado com recursos.`,
      sections: [
        {
          title: "O que parece ter valor",
          text: `Vênus em ${placements.venus.sign} tende a valorizar experiências com ${venus.strengths
            .slice(0, 2)
            .join(" e ")}. Conversar sobre desejo, necessidade e espera ajuda a formar escolhas conscientes.`,
        },
        {
          title: "Como ensinar organização",
          text: `Saturno em ${placements.saturn.sign} aprende responsabilidade com ${saturn.strengths[0]} e regras compreensíveis. Uma tarefa simples e repetida vale mais do que muitas regras ao mesmo tempo.`,
        },
        {
          title: "Pequenas decisões",
          text: `Mercúrio em ${placements.mercury.sign} decide melhor quando existe ${mercury.strengths[0]}. Dar duas opções adequadas pode ensinar autonomia sem deixar a pessoa sozinha com uma escolha grande.`,
        },
      ],
      actionPrompt:
        "Para quem cuida: qual pequena responsabilidade pode ensinar escolha e cuidado sem transformar tudo em cobrança?",
    };
  }

  if (theme === "momento") {
    return {
      id: theme,
      label: "Fase atual",
      headline: "O ritmo desta fase e o apoio que pode ajudar",
      introduction: `O Ano Pessoal ${personalYear} é usado apenas como um tema de reflexão. A Lua em ${placements.moon.sign} fala do ritmo emocional e Marte em ${placements.mars.sign} ajuda a observar como a energia entra em movimento.`,
      sections: [
        {
          title: "Assunto desta fase",
          text: `${PERSONAL_YEARS[personalYear]} Para uma pessoa em desenvolvimento, isso deve ser lido como convite à observação, nunca como destino.`,
        },
        {
          title: "Ritmo emocional",
          text: `A Lua em ${placements.moon.sign} pode recuperar equilíbrio com ${moon.strengths
            .slice(0, 2)
            .join(" e ")}. Mudanças ficam mais simples quando são explicadas com antecedência.`,
        },
        {
          title: "Um passo possível",
          text: `Marte em ${placements.mars.sign} se movimenta com ${mars.strengths
            .slice(0, 2)
            .join(" e ")}. Uma meta curta e visível ajuda a perceber progresso.`,
        },
      ],
      actionPrompt:
        "Para quem cuida: o que pode ser simplificado nesta fase para dar mais segurança e espaço de desenvolvimento?",
    };
  }

  return {
    id: "personalidade",
    label: "Jeito de ser",
    headline: "Um olhar cuidadoso sobre personalidade e emoções",
    introduction: `O Sol em ${placements.sun.sign}, a Lua em ${
      placements.moon.sign
    }${
      ascendant ? ` e o Ascendente em ${ascendant.sign}` : ""
    } mostram tendências diferentes. Elas ajudam a observar, mas não definem quem a pessoa será.`,
    sections: [
      {
        title: "Forças que podem aparecer",
        text: `O Sol em ${placements.sun.sign} destaca ${sun.strengths
          .slice(0, 2)
          .join(" e ")}. Essas qualidades crescem quando há espaço para experimentar sem medo de errar.`,
      },
      {
        title: "Emoções e necessidades",
        text: `A Lua em ${placements.moon.sign} tende a buscar ${moon.strengths
          .slice(0, 2)
          .join(" e ")} para recuperar equilíbrio. Escuta e rotina ajudam a nomear o que está sendo sentido.`,
      },
      {
        title: "Como começa experiências",
        text: ascendant
          ? `O Ascendente em ${ascendant.sign} pode iniciar situações novas com ${SIGNS[
              ascendant.signKey
            ].strengths.slice(0, 2).join(" e ")}.`
          : "Sem horário, o Ascendente não é apresentado. Observe como a pessoa reage quando conhece um lugar, tarefa ou grupo novo.",
      },
    ],
    actionPrompt:
      "Para quem cuida: em quais ambientes essas qualidades aparecem com mais leveza e confiança?",
  };
}

function buildMinorPremiumNarrative(
  guide: ThemeGuide,
  placements: Record<string, Placement>,
  firstName: string,
): AnalysisResult["premium"] {
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const mercury = SIGNS[placements.mercury.signKey];
  const mars = SIGNS[placements.mars.signKey];
  const [firstSection, secondSection, thirdSection] = guide.sections;

  return {
    headline: `${firstName}: uma leitura para observar sem criar rótulos`,
    introduction: `${guide.introduction} O objetivo é oferecer ideias para conversa e apoio. Desenvolvimento, ambiente e experiências continuam sendo mais importantes do que qualquer interpretação isolada.`,
    chapters: [
      {
        id: `${guide.id}-visao`,
        kicker: "Capítulo 01 · Visão geral",
        title: guide.headline,
        summary: guide.introduction,
        insights: [
          `O Sol em ${placements.sun.sign} destaca ${sun.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          `A Lua em ${placements.moon.sign} busca ${moon.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          "Essas tendências servem para observar situações reais, não para definir limites ou capacidades.",
        ],
        highlight:
          "Uma boa leitura abre perguntas; ela não decide quem uma pessoa deve ser.",
      },
      {
        id: `${guide.id}-forca`,
        kicker: "Capítulo 02 · Potencial",
        title: firstSection.title,
        summary: firstSection.text,
        insights: [
          `Vale observar quando ${sun.strengths[0]} aparece de forma espontânea.`,
          "Elogiar o processo ajuda mais do que transformar uma qualidade em obrigação.",
          "Ambientes diferentes podem revelar habilidades diferentes.",
        ],
        highlight:
          "Potencial cresce com oportunidade, prática e segurança para experimentar.",
      },
      {
        id: `${guide.id}-emocao`,
        kicker: "Capítulo 03 · Necessidades",
        title: secondSection.title,
        summary: secondSection.text,
        insights: [
          `A Lua em ${placements.moon.sign} pode precisar de ${moon.strengths[0]}.`,
          `Em dias difíceis, observe se ${moon.watchouts[0]} aparece como proteção.`,
          "Perguntas simples ajudam a pessoa a reconhecer e comunicar o que sente.",
        ],
        highlight:
          "Comportamento também pode ser uma forma de comunicar uma necessidade.",
      },
      {
        id: `${guide.id}-pratica`,
        kicker: "Capítulo 04 · Dia a dia",
        title: thirdSection.title,
        summary: thirdSection.text,
        insights: [
          `Mercúrio em ${placements.mercury.sign} compreende melhor com ${mercury.strengths[0]}.`,
          `Marte em ${placements.mars.sign} entra em ação com ${mars.strengths[0]}.`,
          "Combinar expectativas antes de uma tarefa reduz conflitos desnecessários.",
        ],
        highlight:
          "Uma orientação clara e possível costuma funcionar melhor que muitas cobranças ao mesmo tempo.",
      },
      {
        id: `${guide.id}-apoio`,
        kicker: "Capítulo 05 · Apoio",
        title: "Como apoiar sem comparar ou rotular",
        summary: `O mapa sugere atenção a ${sun.watchouts[0]} e ${moon.watchouts[0]}, mas esses pontos não são defeitos nem diagnósticos.`,
        insights: [
          "Compare a pessoa apenas com o próprio progresso.",
          "Separe um comportamento passageiro de uma característica permanente.",
          "Revise a interpretação sempre que a experiência real mostrar algo diferente.",
        ],
        highlight:
          "A pessoa vem antes do mapa: realidade, escuta e contexto sempre têm prioridade.",
      },
      {
        id: `${guide.id}-proximo`,
        kicker: "Capítulo 06 · Próximo passo",
        title: "Uma experiência simples para os próximos dias",
        summary: guide.actionPrompt,
        insights: [
          "Escolha apenas uma situação para observar.",
          "Converse com curiosidade, sem procurar uma resposta pronta.",
          "Registre o que ajudou e ajuste o apoio quando necessário.",
        ],
        highlight:
          "O melhor resultado desta leitura é uma conversa mais atenta e respeitosa.",
      },
    ],
    actionPlan: [
      {
        step: "01",
        title: "Observe o contexto",
        text: "Perceba onde a qualidade ou dificuldade aparece, sem concluir que ela acontece sempre.",
      },
      {
        step: "02",
        title: "Converse com abertura",
        text: "Faça uma pergunta simples e escute antes de oferecer uma explicação.",
      },
      {
        step: "03",
        title: "Apoie um passo pequeno",
        text: "Teste uma mudança possível na rotina e observe se ela realmente ajuda.",
      },
    ],
    reflectionQuestions: [
      `Em quais situações ${firstName} parece mais à vontade?`,
      "O que costuma trazer segurança quando algo muda?",
      "Qual talento aparece sem muita cobrança?",
      "Que tipo de explicação ou incentivo funciona melhor?",
      "O que a experiência real mostra que o mapa não consegue mostrar?",
    ],
  };
}

function buildThemeReadings(
  theme: ThemeKey,
  placements: Record<string, Placement>,
  ascendant: Placement | null,
  midheaven: Placement | null,
  secondHouseSign: SignKey | null,
  personalYear: number,
): AnalysisResult["readings"] {
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const mercury = SIGNS[placements.mercury.signKey];
  const venus = SIGNS[placements.venus.signKey];
  const mars = SIGNS[placements.mars.signKey];
  const jupiter = SIGNS[placements.jupiter.signKey];
  const saturn = SIGNS[placements.saturn.signKey];
  const themeContext: Record<ThemeKey, string> = {
    personalidade: "personalidade",
    amor: "amor",
    carreira: "carreira",
    dinheiro: "dinheiro",
    momento: "momento atual",
  };
  const areaHint = (placement: Placement) =>
    placement.house && HOUSE_AREAS[placement.house]
      ? ` Nesta leitura sobre ${themeContext[theme]}, a casa ${placement.house} mostra que esse padrão pode ficar mais visível em ${HOUSE_AREAS[placement.house]}.`
      : "";

  if (theme === "amor") {
    return [
      {
        id: "amor-venus",
        kicker: `Vênus em ${placements.venus.sign}`,
        title: "Seu jeito de demonstrar carinho",
        text: `Vênus em ${placements.venus.sign} mostra que carinho, para você, precisa ter ${venus.strengths
          .slice(0, 2)
          .join(" e ")}. Você tende a perceber amor mais facilmente por atitudes que transmitam essas qualidades. Quando surge ${venus.watchouts[0]}, pode ficar mais difícil enxergar o que a outra pessoa está oferecendo. Uma boa pergunta é: “qual gesto concreto me faz sentir valorizado?”${areaHint(
          placements.venus,
        )}`,
      },
      {
        id: "amor-lua",
        kicker: `Lua em ${placements.moon.sign}`,
        title: "O que traz segurança emocional",
        text: `A Lua em ${placements.moon.sign} indica que você baixa a guarda quando encontra ${moon.strengths
          .slice(0, 2)
          .join(" e ")}. Sem isso, podem aparecer ${moon.watchouts
          .slice(0, 2)
          .join(" e ")} como forma de proteção. Em vez de esperar que alguém adivinhe, tente explicar o que ajudaria você a se sentir mais seguro naquela situação.${areaHint(
          placements.moon,
        )}`,
      },
      {
        id: "amor-mercurio",
        kicker: `Mercúrio em ${placements.mercury.sign}`,
        title: "Como você conversa no amor",
        text: `Mercúrio em ${placements.mercury.sign} faz você organizar conversas afetivas por meio de ${mercury.strengths
          .slice(0, 2)
          .join(" e ")}. Quando o assunto fica delicado, ${mercury.watchouts[0]} pode tirar a conversa do ponto principal. Você se comunica melhor quando diz primeiro o que aconteceu, depois como se sentiu e, por fim, o que gostaria de combinar.${areaHint(
          placements.mercury,
        )}`,
      },
      {
        id: "amor-marte",
        kicker: `Marte em ${placements.mars.sign}`,
        title: "Iniciativa e conflitos",
        text: `Marte em ${placements.mars.sign} mostra que você se aproxima e defende seus desejos com ${mars.strengths
          .slice(0, 2)
          .join(" e ")}. Em um conflito, essa força pode virar ${mars.watchouts
          .slice(0, 2)
          .join(" e ")} se a reação vier antes da compreensão. Uma pausa curta ajuda você a responder ao problema real, sem transformar intensidade em distância.${areaHint(
          placements.mars,
        )}`,
      },
    ];
  }

  if (theme === "carreira") {
    return [
      {
        id: "carreira-sol",
        kicker: `Sol em ${placements.sun.sign}`,
        title: "Seu talento central",
        text: `O Sol em ${placements.sun.sign} coloca ${sun.strengths
          .slice(0, 2)
          .join(" e ")} entre seus recursos profissionais mais naturais. Na prática, você tende a render mais quando pode tomar decisões usando essas qualidades, e não apenas cumprir tarefas. O ponto de atenção é ${sun.watchouts[0]}: se exagerado, ele pode esconder um talento que deveria estar mais visível.${areaHint(
          placements.sun,
        )}`,
      },
      {
        id: "carreira-marte",
        kicker: `Marte em ${placements.mars.sign}`,
        title: "Seu ritmo de trabalho",
        text: `Marte em ${placements.mars.sign} descreve como você parte para a execução. Seu ritmo melhora quando existe espaço para ${mars.strengths
          .slice(0, 2)
          .join(" e ")} e uma meta que mostre claramente quando o trabalho terminou. Se aparecer ${mars.watchouts[0]}, experimente dividir a entrega em uma etapa de começo, uma de desenvolvimento e uma de conclusão.${areaHint(
          placements.mars,
        )}`,
      },
      {
        id: "carreira-jupiter",
        kicker: `Júpiter em ${placements.jupiter.sign}`,
        title: "Onde pode haver crescimento",
        text: `Júpiter em ${placements.jupiter.sign} mostra que novas oportunidades podem surgir quando você demonstra ${jupiter.strengths
          .slice(0, 2)
          .join(" e ")}. Isso pode aparecer em projetos maiores, novos aprendizados ou contatos que ampliem sua visão. O cuidado é não confundir entusiasmo com garantia: primeiro entenda o que será exigido, depois decida onde vale crescer.${areaHint(
          placements.jupiter,
        )}`,
      },
      {
        id: "carreira-saturno",
        kicker: `Saturno em ${placements.saturn.sign}`,
        title: "O que pede constância",
        text: `Saturno em ${placements.saturn.sign} aponta uma competência que se fortalece com prática, tempo e ${saturn.strengths[0]}. No início, ${saturn.watchouts
          .slice(0, 2)
          .join(" e ")} podem fazer você duvidar do próprio avanço. A melhor resposta é acompanhar evolução por entregas reais: o que você sabe fazer hoje que ainda não conseguia fazer alguns meses atrás?${areaHint(
          placements.saturn,
        )}`,
      },
      ...(midheaven
        ? [
            {
              id: "carreira-mc",
              kicker: `Meio do Céu em ${midheaven.sign}`,
              title: "Sua direção profissional",
              text: `O Meio do Céu em ${midheaven.sign} sugere que sua imagem profissional ganha força quando transmite ${SIGNS[
                midheaven.signKey
              ].strengths.slice(0, 2).join(" e ")}. Isso não escolhe uma profissão por você; mostra o tipo de contribuição pelo qual pode desejar ser reconhecido. Procure funções em que essas qualidades resolvam um problema concreto para outras pessoas.`,
            },
          ]
        : []),
    ];
  }

  if (theme === "dinheiro") {
    return [
      ...(secondHouseSign
        ? [
            {
              id: "dinheiro-casa-2",
              kicker: `Casa 2 em ${SIGNS[secondHouseSign].label}`,
              title: "Sua busca por segurança",
              text: `A casa 2 em ${SIGNS[secondHouseSign].label} mostra que segurança financeira, para você, está ligada a ${SIGNS[
                secondHouseSign
              ].strengths.slice(0, 2).join(" e ")}. Você tende a se sentir mais tranquilo quando consegue enxergar essas qualidades na forma como ganha, guarda ou usa recursos. O risco está em ${SIGNS[
                secondHouseSign
              ].watchouts.slice(0, 2).join(" e ")}. Um objetivo com valor, prazo e motivo definido ajuda a transformar segurança em algo concreto.`,
            },
          ]
        : []),
      {
        id: "dinheiro-venus",
        kicker: `Vênus em ${placements.venus.sign}`,
        title: "O que influencia seus gastos",
        text: `Vênus em ${placements.venus.sign} mostra que você costuma atribuir valor ao que oferece ${venus.strengths
          .slice(0, 2)
          .join(" e ")}. Isso pode influenciar desde pequenas compras até aquilo que você considera “valer a pena”. Quando ${venus.watchouts[0]} entra na decisão, o desejo do momento pode parecer mais importante que a prioridade. Antes de comprar, pergunte: “quero o objeto ou a sensação que imagino que ele trará?”${areaHint(
          placements.venus,
        )}`,
      },
      {
        id: "dinheiro-jupiter",
        kicker: `Júpiter em ${placements.jupiter.sign}`,
        title: "Como você enxerga oportunidades",
        text: `Júpiter em ${placements.jupiter.sign} faz você perceber possibilidades por meio de ${jupiter.strengths
          .slice(0, 2)
          .join(" e ")}. Essa combinação pode ajudar a ampliar renda, conhecimento ou rede de contatos, desde que exista uma forma clara de acompanhar o resultado. Como Júpiter também amplia excessos, compare cenário otimista, cenário provável e limite de perda antes de assumir um compromisso.${areaHint(
          placements.jupiter,
        )}`,
      },
      {
        id: "dinheiro-saturno",
        kicker: `Saturno em ${placements.saturn.sign}`,
        title: "Como criar mais organização",
        text: `Saturno em ${placements.saturn.sign} mostra que sua organização melhora quando você transforma ${saturn.strengths[0]} em rotina. Em vez de controlar cada detalhe, escolha três números para acompanhar: quanto entrou, quanto saiu e quanto foi separado para uma prioridade. Isso reduz o efeito de ${saturn.watchouts[0]} e deixa as decisões menos emocionais.${areaHint(
          placements.saturn,
        )}`,
      },
      {
        id: "dinheiro-mercurio",
        kicker: `Mercúrio em ${placements.mercury.sign}`,
        title: "Como tomar decisões",
        text: `Mercúrio em ${placements.mercury.sign} indica que você pensa melhor sobre dinheiro quando pode usar ${mercury.strengths
          .slice(0, 2)
          .join(" e ")}. O problema aparece se ${mercury.watchouts[0]} encurtar a análise ou fizer você olhar informações demais sem concluir. Experimente registrar a decisão em três linhas: o que eu ganho, o que eu arrisco e até quando preciso responder.${areaHint(
          placements.mercury,
        )}`,
      },
    ];
  }

  if (theme === "momento") {
    return [
      {
        id: "momento-ano",
        kicker: `Ano Pessoal ${personalYear}`,
        title: "O assunto principal deste ciclo",
        text: `${PERSONAL_YEARS[personalYear]} Em vez de tentar mudar tudo ao mesmo tempo, use esse tema como filtro: quais decisões combinam com a fase atual e quais pertencem a uma prioridade que já perdeu sentido?`,
      },
      {
        id: "momento-lua",
        kicker: `Lua em ${placements.moon.sign}`,
        title: "Seu ritmo emocional",
        text: `A Lua em ${placements.moon.sign} mostra que você recupera equilíbrio com ${moon.strengths
          .slice(0, 2)
          .join(" e ")}. Em uma fase de decisões, ignorar essa necessidade pode aumentar ${moon.watchouts
          .slice(0, 2)
          .join(" e ")}. Antes de escolher o próximo passo, observe se você precisa de informação, descanso, conversa ou apenas um pouco mais de tempo.${areaHint(
          placements.moon,
        )}`,
      },
      {
        id: "momento-marte",
        kicker: `Marte em ${placements.mars.sign}`,
        title: "Como transformar intenção em uma ação concreta",
        text: `Marte em ${placements.mars.sign} mostra que você age melhor quando pode usar ${mars.strengths
          .slice(0, 2)
          .join(" e ")}. Na prática, isso significa escolher um objetivo que exija essas qualidades e definir com clareza o que será considerado “concluído”. Se ${mars.watchouts
          .slice(0, 2)
          .join(" e ")} aparecerem, reduza o tamanho da tarefa sem abandonar a direção. Seu movimento fica mais consistente quando cada passo deixa um resultado visível.${areaHint(
          placements.mars,
        )}`,
      },
      {
        id: "momento-jupiter",
        kicker: `Júpiter em ${placements.jupiter.sign}`,
        title: "Oportunidades para observar",
        text: `Júpiter em ${placements.jupiter.sign} chama atenção para oportunidades ligadas a ${jupiter.strengths
          .slice(0, 2)
          .join(" e ")}. Elas podem vir por uma conversa, um estudo, um convite ou uma ideia que amplia o que você já conhece. Nem todo caminho novo precisa ser seguido; dê prioridade ao que fortalece o tema do seu Ano Pessoal ${personalYear} e ainda faz sentido depois da empolgação inicial.${areaHint(
          placements.jupiter,
        )}`,
      },
      {
        id: "momento-saturno",
        kicker: `Saturno em ${placements.saturn.sign}`,
        title: "O que pede paciência",
        text: `Saturno em ${placements.saturn.sign} mostra onde este momento pede ${saturn.strengths[0]}, repetição e responsabilidade. ${saturn.watchouts
          .slice(0, 2)
          .join(" e ")} podem dar a impressão de que nada está avançando, mesmo quando existe progresso. Divida o desafio em etapas semanais e acompanhe o que foi feito; a evidência de avanço ajuda a diminuir a cobrança.${areaHint(
          placements.saturn,
        )}`,
      },
    ];
  }

  return [
    {
      id: "personalidade-sol",
      kicker: `Sol em ${placements.sun.sign}`,
      title: "O que move você",
      text: `O Sol em ${placements.sun.sign} mostra que sua identidade ganha força através de ${sun.strengths
        .slice(0, 2)
        .join(" e ")}. Você tende a se sentir mais inteiro quando suas escolhas permitem usar essas qualidades de verdade. Quando ${sun.watchouts
        .slice(0, 2)
        .join(" e ")} dominam, pode surgir a sensação de estar tentando provar algo em vez de simplesmente expressar quem é.${areaHint(
        placements.sun,
      )}`,
    },
    {
      id: "personalidade-lua",
      kicker: `Lua em ${placements.moon.sign}`,
      title: "O que você sente e precisa",
      text: `A Lua em ${placements.moon.sign} descreve uma necessidade emocional de ${moon.strengths
        .slice(0, 2)
        .join(" e ")}. Isso aparece principalmente quando você está cansado, inseguro ou precisa reagir sem muito tempo para pensar. Reconhecer ${moon.watchouts[0]} como um sinal — e não como uma definição da sua personalidade — ajuda a escolher uma resposta mais consciente.${areaHint(
        placements.moon,
      )}`,
    },
    ...(ascendant
      ? [
          {
            id: "personalidade-ascendente",
            kicker: `Ascendente em ${ascendant.sign}`,
            title: "Como você chega ao mundo",
            text: `O Ascendente em ${ascendant.sign} faz sua presença inicial transmitir ${SIGNS[
              ascendant.signKey
            ].strengths.slice(0, 2).join(" e ")}. É a camada que costuma aparecer quando você entra em um ambiente novo ou ainda não sabe exatamente o que esperar. Com o tempo, Sol e Lua mostram lados que podem ser bem diferentes dessa primeira impressão.`,
          },
        ]
      : []),
    {
      id: "personalidade-mercurio",
      kicker: `Mercúrio em ${placements.mercury.sign}`,
      title: "Como você pensa e conversa",
      text: `Mercúrio em ${placements.mercury.sign} organiza ideias por meio de ${mercury.strengths
        .slice(0, 2)
        .join(" e ")}. Esse estilo ajuda você a entender certos assuntos rapidamente, mas ${mercury.watchouts
        .slice(0, 2)
        .join(" e ")} podem criar ruído. Quando uma conversa for importante, tente resumir sua ideia principal em uma frase antes de acrescentar detalhes.${areaHint(
        placements.mercury,
      )}`,
    },
    {
      id: "personalidade-marte",
      kicker: `Marte em ${placements.mars.sign}`,
      title: "Como você parte para a ação",
      text: `Marte em ${placements.mars.sign} mostra uma iniciativa alimentada por ${mars.strengths
        .slice(0, 2)
        .join(" e ")}. Você tende a avançar melhor quando entende por que vale a pena agir e qual resultado procura. O desafio é perceber quando ${mars.watchouts[0]} transforma força em desgaste; nesses momentos, ajustar o método costuma ser melhor que abandonar o objetivo.${areaHint(
        placements.mars,
      )}`,
    },
  ];
}

function buildPremiumNarrative(
  theme: ThemeKey,
  placements: Record<string, Placement>,
  ascendant: Placement | null,
  midheaven: Placement | null,
  secondHouseSign: SignKey | null,
  personalYear: number,
  aspects: Array<{ title: string; orb: number; text: string }>,
): AnalysisResult["premium"] {
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const venus = SIGNS[placements.venus.signKey];
  const mars = SIGNS[placements.mars.signKey];
  const mercury = SIGNS[placements.mercury.signKey];
  const jupiter = SIGNS[placements.jupiter.signKey];
  const saturn = SIGNS[placements.saturn.signKey];
  const ascendantProfile = ascendant ? SIGNS[ascendant.signKey] : null;
  const strongestAspect = aspects[0];

  if (theme === "amor") {
    return {
      headline: "Seu jeito de amar, explicado de forma simples",
      introduction: `Esta leitura olha para Vênus em ${placements.venus.sign}, Lua em ${placements.moon.sign}, Mercúrio em ${placements.mercury.sign} e Marte em ${placements.mars.sign}. Em palavras simples: ela mostra o que faz você se sentir querido, como demonstra carinho, como conversa e como reage quando algo incomoda.`,
      chapters: [
        {
          id: "amor-necessidades",
          kicker: "Capítulo 01 · Necessidades",
          title: "O que você precisa sentir no amor",
          summary: `Sua Lua em ${placements.moon.sign} mostra que você se sente melhor quando encontra ${moon.strengths
            .slice(0, 2)
            .join(" e ")} na relação.`,
          insights: [
            `Você tende a se abrir mais quando existe ${moon.strengths[0]}.`,
            `Quando falta segurança, podem aparecer ${moon.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Falar sobre o que você sente costuma funcionar melhor do que esperar que a outra pessoa adivinhe.",
          ],
          highlight:
            "Seu ponto de partida: reconhecer sua necessidade emocional antes de transformá-la em cobrança.",
        },
        {
          id: "amor-carinho",
          kicker: "Capítulo 02 · Carinho",
          title: "Como você demonstra que gosta",
          summary: `Vênus em ${placements.venus.sign} indica uma forma de amar ligada a ${venus.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Você valoriza relações em que existe ${venus.strengths[0]}.`,
            `Seu carinho aparece melhor quando pode usar ${venus.strengths
              .slice(0, 2)
              .join(" e ")}.`,
            `O cuidado está em não deixar ${venus.watchouts[0]} falar mais alto que o afeto.`,
          ],
          highlight:
            "Observe os gestos que você oferece naturalmente. Eles revelam sua linguagem de carinho.",
        },
        {
          id: "amor-conversa",
          kicker: "Capítulo 03 · Conversa",
          title: "Como você fala sobre sentimentos",
          summary: `Mercúrio em ${placements.mercury.sign} mostra uma comunicação com força em ${mercury.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Conversas importantes fluem melhor quando há ${mercury.strengths[0]}.`,
            `Você pode se confundir quando ${mercury.watchouts
              .slice(0, 2)
              .join(" e ")} tomam conta da conversa.`,
            "Uma frase clara sobre o que você sente vale mais do que várias indiretas.",
          ],
          highlight:
            "Falar com clareza não diminui o sentimento; ajuda o outro a entendê-lo.",
        },
        {
          id: "amor-iniciativa",
          kicker: "Capítulo 04 · Iniciativa",
          title: "Como você se aproxima e reage",
          summary: `Marte em ${placements.mars.sign} mostra uma iniciativa movida por ${mars.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Você costuma agir melhor quando existe ${mars.strengths[0]}.`,
            `Em conflitos, preste atenção a ${mars.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Dar um pequeno tempo antes de responder pode evitar que uma reação rápida vire um problema maior.",
          ],
          highlight:
            "A melhor iniciativa é aquela que mantém sua sinceridade sem perder o respeito.",
        },
        {
          id: "amor-padroes",
          kicker: "Capítulo 05 · Padrões",
          title: "O que pode se repetir sem você perceber",
          summary: `Lua, Vênus e Marte contam partes diferentes da mesma história. Você pode desejar ${venus.strengths[0]}, precisar de ${moon.strengths[0]} e agir com ${mars.strengths[0]}.`,
          insights: [
            "Nem sempre o que atrai você é o mesmo que traz segurança emocional.",
            `O excesso de ${venus.watchouts[0]} ou ${moon.watchouts[0]} pode criar ruído nos vínculos.`,
            "Perceber o padrão já é uma forma de escolher uma resposta diferente.",
          ],
          highlight:
            "Relações mais leves começam quando desejo, necessidade e comunicação conseguem conversar.",
        },
        {
          id: "amor-caminho",
          kicker: "Capítulo 06 · Caminho",
          title: "Como tornar seus vínculos mais leves",
          summary: `Seu mapa sugere que relações mais saudáveis crescem com ${venus.strengths[0]}, ${moon.strengths[0]} e uma comunicação baseada em ${mercury.strengths[0]}.`,
          insights: [
            "Diga o que você precisa de forma simples.",
            "Observe se existe troca, não apenas esforço de um lado.",
            "Prefira atitudes consistentes a promessas difíceis de confirmar.",
          ],
          highlight:
            "Escolha uma conversa que pode ficar mais clara nesta semana e comece por ela.",
        },
      ],
      actionPlan: [
        {
          step: "01",
          title: "Nomeie uma necessidade",
          text: "Escreva em uma frase o que faz você se sentir seguro em uma relação.",
        },
        {
          step: "02",
          title: "Troque expectativa por conversa",
          text: "Escolha algo que você espera em silêncio e transforme em um pedido claro e respeitoso.",
        },
        {
          step: "03",
          title: "Observe a troca",
          text: "Durante uma semana, perceba se carinho, atenção e esforço circulam dos dois lados.",
        },
      ],
      reflectionQuestions: [
        "O que faz você se sentir realmente acolhido em uma relação?",
        "Como você costuma mostrar carinho sem usar palavras?",
        "O que você tem dificuldade de pedir com clareza?",
        "Como você reage quando se sente inseguro?",
        "Qual mudança simples deixaria seus vínculos mais leves?",
      ],
    };
  }

  if (theme === "carreira") {
    return {
      headline: "Seus talentos e seu caminho profissional",
      introduction: `Esta leitura olha para sua maneira de trabalhar, aprender, agir e construir resultados. O Meio do Céu ${
        midheaven ? `em ${midheaven.sign}` : "não foi calculado sem o horário"
      }, junto de Sol, Mercúrio, Marte, Júpiter e Saturno, ajuda a mostrar onde você pode render melhor.`,
      chapters: [
        {
          id: "carreira-talentos",
          kicker: "Capítulo 01 · Talentos",
          title: "O que você faz bem naturalmente",
          summary: `Seu Sol em ${placements.sun.sign} destaca ${sun.strengths
            .slice(0, 2)
            .join(" e ")} como forças importantes.`,
          insights: [
            `Você ganha energia quando pode usar ${sun.strengths[0]}.`,
            `Seu diferencial cresce quando ${sun.strengths[1]} vira uma habilidade visível.`,
            `Evite deixar ${sun.watchouts[0]} esconder o que você sabe fazer.`,
          ],
          highlight:
            "Talento vira valor profissional quando pode ser explicado, mostrado e repetido.",
        },
        {
          id: "carreira-estilo",
          kicker: "Capítulo 02 · Estilo de trabalho",
          title: "Como você produz melhor",
          summary: `Marte em ${placements.mars.sign} indica um ritmo de ação ligado a ${mars.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Você tende a render mais com ${mars.strengths[0]}.`,
            `O ritmo cai quando aparecem ${mars.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Metas curtas e visíveis ajudam a transformar energia em entrega.",
          ],
          highlight:
            "Seu melhor método é aquele que respeita seu ritmo e ainda produz uma entrega concreta.",
        },
        {
          id: "carreira-comunicacao",
          kicker: "Capítulo 03 · Comunicação",
          title: "Como suas ideias ganham espaço",
          summary: `Mercúrio em ${placements.mercury.sign} favorece ${mercury.strengths
            .slice(0, 2)
            .join(" e ")} na forma de pensar e explicar.`,
          insights: [
            `Você convence melhor quando usa ${mercury.strengths[0]}.`,
            `Tenha atenção a ${mercury.watchouts
              .slice(0, 2)
              .join(" e ")} em reuniões e decisões.`,
            "Organizar uma ideia em problema, solução e resultado deixa sua fala mais forte.",
          ],
          highlight:
            "Uma boa ideia cresce quando as outras pessoas conseguem entendê-la rapidamente.",
        },
        {
          id: "carreira-direcao",
          kicker: "Capítulo 04 · Direção",
          title: "Que imagem profissional você pode construir",
          summary:
            midheaven && ascendantProfile
              ? `O Meio do Céu em ${midheaven.sign} aponta uma direção ligada a ${SIGNS[
                  midheaven.signKey
                ].strengths.join(", ")}.`
              : "Sem o horário exato, o mapa não calcula o Meio do Céu. Mesmo assim, seus planetas já mostram talentos e formas de trabalhar.",
          insights: [
            midheaven
              ? `Sua presença profissional pode crescer com ${SIGNS[
                  midheaven.signKey
                ].strengths.slice(0, 2).join(" e ")}.`
              : "Observe quais tipos de problema as pessoas procuram você para resolver.",
            `Júpiter em ${placements.jupiter.sign} amplia oportunidades através de ${jupiter.strengths
              .slice(0, 2)
              .join(" e ")}.`,
            "Direção profissional não precisa ser uma profissão única; pode ser um tipo de contribuição.",
          ],
          highlight:
            "Pergunte menos “qual cargo combina comigo?” e mais “que problema eu gosto de resolver?”.",
        },
        {
          id: "carreira-bloqueios",
          kicker: "Capítulo 05 · Crescimento",
          title: "O que pode atrasar sua evolução",
          summary: `Saturno em ${placements.saturn.sign} pede prática e paciência diante de ${saturn.watchouts
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Seu crescimento fica mais sólido quando existe ${saturn.strengths[0]}.`,
            `Evite transformar ${saturn.watchouts[0]} em excesso de cobrança.`,
            "A constância costuma levar mais longe do que esperar o momento perfeito.",
          ],
          highlight:
            "O desafio não é uma sentença. Ele mostra onde a repetição pode criar confiança.",
        },
        {
          id: "carreira-proximo-passo",
          kicker: "Capítulo 06 · Próximo passo",
          title: "Como sair da ideia e avançar",
          summary: `A combinação de ${sun.strengths[0]}, ${mars.strengths[0]} e ${jupiter.strengths[0]} mostra um caminho possível para crescer.`,
          insights: [
            "Escolha uma habilidade para deixar mais visível.",
            "Transforme essa habilidade em um exemplo concreto de resultado.",
            "Defina uma ação profissional que possa ser feita nos próximos 30 dias.",
          ],
          highlight:
            "Um passo pequeno, concluído e visível vale mais do que um plano perfeito que nunca começa.",
        },
      ],
      actionPlan: [
        {
          step: "01",
          title: "Escolha seu talento principal",
          text: `Comece por ${sun.strengths[0]} e anote onde essa força já trouxe resultado.`,
        },
        {
          step: "02",
          title: "Mostre uma entrega",
          text: "Separe um exemplo, projeto ou resultado que torne sua competência fácil de entender.",
        },
        {
          step: "03",
          title: "Crie uma meta de 30 dias",
          text: "Defina uma ação com data, resultado esperado e primeiro passo.",
        },
      ],
      reflectionQuestions: [
        "Que tipo de problema você resolve melhor?",
        "Qual talento seu ainda está pouco visível?",
        "Em que ambiente você costuma render mais?",
        "O que hoje atrasa seu crescimento profissional?",
        "Qual passo real você pode concluir nos próximos 30 dias?",
      ],
    };
  }

  if (theme === "dinheiro") {
    const secondHouse = secondHouseSign ? SIGNS[secondHouseSign] : null;
    return {
      headline: "Seu jeito de lidar com dinheiro e segurança",
      introduction: `Esta leitura fala de hábitos, escolhas e organização. ${
        secondHouse
          ? `Sua casa 2 começa em ${secondHouse.label}.`
          : "Sem o horário exato, a casa do dinheiro não foi calculada."
      } Vênus, Júpiter e Saturno completam a análise. O mapa não prevê ganhos nem substitui orientação financeira.`,
      chapters: [
        {
          id: "dinheiro-seguranca",
          kicker: "Capítulo 01 · Segurança",
          title: "O que faz você se sentir seguro",
          summary: secondHouse
            ? `A casa 2 em ${secondHouse.label} liga segurança material a ${secondHouse.strengths
                .slice(0, 2)
                .join(" e ")}.`
            : `Saturno em ${placements.saturn.sign} mostra que sua segurança cresce com ${saturn.strengths
                .slice(0, 2)
                .join(" e ")}.`,
          insights: [
            secondHouse
              ? `Você tende a confiar mais quando existe ${secondHouse.strengths[0]}.`
              : "Ter uma visão clara do que entra e sai ajuda a diminuir a incerteza.",
            secondHouse
              ? `Preste atenção a ${secondHouse.watchouts
                  .slice(0, 2)
                  .join(" e ")}.`
              : `Preste atenção a ${saturn.watchouts
                  .slice(0, 2)
                  .join(" e ")}.`,
            "Segurança começa quando você sabe o que precisa proteger e por quê.",
          ],
          highlight:
            "Dinheiro costuma ganhar mais sentido quando está ligado a um valor ou objetivo claro.",
        },
        {
          id: "dinheiro-valores",
          kicker: "Capítulo 02 · Valores",
          title: "O que influencia suas escolhas",
          summary: `Vênus em ${placements.venus.sign} mostra que suas decisões de valor buscam ${venus.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Você tende a valorizar aquilo que traz ${venus.strengths[0]}.`,
            `O cuidado está em não deixar ${venus.watchouts
              .slice(0, 2)
              .join(" e ")} comandarem uma compra.`,
            "Antes de gastar, pergunte se a escolha combina com sua prioridade atual.",
          ],
          highlight:
            "Nem todo desejo precisa virar compra; primeiro descubra o que ele representa.",
        },
        {
          id: "dinheiro-oportunidades",
          kicker: "Capítulo 03 · Oportunidades",
          title: "Onde pode existir espaço para crescer",
          summary: `Júpiter em ${placements.jupiter.sign} favorece crescimento por meio de ${jupiter.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Oportunidades aparecem com mais força quando você usa ${jupiter.strengths[0]}.`,
            `Evite confiar demais em ${jupiter.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Crescimento sustentável junta oportunidade, informação e limite.",
          ],
          highlight:
            "Uma oportunidade boa continua fazendo sentido depois que a empolgação inicial passa.",
        },
        {
          id: "dinheiro-limites",
          kicker: "Capítulo 04 · Limites",
          title: "O que pode atrapalhar sua organização",
          summary: `Saturno em ${placements.saturn.sign} pede atenção a ${saturn.watchouts
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Planejar fica mais fácil quando você usa ${saturn.strengths[0]}.`,
            `O excesso de ${saturn.watchouts[0]} pode levar a decisões rígidas ou adiadas.`,
            "Um limite simples e possível funciona melhor do que uma regra impossível de manter.",
          ],
          highlight:
            "Organização financeira não precisa ser complicada para ser útil.",
        },
        {
          id: "dinheiro-decisoes",
          kicker: "Capítulo 05 · Decisões",
          title: "Como pensar antes de escolher",
          summary: `Mercúrio em ${placements.mercury.sign} favorece decisões com ${mercury.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Você analisa melhor quando existe ${mercury.strengths[0]}.`,
            `Tenha cuidado com ${mercury.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Separar necessidade, desejo e oportunidade deixa a escolha mais clara.",
          ],
          highlight:
            "Uma pausa curta antes de decidir pode revelar se a escolha é útil ou apenas urgente.",
        },
        {
          id: "dinheiro-plano",
          kicker: "Capítulo 06 · Plano",
          title: "Seu próximo passo com o dinheiro",
          summary: `Seu mapa sugere unir ${jupiter.strengths[0]} para crescer e ${saturn.strengths[0]} para manter o que foi construído.`,
          insights: [
            "Escolha um objetivo financeiro simples e mensurável.",
            "Acompanhe apenas três números: entrada, gasto e valor separado.",
            "Revise o plano uma vez por semana, sem julgamento.",
          ],
          highlight:
            "O objetivo não é controlar tudo. É enxergar melhor para escolher com mais calma.",
        },
      ],
      actionPlan: [
        {
          step: "01",
          title: "Defina uma prioridade",
          text: "Escolha um objetivo financeiro para os próximos 30 dias.",
        },
        {
          step: "02",
          title: "Acompanhe o básico",
          text: "Anote o que entra, o que sai e o que foi separado para seu objetivo.",
        },
        {
          step: "03",
          title: "Crie uma regra simples",
          text: "Antes de uma compra não planejada, espere um pouco e confira se ela combina com sua prioridade.",
        },
      ],
      reflectionQuestions: [
        "O que dinheiro representa para você hoje: liberdade, segurança ou reconhecimento?",
        "Qual hábito ajuda sua organização?",
        "Qual comportamento costuma atrapalhar?",
        "Que oportunidade merece uma análise mais calma?",
        "Qual objetivo simples você quer acompanhar nos próximos 30 dias?",
      ],
    };
  }

  if (theme === "momento") {
    return {
      headline: `O que seu momento atual pede de você`,
      introduction: `Você está em um Ano Pessoal ${personalYear}. ${PERSONAL_YEARS[personalYear]} Esta leitura junta esse ciclo com sua Lua, Marte, Júpiter e Saturno para mostrar prioridades, ritmo e próximos passos.`,
      chapters: [
        {
          id: "momento-tema",
          kicker: "Capítulo 01 · Tema do ano",
          title: `O centro do seu Ano Pessoal ${personalYear}`,
          summary: PERSONAL_YEARS[personalYear],
          insights: [
            "Este ciclo mostra um assunto para observar, não um destino pronto.",
            "Você aproveita melhor o período quando escolhe poucas prioridades.",
            "Pequenas decisões repetidas costumam mostrar a direção com mais clareza.",
          ],
          highlight:
            "Use o ciclo como uma pergunta: o que merece mais atenção agora?",
        },
        {
          id: "momento-emocao",
          kicker: "Capítulo 02 · Emoções",
          title: "Como cuidar do seu ritmo",
          summary: `Sua Lua em ${placements.moon.sign} precisa de ${moon.strengths
            .slice(0, 2)
            .join(" e ")} para recuperar equilíbrio.`,
          insights: [
            `Você se reorganiza melhor quando existe ${moon.strengths[0]}.`,
            `Em períodos intensos, observe ${moon.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Respeitar seu ritmo não significa parar; significa escolher um passo possível.",
          ],
          highlight:
            "Antes de acelerar, perceba do que você precisa para continuar bem.",
        },
        {
          id: "momento-acao",
          kicker: "Capítulo 03 · Ação",
          title: "Como transformar intenção em movimento",
          summary: `Marte em ${placements.mars.sign} age melhor com ${mars.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Seu impulso cresce quando existe ${mars.strengths[0]}.`,
            `O cuidado está em não cair em ${mars.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Defina uma ação que possa ser concluída, não apenas começada.",
          ],
          highlight:
            "Movimento útil é aquele que aproxima você de uma prioridade real.",
        },
        {
          id: "momento-expansao",
          kicker: "Capítulo 04 · Oportunidades",
          title: "Onde vale prestar mais atenção",
          summary: `Júpiter em ${placements.jupiter.sign} amplia caminhos por meio de ${jupiter.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Novas possibilidades podem surgir quando você usa ${jupiter.strengths[0]}.`,
            `Evite exagerar em ${jupiter.watchouts
              .slice(0, 2)
              .join(" e ")}.`,
            "Nem toda oportunidade precisa ser aceita; escolha a que combina com seu momento.",
          ],
          highlight:
            "O melhor “sim” costuma aparecer depois de alguns “nãos” bem escolhidos.",
        },
        {
          id: "momento-desafio",
          kicker: "Capítulo 05 · Desafio",
          title: "O que pede paciência e maturidade",
          summary: `Saturno em ${placements.saturn.sign} mostra que este momento também cresce com ${saturn.strengths
            .slice(0, 2)
            .join(" e ")}.`,
          insights: [
            `Seu apoio está em ${saturn.strengths[0]}.`,
            `O peso aumenta quando ${saturn.watchouts
              .slice(0, 2)
              .join(" e ")} dominam as escolhas.`,
            "Dividir uma tarefa difícil em partes menores reduz a sensação de bloqueio.",
          ],
          highlight:
            "Maturidade não é fazer tudo sozinho; é saber o que precisa de tempo, ajuda ou limite.",
        },
        {
          id: "momento-30-dias",
          kicker: "Capítulo 06 · Próximos 30 dias",
          title: "Um caminho simples para agora",
          summary: `Seu momento pede uma combinação de ${moon.strengths[0]}, ${mars.strengths[0]} e ${saturn.strengths[0]}.`,
          insights: [
            "Escolha uma prioridade principal.",
            "Defina uma ação pequena para cada semana.",
            "No fim do mês, observe o que avançou e o que precisa ser ajustado.",
          ],
          highlight:
            "Você não precisa resolver o ano inteiro hoje. Precisa apenas enxergar o próximo passo.",
        },
      ],
      actionPlan: [
        {
          step: "01",
          title: "Escolha uma prioridade",
          text: "Defina o assunto que mais merece sua energia neste mês.",
        },
        {
          step: "02",
          title: "Dê um passo por semana",
          text: "Transforme a prioridade em quatro ações pequenas e possíveis.",
        },
        {
          step: "03",
          title: "Revise sem se cobrar",
          text: "Ao final do mês, veja o que funcionou, o que cansou e o que precisa mudar.",
        },
      ],
      reflectionQuestions: [
        "O que mais pede sua atenção agora?",
        "O que pode ser deixado para depois?",
        "Qual emoção está tentando mostrar algo importante?",
        "Que oportunidade combina com seu momento?",
        "Qual passo você consegue concluir nesta semana?",
      ],
    };
  }

  return {
    headline: "Sua personalidade, explicada por partes",
    introduction: `Seu Sol está em ${placements.sun.sign}, sua Lua em ${
      placements.moon.sign
    }${
      ascendant ? ` e seu Ascendente em ${ascendant.sign}` : ""
    }. Cada parte mostra algo diferente: quem você busca ser, o que sente e como chega ao mundo. A leitura abaixo junta essas peças em uma linguagem direta.`,
    chapters: [
      {
        id: "personalidade-essencia",
        kicker: "Capítulo 01 · Essência",
        title: "O que move você por dentro",
        summary: `Seu Sol em ${placements.sun.sign} destaca ${sun.strengths
          .slice(0, 2)
          .join(" e ")} como forças centrais.`,
        insights: [
          `Você se sente mais você quando pode usar ${sun.strengths[0]}.`,
          `Seu brilho diminui quando ${sun.watchouts
            .slice(0, 2)
            .join(" e ")} assumem o controle.`,
          "Escolhas alinhadas com seus valores costumam devolver energia.",
        ],
        highlight:
          "Sua essência aparece com mais clareza nas escolhas que você faria mesmo sem precisar impressionar ninguém.",
      },
      {
        id: "personalidade-emocao",
        kicker: "Capítulo 02 · Emoções",
        title: "O que você precisa para ficar bem",
        summary: `Sua Lua em ${placements.moon.sign} busca ${moon.strengths
          .slice(0, 2)
          .join(" e ")} para recuperar equilíbrio.`,
        insights: [
          `Você tende a se reorganizar com ${moon.strengths[0]}.`,
          `Em momentos difíceis, podem surgir ${moon.watchouts
            .slice(0, 2)
            .join(" e ")}.`,
          "Entender o que você sente ajuda a escolher melhor o que fazer.",
        ],
        highlight:
          "Emoção não é fraqueza nem ordem. É uma informação que merece ser entendida.",
      },
      {
        id: "personalidade-presenca",
        kicker: "Capítulo 03 · Presença",
        title: "Como as pessoas podem perceber você",
        summary:
          ascendant && ascendantProfile
            ? `Seu Ascendente em ${ascendant.sign} transmite ${ascendantProfile.strengths
                .slice(0, 2)
                .join(" e ")} logo no primeiro contato.`
            : "Sem o horário exato, o Ascendente não foi calculado. Observe como você costuma agir em situações novas.",
        insights: [
          ascendantProfile
            ? `Sua presença cresce com ${ascendantProfile.strengths[0]}.`
            : "Seu comportamento ao começar algo novo oferece pistas importantes.",
          ascendantProfile
            ? `O cuidado está em ${ascendantProfile.watchouts
                .slice(0, 2)
                .join(" e ")}.`
            : "Compare a primeira impressão que você acredita causar com o que pessoas próximas dizem.",
          "A primeira impressão é uma porta de entrada, não sua personalidade inteira.",
        ],
        highlight:
          "Você pode parecer de um jeito no começo e mostrar outras camadas quando ganha confiança.",
      },
      {
        id: "personalidade-comunicacao",
        kicker: "Capítulo 04 · Comunicação",
        title: "Como sua mente organiza o mundo",
        summary: `Mercúrio em ${placements.mercury.sign} favorece ${mercury.strengths
          .slice(0, 2)
          .join(" e ")}.`,
        insights: [
          `Você entende melhor quando pode usar ${mercury.strengths[0]}.`,
          `Pode haver ruído quando aparecem ${mercury.watchouts
            .slice(0, 2)
            .join(" e ")}.`,
          "Explicar uma ideia com exemplos simples ajuda outras pessoas a acompanhar seu raciocínio.",
        ],
        highlight:
          "Seu jeito de pensar é uma ferramenta; ele funciona melhor quando você conhece seus atalhos e excessos.",
      },
      {
        id: "personalidade-acao",
        kicker: "Capítulo 05 · Ação",
        title: "Como você transforma vontade em atitude",
        summary: `Marte em ${placements.mars.sign} mostra uma forma de agir ligada a ${mars.strengths
          .slice(0, 2)
          .join(" e ")}.`,
        insights: [
          `Sua energia cresce com ${mars.strengths[0]}.`,
          `O desafio aparece em ${mars.watchouts
            .slice(0, 2)
            .join(" e ")}.`,
          "Uma meta clara ajuda sua energia a encontrar direção.",
        ],
        highlight:
          "Seu jeito de agir fica mais forte quando impulso e intenção apontam para o mesmo lugar.",
      },
      {
        id: "personalidade-integracao",
        kicker: "Capítulo 06 · Integração",
        title: "Como juntar todas essas partes",
        summary: `Seu mapa mistura ${sun.strengths[0]}, ${moon.strengths[0]} e ${mars.strengths[0]}. Nenhuma dessas partes conta sua história sozinha.`,
        insights: [
          `Sua principal força pode estar em unir ${sun.strengths[0]} e ${moon.strengths[0]}.`,
          strongestAspect
            ? `${strongestAspect.title} mostra uma conversa importante entre duas partes do mapa.`
            : "Situações diferentes podem ativar lados diferentes da sua personalidade.",
          "Você não precisa escolher uma única definição para quem é.",
        ],
        highlight:
          "Autoconhecimento serve para ampliar escolhas, não para colocar você dentro de uma caixa.",
      },
    ],
    actionPlan: [
      {
        step: "01",
        title: "Reconheça uma força",
        text: `Observe onde ${sun.strengths[0]} já ajuda você na vida real.`,
      },
      {
        step: "02",
        title: "Perceba uma reação",
        text: `Quando surgir ${moon.watchouts[0]}, pare e tente nomear o que você está sentindo.`,
      },
      {
        step: "03",
        title: "Teste uma escolha nova",
        text: "Em uma situação conhecida, experimente responder de um jeito um pouco mais consciente.",
      },
    ],
    reflectionQuestions: [
      "Em quais situações você se sente mais você?",
      "O que ajuda você a recuperar equilíbrio emocional?",
      "Que primeira impressão você acredita transmitir?",
      "Qual força sua é pouco reconhecida?",
      "Que reação você gostaria de entender melhor?",
    ],
  };
}

function addPersonalSignature(
  premium: AnalysisResult["premium"],
  theme: ThemeKey,
  placements: Record<string, Placement>,
  firstName: string,
  strongestAspect?: { title: string; orb: number; text: string },
): AnalysisResult["premium"] {
  const themePlanet: Record<ThemeKey, Placement> = {
    personalidade: placements.mercury,
    amor: placements.venus,
    carreira: placements.saturn,
    dinheiro: placements.jupiter,
    momento: placements.mars,
  };
  const themeLabel: Record<ThemeKey, string> = {
    personalidade: "Personalidade",
    amor: "Amor",
    carreira: "Carreira",
    dinheiro: "Dinheiro",
    momento: "Momento atual",
  };
  const focus = themePlanet[theme];
  const sun = SIGNS[placements.sun.signKey];
  const moon = SIGNS[placements.moon.signKey];
  const focusProfile = SIGNS[focus.signKey];
  const aspectText = strongestAspect
    ? `${strongestAspect.title} acrescenta uma tensão ou facilidade particular a essa combinação: ${strongestAspect.text}`
    : "Sem um aspecto principal destacado, a síntese se apoia na combinação entre identidade, necessidade emocional e planeta do tema.";

  return {
    ...premium,
    headline: `${firstName}, sua leitura única sobre ${themeLabel[theme].toLowerCase()}`,
    introduction: `${premium.introduction} A síntese abaixo cruza suas posições reais para explicar como elas funcionam juntas — a parte do relatório que muda de pessoa para pessoa.`,
    chapters: [
      {
        id: `${theme}-assinatura-pessoal`,
        kicker: "Abertura · Sua assinatura pessoal",
        title: `Sol em ${placements.sun.sign}, Lua em ${placements.moon.sign} e ${focus.label} em ${focus.sign}`,
        summary: `${firstName}, sua combinação reúne a direção de ${sun.strengths[0]}, a necessidade emocional de ${moon.strengths[0]} e uma forma de lidar com ${themeLabel[theme].toLowerCase()} marcada por ${focusProfile.strengths[0]}.`,
        insights: [
          `Quando ${sun.strengths[0]} e ${moon.strengths[0]} trabalham juntos, você tende a agir com mais coerência neste tema.`,
          `Quando ${sun.watchouts[0]} encontra ${moon.watchouts[0]}, pode surgir uma contradição entre o que você quer demonstrar e o que precisa sentir.`,
          `${focus.label} em ${focus.sign} mostra que ${focusProfile.strengths.slice(0, 2).join(" e ")} são chaves pessoais para lidar com esta área.`,
          aspectText,
        ],
        highlight: `A sua leitura não vem de um signo isolado: ela nasce do encontro entre ${placements.sun.sign}, ${placements.moon.sign}, ${focus.sign}${strongestAspect ? " e o aspecto mais forte do mapa" : ""}.`,
      },
      ...premium.chapters,
    ],
  };
}

async function geocode(city: string, country: string) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");
  const code = COUNTRY_CODES[normalize(country)];
  if (code) url.searchParams.set("countryCode", code);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Não foi possível consultar a cidade agora.");
  }

  const data = (await response.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      timezone: string;
      country?: string;
      admin1?: string;
      country_code?: string;
    }>;
  };

  const results = data.results ?? [];
  const countryNormalized = normalize(country);
  const selected =
    results.find(
      (item) =>
        normalize(item.country ?? "") === countryNormalized ||
        item.country_code?.toLowerCase() === code?.toLowerCase(),
    ) ?? results[0];

  if (!selected) {
    throw new Error(
      "Não encontramos essa cidade. Confira a escrita e tente novamente.",
    );
  }

  return {
    latitude: selected.latitude,
    longitude: selected.longitude,
    timezone: selected.timezone,
    location: [selected.name, selected.admin1, selected.country]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", "),
  };
}

function calculateAge(birthDate: string) {
  const [year, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  const monthDifference = today.getUTCMonth() + 1 - month;
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

function validate(input: AnalyzeRequest) {
  const name = formatPersonName(String(input.name ?? "")).slice(0, 100);
  const birthDate = String(input.birthDate ?? "");
  const birthTime = String(input.birthTime ?? "");
  const city = String(input.city ?? "").trim().slice(0, 100);
  const country = String(input.country ?? "").trim().slice(0, 100);
  const recipientType = (
    ["self", "partner", "child", "other"].includes(
      String(input.recipientType),
    )
      ? input.recipientType
      : "self"
  ) as RecipientType;
  const theme = (
    ["personalidade", "amor", "carreira", "dinheiro", "momento"].includes(
      input.theme,
    )
      ? input.theme
      : "personalidade"
  ) as ThemeKey;

  if (!name || !city || !country || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("Preencha nome, data, cidade e país corretamente.");
  }
  if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime)) {
    throw new Error("Informe um horário válido ou deixe o campo vazio.");
  }
  if (input.dataConsent !== true) {
    throw new Error(
      "Confirme o uso dos dados para gerar a demonstração.",
    );
  }
  if (recipientType !== "self" && input.authorizationConfirmed !== true) {
    throw new Error(
      "Confirme que você pode utilizar os dados desta pessoa.",
    );
  }

  const [year, month, day] = birthDate.split("-").map(Number);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    dateCheck.getUTCFullYear() !== year ||
    dateCheck.getUTCMonth() !== month - 1 ||
    dateCheck.getUTCDate() !== day ||
    year < 1900 ||
    dateCheck > new Date()
  ) {
    throw new Error("Informe uma data de nascimento válida.");
  }

  return {
    name,
    birthDate,
    birthTime,
    city,
    country,
    theme,
    recipientType,
  };
}

export async function createAstroAnalysis(
  rawInput: AnalyzeRequest,
): Promise<AnalysisResult> {
  const input = validate(rawInput);
  const age = calculateAge(input.birthDate);
  const isMinor = age < 18;
  const firstName = input.name.split(/\s+/)[0];
  const relationshipLabels: Record<RecipientType, string> = {
    self: "Meu mapa",
    partner: "Parceiro ou parceira",
    child: "Filho ou filha",
    other: "Familiar ou outra pessoa",
  };
  const coordinates = await geocode(input.city, input.country);
  const [year, month, date] = input.birthDate.split("-").map(Number);
  const exactTime = Boolean(input.birthTime);
  const [hour, minute] = exactTime
    ? input.birthTime.split(":").map(Number)
    : [12, 0];

  const origin = new Origin({
    year,
    month: month - 1,
    date,
    hour,
    minute,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies"],
    aspectWithPoints: ["bodies"],
    aspectTypes: ["major"],
    customOrbs: {},
    language: "en",
  });

  const planetKeys = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];

  const placements = planetKeys.map((key) =>
    placementFrom(key, horoscope.CelestialBodies[key], exactTime),
  );
  const byKey = Object.fromEntries(
    placements.map((placement) => [placement.key, placement]),
  ) as Record<string, Placement>;

  const ascendant = exactTime
    ? anglePlacement("ascendant", "Ascendente", "↑", horoscope.Ascendant)
    : null;
  const midheaven = exactTime
    ? anglePlacement("midheaven", "Meio do Céu", "MC", horoscope.Midheaven)
    : null;
  if (ascendant) byKey.ascendant = ascendant;

  const counted = placements.slice(0, 7);
  const elementCounts = counted.reduce<Record<string, number>>(
    (counts, placement) => {
      const element = SIGNS[placement.signKey].element;
      counts[element] = (counts[element] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const modeCounts = counted.reduce<Record<string, number>>(
    (counts, placement) => {
      const mode = SIGNS[placement.signKey].mode;
      counts[mode] = (counts[mode] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const dominantElement =
    Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Fogo";
  const dominantMode =
    Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Cardinal";

  const strengths = [
    PATTERN_TRAITS[dominantElement]?.strength,
    PATTERN_TRAITS[dominantMode]?.strength,
  ].filter((item): item is string => Boolean(item));
  const watchouts = [
    PATTERN_TRAITS[dominantElement]?.watchout,
    PATTERN_TRAITS[dominantMode]?.watchout,
  ].filter((item): item is string => Boolean(item));

  const lifePath = calculateLifePath(input.birthDate);
  const personalYear = calculatePersonalYear(input.birthDate);
  const secondHouse = exactTime
    ? (horoscope.Houses?.[1]?.Sign as { key?: SignKey } | undefined)
    : undefined;
  const secondHouseSign = secondHouse?.key
    ? getSignKey(secondHouse.key)
    : null;

  const aspectResults = horoscope.Aspects.all
    .filter(
      (aspect) =>
        PLANETS[aspect.point1Key] &&
        PLANETS[aspect.point2Key] &&
        ASPECTS[aspect.aspectKey],
    )
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 6)
    .map((aspect) => {
      const type = ASPECTS[aspect.aspectKey];
      const first = PLANETS[aspect.point1Key];
      const second = PLANETS[aspect.point2Key];
      return {
        title: `${first.label} em ${type.label} com ${second.label}`,
        orb: aspect.orb,
        text: `${first.role[0].toUpperCase()}${first.role.slice(
          1,
        )} encontra ${second.role}. ${type.meaning}`,
        point1Key: aspect.point1Key,
        point2Key: aspect.point2Key,
        aspectKey: aspect.aspectKey,
      };
    });

  const houseCusps = exactTime
    ? horoscope.Houses.map((house) => {
        const position = house.ChartPosition as
          | { StartPosition?: { Ecliptic?: { DecimalDegrees?: number } } }
          | undefined;
        const longitude = position?.StartPosition?.Ecliptic?.DecimalDegrees;
        return {
          house: Number(house.id),
          longitude: typeof longitude === "number" ? longitude : Number.NaN,
        };
      }).filter(
        (cusp) =>
          Number.isInteger(cusp.house) && Number.isFinite(cusp.longitude),
      )
    : [];

  const currentSky = buildCurrentSky(byKey);
  const themeKeys: ThemeKey[] = [
    "personalidade",
    "amor",
    "carreira",
    "dinheiro",
    "momento",
  ];
  const allThemes = themeKeys.map((theme) => {
    const guide = isMinor
      ? buildMinorThemeGuide(
          theme,
          byKey,
          ascendant,
          personalYear,
        )
      : buildThemeDeepDive(
          theme,
          byKey,
          ascendant,
          midheaven,
          secondHouseSign,
          personalYear,
        );
    return addCurrentSkyToMoment(guide, currentSky);
  });
  const themeDeepDive =
    allThemes.find((theme) => theme.id === input.theme) ?? allThemes[0];
  const baseThemeFocus = isMinor
    ? {
        title: themeDeepDive.headline,
        text: themeDeepDive.introduction,
      }
    : themeReading(
        input.theme,
        byKey,
        midheaven,
        secondHouseSign,
        personalYear,
      );
  const themeFocus =
    input.theme === "momento"
      ? {
          ...baseThemeFocus,
          text: `${baseThemeFocus.text} ${currentSky.summary}`,
        }
      : baseThemeFocus;
  const summary = isMinor && age < 13
    ? `O mapa de ${firstName} junta Sol em ${byKey.sun.sign}, Lua em ${byKey.moon.sign}${ascendant ? ` e Ascendente em ${ascendant.sign}` : ""}. Role a página para conhecer ${firstName} um pouco melhor, sempre com carinho e sem rótulos.`
    : `Seu mapa junta Sol em ${byKey.sun.sign}, Lua em ${byKey.moon.sign}${ascendant ? ` e Ascendente em ${ascendant.sign}` : ""}. Role a página para descobrir o que cada um diz sobre você.`;
  const isTeen = isMinor && age >= 13;
  const freeReading = isTeen
    ? buildTeenFreeReading({
        sun: byKey.sun,
        moon: byKey.moon,
        ascendant,
        mercury: byKey.mercury,
        venus: byKey.venus,
        mars: byKey.mars,
        jupiter: byKey.jupiter,
      })
    : isMinor
    ? buildKidFreeReading({
        firstName,
        sun: byKey.sun,
        moon: byKey.moon,
        ascendant,
        mercury: byKey.mercury,
        venus: byKey.venus,
        mars: byKey.mars,
        jupiter: byKey.jupiter,
      })
    : buildFreeReading({
        sun: byKey.sun,
        moon: byKey.moon,
        ascendant,
        midheaven,
        venus: byKey.venus,
        jupiter: byKey.jupiter,
        personalYear,
        skyMovements: currentSky.highlights.length,
      });
  const northNodeRaw = horoscope.CelestialPoints?.northnode;
  const chironRaw = horoscope.CelestialBodies?.chiron;
  const premiumReading = isTeen
    ? buildTeenPremiumReading({
        firstName,
        moon: byKey.moon,
        mercury: byKey.mercury,
        venus: byKey.venus,
        mars: byKey.mars,
        jupiter: byKey.jupiter,
        saturn: byKey.saturn,
        lifePath,
      })
    : isMinor
    ? buildKidPremiumReading({
        firstName,
        moon: byKey.moon,
        mercury: byKey.mercury,
        venus: byKey.venus,
        mars: byKey.mars,
        jupiter: byKey.jupiter,
        saturn: byKey.saturn,
        lifePath,
      })
    : buildPremiumReading({
        firstName,
        archetypeName: freeReading?.archetype.name ?? null,
        birthDate: input.birthDate,
        sun: byKey.sun,
        moon: byKey.moon,
        midheaven,
        mercury: byKey.mercury,
        venus: byKey.venus,
        mars: byKey.mars,
        jupiter: byKey.jupiter,
        saturn: byKey.saturn,
        northNode: northNodeRaw
          ? placementFrom("northnode", northNodeRaw, exactTime, true)
          : null,
        chiron: chironRaw
          ? placementFrom("chiron", chironRaw, exactTime, true)
          : null,
        secondHouseSign,
        secondHouseLabel: secondHouseSign ? SIGNS[secondHouseSign].label : null,
        personalYear,
        lifePath,
        skyMoves: currentSky.moves ?? [],
        moonPhaseAngle: currentSky.moonPhase.angle,
        monthSky: buildMonthSky(),
      });
  const readings = isMinor
    ? themeDeepDive.sections.map((section, index) => ({
        id: `${themeDeepDive.id}-cuidado-${index}`,
        kicker: `${themeDeepDive.label} · ponto ${index + 1}`,
        title: section.title,
        text: section.text,
      }))
    : buildThemeReadings(
        input.theme,
        byKey,
        ascendant,
        midheaven,
        secondHouseSign,
        personalYear,
      );
  const basePremium = isMinor
    ? buildMinorPremiumNarrative(themeDeepDive, byKey, firstName)
    : buildPremiumNarrative(
        input.theme,
        byKey,
        ascendant,
        midheaven,
        secondHouseSign,
        personalYear,
        aspectResults,
      );
  const premium = isMinor
    ? basePremium
    : addPersonalSignature(
        basePremium,
        input.theme,
        byKey,
        firstName,
        aspectResults[0],
      );

  return {
    person: {
      firstName,
      fullName: input.name,
      birthDate: input.birthDate,
      birthTime: exactTime ? input.birthTime : null,
      location: coordinates.location,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezone:
        horoscope.origin.timezone?.name ?? coordinates.timezone ?? "—",
      exactTime,
      recipientType: input.recipientType,
      relationshipLabel: relationshipLabels[input.recipientType],
      isMinor,
      age,
    },
    bigThree: {
      sun: byKey.sun,
      moon: byKey.moon,
      ascendant,
    },
    midheaven,
    placements,
    houseCusps,
    summary,
    pattern: {
      element: dominantElement,
      mode: dominantMode,
      text: isMinor
        ? `${ELEMENT_TEXT[dominantElement]} ${MODE_TEXT[dominantMode]} Em uma pessoa em desenvolvimento, isso descreve possibilidades de expressão, não uma personalidade fixa.`
        : `${ELEMENT_TEXT[dominantElement]} ${MODE_TEXT[dominantMode]}`,
      strengths,
      watchouts,
    },
    zodiacPortrait: buildZodiacPortrait(byKey, ascendant, isMinor),
    readings,
    themeFocus,
    themeDeepDive,
    allThemes,
    currentSky,
    numerology: {
      lifePath,
      personalYear,
      lifePathText:
        LIFE_PATHS[lifePath] ??
        "Seu número de destino destaca uma combinação própria de aprendizado e expressão.",
      personalYearText: PERSONAL_YEARS[personalYear],
    },
    aspects: aspectResults,
    premium,
    freeReading,
    premiumReading,
    notes: [
      "A análise utiliza zodíaco tropical e casas Placidus.",
      `O céu de ${currentSky.dateLabel} foi calculado para cruzar trânsitos atuais com as posições do nascimento.`,
      exactTime
        ? "Ascendente, Meio do Céu e casas foram calculados com o horário informado."
        : "Sem horário, Ascendente, Meio do Céu e casas não são apresentados; a Lua é estimada para o meio-dia.",
      "Astrologia e numerologia são apresentadas como ferramentas de entretenimento e reflexão, não como ciência ou previsão de acontecimentos.",
      ...(isMinor
        ? [
            "Esta leitura foi adaptada para uma pessoa menor de idade e deve ser usada com cuidado, sem rótulos, diagnósticos ou decisões sobre seu futuro.",
          ]
        : []),
    ],
  };
}
