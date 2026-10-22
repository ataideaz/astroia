// Leitura grátis do AstroIA.
//
// Textos escritos em linguagem simples (frases curtas, palavras do dia a dia),
// com um texto próprio para cada ponto (Sol, Lua, Ascendente) em cada signo,
// para que dois pontos no mesmo signo nunca repitam o mesmo conteúdo.
//
// Regra de escrita: falar com "você" sem adjetivos de gênero. Quando precisar
// de adjetivo, usar "uma pessoa ..." (concorda com "pessoa").

export type SignKey =
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

type Element = "Fogo" | "Terra" | "Ar" | "Água";

type PlacementLike = {
  sign: string;
  signKey: SignKey;
};

type PointText = {
  headline: string;
  text: string;
  gifts: string[];
  shadows: string[];
};

type SunText = PointText & {
  /** Como quem convive enxerga você. Sempre "uma pessoa ...". */
  phrase: string;
  /** Superpoder, em forma de substantivo: "a coragem de começar". */
  power: string;
  /** Ponto de atenção, em forma de verbo no infinitivo: "agir antes de pensar". */
  blind: string;
};

type MoonText = SunText;

type AscText = PointText & {
  /** Primeira impressão. Sempre "uma pessoa ...". */
  phrase: string;
};

export type FreeReading = {
  /** "child" quando o mapa é de uma criança ou adolescente (textos para quem cuida). */
  audience?: "adult" | "child";
  archetype: {
    name: string;
    text: string;
    combinations: string;
  };
  layers: Array<{
    id: "sun" | "moon" | "ascendant";
    symbol: string;
    role: string;
    question: string;
    sign: string;
    headline: string;
    text: string;
    gifts: string[];
    shadows: string[];
  }>;
  mirror: {
    title: string;
    text: string;
    harmony: string;
    sameSign: string | null;
  };
  superpower: string;
  attention: string;
  teasers: Array<{
    id: "amor" | "carreira" | "dinheiro" | "momento";
    symbol: string;
    label: string;
    title: string;
    opening: string;
    cliff: string;
    locked: string[];
  }>;
  noTimeNote: string | null;
};

const ELEMENTS: Record<SignKey, Element> = {
  aries: "Fogo",
  taurus: "Terra",
  gemini: "Ar",
  cancer: "Água",
  leo: "Fogo",
  virgo: "Terra",
  libra: "Ar",
  scorpio: "Água",
  sagittarius: "Fogo",
  capricorn: "Terra",
  aquarius: "Ar",
  pisces: "Água",
};

