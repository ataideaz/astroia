// Leitura do mapa completo (pago) do AstroIA.
//
// Mesma linha do grátis: frases curtas, palavras do dia a dia e, sempre que
// possível, um exemplo da vida real ("Na vida real: ...").
// Cada tabela é de um planeta diferente, para que nenhum texto se repita
// mesmo quando dois planetas estão no mesmo signo.
//
// Regra de escrita: falar com "você" sem adjetivos de gênero.

import type { SignKey } from "./free-reading";

type PlacementLike = { sign: string; signKey: SignKey; longitude?: number };

export type PremiumBlock = {
  title: string;
  text: string;
  example?: string;
  tip?: string;
};

export type PremiumChapterId =
  | "amor"
  | "conversa"
  | "trabalho"
  | "dinheiro"
  | "missao"
  | "dom"
  | "agora"
  | "numero";

export type PremiumChapter = {
  id: PremiumChapterId;
  symbol: string;
  label: string;
  title: string;
  /** De onde vem a leitura, em palavras simples. */
  source: string;
  intro: string;
  /** Continuação da frase que ficou cortada na prévia grátis. */
  payoff?: { lead: string; rest: string };
  blocks: PremiumBlock[];
};

export type PremiumMonth = {
  key: string;
  label: string;
  number: number;
  theme: string;
  tags: Array<{ id: "amor" | "sorte" | "energia" | "aniversario"; label: string }>;
};

export type PremiumReading = {
  letter: { title: string; text: string };
  chapters: PremiumChapter[];
  months: PremiumMonth[];
  closing: string;
};

// ---------------------------------------------------------------------------
// AMOR
// ---------------------------------------------------------------------------
const MOON_LOVE: Record<SignKey, { why: string; safe: string; example: string }> = {
  aries: {
    why: "você fica impaciente quando a outra pessoa demora para responder ou para resolver uma briga.",
    safe: "Você se sente em paz quando a relação tem verdade e movimento: dá para falar o que sente na hora, sem joguinhos.",
    example: "Na vida real: se a pessoa some depois de uma discussão, você prefere ligar e resolver logo a ficar esperando.",
  },
  taurus: {
    why: "um abraço demorado ou um jantar em casa te acalma mais do que qualquer conversa longa.",
    safe: "Você se sente em paz quando o amor é constante: mensagens de sempre, planos que se cumprem e presença de verdade.",
    example: "Na vida real: um cancelamento de última hora estraga o seu dia mais do que você admite.",
  },
  gemini: {
    why: "você precisa conversar sobre a relação para entender o que sente por ela.",
    safe: "Você se sente em paz quando pode falar de tudo com a pessoa, rir junto e trocar mensagens durante o dia.",
    example: "Na vida real: quando a conversa esfria, você logo acha que tem alguma coisa errada.",
  },
  cancer: {
    why: "você lembra de cada detalhe do começo da relação e se magoa quando a outra pessoa esquece.",
    safe: "Você se sente em paz quando sente que tem um lar com a pessoa: cuidado, rotina a dois e a certeza de que ela vai estar ali.",
    example: "Na vida real: num dia ruim, um simples \"chegou bem em casa?\" vale mais do que um presente.",
  },
  leo: {
    why: "um simples \"tenho orgulho de você\" vale mais do que um presente caro.",
    safe: "Você se sente em paz quando sente que é especial na vida do outro: elogio sincero, atenção e carinho até na frente dos amigos.",
    example: "Na vida real: se a pessoa elogia todo mundo e esquece de você, isso pesa muito.",
  },
  virgo: {
    why: "você demonstra amor resolvendo problemas e, às vezes, espera que a outra pessoa perceba sem você precisar falar.",
    safe: "Você se sente em paz quando o amor aparece em atitudes: cumprir o combinado, ajudar na rotina, cuidar dos pequenos detalhes.",
    example: "Na vida real: a pessoa lembrar de comprar o seu café preferido vale mais do que uma declaração.",
  },
  libra: {
    why: "você evita brigas, mesmo quando alguma coisa está te incomodando por dentro.",
    safe: "Você se sente em paz quando a relação é leve e justa: os dois cedem, os dois se escutam e ninguém manda sozinho.",
    example: "Na vida real: você diz \"tanto faz, escolhe você\" e depois percebe que queria outra coisa.",
  },
  scorpio: {
    why: "você precisa de tempo para confiar e, quando confia, entrega tudo.",
    safe: "Você se sente em paz quando existe verdade total: sem segredos, sem meias palavras, com a pessoa presente de verdade.",
    example: "Na vida real: uma resposta vaga, do tipo \"depois te conto\", já deixa você com a pulga atrás da orelha.",
  },
  sagittarius: {
    why: "você se afasta quando a relação começa a parecer uma prisão.",
    safe: "Você se sente em paz quando o amor tem espaço e aventura: viagens, risadas, planos novos e liberdade para cada um ter a sua vida.",
    example: "Na vida real: ciúme e controle apagam o seu interesse mais rápido do que qualquer briga.",
  },
  capricorn: {
    why: "você demora para dizer \"eu te amo\", mas, quando diz, é para valer.",
    safe: "Você se sente em paz quando a relação tem futuro: planos concretos, compromisso e alguém que cumpre o que promete.",
    example: "Na vida real: você prefere mostrar amor ajudando a resolver um problema do que falando bonito.",
  },
  aquarius: {
    why: "você precisa de um tempo só seu, mesmo quando ama muito.",
    safe: "Você se sente em paz quando a pessoa também é sua amiga e respeita o seu espaço, sem cobrar a cada minuto onde você está.",
    example: "Na vida real: um \"vai lá curtir com os seus amigos\" te conquista mais do que mil mensagens.",
  },
  pisces: {
    why: "você sente o humor da outra pessoa antes mesmo de ela falar alguma coisa.",
    safe: "Você se sente em paz quando existe carinho, delicadeza e romance, com alguém que cuida do seu coração sensível.",
    example: "Na vida real: uma palavra mais dura fica na sua cabeça por dias, mesmo que a pessoa já tenha esquecido.",
  },
};

