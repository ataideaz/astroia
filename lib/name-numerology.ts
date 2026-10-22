// Numerologia do Nome do AstroIA (produto de R$ 19,90).
//
// Usa as letras do nome completo (tabela pitagórica) e a data de nascimento.
// Mesma linha de escrita do resto do site: frases curtas, exemplos do dia a
// dia, falando com "você" sem palavras de gênero.

const LETTER_VALUE: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};
const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const MASTERS = [11, 22, 33];

type NumberText = { title: string; text: string; example: string };

export type NameReading = {
  version: 1;
  name: string;
  letters: number;
  numbers: {
    soul: number;
    personality: number;
    expression: number;
    destiny: number;
    maturity: number;
    challenge: number;
    lucky: number;
  };
  headline: string;
  intro: string;
  sections: Array<{
    id: "alma" | "personalidade" | "expressao" | "destino" | "maturidade" | "desafio";
    number: number;
    label: string;
    question: string;
    title: string;
    text: string;
    example: string;
    extra?: string;
  }>;
  powerDays: number[];
  powerText: string;
  luckyText: string;
  closing: string;
};

function sumDigits(value: number) {
  return String(value).split("").reduce((sum, digit) => sum + Number(digit), 0);
}

function reduce(value: number, keepMasters = true) {
  let current = value;
  while (current > 9 && !(keepMasters && MASTERS.includes(current))) current = sumDigits(current);
  return current;
}