// ---------------------------------------------------------------------------
// SOL: quem você é por dentro
// ---------------------------------------------------------------------------
const SUN: Record<SignKey, SunText> = {
  aries: {
    headline: "Você nasceu para começar coisas",
    text: "Você gosta de ser a primeira pessoa a tentar. Quando tem uma ideia, quer fazer agora, não amanhã. É você quem puxa o grupo quando todo mundo está parado.",
    gifts: ["coragem", "começar sem medo", "falar o que pensa"],
    shadows: ["perder a paciência rápido", "largar no meio quando cansa"],
    phrase: "uma pessoa corajosa, que gosta de ir na frente",
    power: "a coragem de começar",
    blind: "agir antes de pensar",
  },
  taurus: {
    headline: "Você constrói devagar e para durar",
    text: "Você gosta de coisas que dão segurança: rotina, conforto, uma casa gostosa. Prefere ir passo a passo, mas quando decide algo, vai até o fim. É aquela pessoa em quem os outros confiam.",
    gifts: ["paciência", "ser de confiança", "terminar o que começa"],
    shadows: ["teimosia", "medo de mudar"],
    phrase: "uma pessoa firme e de confiança, que constrói com calma",
    power: "a paciência de quem constrói devagar",
    blind: "segurar o que já não faz bem só por costume",
  },
  gemini: {
    headline: "Sua cabeça não para nunca",
    text: "Você adora aprender, conversar e descobrir coisas novas. Num dia quer saber de um assunto, no outro já está em outro. É a pessoa que sempre tem uma história ou uma curiosidade para contar.",
    gifts: ["curiosidade", "conversa fácil", "aprender rápido"],
    shadows: ["começar muitas coisas ao mesmo tempo", "se distrair fácil"],
    phrase: "uma pessoa curiosa, que sabe um pouco de tudo",
    power: "a curiosidade de quem quer entender tudo",
    blind: "pular de uma coisa para outra sem terminar",
  },
  cancer: {
    headline: "Você cuida de quem ama como ninguém",
    text: "Família, amigos e a sua casa são muito importantes para você. Você percebe quando alguém não está bem, mesmo sem a pessoa falar. É quem lembra do aniversário de todo mundo.",
    gifts: ["cuidar dos outros", "lembrar de tudo", "sentir o que o outro sente"],
    shadows: ["se magoar com facilidade", "se fechar quando algo machuca"],
    phrase: "uma pessoa carinhosa, que protege quem ama",
    power: "o cuidado de quem protege quem ama",
    blind: "guardar mágoa em silêncio",
  },
  leo: {
    headline: "Você nasceu para brilhar",
    text: "Você tem um jeito que chama atenção, mesmo sem querer. Gosta de criar, de se expressar e de ver as pessoas felizes por perto. Quando você entra num lugar, o lugar fica mais animado.",
    gifts: ["alegria", "generosidade", "criatividade"],
    shadows: ["precisar muito de elogio", "dificuldade de admitir um erro"],
    phrase: "uma pessoa calorosa, que ilumina o ambiente",
    power: "o brilho de quem anima todo mundo",
    blind: "se magoar quando ninguém nota o seu esforço",
  },
  virgo: {
    headline: "Você deixa tudo melhor do que encontrou",
    text: "Você repara nos detalhes que ninguém vê. Gosta de organizar, de ajudar e de fazer as coisas direito. Se alguém precisa resolver um problema, costuma chamar você.",
    gifts: ["atenção aos detalhes", "organização", "vontade de ajudar"],
    shadows: ["cobrar demais de si", "se preocupar com tudo"],
    phrase: "uma pessoa atenta, que resolve o que ninguém resolve",
    power: "o cuidado com os detalhes",
    blind: "se cobrar até cansar",
  },
  libra: {
    headline: "Você busca harmonia em tudo",
    text: "Você não gosta de briga e sabe deixar as pessoas à vontade. Tem bom gosto e enxerga os dois lados de uma história. É quem faz as pazes quando os amigos discutem.",
    gifts: ["fazer as pazes", "bom gosto", "senso de justiça"],
    shadows: ["demorar para decidir", "dizer sim quando queria dizer não"],
    phrase: "uma pessoa gentil, que sabe unir as pessoas",
    power: "o dom de unir as pessoas",
    blind: "esquecer o que você quer só para agradar",
  },
  scorpio: {
    headline: "Você sente tudo lá no fundo",
    text: "Você não gosta de nada pela metade: ou é de verdade, ou não é. Percebe o que as pessoas escondem e guarda os segredos de quem confia em você. Quando passa por uma fase difícil, volta mais forte.",
    gifts: ["intensidade", "lealdade", "força para recomeçar"],
    shadows: ["desconfiar demais", "dificuldade de perdoar"],
    phrase: "uma pessoa intensa, que vai fundo em tudo",
    power: "a força de quem renasce das dificuldades",
    blind: "guardar tudo por dentro até explodir",
  },
  sagittarius: {
    headline: "Você precisa de liberdade e de horizonte",
    text: "Você ama viajar, aprender e conhecer gente diferente. É otimista e sempre acredita que as coisas vão dar certo. Fica triste quando a vida vira só rotina.",
    gifts: ["otimismo", "sinceridade", "vontade de aprender"],
    shadows: ["prometer mais do que dá para cumprir", "perder a paciência com regras"],
    phrase: "uma pessoa animada, que sempre vê o lado bom",
    power: "o otimismo de quem acredita no amanhã",
    blind: "fugir quando as coisas ficam sérias demais",
  },
  capricorn: {
    headline: "Você sobe a montanha, um passo de cada vez",
    text: "Você leva a vida a sério e gosta de ter metas. Trabalha duro e não desiste fácil. Com o tempo, as pessoas percebem que podem contar com você para qualquer coisa importante.",
    gifts: ["responsabilidade", "persistência", "pé no chão"],
    shadows: ["trabalhar demais e descansar de menos", "esconder o que sente"],
    phrase: "uma pessoa responsável, que chega aonde quer",
    power: "a persistência de quem não desiste",
    blind: "querer dar conta de tudo sem pedir ajuda",
  },
  aquarius: {
    headline: "Você pensa diferente, e isso é o seu charme",
    text: "Você não gosta de fazer as coisas só porque todo mundo faz. Tem ideias novas e valoriza muito a amizade e a liberdade. Muitas vezes enxerga o futuro antes dos outros.",
    gifts: ["originalidade", "amizade verdadeira", "ideias novas"],
    shadows: ["parecer distante", "teimar nas próprias ideias"],
    phrase: "uma pessoa original, com ideias à frente do tempo",
    power: "a coragem de pensar diferente",
    blind: "se afastar quando a emoção aperta",
  },
  pisces: {
    headline: "Você sente o mundo com o coração",
    text: "Você tem muita sensibilidade e imaginação. Sente quando alguém está triste e quer ajudar. Gosta de música, de arte, de sonhos e de tudo que toca a alma.",
    gifts: ["empatia", "imaginação", "intuição"],
    shadows: ["absorver o problema dos outros", "fugir da realidade quando dói"],
    phrase: "uma pessoa sensível, que entende sem precisar de palavras",
    power: "a empatia de quem sente o que o outro sente",
    blind: "esquecer de cuidar de si para cuidar dos outros",
  },
};