const VENUS_SHOW: Record<SignKey, { show: string; example: string; attract: string }> = {
  aries: {
    show: "Você demonstra carinho com atitude: chama para sair, faz surpresa, toma a iniciativa.",
    example: "Na vida real: é você quem manda a primeira mensagem e marca o encontro.",
    attract: "quem tem coragem, energia e não faz joguinho",
  },
  taurus: {
    show: "Você demonstra carinho com presença: abraço, cafuné, comidinha gostosa e tempo junto.",
    example: "Na vida real: cozinhar para alguém é o seu jeito de dizer \"gosto de você\".",
    attract: "quem passa calma, é fiel e aproveita as coisas boas da vida",
  },
  gemini: {
    show: "Você demonstra carinho conversando: manda meme, conta novidades, faz a pessoa rir.",
    example: "Na vida real: você manda aquele vídeo engraçado com um \"lembrei de você\".",
    attract: "quem tem papo bom, curiosidade e senso de humor",
  },
  cancer: {
    show: "Você demonstra carinho cuidando: pergunta se comeu, se chegou bem, se está tudo certo.",
    example: "Na vida real: você guarda o bilhete, a foto e lembra da data do primeiro encontro.",
    attract: "quem tem carinho, cuida da família e quer construir um lar",
  },
  leo: {
    show: "Você demonstra carinho com generosidade: presentes, elogios, surpresas e o jeito de fazer a pessoa se sentir única.",
    example: "Na vida real: você posta a foto do seu amor com orgulho e quer que todo mundo saiba.",
    attract: "quem tem brilho próprio, admira você e não tem vergonha de demonstrar",
  },
  virgo: {
    show: "Você demonstra carinho nos detalhes: lembra do que a pessoa gosta, ajuda num problema, organiza as coisas.",
    example: "Na vida real: você prepara o café do jeito que a pessoa gosta, sem ela pedir.",
    attract: "quem é de verdade, cumpre o que promete e cuida das coisas simples",
  },
  libra: {
    show: "Você demonstra carinho com gentileza e romance: elogio, flor, um jantar bonito, um jeito delicado de falar.",
    example: "Na vida real: você capricha no lugar do encontro e repara se está tudo bonito.",
    attract: "quem tem educação, bom gosto e trata você com respeito",
  },
  scorpio: {
    show: "Você demonstra carinho com entrega: lealdade, atenção profunda e conversas que vão fundo.",
    example: "Na vida real: você lembra de algo que a pessoa contou meses atrás e mostra que prestou atenção.",
    attract: "quem tem intensidade, um pouco de mistério e muita verdade",
  },
  sagittarius: {
    show: "Você demonstra carinho com aventura: chama para viajar, conhecer um lugar novo, rir de tudo junto.",
    example: "Na vida real: o seu programa romântico ideal é uma viagem de última hora, não um jantar parado.",
    attract: "quem tem alegria, liberdade e topa uma aventura",
  },
  capricorn: {
    show: "Você demonstra carinho com atitudes sérias: estar presente, ajudar a resolver a vida, fazer planos de verdade.",
    example: "Na vida real: ajudar a pessoa a organizar as contas ou a montar um currículo é o seu jeito de amar.",
    attract: "quem tem maturidade, responsabilidade e sabe o que quer",
  },
  aquarius: {
    show: "Você demonstra carinho com amizade: apoia os sonhos da pessoa, respeita o espaço dela e conversa sobre tudo.",
    example: "Na vida real: você prefere um encontro diferente, como um show alternativo ou uma ideia maluca de passeio.",
    attract: "quem tem um jeito diferente, mente aberta e não tenta mudar você",
  },
  pisces: {
    show: "Você demonstra carinho com romance e sensibilidade: carta, música dedicada, cuidado com o que a pessoa sente.",
    example: "Na vida real: você cria uma playlist só para a pessoa ou escreve uma mensagem longa, do coração.",
    attract: "quem tem sensibilidade, gentileza e um lado sonhador",
  },
};

const MARS_LOVE: Record<SignKey, { conquer: string; fight: string; tip: string }> = {
  aries: {
    conquer: "Quando quer alguém, você vai direto: chama, convida, não fica esperando.",
    fight: "Na briga, você esquenta rápido e fala na hora. Mas também esfria rápido e não guarda rancor.",
    tip: "Antes de responder no calor da briga, conte até dez ou dê uma volta. Você vai dizer a mesma verdade, só que sem machucar.",
  },
  taurus: {
    conquer: "Quando quer alguém, você vai com calma e constância: aparece sempre, cuida e mostra que é para valer.",
    fight: "Na briga, você aguenta muito em silêncio. Mas, quando chega no limite, fica firme e é difícil mudar de ideia.",
    tip: "Fale do incômodo enquanto ele ainda é pequeno. Esperar o copo transbordar deixa a conversa muito mais difícil.",
  },
  gemini: {
    conquer: "Quando quer alguém, você conquista pela conversa: mensagens, perguntas e muito bom humor.",
    fight: "Na briga, você usa as palavras: argumenta, explica e, às vezes, fala demais ou faz piada para fugir do assunto.",
    tip: "Na próxima discussão, tente ouvir até o fim antes de responder. Às vezes a pessoa só quer ser escutada.",
  },
  cancer: {
    conquer: "Quando quer alguém, você conquista cuidando: aparece com carinho, ajuda e faz a pessoa se sentir protegida.",
    fight: "Na briga, você se fecha quando se magoa e pode lembrar de coisas antigas. Mas defende quem ama com unhas e dentes.",
    tip: "Quando se magoar, diga \"isso me machucou\" em vez de se fechar. A outra pessoa nem sempre percebe sozinha.",
  },
  leo: {
    conquer: "Quando quer alguém, você conquista com charme e generosidade: faz a pessoa se sentir especial.",
    fight: "Na briga, o seu orgulho fala alto. Você quer respeito e tem dificuldade de pedir desculpas primeiro.",
    tip: "Pedir desculpas não apaga o seu brilho. Muitas vezes, é justamente isso que faz a outra pessoa te admirar ainda mais.",
  },
  virgo: {
    conquer: "Quando quer alguém, você conquista sendo útil: ajuda, resolve e mostra que dá para contar com você.",
    fight: "Na briga, você aponta o que está errado com detalhes e pode soar exigente demais sem querer.",
    tip: "Junto com o que precisa melhorar, fale também do que está bom. Assim a pessoa escuta sem se sentir atacada.",
  },
  libra: {
    conquer: "Quando quer alguém, você conquista com charme, educação e gentileza, quase sem a pessoa perceber.",
    fight: "Na briga, você tenta manter a paz a todo custo e pode demorar para dizer o que realmente te incomoda.",
    tip: "Concordar só para a briga acabar não resolve. Diga com calma o que você quer: dá para ter gentileza e sinceridade ao mesmo tempo.",
  },
  scorpio: {
    conquer: "Quando quer alguém, você conquista com intensidade e com o olhar: a pessoa sente que você enxerga quem ela é de verdade.",
    fight: "Na briga, você vai fundo e pode usar o silêncio como arma. Quando sente que houve traição, demora a perdoar.",
    tip: "Ficar em silêncio para \"castigar\" cansa os dois. Diga o que sente, mesmo que seja difícil.",
  },
  sagittarius: {
    conquer: "Quando quer alguém, você conquista com alegria, convites e muita risada.",
    fight: "Na briga, você fala sem filtro e depois quer que tudo volte ao normal rapidinho.",
    tip: "A sinceridade é linda, mas o jeito de falar importa. Antes, pergunte a si: \"dá para dizer isso de um jeito mais leve?\"",
  },
  capricorn: {
    conquer: "Quando quer alguém, você conquista com seriedade e constância: mostra que dá para confiar em você.",
    fight: "Na briga, você segura a emoção e tenta resolver com lógica. Às vezes parece que não liga, mas liga muito.",
    tip: "Mostrar o que você sente não é fraqueza. Às vezes, a outra pessoa só precisa saber que aquilo importa para você.",
  },
  aquarius: {
    conquer: "Quando quer alguém, você conquista virando amizade primeiro: conversa, ideias e parceria.",
    fight: "Na briga, você se afasta para pensar e pode parecer que não se importa. Mas você só precisa de espaço.",
    tip: "Avise quando precisar de espaço: \"preciso de um tempo para pensar, depois a gente conversa\". Assim a pessoa não se sente abandonada.",
  },
  pisces: {
    conquer: "Quando quer alguém, você conquista com romance e delicadeza: um olhar, uma mensagem bonita, um gesto do coração.",
    fight: "Na briga, você se magoa fácil e pode chorar, se fechar ou fugir do assunto.",
    tip: "Fugir da conversa parece mais fácil, mas o problema volta. Escolha um momento calmo e fale com carinho.",
  },
};