function letters(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("");
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------
const SOUL: Record<number, NumberText> = {
  1: { title: "Lá no fundo, você quer ser livre para fazer do seu jeito", text: "O seu coração pede independência. Você se sente feliz quando decide o próprio caminho e quando é a primeira pessoa a tentar algo novo.", example: "Na vida real: receber ordem sem explicação te irrita mais do que trabalhar muito." },
  2: { title: "Lá no fundo, você quer paz e companhia", text: "O seu coração pede parceria. Você se sente feliz quando tem alguém do lado, quando o clima está leve e quando as pessoas se tratam com carinho.", example: "Na vida real: uma briga em casa tira o seu sono, mesmo que não seja com você." },
  3: { title: "Lá no fundo, você quer se expressar e ser feliz", text: "O seu coração pede alegria. Você se sente bem quando pode conversar, criar, rir e mostrar o que sente sem medo de julgamento.", example: "Na vida real: um dia sem conversar com ninguém parece um dia perdido." },
  4: { title: "Lá no fundo, você quer segurança", text: "O seu coração pede chão firme. Você se sente em paz quando a vida está organizada, as contas em dia e existe um plano para o futuro.", example: "Na vida real: surpresa de última hora te tira mais a paz do que te anima." },
  5: { title: "Lá no fundo, você quer liberdade e novidade", text: "O seu coração pede movimento. A vida fica mais gostosa quando você viaja, conhece gente nova e experimenta coisas diferentes.", example: "Na vida real: a mesma rotina por muito tempo te dá vontade de mudar tudo de lugar." },
  6: { title: "Lá no fundo, você quer cuidar e receber cuidado", text: "O seu coração pede amor e família. Você se sente feliz quando as pessoas que ama estão bem e quando a sua casa é um lugar gostoso de estar.", example: "Na vida real: você é quem lembra de levar o remédio, o casaco e o lanche de todo mundo." },
  7: { title: "Lá no fundo, você quer entender a vida", text: "O seu coração pede silêncio e respostas. Você se sente bem quando tem tempo para pensar, ler, estudar e ficar um pouco na sua.", example: "Na vida real: depois de uma festa cheia, você precisa de um dia quieto para recarregar." },
  8: { title: "Lá no fundo, você quer conquistar", text: "O seu coração pede realização. Você se sente feliz quando vê o resultado do seu esforço, quando recebe reconhecimento e quando tem segurança financeira.", example: "Na vida real: bater uma meta te dá mais alegria do que ganhar um presente." },
  9: { title: "Lá no fundo, você quer fazer o bem", text: "O seu coração pede propósito. Você se sente feliz quando ajuda alguém, quando faz parte de algo maior e quando o mundo fica um pouco melhor por sua causa.", example: "Na vida real: uma notícia triste de um desconhecido mexe com você o dia inteiro." },
  11: { title: "Lá no fundo, você quer inspirar", text: "O seu número da alma é especial, o 11. O seu coração pede sentido e conexão. Você sente as coisas antes de elas acontecerem e quer usar isso para tocar a vida das pessoas.", example: "Na vida real: você pensa numa pessoa e, minutos depois, ela te manda mensagem." },
  22: { title: "Lá no fundo, você quer construir algo que fique", text: "O seu número da alma é especial, o 22. O seu coração pede obras grandes: algo que ajude muita gente e que continue existindo depois de você.", example: "Na vida real: você não se contenta com um plano pequeno; já pensa em como fazer aquilo crescer." },
  33: { title: "Lá no fundo, você quer curar com amor", text: "O seu número da alma é especial, o 33. O seu coração pede cuidar, ensinar e acolher, como quem abraça o mundo.", example: "Na vida real: as pessoas te procuram para desabafar mesmo sem te conhecer bem." },
};

const PERSONALITY: Record<number, NumberText> = {
  1: { title: "Os outros te veem como alguém que lidera", text: "Na primeira impressão, você passa firmeza e decisão. As pessoas acham que você sabe o que quer, mesmo quando você ainda está pensando.", example: "Na vida real: num grupo novo, logo te perguntam \"e aí, o que a gente faz?\"." },
  2: { title: "Os outros te veem como alguém gentil", text: "Na primeira impressão, você passa calma e simpatia. As pessoas sentem que podem confiar em você e se sentem à vontade para conversar.", example: "Na vida real: estranhos te pedem informação na rua mais do que aos outros." },
  3: { title: "Os outros te veem como alguém divertido", text: "Na primeira impressão, você passa alegria e bom papo. As pessoas acham que você é leve e fácil de gostar.", example: "Na vida real: em pouco tempo numa roda, você já arrancou risadas." },
  4: { title: "Os outros te veem como alguém confiável", text: "Na primeira impressão, você passa seriedade e responsabilidade. As pessoas sentem que, se você disse que faz, vai fazer.", example: "Na vida real: te escolhem para cuidar das contas da viagem ou do dinheiro do grupo." },
  5: { title: "Os outros te veem como alguém interessante", text: "Na primeira impressão, você passa energia e curiosidade. As pessoas acham que você tem sempre uma história nova para contar.", example: "Na vida real: te chamam quando querem um programa diferente." },
  6: { title: "Os outros te veem como alguém acolhedor", text: "Na primeira impressão, você passa cuidado e carinho. As pessoas sentem que você se importa de verdade.", example: "Na vida real: amigos dos seus amigos acabam virando seus amigos também." },
  7: { title: "Os outros te veem como alguém misterioso", text: "Na primeira impressão, você passa inteligência e um certo mistério. As pessoas ficam curiosas para saber o que você está pensando.", example: "Na vida real: te dizem \"no começo achei que você era de pouca conversa\"." },
  8: { title: "Os outros te veem como alguém forte", text: "Na primeira impressão, você passa poder e segurança. As pessoas sentem que você sabe resolver as coisas e não se assusta fácil.", example: "Na vida real: num problema, é para você que olham primeiro." },
  9: { title: "Os outros te veem como alguém generoso", text: "Na primeira impressão, você passa bondade e maturidade. As pessoas sentem que você entende a dor delas.", example: "Na vida real: te contam segredos que não contam para mais ninguém." },
  11: { title: "Os outros te veem como alguém especial", text: "Na primeira impressão, você passa uma energia diferente, difícil de explicar. As pessoas lembram de você depois de um único encontro.", example: "Na vida real: alguém te diz \"parece que eu já te conhecia\"." },
  22: { title: "Os outros te veem como alguém que faz acontecer", text: "Na primeira impressão, você passa visão e capacidade. As pessoas sentem que você pode tirar projetos grandes do papel.", example: "Na vida real: te chamam para organizar o que ninguém conseguiu organizar." },
  33: { title: "Os outros te veem como alguém que cuida", text: "Na primeira impressão, você passa um carinho que acalma. As pessoas se sentem protegidas perto de você.", example: "Na vida real: crianças e animais costumam gostar de você logo de cara." },
};

const EXPRESSION: Record<number, NumberText & { where: string }> = {
  1: { title: "O seu talento é começar e liderar", text: "O seu nome carrega a força da iniciativa. Você tem facilidade para tomar decisões, abrir caminhos e mostrar a direção.", example: "Na vida real: os projetos andam mais rápido quando você está no comando.", where: "liderança, negócio próprio, vendas, esportes" },
  2: { title: "O seu talento é unir pessoas", text: "O seu nome carrega o dom da parceria. Você tem facilidade para escutar, negociar e fazer as pessoas trabalharem juntas.", example: "Na vida real: você resolve no papo o que outros resolveriam no grito.", where: "atendimento, mediação, saúde, recursos humanos" },
  3: { title: "O seu talento é se comunicar", text: "O seu nome carrega a força das palavras e da criatividade. Você tem facilidade para falar, escrever, ensinar e encantar.", example: "Na vida real: quando você explica, todo mundo entende.", where: "comunicação, redes sociais, arte, ensino" },
  4: { title: "O seu talento é organizar e construir", text: "O seu nome carrega a força do trabalho bem feito. Você tem facilidade para planejar, cuidar dos detalhes e terminar o que começa.", example: "Na vida real: você transforma bagunça em planilha.", where: "gestão, finanças, engenharia, processos" },
  5: { title: "O seu talento é se adaptar", text: "O seu nome carrega a força da mudança. Você tem facilidade para aprender rápido, falar com qualquer pessoa e se virar em qualquer lugar.", example: "Na vida real: quando o plano A falha, você já tem o B e o C.", where: "vendas, viagens, eventos, marketing" },
  6: { title: "O seu talento é cuidar", text: "O seu nome carrega o dom de acolher. Você tem facilidade para ajudar, ensinar e deixar os ambientes mais bonitos e humanos.", example: "Na vida real: onde você chega, as pessoas se sentem em casa.", where: "saúde, educação, beleza, decoração" },
  7: { title: "O seu talento é pensar fundo", text: "O seu nome carrega a força da análise. Você tem facilidade para estudar, pesquisar e entender o que está por trás das coisas.", example: "Na vida real: você descobre o problema que ninguém conseguiu achar.", where: "pesquisa, tecnologia, ciência, terapias" },
  8: { title: "O seu talento é realizar", text: "O seu nome carrega a força das conquistas. Você tem facilidade para lidar com dinheiro, liderar equipes e transformar planos em resultado.", example: "Na vida real: você enxerga oportunidade de negócio onde outros veem problema.", where: "negócios, finanças, direção, empreendedorismo" },
  9: { title: "O seu talento é inspirar e ajudar", text: "O seu nome carrega a força da generosidade. Você tem facilidade para entender pessoas, criar arte e defender causas.", example: "Na vida real: você convence as pessoas a ajudarem uma causa que você acredita.", where: "causas sociais, arte, saúde, ensino" },
  11: { title: "O seu talento é iluminar o caminho dos outros", text: "O seu nome carrega um número especial, o 11. Você tem facilidade para inspirar, orientar e enxergar além do óbvio.", example: "Na vida real: uma frase sua muda o dia de alguém.", where: "orientação, comunicação, arte, espiritualidade" },
  22: { title: "O seu talento é construir em grande escala", text: "O seu nome carrega um número especial, o 22. Você tem facilidade para transformar ideias enormes em algo concreto.", example: "Na vida real: você começa com um projeto pequeno e já pensa em como multiplicar.", where: "grandes projetos, gestão, arquitetura, empresas" },
  33: { title: "O seu talento é ensinar com amor", text: "O seu nome carrega um número especial, o 33. Você tem facilidade para cuidar, ensinar e curar com paciência.", example: "Na vida real: as pessoas aprendem mais com você do que com qualquer livro.", where: "educação, saúde, terapias, cuidado" },
};

const DESTINY: Record<number, { title: string; text: string; love: string; work: string }> = {
  1: { title: "Seu destino é abrir caminhos", text: "A sua vida é uma estrada de coragem: você veio para aprender a confiar em si e a dar o primeiro passo.", love: "No amor, precisa de alguém que admire a sua independência.", work: "No trabalho, brilha quando tem autonomia." },
  2: { title: "Seu destino é unir", text: "A sua vida é uma ponte: você veio para aprender a cooperar, a ouvir e a fazer as pazes.", love: "No amor, você é parceria pura e precisa de reciprocidade.", work: "No trabalho, brilha em equipe e em negociações." },
  3: { title: "Seu destino é se expressar", text: "A sua vida é um palco: você veio para aprender a mostrar quem é, com alegria e criatividade.", love: "No amor, precisa de leveza, conversa e risada.", work: "No trabalho, brilha quando pode criar e falar." },
  4: { title: "Seu destino é construir", text: "A sua vida é uma obra: você veio para aprender que constância vale mais que pressa.", love: "No amor, você é lealdade e quer algo sólido.", work: "No trabalho, brilha organizando e entregando." },
  5: { title: "Seu destino é experimentar", text: "A sua vida é uma viagem: você veio para aprender a usar a liberdade com responsabilidade.", love: "No amor, precisa de novidade e de espaço.", work: "No trabalho, brilha em ambientes que mudam." },
  6: { title: "Seu destino é cuidar", text: "A sua vida é uma casa aberta: você veio para aprender a amar sem se esquecer de si.", love: "No amor, você se entrega e cria um lar.", work: "No trabalho, brilha ajudando pessoas." },
  7: { title: "Seu destino é entender", text: "A sua vida é uma busca: você veio para aprender a confiar na sua intuição e no seu conhecimento.", love: "No amor, precisa de alguém que respeite o seu silêncio.", work: "No trabalho, brilha como especialista." },
  8: { title: "Seu destino é realizar", text: "A sua vida é uma subida: você veio para aprender a usar o seu poder com justiça.", love: "No amor, você protege e quer alguém tão forte quanto você.", work: "No trabalho, brilha liderando e cuidando de resultados." },
  9: { title: "Seu destino é servir ao mundo", text: "A sua vida é um farol: você veio para aprender a ajudar sem carregar tudo nas costas.", love: "No amor, você ama de um jeito grande e generoso.", work: "No trabalho, brilha quando o que faz tem propósito." },
  11: { title: "Seu destino é inspirar", text: "O seu destino é um número especial, o 11: você veio para transformar sensibilidade em luz para os outros.", love: "No amor, precisa de conexão profunda, quase de alma.", work: "No trabalho, brilha orientando e inspirando." },
  22: { title: "Seu destino é construir algo grande", text: "O seu destino é um número especial, o 22: você veio para tirar do papel sonhos que ajudam muita gente.", love: "No amor, quer uma parceria para construir junto.", work: "No trabalho, brilha em projetos de grande escala." },
  33: { title: "Seu destino é curar com amor", text: "O seu destino é um número especial, o 33: você veio para ensinar e cuidar com o coração.", love: "No amor, você é colo e cuidado.", work: "No trabalho, brilha ensinando e acolhendo." },
};

const MATURITY: Record<number, string> = {
  1: "Com o passar dos anos, você ganha cada vez mais independência e coragem para seguir o próprio caminho.",
  2: "Com o passar dos anos, você ganha cada vez mais calma, paciência e jeito para parcerias.",
  3: "Com o passar dos anos, você ganha cada vez mais leveza e criatividade para se expressar.",
  4: "Com o passar dos anos, você constrói uma base cada vez mais firme e segura.",
  5: "Com o passar dos anos, você ganha cada vez mais liberdade para viver do seu jeito.",
  6: "Com o passar dos anos, a família e o lar ficam cada vez mais no centro da sua vida.",
  7: "Com o passar dos anos, você ganha cada vez mais sabedoria e paz consigo.",
  8: "Com o passar dos anos, as suas conquistas ficam cada vez maiores e mais sólidas.",
  9: "Com o passar dos anos, você encontra cada vez mais sentido em ajudar os outros.",
  11: "Com o passar dos anos, a sua intuição fica cada vez mais forte e certeira.",
  22: "Com o passar dos anos, você realiza projetos cada vez maiores.",
  33: "Com o passar dos anos, você vira uma referência de carinho para muita gente.",
};

// O desafio usa um gênero neutro de propósito: "aprender a ...".
const CHALLENGE: Record<number, { title: string; text: string; tip: string }> = {
  0: { title: "O desafio da escolha", text: "Você tem muitos talentos e, às vezes, fica em dúvida sobre qual seguir.", tip: "Experimente: escolha uma coisa por vez e dê três meses para ela antes de trocar." },
  1: { title: "O desafio de se colocar", text: "Você pode ter dificuldade de dizer o que quer ou de defender as suas ideias.", tip: "Experimente: comece frases com \"eu quero\" e \"eu acho\" sem pedir desculpas." },
  2: { title: "O desafio da sensibilidade", text: "Você pode se magoar fácil ou se preocupar demais com o que os outros pensam.", tip: "Experimente: antes de sofrer por uma frase, pergunte o que a pessoa quis dizer." },
  3: { title: "O desafio de se expressar", text: "Você pode guardar o que sente ou ter vergonha de mostrar o que cria.", tip: "Experimente: mostre uma ideia sua para alguém de confiança esta semana." },
  4: { title: "O desafio da disciplina", text: "Você pode ter dificuldade com rotina ou, ao contrário, se prender demais a ela.", tip: "Experimente: crie um hábito pequeno, de cinco minutos, e repita todo dia." },
  5: { title: "O desafio da liberdade", text: "Você pode ter medo de mudar ou mudar rápido demais, sem terminar as coisas.", tip: "Experimente: antes de largar algo, termine pelo menos uma etapa." },
  6: { title: "O desafio da responsabilidade", text: "Você pode querer resolver a vida de todo mundo e esquecer da sua.", tip: "Experimente: diga \"agora não posso\" uma vez esta semana, sem culpa." },
  7: { title: "O desafio da confiança", text: "Você pode desconfiar das pessoas ou de si, e se fechar demais.", tip: "Experimente: divida um pensamento seu com alguém em vez de guardar." },
  8: { title: "O desafio do dinheiro e do poder", text: "Você pode ter uma relação difícil com dinheiro ou com quem manda.", tip: "Experimente: anote para onde vai o seu dinheiro durante um mês." },
};

const LUCKY: Record<number, string> = {
  1: "Use o 1 para começar coisas: dia 1, primeiro horário, primeiro da fila.",
  2: "Use o 2 para parcerias: decisões a dois, encontros e conversas importantes.",
  3: "Use o 3 para se mostrar: postar, apresentar, pedir.",
  4: "Use o 4 para organizar: assinar contratos, planejar, arrumar a casa.",
  5: "Use o 5 para mudanças: viagens, mudanças e coisas novas.",
  6: "Use o 6 para o amor e a família: encontros, reconciliações, casa.",
  7: "Use o 7 para pensar: estudos, provas, decisões importantes depois de refletir.",
  8: "Use o 8 para dinheiro: negociar, pedir aumento, investir.",
  9: "Use o 9 para encerrar: terminar projetos, doar, fazer as pazes com o passado.",
};

// ---------------------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------------------
export function buildNameReading(fullName: string, birthDate: string): NameReading {
  const chars = letters(fullName);
  const total = (filter: (letter: string) => boolean) =>
    chars.filter(filter).reduce((sum, letter) => sum + (LETTER_VALUE[letter] ?? 0), 0);
  const soul = reduce(total((letter) => VOWELS.has(letter)) || 1);
  const personality = reduce(total((letter) => !VOWELS.has(letter)) || 1);
  const expression = reduce(total(() => true) || 1);

  const [year, month, day] = birthDate.split("-").map(Number);
  const destiny = reduce(String(year).concat(String(month), String(day)).split("").reduce((sum, digit) => sum + Number(digit), 0));
  const maturity = reduce(reduce(destiny, false) + reduce(expression, false));
  const d = reduce(day, false);
  const m = reduce(month, false);
  const y = reduce(year, false);
  const challenge = Math.abs(Math.abs(m - d) - Math.abs(d - y));
  const lucky = reduce(expression, false);
  const destinySingle = reduce(destiny, false);
  const powerDays = Array.from({ length: 31 }, (_, index) => index + 1).filter((value) => reduce(value, false) === destinySingle);

  const first = fullName.trim().split(/\s+/)[0] ?? fullName;
  const soulText = SOUL[soul] ?? SOUL[reduce(soul, false)];
  const personalityText = PERSONALITY[personality] ?? PERSONALITY[reduce(personality, false)];
  const expressionText = EXPRESSION[expression] ?? EXPRESSION[reduce(expression, false)];
  const destinyText = DESTINY[destiny] ?? DESTINY[reduce(destiny, false)];
  const challengeText = CHALLENGE[challenge] ?? CHALLENGE[0];

  return {
    version: 1,
    name: fullName.trim(),
    letters: chars.length,
    numbers: { soul, personality, expression, destiny, maturity, challenge, lucky },
    headline: `${first}, o seu nome vibra no número ${expression}`,
    intro: `Cada letra do seu nome tem um número. Somando as ${chars.length} letras de "${fullName.trim()}", aparecem os números que contam o que você deseja, como os outros te veem e quais são os seus talentos. É como se o seu nome fosse uma assinatura de energia.`,
    sections: [
      {
        id: "alma",
        number: soul,
        label: "Número da Alma",
        question: "O que você deseja lá no fundo",
        title: soulText.title,
        text: soulText.text,
        example: soulText.example,
        extra: "Vem das vogais do seu nome.",
      },
      {
        id: "personalidade",
        number: personality,
        label: "Número da Personalidade",
        question: "Como os outros te veem",
        title: personalityText.title,
        text: personalityText.text,
        example: personalityText.example,
        extra: "Vem das consoantes do seu nome.",
      },
      {
        id: "expressao",
        number: expression,
        label: "Número da Expressão",
        question: "Os seus talentos naturais",
        title: expressionText.title,
        text: expressionText.text,
        example: expressionText.example,
        extra: `Onde esse talento costuma brilhar: ${expressionText.where}.`,
      },
      {
        id: "destino",
        number: destiny,
        label: "Número do Destino",
        question: "O caminho da sua vida",
        title: destinyText.title,
        text: destinyText.text,
        example: `${destinyText.love} ${destinyText.work}`,
        extra: "Vem da soma da sua data de nascimento.",
      },
      {
        id: "maturidade",
        number: maturity,
        label: "Número da Maturidade",
        question: "Quem você vai se tornando com o tempo",
        title: "O que fica mais forte com os anos",
        text: MATURITY[maturity] ?? MATURITY[reduce(maturity, false)],
        example: "Esse número costuma ficar mais forte depois dos 35 a 40 anos.",
      },
      {
        id: "desafio",
        number: challenge,
        label: "Número do Desafio",
        question: "O que você veio aprender",
        title: challengeText.title,
        text: challengeText.text,
        example: challengeText.tip,
      },
    ],
    powerDays,
    powerText: `Os seus dias de poder em qualquer mês são ${powerDays.join(", ").replace(/, (\d+)$/, " e $1")}. São bons dias para começar algo importante, ter uma conversa decisiva ou pedir o que você quer.`,
    luckyText: `O seu número da sorte é ${lucky}. ${LUCKY[lucky] ?? LUCKY[1]}`,
    closing: "A numerologia não decide nada por você: ela mostra tendências, como um mapa. O caminho, quem escolhe é você.",
  };
}