// ---------------------------------------------------------------------------
// LUA: como você sente e o que te acalma
// ---------------------------------------------------------------------------
const MOON: Record<SignKey, MoonText> = {
  aries: {
    headline: "Suas emoções vêm rápido e passam rápido",
    text: "Quando algo te incomoda, você sente na hora e quer resolver logo. Pode se irritar fácil, mas também esquece rápido. Para se acalmar, precisa se mexer: andar, treinar, fazer alguma coisa.",
    gifts: ["sinceridade com o que sente", "se recuperar rápido", "não guardar rancor"],
    shadows: ["explodir por pouco", "ter pressa com os sentimentos"],
    phrase: "um coração que sente tudo na hora",
    power: "a sinceridade de um coração que não esconde nada",
    blind: "reagir antes de entender o que sente",
  },
  taurus: {
    headline: "Você se acalma com calma e conforto",
    text: "Você precisa de estabilidade para ficar bem: uma comida gostosa, a sua cama, as pessoas de sempre. Mudanças de última hora tiram sua paz. Quando ama, ama de um jeito constante.",
    gifts: ["calma", "carinho constante", "saber se cuidar"],
    shadows: ["dificuldade com mudanças", "se apegar demais"],
    phrase: "um coração que precisa de calma e de colo",
    power: "a calma de quem sabe esperar",
    blind: "resistir quando algo precisa mudar",
  },
  gemini: {
    headline: "Você entende o que sente conversando",
    text: "Conversar é o seu jeito de lidar com as emoções. Às vezes você só entende o que sente depois de contar para alguém ou escrever. O tédio é o que mais te deixa para baixo.",
    gifts: ["falar sobre o que sente", "bom humor", "se adaptar"],
    shadows: ["pensar demais em vez de sentir", "mudar de humor rápido"],
    phrase: "uma mente que precisa de conversa para se acalmar",
    power: "a leveza de quem fala sobre o que sente",
    blind: "pensar demais e sentir de menos",
  },
  cancer: {
    headline: "Seu coração é a sua casa",
    text: "Você sente tudo com muita força, principalmente o que vem da família e de quem você ama. Precisa de um cantinho seguro e de pessoas que te acolham. Lembra de momentos bonitos por muito tempo.",
    gifts: ["carinho", "memória afetiva", "acolher"],
    shadows: ["se magoar fácil", "se fechar para se proteger"],
    phrase: "um coração que precisa de colo e de casa",
    power: "o carinho de quem acolhe",
    blind: "ficar remoendo uma mágoa",
  },
  leo: {
    headline: "Você precisa sentir que é importante para alguém",
    text: "Você demonstra carinho com generosidade e gosta de receber atenção também. Um elogio sincero muda o seu dia. Quando ninguém nota o que você faz, isso dói mais do que parece.",
    gifts: ["generosidade", "calor humano", "lealdade"],
    shadows: ["sofrer com a indiferença", "precisar de muita atenção"],
    phrase: "um coração que precisa de carinho e de reconhecimento",
    power: "o calor de um coração generoso",
    blind: "achar que ninguém liga quando falta atenção",
  },
  virgo: {
    headline: "Você se acalma quando tudo está em ordem",
    text: "Bagunça e confusão mexem com a sua paz. Você demonstra carinho com coisas práticas: ajudar, resolver, cuidar dos detalhes. Organizar a rotina é o seu jeito de ficar bem.",
    gifts: ["cuidar de forma prática", "ajudar sem esperar nada", "rotina saudável"],
    shadows: ["se preocupar demais", "se criticar muito"],
    phrase: "um coração que demonstra amor ajudando",
    power: "o amor que aparece em gestos práticos",
    blind: "se preocupar com tudo antes da hora",
  },
  libra: {
    headline: "Você precisa de paz para ficar bem",
    text: "Brigas e clima pesado te deixam mal. Você se sente melhor em lugares bonitos e perto de pessoas gentis. Quase sempre pensa no que o outro está sentindo antes de pensar em você.",
    gifts: ["gentileza", "saber escutar", "acalmar os outros"],
    shadows: ["engolir o que sente para evitar briga", "depender da opinião dos outros"],
    phrase: "um coração que precisa de paz e de parceria",
    power: "a gentileza que acalma qualquer clima",
    blind: "engolir o que sente para não brigar",
  },
  scorpio: {
    headline: "Você sente tudo em dobro",
    text: "Suas emoções são profundas e você não mostra para qualquer um. Precisa confiar muito em alguém para se abrir. Quando ama, é de corpo e alma. Quando se decepciona, demora para esquecer.",
    gifts: ["profundidade", "lealdade", "enxergar o que está escondido"],
    shadows: ["ciúme", "demorar a perdoar"],
    phrase: "um coração intenso, que só se abre para quem confia",
    power: "a profundidade de quem sente de verdade",
    blind: "testar as pessoas antes de confiar",
  },
  sagittarius: {
    headline: "Você se cura com liberdade e risada",
    text: "Quando está triste, você precisa de espaço, de ar livre ou de uma boa risada com os amigos. Não gosta de drama nem de sentir que perdeu a liberdade. Acredita que tudo tem um lado bom.",
    gifts: ["otimismo", "bom humor", "dar esperança aos outros"],
    shadows: ["fugir de conversas difíceis", "fingir que está tudo bem"],
    phrase: "um coração livre, que precisa de espaço para respirar",
    power: "a esperança de quem sempre vê uma saída",
    blind: "fugir das conversas difíceis",
  },
  capricorn: {
    headline: "Você guarda o que sente com cuidado",
    text: "Você não costuma mostrar suas emoções logo de cara. Prefere resolver os problemas por conta própria, com calma e pé no chão. Fica em paz quando tem planos e as coisas estão sob controle.",
    gifts: ["calma nas crises", "maturidade", "ser porto seguro"],
    shadows: ["esconder o que sente", "dificuldade de pedir ajuda"],
    phrase: "um coração forte, que sente mais do que mostra",
    power: "a firmeza de quem não desaba nas crises",
    blind: "esconder o que sente para parecer forte",
  },
  aquarius: {
    headline: "Você precisa de espaço para sentir",
    text: "Você lida com as emoções pensando nelas, como se olhasse de longe. Precisa de liberdade e de amigos que respeitem o seu jeito. Pressão e cobrança te afastam.",
    gifts: ["respeitar o espaço dos outros", "amizade", "calma para pensar"],
    shadows: ["parecer distante quando está sofrendo", "fugir de demonstrações de carinho"],
    phrase: "um coração livre, que ama sem prender",
    power: "a liberdade de amar sem prender",
    blind: "se afastar quando a emoção fica forte",
  },
  pisces: {
    headline: "Você sente o que ninguém fala",
    text: "Você percebe o clima de um lugar assim que entra. Se emociona com filmes e músicas e sente a dor dos outros como se fosse sua. Precisa de momentos de silêncio para recarregar.",
    gifts: ["empatia", "intuição", "compaixão"],
    shadows: ["absorver a tristeza dos outros", "se perder nos próprios sonhos"],
    phrase: "um coração que sente o que ninguém fala",
    power: "a intuição de quem sente antes de saber",
    blind: "carregar a tristeza dos outros como se fosse sua",
  },
};