// ---------------------------------------------------------------------------
// CONVERSA (Mercúrio)
// ---------------------------------------------------------------------------
const MERCURY: Record<SignKey, { text: string; example: string; tip: string }> = {
  aries: {
    text: "Você pensa rápido e fala direto, sem rodeios. Gosta de decidir na hora e se irrita com enrolação.",
    example: "Na vida real: no grupo do WhatsApp, você é quem diz \"então, vamos decidir logo?\".",
    tip: "Antes de mandar uma mensagem no calor do momento, leia de novo. Rapidez é ótima, mas reler evita mal-entendido.",
  },
  taurus: {
    text: "Você pensa com calma e fala pouco, mas, quando fala, é com firmeza. Aprende melhor fazendo, com as mãos.",
    example: "Na vida real: você prefere ver alguém fazendo a receita do que ler o passo a passo.",
    tip: "Quando alguém trouxer uma ideia nova, dê uma chance antes de dizer não. A sua calma ajuda a pensar; não precisa travar.",
  },
  gemini: {
    text: "Sua cabeça é rápida e curiosa. Você conversa com qualquer pessoa, aprende de tudo um pouco e adora uma boa história.",
    example: "Na vida real: você abre dez abas no celular ao mesmo tempo e lê um pouco de cada uma.",
    tip: "Termine um assunto antes de abrir outro. A sua mente rende muito mais quando fecha uma coisa de cada vez.",
  },
  cancer: {
    text: "Você pensa com o coração. Lembra das coisas pelo que sentiu e fala com carinho, mas também se magoa com palavras duras.",
    example: "Na vida real: você lembra exatamente como foi aquela conversa de anos atrás, com tom de voz e tudo.",
    tip: "Quando uma frase te machucar, pergunte o que a pessoa quis dizer antes de tirar conclusões.",
  },
  leo: {
    text: "Você fala com confiança e gosta de contar histórias. Tem um jeito animado de explicar que prende a atenção.",
    example: "Na vida real: quando você conta algo, as pessoas param para ouvir, e você adora isso.",
    tip: "Deixe espaço para os outros falarem também. Uma boa conversa é como um palco dividido.",
  },
  virgo: {
    text: "Você presta atenção aos detalhes e gosta de encontrar soluções. Pensa de forma organizada e explica passo a passo.",
    example: "Na vida real: você é quem revisa o texto do amigo e acha o erro que ninguém viu.",
    tip: "Melhorar algo não exige que tudo fique perfeito. Feito é melhor do que perfeito.",
  },
  libra: {
    text: "Você pensa nos dois lados antes de falar e escolhe as palavras com cuidado para não magoar ninguém.",
    example: "Na vida real: no restaurante, você olha o cardápio por muito tempo porque tudo parece bom.",
    tip: "Dê a si um prazo para decidir: \"até amanhã eu escolho\". Pensar é bom, mas ficar em cima do muro cansa.",
  },
  scorpio: {
    text: "Você pensa fundo e não acredita em qualquer coisa. Percebe o que está por trás das palavras e guarda bem os segredos.",
    example: "Na vida real: alguém diz \"tá tudo bem\" e você já sabe que não está.",
    tip: "Nem tudo é um mistério para desvendar. Às vezes vale perguntar direto, em vez de ficar imaginando.",
  },
  sagittarius: {
    text: "Você pensa grande e fala com entusiasmo. Adora aprender coisas novas, viajar nas ideias e falar a verdade.",
    example: "Na vida real: você começa falando de um filme e termina falando do sentido da vida.",
    tip: "Antes de prometer, veja se cabe na sua agenda. O seu entusiasmo é lindo, mas a promessa precisa ser cumprida.",
  },
  capricorn: {
    text: "Você pensa de forma prática e séria. Gosta de planejar, de ter metas e de falar só o que é útil.",
    example: "Na vida real: você faz listas, planilhas ou anotações para não esquecer nada importante.",
    tip: "Nem toda conversa precisa ter um objetivo. Bater papo à toa também descansa a cabeça.",
  },
  aquarius: {
    text: "Você pensa diferente e tem ideias que parecem do futuro. Gosta de assuntos novos e de questionar regras.",
    example: "Na vida real: você é quem diz \"e se a gente fizesse de um jeito totalmente diferente?\".",
    tip: "Quando tiver uma ideia nova, explique o passo a passo. Nem todo mundo enxerga tão longe quanto você.",
  },
  pisces: {
    text: "Você pensa por imagens e sentimentos. Tem muita imaginação, intuição e jeito para arte, música ou escrita.",
    example: "Na vida real: você entende uma pessoa só pelo olhar ou pelo tom de voz.",
    tip: "Anote as ideias e os combinados. A sua mente sonhadora é criativa, mas às vezes esquece os detalhes.",
  },
};

// ---------------------------------------------------------------------------
// TRABALHO
// ---------------------------------------------------------------------------
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

const CAREER_EXAMPLE: Record<SignKey, string> = {
  aries: "Na vida real: quando aparece um problema urgente no trabalho, é você quem resolve primeiro.",
  taurus: "Na vida real: você é quem mantém tudo funcionando, dia após dia, sem drama.",
  gemini: "Na vida real: você explica as coisas de um jeito que todo mundo entende.",
  cancer: "Na vida real: os colegas te procuram quando precisam desabafar ou de um conselho.",
  leo: "Na vida real: quando alguém precisa apresentar um trabalho, todo mundo olha para você.",
  virgo: "Na vida real: você percebe o erro na planilha antes de ele virar um problemão.",
  libra: "Na vida real: quando dois colegas brigam, é você quem acalma e acha um meio-termo.",
  scorpio: "Na vida real: numa crise, enquanto todos se desesperam, você enxerga a saída.",
  sagittarius: "Na vida real: você traz ideias de fora e anima a equipe a tentar algo novo.",
  capricorn: "Na vida real: quando um projeto importante precisa de alguém responsável, chamam você.",
  aquarius: "Na vida real: você é quem sugere um aplicativo ou um jeito novo que economiza horas.",
  pisces: "Na vida real: você percebe quando alguém da equipe não está bem, antes de todo mundo.",
};

const JUPITER_GROW: Record<SignKey, string> = {
  aries: "toma a frente e começa algo seu, sem esperar permissão",
  taurus: "faz com calma e vê o resultado do seu trabalho crescendo aos poucos",
  gemini: "ensina, conversa e divide o que sabe com mais gente",
  cancer: "trabalha num ambiente acolhedor, com pessoas que confiam em você",
  leo: "mostra o seu talento sem vergonha e recebe o reconhecimento que merece",
  virgo: "vira a pessoa de referência em algo que faz muito bem",
  libra: "trabalha em parceria e tem as pessoas certas ao seu lado",
  scorpio: "mergulha fundo num assunto e vira especialista nele",
  sagittarius: "estuda, viaja ou ensina, abrindo novos horizontes",
  capricorn: "assume uma responsabilidade grande e percebe que dá conta dela",
  aquarius: "inova, usa a tecnologia ou faz algo que ninguém fez ainda",
  pisces: "usa a criatividade e a intuição para ajudar outras pessoas",
};