// ---------------------------------------------------------------------------
// ASCENDENTE: como os outros veem você
// ---------------------------------------------------------------------------
const ASC: Record<SignKey, AscText> = {
  aries: {
    headline: "Você chega chegando",
    text: "As pessoas te veem como alguém direto, rápido e cheio de energia. Você não espera ninguém para começar, e isso passa confiança. Na primeira impressão, parece uma pessoa corajosa.",
    gifts: ["presença forte", "iniciativa", "franqueza"],
    shadows: ["parecer que está com raiva sem estar", "atropelar sem perceber"],
    phrase: "uma pessoa cheia de energia, que chega com tudo",
  },
  taurus: {
    headline: "Você passa calma e confiança",
    text: "Logo de cara, as pessoas sentem que podem confiar em você. Seu jeito é tranquilo, sem pressa. Muita gente repara no seu bom gosto e no seu jeito de falar.",
    gifts: ["passar segurança", "elegância simples", "calma"],
    shadows: ["parecer devagar", "demorar a se abrir"],
    phrase: "uma pessoa tranquila, que passa segurança",
  },
  gemini: {
    headline: "Você puxa conversa com qualquer pessoa",
    text: "Na primeira impressão, você tem papo fácil e olhar atento. Faz perguntas, conta histórias e deixa todo mundo à vontade. Parece estar sempre por dentro de tudo.",
    gifts: ["papo fácil", "bom humor", "se adaptar a qualquer lugar"],
    shadows: ["parecer que não leva nada a sério", "falar mais do que escuta"],
    phrase: "uma pessoa de conversa fácil e olhar atento",
  },
  cancer: {
    headline: "Você passa acolhimento",
    text: "As pessoas sentem que podem contar coisas para você. Você transmite doçura e cuidado, mesmo quando está só observando. No começo, costuma ficar mais na sua até sentir que o lugar é seguro.",
    gifts: ["acolher", "passar confiança", "cuidar do grupo"],
    shadows: ["demorar a se soltar", "levar críticas para o lado pessoal"],
    phrase: "uma pessoa doce, que faz os outros se sentirem em casa",
  },
  leo: {
    headline: "Você chama atenção sem esforço",
    text: "Quando você chega, as pessoas reparam. Você tem um jeito caloroso, confiante e um sorriso que contagia. Muitas vezes, os outros esperam que você lidere.",
    gifts: ["carisma", "confiança", "animar o ambiente"],
    shadows: ["parecer que quer ser o centro", "se importar demais com a imagem"],
    phrase: "uma pessoa carismática, com brilho próprio",
  },
  virgo: {
    headline: "Você passa a imagem de quem sabe o que faz",
    text: "As pessoas te veem como alguém discreto, educado e muito capaz. Você repara em tudo ao redor, e isso aparece no seu jeito cuidadoso. Passa a sensação de que, com você, as coisas dão certo.",
    gifts: ["discrição", "competência", "cuidado"],
    shadows: ["parecer exigente demais", "se incomodar com bagunça"],
    phrase: "uma pessoa discreta, que repara em tudo",
  },
  libra: {
    headline: "Você é a simpatia em pessoa",
    text: "Na primeira impressão, você tem um charme educado que agrada todo mundo. Sabe o que dizer para deixar o clima leve. As pessoas reparam no seu bom gosto e no seu sorriso.",
    gifts: ["charme", "diplomacia", "bom gosto"],
    shadows: ["tentar agradar a todos", "esconder quando algo incomoda"],
    phrase: "uma pessoa charmosa, que agrada a todos",
  },
  scorpio: {
    headline: "Você tem um olhar que impressiona",
    text: "As pessoas sentem que você enxerga além do que elas mostram. Você tem um ar de mistério e não se revela logo. Isso gera curiosidade e respeito.",
    gifts: ["presença marcante", "perceber intenções", "discrição"],
    shadows: ["parecer difícil de conhecer", "passar uma imagem mais séria do que é"],
    phrase: "uma pessoa de olhar profundo e jeito misterioso",
  },
  sagittarius: {
    headline: "Você chega animando todo mundo",
    text: "As pessoas te veem como alguém alegre, aberto e cheio de histórias. Você fala com sinceridade e tem um jeito livre que contagia. Parece estar sempre a um passo de uma nova aventura.",
    gifts: ["alegria", "sinceridade", "espírito aventureiro"],
    shadows: ["falar sem filtro", "prometer e esquecer"],
    phrase: "uma pessoa alegre, que traz leveza para o grupo",
  },
  capricorn: {
    headline: "Você passa respeito logo de cara",
    text: "Na primeira impressão, você transmite seriedade e responsabilidade. Muita gente confia em você para coisas importantes antes mesmo de te conhecer bem. Com o tempo, aparece o seu bom humor.",
    gifts: ["passar credibilidade", "postura", "foco"],
    shadows: ["parecer distante no começo", "demorar a relaxar"],
    phrase: "uma pessoa séria e confiável, que passa respeito",
  },
  aquarius: {
    headline: "Você é diferente, e todo mundo percebe",
    text: "Logo de cara, as pessoas notam que você tem um jeito próprio de pensar, de falar ou de se vestir. Você trata todo mundo com simpatia, mas guarda um pouco de distância. Passa uma imagem moderna e original.",
    gifts: ["originalidade", "simpatia com todos", "mente aberta"],
    shadows: ["parecer distante", "ser difícil de ler"],
    phrase: "uma pessoa original, que não segue a multidão",
  },
  pisces: {
    headline: "Você tem um jeito doce e sonhador",
    text: "As pessoas sentem uma energia suave perto de você. Você parece gentil, sensível e fácil de gostar. Muitas vezes, quem acabou de te conhecer já sente vontade de te contar a vida.",
    gifts: ["suavidade", "empatia", "inspirar"],
    shadows: ["parecer que está no mundo da lua", "dificuldade de dizer não"],
    phrase: "uma pessoa suave, que acolhe sem esforço",
  },
};