const SATURN: Record<SignKey, { text: string; tip: string }> = {
  aries: {
    text: "A vida te pede paciência. Você aprende que nem tudo sai na pressa e que terminar é tão importante quanto começar.",
    tip: "Divida as metas grandes em pedaços pequenos, com uma data para cada um.",
  },
  taurus: {
    text: "A vida te pede segurança feita por você. Você aprende a construir uma base firme, sem medo de perder o que tem.",
    tip: "Faça um pouquinho todo dia, mesmo que pareça pouco. A constância é o seu superpoder no trabalho.",
  },
  gemini: {
    text: "A vida te pede foco. Você aprende que estudar uma coisa a fundo vale mais do que saber um pouco de tudo.",
    tip: "Escolha um curso ou projeto e vá até o fim antes de começar outro.",
  },
  cancer: {
    text: "A vida te pede um porto seguro dentro de você. Você aprende a cuidar dos outros sem esquecer de cuidar de si.",
    tip: "Reserve um horário fixo na semana só para você, como se fosse um compromisso de trabalho.",
  },
  leo: {
    text: "A vida te pede confiar no seu brilho mesmo sem aplausos. Você aprende que o seu valor não depende do elogio dos outros.",
    tip: "Anote toda semana uma coisa que você fez bem, mesmo que ninguém tenha visto.",
  },
  virgo: {
    text: "A vida te pede leveza. Você aprende que dá para fazer bem feito sem se cobrar até cansar.",
    tip: "Antes de começar uma tarefa, decida o que é \"bom o bastante\". Chegou lá? Pode parar.",
  },
  libra: {
    text: "A vida te pede decisões. Você aprende que não dá para agradar todo mundo e que conversas difíceis também constroem.",
    tip: "Quando precisar escolher, escreva os prós e os contras e decida em até um dia.",
  },
  scorpio: {
    text: "A vida te pede confiança. Você aprende a dividir o controle e a deixar as pessoas certas chegarem perto.",
    tip: "Passe uma tarefa por semana para alguém e confie que vai dar certo.",
  },
  sagittarius: {
    text: "A vida te pede compromisso com os seus sonhos. Você aprende que liberdade também precisa de plano.",
    tip: "Para cada sonho grande, escreva o primeiro passo prático e uma data.",
  },
  capricorn: {
    text: "A vida te pede equilíbrio entre trabalho e descanso. Você aprende que chegar ao topo sem energia não vale a pena.",
    tip: "Coloque o descanso na agenda, do mesmo jeito que você coloca uma reunião.",
  },
  aquarius: {
    text: "A vida te pede ser você dentro do grupo. Você aprende a ter ideias diferentes e, ao mesmo tempo, fazer parte de algo maior.",
    tip: "Junte-se a um grupo ou projeto que tenha a ver com as suas ideias.",
  },
  pisces: {
    text: "A vida te pede limites. Você aprende que ajudar é lindo, mas dizer \"não\" também é um jeito de se cuidar.",
    tip: "Antes de dizer sim, pergunte a si: \"eu tenho energia para isso agora?\"",
  },
};

// ---------------------------------------------------------------------------
// DINHEIRO
// ---------------------------------------------------------------------------
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

const MONEY_BASE: Record<SignKey, string> = {
  aries: "quando tem o seu próprio dinheiro e liberdade para decidir o que fazer com ele.",
  taurus: "quando tem uma reserva guardada e as contas em dia. Ver o dinheiro parado na conta te dá paz.",
  gemini: "quando tem mais de uma fonte de renda. Saber que dá para ganhar de vários jeitos te tranquiliza.",
  cancer: "quando a casa e a família estão garantidas. Para você, dinheiro é proteção.",
  leo: "quando pode presentear quem ama e viver com um pouco de conforto e beleza.",
  virgo: "quando sabe exatamente quanto entra e quanto sai. Organização é a sua paz.",
  libra: "quando o dinheiro traz equilíbrio: pagar as contas e ainda sobrar para algo bonito.",
  scorpio: "quando tem controle do seu dinheiro e uma reserva só sua, para emergências.",
  sagittarius: "quando o dinheiro compra experiências: viagens, cursos e liberdade de escolher.",
  capricorn: "quando tem metas claras e vê o seu patrimônio crescendo com o tempo.",
  aquarius: "quando o dinheiro te dá independência para viver do seu jeito.",
  pisces: "quando não precisa se preocupar com dinheiro e ainda pode ajudar quem precisa.",
};

const MONEY_LEAK: Record<SignKey, { leak: string; tip: string }> = {
  aries: {
    leak: "você compra no impulso, porque viu e quis na hora.",
    tip: "Espere 24 horas antes de comprar algo que não estava nos planos. Se ainda quiser amanhã, compre.",
  },
  taurus: {
    leak: "você gasta com conforto e comida gostosa para compensar um dia difícil.",
    tip: "Separe um valor por mês só para os seus mimos. Assim você aproveita sem culpa e sem estourar.",
  },
  gemini: {
    leak: "aparecem muitas pequenas compras e assinaturas que você nem lembra que tem.",
    tip: "Uma vez por mês, olhe a fatura com calma e cancele o que você não usa.",
  },
  cancer: {
    leak: "você gasta para agradar a família ou para se consolar quando está triste.",
    tip: "Tenha um \"fundo do abraço\": um dinheirinho separado só para emergências da família.",
  },
  leo: {
    leak: "você quer impressionar ou presentear todo mundo, mesmo quando o mês está apertado.",
    tip: "Presente não precisa ser caro para brilhar. Um gesto criativo vale mais do que o preço.",
  },
  virgo: {
    leak: "você se preocupa tanto em economizar que deixa de investir em você.",
    tip: "Reserve uma parte do dinheiro para investir em você: um curso, um cuidado, um descanso.",
  },
  libra: {
    leak: "você não consegue dizer não para um convite ou para algo bonito na vitrine.",
    tip: "Antes de aceitar um convite, olhe o orçamento. Dá para dizer \"esse mês não\" com charme.",
  },
  scorpio: {
    leak: "você guarda tudo por medo e deixa de aproveitar, ou gasta tudo de uma vez quando está mal.",
    tip: "Decida quanto vai guardar e quanto pode gastar sem culpa. O controle pode ser leve.",
  },
  sagittarius: {
    leak: "você gasta pensando que \"depois dá um jeito\" e não faz as contas antes.",
    tip: "Antes de uma viagem ou de um curso, faça a conta completa. Liberdade também é não ter dívida.",
  },
  capricorn: {
    leak: "você trabalha demais para ganhar mais e esquece de aproveitar o que já conquistou.",
    tip: "Programe um prêmio para quando bater uma meta. O dinheiro também serve para aproveitar.",
  },
  aquarius: {
    leak: "você gasta com novidades e tecnologia sem planejar.",
    tip: "Faça uma lista de desejos e espere uma semana. Muita novidade perde a graça rápido.",
  },
  pisces: {
    leak: "você empresta, ajuda ou paga a conta dos outros e esquece de você.",
    tip: "Ajude, mas com limite: decida antes quanto pode emprestar sem se prejudicar.",
  },
};