// ---------------------------------------------------------------------------
// ARQUÉTIPO: Sol (substantivo) + Lua (adjetivo)
// ---------------------------------------------------------------------------
const ARCHETYPE_NOUN: Record<SignKey, { noun: string; meaning: string }> = {
  aries: { noun: "Faísca", meaning: "acende as coisas e faz tudo começar" },
  taurus: { noun: "Raiz", meaning: "dá firmeza e segura tudo no lugar" },
  gemini: { noun: "Ponte", meaning: "liga pessoas, ideias e assuntos" },
  cancer: { noun: "Lareira", meaning: "aquece e protege quem está perto" },
  leo: { noun: "Estrela", meaning: "brilha e ilumina o caminho dos outros" },
  virgo: { noun: "Lente", meaning: "enxerga os detalhes que ninguém vê" },
  libra: { noun: "Balança", meaning: "busca equilíbrio e justiça em tudo" },
  scorpio: { noun: "Fênix", meaning: "renasce mais forte depois de cada fase difícil" },
  sagittarius: { noun: "Flecha", meaning: "mira longe e vai atrás do horizonte" },
  capricorn: { noun: "Montanha", meaning: "é firme e chega bem alto, com o tempo" },
  aquarius: { noun: "Ventania", meaning: "traz o novo e muda o que estava parado" },
  pisces: { noun: "Maré", meaning: "sente tudo e se move com as emoções" },
};

const ARCHETYPE_ADJ: Record<SignKey, { adj: string; meaning: string }> = {
  aries: { adj: "Destemida", meaning: "não tem medo de sentir" },
  taurus: { adj: "Serena", meaning: "precisa de calma para ficar bem" },
  gemini: { adj: "Curiosa", meaning: "precisa de conversa e de novidade" },
  cancer: { adj: "Acolhedora", meaning: "cuida de quem ama" },
  leo: { adj: "Radiante", meaning: "ama com calor e generosidade" },
  virgo: { adj: "Cuidadosa", meaning: "demonstra amor com atenção e cuidado" },
  libra: { adj: "Gentil", meaning: "busca paz e harmonia" },
  scorpio: { adj: "Intensa", meaning: "sente tudo lá no fundo" },
  sagittarius: { adj: "Livre", meaning: "precisa de espaço para ser feliz" },
  capricorn: { adj: "Firme", meaning: "segura as pontas nas horas difíceis" },
  aquarius: { adj: "Original", meaning: "ama do seu próprio jeito" },
  pisces: { adj: "Sonhadora", meaning: "sente com o coração e a imaginação" },
};

// ---------------------------------------------------------------------------
// GANCHOS DO PAGO (começo real da leitura, cortado no melhor ponto)
// ---------------------------------------------------------------------------
const VENUS_LOVE: Record<SignKey, string> = {
  aries: "você se apaixona rápido e gosta de quem tem coragem e atitude. Para você, amor precisa ter emoção.",
  taurus: "você ama com calma e com fidelidade. Carinho, toque e presença valem mais para você do que palavras bonitas.",
  gemini: "você se encanta por quem tem uma boa conversa. Quem te faz rir e pensar já ganhou metade do seu coração.",
  cancer: "você ama cuidando. Gosta de relações que parecem um lar, com carinho, segurança e muito afeto.",
  leo: "você ama de coração aberto e gosta de se sentir especial. Gestos grandes e elogios sinceros te conquistam.",
  virgo: "você mostra amor nos detalhes: lembrar de algo importante, ajudar num problema, fazer um café. E se apaixona por quem é de verdade.",
  libra: "você ama ter um par. Gosta de romance, de gentileza e de relações em que os dois se tratam com respeito.",
  scorpio: "você ama com intensidade e não gosta de nada pela metade. Para você, confiança é tudo.",
  sagittarius: "você precisa de um amor que também seja aventura. Gosta de quem te deixa livre e topa viver coisas novas com você.",
  capricorn: "você leva o amor a sério. Prefere construir algo firme, com alguém que tenha os pés no chão.",
  aquarius: "você ama quem também é seu amigo. Precisa de liberdade e de alguém que respeite o seu jeito diferente.",
  pisces: "você ama de um jeito romântico e sonhador. Se entrega fácil e sente tudo com muita força.",
};

const CAREER: Record<SignKey, string> = {
  aries: "você brilha em trabalhos que pedem iniciativa, liderança e decisões rápidas. Rotina parada não combina com você.",
  taurus: "você se dá bem em trabalhos que constroem algo concreto e duradouro, como finanças, beleza, comida, arte ou natureza.",
  gemini: "você se destaca em trabalhos com comunicação e pessoas: falar, escrever, ensinar, vender ou criar conteúdo.",
  cancer: "você se realiza em trabalhos em que pode cuidar de pessoas, como saúde, educação, alimentação ou atendimento.",
  leo: "você nasceu para trabalhos em que pode aparecer e criar: liderança, arte, eventos, comunicação ou qualquer palco.",
  virgo: "você se destaca em trabalhos que pedem cuidado e precisão, como saúde, organização, análise ou serviços.",
  libra: "você se dá bem em trabalhos com pessoas, beleza e acordos: design, moda, direito, atendimento ou parcerias.",
  scorpio: "você se destaca em trabalhos que pedem profundidade: pesquisa, psicologia, investigação, finanças ou momentos de crise.",
  sagittarius: "você se realiza em trabalhos que abrem horizontes: viagens, ensino, idiomas, esportes ou ter o próprio negócio.",
  capricorn: "você tem talento para cargos de responsabilidade, gestão e para construir uma carreira sólida com o tempo.",
  aquarius: "você se destaca em trabalhos que inovam: tecnologia, causas sociais, ciência ou qualquer coisa que mude o jeito de fazer.",
  pisces: "você se realiza em trabalhos criativos ou de ajuda: arte, música, terapia, cuidado ou espiritualidade.",
};