// ---------------------------------------------------------------------------
// MISSÃO (Nodo Norte) e DOM (Quíron)
// ---------------------------------------------------------------------------
const NODE: Record<SignKey, { text: string; example: string }> = {
  aries: {
    text: "aprender a pensar mais em você. A sua missão é ter coragem de escolher o que você quer, mesmo que nem todo mundo concorde.",
    example: "Na vida real: dizer \"eu quero isso\" sem pedir desculpas já é um passo enorme.",
  },
  taurus: {
    text: "aprender a viver com calma e simplicidade. A sua missão é construir paz e segurança, sem precisar de drama para sentir que a vida está acontecendo.",
    example: "Na vida real: um domingo tranquilo, sem pressa, é um treino da sua missão.",
  },
  gemini: {
    text: "aprender a escutar e a fazer perguntas. A sua missão é trocar ideias, sem achar que já sabe todas as respostas.",
    example: "Na vida real: perguntar \"como você vê isso?\" antes de dar a sua opinião.",
  },
  cancer: {
    text: "aprender a mostrar o que sente e a cuidar do seu lar. A sua missão é equilibrar o sucesso lá fora com o carinho aqui dentro.",
    example: "Na vida real: desligar o trabalho para jantar com quem você ama.",
  },
  leo: {
    text: "aprender a brilhar do seu jeito. A sua missão é mostrar o seu talento e o seu coração, sem se esconder no meio do grupo.",
    example: "Na vida real: postar aquela foto, cantar no karaokê, mostrar o que você criou.",
  },
  virgo: {
    text: "aprender a colocar os sonhos em prática. A sua missão é transformar a sua sensibilidade em ajuda de verdade, com rotina e cuidado.",
    example: "Na vida real: pegar uma ideia linda e fazer um plano de três passos para ela.",
  },
  libra: {
    text: "aprender a dividir a vida com alguém. A sua missão é descobrir a força da parceria, sem querer resolver tudo por conta própria.",
    example: "Na vida real: pedir a opinião de alguém antes de tomar uma decisão grande.",
  },
  scorpio: {
    text: "aprender a se transformar. A sua missão é largar o que já não serve e ter coragem de viver as coisas profundas.",
    example: "Na vida real: ter aquela conversa sincera que você vem adiando.",
  },
  sagittarius: {
    text: "aprender a confiar no caminho. A sua missão é buscar sentido, estudar, viajar e falar a sua verdade.",
    example: "Na vida real: fazer o curso ou a viagem que você vive dizendo que um dia vai fazer.",
  },
  capricorn: {
    text: "aprender a construir algo seu. A sua missão é assumir responsabilidades e mostrar ao mundo do que você é capaz.",
    example: "Na vida real: escolher uma meta para daqui a um ano e cuidar dela todo mês.",
  },
  aquarius: {
    text: "aprender a pensar no grupo. A sua missão é usar o seu talento para algo maior do que você e encontrar a sua turma.",
    example: "Na vida real: entrar num projeto, numa causa ou num grupo que tenha a ver com você.",
  },
  pisces: {
    text: "aprender a confiar e a soltar o controle. A sua missão é ouvir a intuição e deixar espaço para o inesperado.",
    example: "Na vida real: tirar um dia sem planejar nada e ver o que aparece.",
  },
};

const CHIRON: Record<SignKey, { wound: string; gift: string }> = {
  aries: {
    wound: "Talvez você já tenha sentido que não tinha o direito de ocupar espaço ou de ser quem é.",
    gift: "você ajuda outras pessoas a terem coragem de existir do jeito delas.",
  },
  taurus: {
    wound: "Talvez você já tenha sentido que nunca tinha o suficiente: de dinheiro, de carinho ou de segurança.",
    gift: "você ensina os outros a darem valor ao que realmente importa.",
  },
  gemini: {
    wound: "Talvez você já tenha sentido que a sua voz não era ouvida ou que você não sabia o bastante.",
    gift: "você ajuda outras pessoas a encontrarem as palavras certas.",
  },
  cancer: {
    wound: "Talvez você já tenha sentido falta de colo ou de um lugar onde se sentir em casa.",
    gift: "você sabe acolher como ninguém.",
  },
  leo: {
    wound: "Talvez você já tenha sentido que ninguém reparava em você, por mais que se esforçasse.",
    gift: "você sabe fazer as pessoas se sentirem especiais e vistas.",
  },
  virgo: {
    wound: "Talvez você já tenha sentido que nada do que fazia era bom o suficiente.",
    gift: "você ajuda as pessoas a cuidarem de si com carinho, sem tanta cobrança.",
  },
  libra: {
    wound: "Talvez você já tenha sentido medo de que as pessoas fossem embora se você discordasse delas.",
    gift: "você ensina relações mais justas, em que os dois lados importam.",
  },
  scorpio: {
    wound: "Talvez você já tenha passado por perdas ou decepções que doeram fundo.",
    gift: "você entende a dor dos outros e ajuda a atravessar as fases difíceis.",
  },
  sagittarius: {
    wound: "Talvez você já tenha duvidado do sentido das coisas ou daquilo em que acreditava.",
    gift: "você ajuda as pessoas a encontrarem esperança e sentido.",
  },
  capricorn: {
    wound: "Talvez você já tenha sentido que precisou amadurecer cedo demais ou carregar peso por conta própria.",
    gift: "você ajuda outras pessoas a se sentirem capazes.",
  },
  aquarius: {
    wound: "Talvez você já tenha se sentido diferente de todo mundo, como se não se encaixasse.",
    gift: "você faz as pessoas diferentes se sentirem bem-vindas.",
  },
  pisces: {
    wound: "Talvez você já tenha sentido o peso do mundo nas costas ou absorvido a tristeza dos outros.",
    gift: "você cura com a sua presença, a sua escuta e a sua arte.",
  },
};