const JUPITER_MONEY: Record<SignKey, string> = {
  aries: "o dinheiro tende a vir quando você toma a iniciativa e aposta em algo seu.",
  taurus: "o dinheiro cresce com paciência: guardar, investir aos poucos e cuidar bem do que já tem.",
  gemini: "o dinheiro aparece pela comunicação: ideias, contatos, vendas e mais de uma fonte de renda.",
  cancer: "a prosperidade vem do cuidado: com a família, com a casa e com pessoas que confiam em você.",
  leo: "o dinheiro vem quando você mostra o seu talento e não tem medo de aparecer.",
  virgo: "a prosperidade vem da organização: fazer bem feito, ter método e cuidar dos detalhes.",
  libra: "o dinheiro tende a vir por meio de parcerias, acordos e das pessoas certas ao seu lado.",
  scorpio: "a prosperidade vem de ir fundo: estudar bem antes de investir e transformar crises em oportunidades.",
  sagittarius: "o dinheiro vem quando você expande: estudo, viagens, ensino ou negócios maiores.",
  capricorn: "a prosperidade é construída com tempo, metas e muita persistência. Devagar e sempre.",
  aquarius: "o dinheiro aparece por caminhos diferentes: tecnologia, ideias novas e redes de pessoas.",
  pisces: "a prosperidade vem quando você confia na intuição e usa a sua criatividade ou o seu dom de ajudar.",
};

const PERSONAL_YEAR: Record<number, string> = {
  1: "um ano de recomeço. É hora de plantar sementes novas.",
  2: "um ano de paciência e de parcerias. As coisas crescem devagar, junto com outras pessoas.",
  3: "um ano de alegria, de criatividade e de se expressar mais.",
  4: "um ano de trabalho e de organização. O que você construir agora fica firme.",
  5: "um ano de mudanças e de liberdade. Coisas novas podem aparecer de repente.",
  6: "um ano de família, de casa e de cuidar de quem você ama.",
  7: "um ano para olhar para dentro, estudar e se conhecer melhor.",
  8: "um ano de conquistas, de dinheiro e de colher o resultado do seu esforço.",
  9: "um ano de encerramento. Hora de fechar ciclos e abrir espaço para o novo.",
};

function harmony(sun: PlacementLike, moon: PlacementLike) {
  const a = ELEMENTS[sun.signKey];
  const b = ELEMENTS[moon.signKey];
  const pair = [a, b].sort().join("+");
  if (a === b) {
    return `Seu Sol e sua Lua são do mesmo elemento (${a}). Isso quer dizer que o que você quer e o que você sente costumam andar juntos. O que você mostra é, quase sempre, o que você sente.`;
  }
  if (pair === "Ar+Fogo" || pair === "Terra+Água") {
    return `Seu Sol (${a}) e sua Lua (${b}) combinam bem. A cabeça e o coração costumam se ajudar, e isso deixa as suas escolhas mais leves.`;
  }
  return `Seu Sol (${a}) e sua Lua (${b}) falam línguas diferentes. Às vezes você quer uma coisa e sente outra, e isso confunde até você. Mas é justamente essa mistura que faz de você uma pessoa tão interessante.`;
}

function sameSign(
  sun: PlacementLike,
  moon: PlacementLike,
  asc: PlacementLike | null,
): string | null {
  const s = sun.signKey;
  const m = moon.signKey;
  const a = asc?.signKey;
  if (a && s === m && m === a) {
    return `Sol, Lua e Ascendente em ${sun.sign}! É raro: você é ${sun.sign} por dentro, no coração e por fora. Tudo em você aponta para a mesma direção.`;
  }
  if (s === m) {
    return `Seu Sol e sua Lua estão em ${sun.sign}. É como ter o volume de ${sun.sign} no máximo: quem você é e o que você sente seguem a mesma direção.`;
  }
  if (a && m === a) {
    return `Sua Lua e seu Ascendente estão em ${moon.sign}: o que você sente aparece no seu rosto. É difícil esconder as suas emoções.`;
  }
  if (a && s === a) {
    return `Seu Sol e seu Ascendente estão em ${sun.sign}: você é exatamente o que parece. O que as pessoas veem por fora é o que existe por dentro.`;
  }
  return null;
}

export function buildFreeReading(input: {
  sun: PlacementLike;
  moon: PlacementLike;
  ascendant: PlacementLike | null;
  midheaven: PlacementLike | null;
  venus: PlacementLike;
  jupiter: PlacementLike;
  personalYear: number;
  skyMovements: number;
}): FreeReading {
  const { sun, moon, ascendant, midheaven, venus, jupiter } = input;
  const sunText = SUN[sun.signKey];
  const moonText = MOON[moon.signKey];
  const ascText = ascendant ? ASC[ascendant.signKey] : null;
  const noun = ARCHETYPE_NOUN[sun.signKey];
  const adj = ARCHETYPE_ADJ[moon.signKey];

  const layers: FreeReading["layers"] = [
    {
      id: "sun",
      symbol: "☉",
      role: "Seu Sol",
      question: "Quem você é por dentro",
      sign: sun.sign,
      headline: sunText.headline,
      text: sunText.text,
      gifts: sunText.gifts,
      shadows: sunText.shadows,
    },
    {
      id: "moon",
      symbol: "☾",
      role: "Sua Lua",
      question: "Como você sente",
      sign: moon.sign,
      headline: moonText.headline,
      text: moonText.text,
      gifts: moonText.gifts,
      shadows: moonText.shadows,
    },
  ];
  if (ascendant && ascText) {
    layers.push({
      id: "ascendant",
      symbol: "↑",
      role: "Seu Ascendente",
      question: "Como os outros veem você",
      sign: ascendant.sign,
      headline: ascText.headline,
      text: ascText.text,
      gifts: ascText.gifts,
      shadows: ascText.shadows,
    });
  }

  const mirrorText = ascText
    ? `Quem te conhece rápido vê ${ascText.phrase}. Quem convive descobre ${sunText.phrase}. E só quem chega bem perto conhece ${moonText.phrase}.`
    : `Quem convive com você descobre ${sunText.phrase}. E só quem chega bem perto conhece ${moonText.phrase}.`;

  const careerPrefix = midheaven
    ? `Seu Meio do Céu, o ponto do mapa que fala de carreira, está em ${midheaven.sign}. Isso mostra que `
    : `Seu Sol em ${sun.sign} mostra que `;
  const careerSign = midheaven ? midheaven.signKey : sun.signKey;

  const yearText =
    PERSONAL_YEAR[input.personalYear] ??
    "um ciclo com um tema próprio, que pede atenção ao que está mudando.";
  const sky =
    input.skyMovements > 0
      ? ` E agora mesmo, ${input.skyMovements} ${
          input.skyMovements === 1 ? "movimento do céu está tocando" : "movimentos do céu estão tocando"
        } pontos importantes do seu mapa.`
      : "";

  return {
    archetype: {
      name: `A ${noun.noun} ${adj.adj}`,
      text: `${noun.noun}, porque o seu Sol em ${sun.sign} ${noun.meaning}. ${adj.adj}, porque a sua Lua em ${moon.sign} ${adj.meaning}.`,
      combinations: ascendant
        ? "Existem 1.728 combinações possíveis de Sol, Lua e Ascendente. A sua é uma delas. É por isso que duas pessoas do mesmo signo podem ser tão diferentes."
        : "Existem 144 combinações possíveis de Sol e Lua. A sua é uma delas. É por isso que duas pessoas do mesmo signo podem ser tão diferentes.",
    },
    layers,
    mirror: {
      title: ascText ? "Você em três camadas" : "Você em duas camadas",
      text: mirrorText,
      harmony: harmony(sun, moon),
      sameSign: sameSign(sun, moon, ascendant),
    },
    superpower: `Seu superpoder é juntar ${sunText.power} com ${moonText.power}.`,
    attention: `Cuidado para não ${sunText.blind}, nem ${moonText.blind}.`,
    teasers: [
      {
        id: "amor",
        symbol: "♀",
        label: "Amor",
        title: "Como você ama",
        opening: `Com Vênus em ${venus.sign}, ${VENUS_LOVE[venus.signKey]}`,
        cliff: "Mas o seu mapa também mostra o que te dá segurança no amor e como você reage quando aparece uma briga. E isso explica por que",
        locked: [
          "Seu jeito de demonstrar carinho",
          "O que te dá segurança no amor",
          "Como você age nas brigas e nas conquistas",
        ],
      },
      {
        id: "carreira",
        symbol: "◆",
        label: "Carreira",
        title: "Onde você brilha no trabalho",
        opening: `${careerPrefix}${CAREER[careerSign]}`,
        cliff: "E tem um ponto do seu mapa que mostra exatamente onde a sua confiança no trabalho ainda pode crescer. Ele está ligado a",
        locked: [
          "A direção da sua carreira",
          "Onde a sua confiança pode crescer",
          "Como ter disciplina sem se cansar",
        ],
      },
      {
        id: "dinheiro",
        symbol: "♃",
        label: "Dinheiro",
        title: "Como o dinheiro chega até você",
        opening: `Com Júpiter em ${jupiter.sign}, ${JUPITER_MONEY[jupiter.signKey]}`,
        cliff: "Mas o seu mapa também mostra onde o dinheiro costuma escapar. Isso acontece principalmente quando",
        locked: [
          "Sua base de segurança com dinheiro",
          "Onde estão as suas oportunidades",
          "Como guardar e planejar melhor",
        ],
      },
      {
        id: "momento",
        symbol: "☼",
        label: "Momento atual",
        title: "O que este ano pede de você",
        opening: `Você está no Ano Pessoal ${input.personalYear}: ${yearText}${sky}`,
        cliff: input.skyMovements > 0
          ? "O mais importante deles fala"
          : "E existe um passo simples que pode fazer este ano render muito mais. Ele começa por",
        locked: [
          "O tema principal deste momento",
          "Como transformar vontade em ação",
          "Como respeitar o seu ritmo",
        ],
      },
    ],
    noTimeNote: ascendant
      ? null
      : "Sem o horário de nascimento, não dá para calcular o Ascendente nem o Meio do Céu. Se descobrir o horário (ele costuma estar na certidão de nascimento), refaça o mapa para ver a terceira camada.",
  };
}