// ---------------------------------------------------------------------------
// MOMENTO (Ano Pessoal + céu de agora)
// ---------------------------------------------------------------------------
const PERSONAL_YEAR_SHORT: Record<number, string> = {
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

const PERSONAL_YEAR: Record<number, { first: string; act: string; rhythm: string }> = {
  1: {
    first: "escolher uma única coisa nova e dar o primeiro passo ainda esta semana.",
    act: "Escolha algo para começar: um curso, um hábito, um projeto. Não espere o momento perfeito, porque ele não vem pronto.",
    rhythm: "É normal sentir pressa este ano. Comece, mas não precisa resolver tudo de uma vez.",
  },
  2: {
    first: "chamar alguém para fazer junto com você aquilo que você está adiando.",
    act: "Procure parcerias e peça ajuda. Este ano, as coisas andam melhor junto com outras pessoas.",
    rhythm: "Se tudo parecer lento, é o tempo da semente: está crescendo por baixo da terra. Tenha paciência.",
  },
  3: {
    first: "mostrar para alguém uma coisa que você criou ou pensou.",
    act: "Apareça: poste, fale, crie, mostre o que você faz. Este ano pede que você se expresse.",
    rhythm: "Cuidado para não se espalhar demais. Escolha dois ou três projetos e foque neles.",
  },
  4: {
    first: "arrumar uma coisa pequena que está bagunçada há muito tempo.",
    act: "Organize a vida: rotina, contas, saúde e casa. O que você arrumar agora vai sustentar os próximos anos.",
    rhythm: "Vai ter dias de cansaço. Descanse sem culpa: tijolo por tijolo também é avanço.",
  },
  5: {
    first: "dizer sim a um convite diferente do que você costuma aceitar.",
    act: "Experimente algo novo: uma viagem, uma mudança, um jeito diferente de fazer as coisas.",
    rhythm: "As mudanças podem chegar de surpresa. Respire antes de decidir e mantenha por perto o que te dá segurança.",
  },
  6: {
    first: "mandar uma mensagem de carinho para alguém da família que você não vê faz tempo.",
    act: "Cuide das relações e da casa: faça as pazes, reúna as pessoas, arrume o seu cantinho.",
    rhythm: "Ajudar é bom, mas não carregue todo mundo. O seu bem-estar também entra na lista.",
  },
  7: {
    first: "reservar meia hora de silêncio só para pensar no que você quer.",
    act: "Tire um tempo para estudar e se conhecer: um livro, um curso, uma terapia, um momento de silêncio.",
    rhythm: "Este é um ano mais calmo por dentro. Tudo bem querer ficar mais em casa e pensar.",
  },
  8: {
    first: "escrever, com número e data, uma meta de dinheiro ou de carreira.",
    act: "Vá atrás de um objetivo concreto: uma promoção, um negócio, um dinheiro guardado.",
    rhythm: "Trabalhe com força, mas lembre de comemorar as conquistas pelo caminho.",
  },
  9: {
    first: "terminar ou deixar ir uma coisa que já está pela metade há muito tempo.",
    act: "Feche ciclos: termine o que está pela metade, doe o que não usa, perdoe o que pesa.",
    rhythm: "Despedidas podem doer um pouco. É espaço sendo aberto para o recomeço do ano que vem.",
  },
};

const PERSONAL_MONTH: Record<number, string> = {
  1: "Mês de começar algo novo",
  2: "Mês de paciência e parcerias",
  3: "Mês de se expressar e se divertir",
  4: "Mês de organizar e trabalhar",
  5: "Mês de mudança e novidade",
  6: "Mês de família e cuidado",
  7: "Mês de pensar e descansar",
  8: "Mês de conquistas e dinheiro",
  9: "Mês de encerrar e limpar",
};

const NATAL_AREA: Record<string, { area: string; of: string; title: string }> = {
  sun: { area: "quem você é e o que você quer", of: "de quem você é e do que você quer", title: "Quem você é e o que você quer" },
  moon: { area: "o que você sente", of: "do que você sente", title: "O que você sente" },
  mercury: { area: "o seu jeito de pensar e de conversar", of: "do seu jeito de pensar e de conversar", title: "Seu jeito de pensar e conversar" },
  venus: { area: "o amor e as coisas que te dão prazer", of: "do amor e das coisas que te dão prazer", title: "O amor e o que te dá prazer" },
  mars: { area: "a sua energia e a sua coragem", of: "da sua energia e da sua coragem", title: "Sua energia e sua coragem" },
  jupiter: { area: "a sua sorte e o seu crescimento", of: "da sua sorte e do seu crescimento", title: "Sua sorte e seu crescimento" },
  saturn: { area: "os seus compromissos e o seu esforço", of: "dos seus compromissos e do seu esforço", title: "Seus compromissos e seu esforço" },
};

const NATAL_LABEL: Record<string, string> = {
  sun: "o seu Sol",
  moon: "a sua Lua",
  mercury: "o seu Mercúrio",
  venus: "a sua Vênus",
  mars: "o seu Marte",
  jupiter: "o seu Júpiter",
  saturn: "o seu Saturno",
};

const TRANSIT_VERB: Record<string, { name: string; verb: string }> = {
  sun: { name: "O Sol", verb: "está iluminando" },
  venus: { name: "Vênus", verb: "está trazendo carinho e beleza para" },
  mars: { name: "Marte", verb: "está colocando energia e pressa em" },
  jupiter: { name: "Júpiter", verb: "está abrindo portas para" },
  saturn: { name: "Saturno", verb: "está pedindo paciência e responsabilidade com" },
};

const TRANSIT_TONE: Record<string, string> = {
  conjunction: "O assunto fica em evidência: difícil de ignorar.",
  sextile: "É uma ajuda do céu: aproveite, mas faça a sua parte.",
  trine: "É um momento fácil e fluido: bom para aproveitar.",
  square: "Pode dar um friozinho na barriga ou algum atrito, mas é para ajustar o que estava faltando.",
  opposition: "Pode parecer que a vida puxa você para dois lados. Busque o equilíbrio antes de decidir.",
};

const MOON_TODAY = [
  "A Lua está nova, quase invisível no céu: bom momento para fazer pedidos e planejar começos.",
  "A Lua está começando a crescer: bom momento para dar os primeiros passos.",
  "A Lua está crescendo, já pela metade: bom momento para decidir e seguir em frente.",
  "A Lua está quase cheia: bom momento para caprichar nos detalhes antes de mostrar o resultado.",
  "A Lua está cheia e brilhante: bom momento para enxergar as coisas com clareza e comemorar.",
  "A Lua começou a diminuir: bom momento para agradecer e dividir o que você aprendeu.",
  "A Lua está pela metade e diminuindo: bom momento para arrumar, limpar e cortar excessos.",
  "A Lua está quase sumindo: bom momento para descansar e fechar o que precisa ser fechado.",
];

// ---------------------------------------------------------------------------
// NÚMERO DE DESTINO
// ---------------------------------------------------------------------------
const LIFE_PATH: Record<number, { text: string; example: string; care: string }> = {
  1: {
    text: "Você veio para liderar e abrir caminhos. É quem começa, tem ideias próprias e não gosta de depender dos outros.",
    example: "Como uma locomotiva: puxa o trem inteiro.",
    care: "Cuidado para não querer fazer tudo por conta própria.",
  },
  2: {
    text: "Você veio para unir pessoas. Tem o dom de escutar, de fazer parcerias e de perceber o que os outros sentem.",
    example: "Como uma cola: junta o que estava separado.",
    care: "Cuidado para não esquecer de você enquanto cuida dos outros.",
  },
  3: {
    text: "Você veio para se expressar. Tem facilidade para conversar, criar, fazer rir e espalhar alegria.",
    example: "Como um alto-falante: faz as ideias chegarem longe.",
    care: "Cuidado para não começar tudo e terminar pouco.",
  },
  4: {
    text: "Você veio para construir. Faz as coisas com cuidado, gosta de organização e cria bases firmes.",
    example: "Como um tijolo bem colocado: segura a casa inteira.",
    care: "Cuidado para a rotina não virar uma prisão.",
  },
  5: {
    text: "Você veio para experimentar. Ama liberdade, novidades, viagens e mudanças.",
    example: "Como o vento: não para quieto e leva tudo para a frente.",
    care: "Cuidado para não fugir quando as coisas pedem compromisso.",
  },
  6: {
    text: "Você veio para cuidar. Família, amigos e casa são o seu centro, e você gosta de ver todo mundo bem.",
    example: "Como um abraço: deixa o mundo mais quentinho.",
    care: "Cuidado para não querer resolver a vida de todo mundo.",
  },
  7: {
    text: "Você veio para entender a vida. Gosta de estudar, de pensar e de buscar respostas profundas.",
    example: "Como um detetive: sempre quer saber o porquê.",
    care: "Cuidado para não se isolar demais nos próprios pensamentos.",
  },
  8: {
    text: "Você veio para realizar. Tem força para conquistar objetivos grandes, cuidar do dinheiro e liderar.",
    example: "Como um motor potente: leva os projetos até a linha de chegada.",
    care: "Cuidado para o trabalho não ocupar o lugar de tudo.",
  },
  9: {
    text: "Você veio para ajudar o mundo. Tem um coração grande, sente a dor dos outros e quer deixar algo bom.",
    example: "Como um farol: ilumina o caminho de quem está perdido.",
    care: "Cuidado para não carregar os problemas do mundo nas costas.",
  },
  11: {
    text: "Você tem um número especial, o 11. Veio para inspirar: tem muita intuição e um jeito de tocar as pessoas com palavras e ideias.",
    example: "Como uma antena: capta o que os outros não percebem.",
    care: "Cuidado com a ansiedade: tanta sensibilidade também precisa de descanso.",
  },
  22: {
    text: "Você tem um número especial, o 22. Veio para construir algo grande, que ajude muita gente.",
    example: "Como quem constrói pontes: cria caminhos para os outros atravessarem.",
    care: "Cuidado para não se cobrar demais por sonhar tão grande.",
  },
  33: {
    text: "Você tem um número especial, o 33. Veio para cuidar e ensinar com amor.",
    example: "Como aquela professora ou aquele professor que todo mundo lembra com carinho.",
    care: "Cuidado para não esquecer de receber carinho também.",
  },
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function reduce(value: number) {
  let current = value;
  while (current > 9) {
    current = String(current).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return current;
}

function angleBetween(a: number, b: number) {
  const distance = Math.abs(a - b) % 360;
  return Math.min(distance, 360 - distance);
}

function touches(transit: number | number[], natal: number | undefined, orb: number) {
  if (typeof natal !== "number") return false;
  const samples = Array.isArray(transit) ? transit : [transit];
  return samples.some((longitude) => {
    const distance = angleBetween(longitude, natal);
    return [0, 60, 120].some((angle) => Math.abs(distance - angle) <= orb);
  });
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type SkyMove = {
  transit: string;
  natal: string;
  kind: string;
};

export type MonthSky = {
  year: number;
  month: number; // 1-12
  /** Longitudes em alguns dias do mês (dias 4, 11, 18 e 25). */
  venus: number[];
  mars: number[];
  jupiter: number;
};

export function buildPremiumReading(input: {
  firstName: string;
  archetypeName: string | null;
  birthDate: string;
  sun: PlacementLike;
  moon: PlacementLike;
  midheaven: PlacementLike | null;
  mercury: PlacementLike;
  venus: PlacementLike;
  mars: PlacementLike;
  jupiter: PlacementLike;
  saturn: PlacementLike;
  northNode: PlacementLike | null;
  chiron: PlacementLike | null;
  secondHouseSign: SignKey | null;
  secondHouseLabel: string | null;
  personalYear: number;
  lifePath: number;
  skyMoves: SkyMove[];
  moonPhaseAngle: number;
  monthSky: MonthSky[];
}): PremiumReading {
  const {
    sun, moon, midheaven, mercury, venus, mars, jupiter, saturn,
    northNode, chiron,
  } = input;
  const love = MOON_LOVE[moon.signKey];
  const venusShow = VENUS_SHOW[venus.signKey];
  const marsLove = MARS_LOVE[mars.signKey];
  const merc = MERCURY[mercury.signKey];
  const careerSign = midheaven ? midheaven.signKey : sun.signKey;
  const sat = SATURN[saturn.signKey];
  const leakSign = input.secondHouseSign ?? moon.signKey;
  const leak = MONEY_LEAK[leakSign];
  const year = PERSONAL_YEAR[input.personalYear] ?? PERSONAL_YEAR[1];
  const life = LIFE_PATH[input.lifePath] ?? LIFE_PATH[reduce(input.lifePath)] ?? LIFE_PATH[1];

  const chapters: PremiumChapter[] = [];

  // 1. Amor -----------------------------------------------------------------
  chapters.push({
    id: "amor",
    symbol: "♀",
    label: "Amor",
    title: "Como você ama",
    source: `Vênus em ${venus.sign} (o seu jeito de amar), Lua em ${moon.sign} (o seu coração) e Marte em ${mars.sign} (a sua atitude).`,
    intro: `Com Vênus em ${venus.sign}, ${VENUS_LOVE_OPENING[venus.signKey]}`,
    payoff: {
      lead: "O seu mapa também mostra o que te dá segurança no amor e como você reage quando aparece uma briga. E isso explica por que",
      rest: love.why,
    },
    blocks: [
      {
        title: "Seu jeito de demonstrar carinho",
        text: `${venusShow.show} Quem costuma te encantar: ${venusShow.attract}.`,
        example: venusShow.example,
      },
      {
        title: "O que te dá segurança no amor",
        text: love.safe,
        example: love.example,
      },
      {
        title: "Nas conquistas e nas brigas",
        text: `${marsLove.conquer} ${marsLove.fight}`,
        tip: marsLove.tip,
      },
    ],
  });

  // 2. Conversa -------------------------------------------------------------
  chapters.push({
    id: "conversa",
    symbol: "☿",
    label: "Cabeça e conversa",
    title: "Como você pensa e conversa",
    source: `Mercúrio em ${mercury.sign}. Mercúrio é o planeta que cuida da cabeça e das palavras.`,
    intro: merc.text,
    blocks: [
      {
        title: "Como isso aparece no dia a dia",
        text: "Esse é o seu jeito natural de aprender, de explicar e de resolver as coisas. Quando você respeita esse jeito, tudo fica mais leve.",
        example: merc.example,
        tip: merc.tip,
      },
    ],
  });

  // 3. Trabalho -------------------------------------------------------------
  chapters.push({
    id: "trabalho",
    symbol: "◆",
    label: "Trabalho",
    title: "Onde você brilha no trabalho",
    source: midheaven
      ? `Meio do Céu em ${midheaven.sign} (o ponto mais alto do mapa, que fala de carreira), Júpiter em ${jupiter.sign} (a sorte) e Saturno em ${saturn.sign} (o esforço).`
      : `Sol em ${sun.sign}, Júpiter em ${jupiter.sign} (a sorte) e Saturno em ${saturn.sign} (o esforço).`,
    intro: midheaven
      ? `Seu Meio do Céu está em ${midheaven.sign}. Isso mostra que ${CAREER[careerSign]}`
      : `Seu Sol em ${sun.sign} mostra que ${CAREER[careerSign]}`,
    payoff: {
      lead: "E tem um ponto do seu mapa que mostra onde a sua confiança no trabalho ainda pode crescer. Ele está ligado a",
      rest: `Júpiter, o planeta da sorte. No seu mapa, a sua confiança cresce quando você ${JUPITER_GROW[jupiter.signKey]}.`,
    },
    blocks: [
      {
        title: "O tipo de tarefa em que você se sente em casa",
        text: "Isso não quer dizer que você precisa ter uma dessas profissões. Fala do tipo de tarefa em que você rende mais e se cansa menos.",
        example: CAREER_EXAMPLE[careerSign],
      },
      {
        title: "Como ter disciplina sem se cansar",
        text: sat.text,
        tip: sat.tip,
      },
    ],
  });

  // 4. Dinheiro -------------------------------------------------------------
  chapters.push({
    id: "dinheiro",
    symbol: "♃",
    label: "Dinheiro",
    title: "Como o dinheiro chega até você",
    source: input.secondHouseLabel
      ? `Júpiter em ${jupiter.sign} (as oportunidades), Vênus em ${venus.sign} (o que você valoriza) e a parte do mapa que cuida do dinheiro, em ${input.secondHouseLabel}.`
      : `Júpiter em ${jupiter.sign} (as oportunidades), Vênus em ${venus.sign} (o que você valoriza) e Lua em ${moon.sign} (as emoções).`,
    intro: `Com Júpiter em ${jupiter.sign}, ${JUPITER_MONEY[jupiter.signKey]}`,
    payoff: {
      lead: "Mas o seu mapa também mostra onde o dinheiro costuma escapar. Isso acontece principalmente quando",
      rest: leak.leak,
    },
    blocks: [
      {
        title: "Sua base de segurança com dinheiro",
        text: `Você se sente em segurança ${MONEY_BASE[venus.signKey]}`,
      },
      {
        title: "Como guardar e planejar melhor",
        text: "Não é sobre parar de gastar. É sobre gastar no que importa para você e não deixar o dinheiro escapar pelos cantos.",
        tip: leak.tip,
      },
    ],
  });

  // 5. Missão ---------------------------------------------------------------
  if (northNode) {
    const node = NODE[northNode.signKey];
    chapters.push({
      id: "missao",
      symbol: "☊",
      label: "Missão",
      title: "Para que você veio",
      source: `Nodo Norte em ${northNode.sign}. É um ponto do mapa que funciona como uma bússola: aponta para o que você veio aprender.`,
      intro: `O seu mapa mostra que você veio para ${node.text}`,
      blocks: [
        {
          title: "Como treinar a sua missão",
          text: "Não precisa ser nada grandioso. A missão aparece nas pequenas escolhas, e cada vez que você faz uma delas, a vida parece encaixar melhor.",
          example: node.example,
        },
      ],
    });
  }

  // 6. Dom ------------------------------------------------------------------
  if (chiron) {
    const wound = CHIRON[chiron.signKey];
    chapters.push({
      id: "dom",
      symbol: "⚷",
      label: "Seu dom",
      title: "A cicatriz que vira dom",
      source: `Quíron em ${chiron.sign}. Quíron é um pequeno astro que fala de uma dor antiga que, cuidada, vira um talento para ajudar os outros.`,
      intro: wound.wound,
      blocks: [
        {
          title: "O dom que nasce daí",
          text: `Com o tempo, isso vira um dom: ${wound.gift}`,
          example: "Na vida real: quando alguém passa pelo que você já passou, você sabe exatamente o que dizer.",
        },
      ],
    });
  }

  // 7. Agora ----------------------------------------------------------------
  const moves = input.skyMoves.filter((move) => TRANSIT_VERB[move.transit] && NATAL_AREA[move.natal]);
  const moveBlocks: PremiumBlock[] = moves.slice(0, 3).map((move) => {
    const planet = TRANSIT_VERB[move.transit];
    const area = NATAL_AREA[move.natal];
    return {
      title: area.title,
      text: `${planet.name} ${planet.verb} ${area.area}. ${TRANSIT_TONE[move.kind] ?? ""}`.trim(),
      example: `Por quê: hoje, ${planet.name === "O Sol" ? "o Sol" : planet.name} está passando num ponto que toca ${NATAL_LABEL[move.natal]}.`,
    };
  });
  const phaseIndex = Math.floor((((input.moonPhaseAngle % 360) + 360 + 22.5) % 360) / 45) % 8;
  chapters.push({
    id: "agora",
    symbol: "☼",
    label: "Agora",
    title: "O que este momento pede de você",
    source: `Seu Ano Pessoal ${input.personalYear} (numerologia) e os planetas de hoje passando pelo seu mapa.`,
    intro: `Você está no Ano Pessoal ${input.personalYear}: ${PERSONAL_YEAR_SHORT[input.personalYear] ?? PERSONAL_YEAR_SHORT[1]}${
      moves.length
        ? ` E agora mesmo, ${moves.length} ${moves.length === 1 ? "movimento do céu está tocando" : "movimentos do céu estão tocando"} pontos importantes do seu mapa.`
        : ""
    }`,
    payoff: moves.length
      ? { lead: "O mais importante deles fala", rest: `${NATAL_AREA[moves[0].natal].of}.` }
      : { lead: "E existe um passo simples que pode fazer este ano render muito mais. Ele começa por", rest: year.first },
    blocks: [
      ...moveBlocks,
      { title: "Como transformar vontade em ação", text: year.act },
      { title: "Como respeitar o seu ritmo", text: year.rhythm },
      { title: "A Lua de hoje", text: MOON_TODAY[phaseIndex] },
    ],
  });

  // 8. Número ---------------------------------------------------------------
  chapters.push({
    id: "numero",
    symbol: String(input.lifePath),
    label: "Seu número",
    title: `Seu número de destino é ${input.lifePath}`,
    source: "Numerologia: a soma de todos os números da sua data de nascimento.",
    intro: life.text,
    blocks: [
      { title: "Uma imagem para lembrar", text: life.example, tip: life.care },
    ],
  });

  // Próximos 12 meses -----------------------------------------------------
  const [, birthMonth, birthDay] = input.birthDate.split("-").map(Number);
  const months: PremiumMonth[] = input.monthSky.map((sky) => {
    const yearSum = String(sky.year).split("").reduce((sum, digit) => sum + Number(digit), 0);
    const personalYear = reduce(birthMonth + birthDay + yearSum);
    const number = reduce(personalYear + sky.month);
    const tags: PremiumMonth["tags"] = [];
    if (sky.month === birthMonth) tags.push({ id: "aniversario", label: "Seu aniversário: um ano novo só seu" });
    if (touches(sky.venus, venus.longitude, 4) || touches(sky.venus, sun.longitude, 3)) {
      tags.push({ id: "amor", label: "Amor em alta" });
    }
    if (touches(sky.jupiter, sun.longitude, 5) || touches(sky.jupiter, midheaven?.longitude, 5) || touches(sky.jupiter, venus.longitude, 4)) {
      tags.push({ id: "sorte", label: "Sorte e crescimento" });
    }
    if (touches(sky.mars, sun.longitude, 3) || touches(sky.mars, mars.longitude, 2)) {
      tags.push({ id: "energia", label: "Energia de sobra" });
    }
    return {
      key: `${sky.year}-${String(sky.month).padStart(2, "0")}`,
      label: `${MONTH_NAMES[sky.month - 1]} ${sky.year}`,
      number,
      theme: PERSONAL_MONTH[number] ?? PERSONAL_MONTH[1],
      tags,
    };
  });

  const archetype = input.archetypeName ? `Você já conheceu ${input.archetypeName}. ` : "";
  return {
    letter: {
      title: `${input.firstName}, agora vem a parte mais gostosa`,
      text: `${archetype}Agora a gente vai mais fundo: como você ama, como pensa, onde brilha no trabalho, como o dinheiro chega, para que você veio e o que este momento pede de você. Tudo explicado com exemplos do dia a dia, para você se reconhecer em cada parte.`,
    },
    chapters,
    months,
    closing: "Guarde este mapa e volte nele quando precisar. Ele não decide nada por você: só ajuda você a se entender melhor. Quem escolhe o caminho é você.",
  };
}

// Primeira frase do amor (a mesma da prévia grátis, para a pessoa reconhecer).
const VENUS_LOVE_OPENING: Record<SignKey, string> = {
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
