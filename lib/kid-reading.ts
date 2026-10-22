// Leitura infantil do AstroIA (grátis e completa), para mapas de crianças e
// adolescentes. Fala com quem cuida, sobre a criança, sempre pelo nome ({n}).
// Nada de amor, dinheiro ou carreira: jeito de ser, emoções, aprendizado,
// amizades, energia, talentos e como apoiar. Sem rótulos e sem previsões.

import type { FreeReading, SignKey } from "./free-reading";
import type { PremiumChapter, PremiumReading } from "./premium-reading";

type PlacementLike = { sign: string; signKey: SignKey };

type KidPoint = {
  headline: string;
  text: string;
  gifts: string[];
  shadows: string[];
  power: string;
};

const fill = (text: string, n: string) => text.replaceAll("{n}", n);

// ---------------------------------------------------------------------------
// SOL: quem a criança é por dentro
// ---------------------------------------------------------------------------
const SUN: Record<SignKey, KidPoint> = {
  aries: { headline: "{n} nasceu para ir na frente", text: "{n} gosta de ser a primeira pessoa a tentar. Tem pressa, coragem e muita energia para começar brincadeiras, jogos e aventuras.", gifts: ["coragem", "iniciativa", "energia"], shadows: ["impaciência para esperar a vez", "frustração quando perde"], power: "a coragem de tentar primeiro" },
  taurus: { headline: "{n} gosta de tudo no seu tempo", text: "{n} gosta de rotina, de conforto e das coisas de sempre: o brinquedo preferido, a comida preferida, o colo de sempre. Faz tudo com calma e capricho.", gifts: ["calma", "constância", "carinho"], shadows: ["teimosia", "dificuldade com mudanças de última hora"], power: "a calma de quem faz com capricho" },
  gemini: { headline: "{n} quer saber de tudo", text: "{n} pergunta, conversa e se interessa por mil assuntos ao mesmo tempo. É uma criança curiosa, que aprende rápido e adora uma novidade.", gifts: ["curiosidade", "conversa", "esperteza"], shadows: ["dificuldade de focar numa coisa só", "agitação"], power: "a curiosidade que não acaba" },
  cancer: { headline: "{n} tem um coração enorme", text: "{n} tem uma ligação muito forte com a família e com os lugares que conhece. Percebe quando alguém está triste e gosta de cuidar dos outros, até dos brinquedos.", gifts: ["carinho", "sensibilidade", "cuidado com os outros"], shadows: ["se magoar fácil", "medo do que é novo"], power: "o carinho de quem cuida de todo mundo" },
  leo: { headline: "{n} nasceu para brilhar", text: "{n} gosta de aparecer, de criar e de receber atenção. Adora aplauso, faz apresentações e deixa qualquer lugar mais animado.", gifts: ["alegria", "criatividade", "generosidade"], shadows: ["sofrer quando ninguém repara", "dificuldade de perder"], power: "o brilho que anima a casa inteira" },
  virgo: { headline: "{n} repara em cada detalhe", text: "{n} gosta das coisas no lugar e feitas do jeito certo. Presta atenção em tudo, gosta de ajudar e de aprender como as coisas funcionam.", gifts: ["atenção", "organização", "vontade de ajudar"], shadows: ["se cobrar demais", "ficar com ansiedade quando erra"], power: "o olhar que encontra todos os detalhes" },
  libra: { headline: "{n} gosta de todo mundo em paz", text: "{n} não gosta de briga e é ótima companhia para brincar. Tem bom gosto, é gentil e quer que tudo seja justo para todos.", gifts: ["gentileza", "senso de justiça", "simpatia"], shadows: ["demorar para escolher", "ceder demais para agradar"], power: "o dom de deixar todo mundo à vontade" },
  scorpio: { headline: "{n} sente tudo bem fundo", text: "{n} é uma criança observadora, intensa e leal. Não se abre com qualquer pessoa, mas quando confia, é para sempre. Percebe muito mais do que fala.", gifts: ["intensidade", "lealdade", "percepção"], shadows: ["guardar a raiva", "ciúme dos irmãos ou amigos"], power: "a força de quem sente de verdade" },
  sagittarius: { headline: "{n} quer explorar o mundo", text: "{n} é uma criança aventureira, alegre e cheia de perguntas sobre o mundo. Gosta de correr, de sair, de conhecer lugares e de ouvir histórias.", gifts: ["otimismo", "alegria", "vontade de aprender"], shadows: ["impaciência com regras", "falar sem pensar"], power: "a alegria de quem quer conhecer tudo" },
  capricorn: { headline: "{n} tem um jeito de gente grande", text: "{n} é uma criança responsável e séria para a idade. Gosta de fazer as coisas direito, de ter metas e de que os adultos levem a sério o que diz.", gifts: ["responsabilidade", "persistência", "maturidade"], shadows: ["se cobrar demais", "esconder quando está triste"], power: "a persistência de quem não desiste" },
  aquarius: { headline: "{n} pensa diferente", text: "{n} tem ideias próprias e não gosta de fazer as coisas só porque todo mundo faz. Tem muita criatividade, inventa jogos e valoriza muito os amigos.", gifts: ["originalidade", "criatividade", "amizade"], shadows: ["teimar nas próprias ideias", "parecer distante"], power: "a criatividade que inventa o novo" },
  pisces: { headline: "{n} vive num mundo cheio de imaginação", text: "{n} é uma criança sensível e sonhadora, que adora histórias, desenhos e música. Sente o clima da casa e tem um jeito doce com todo mundo.", gifts: ["imaginação", "empatia", "doçura"], shadows: ["se distrair no mundo da lua", "absorver a tristeza dos outros"], power: "a imaginação que cria mundos" },
};

// ---------------------------------------------------------------------------
// LUA: como a criança sente e o que acalma
// ---------------------------------------------------------------------------
const MOON: Record<SignKey, KidPoint & { comfort: string; example: string }> = {
  aries: { headline: "As emoções de {n} chegam rápido", text: "{n} sente tudo na hora: passa da raiva para a alegria num piscar de olhos, e também esquece rápido. Gasta a emoção se mexendo.", gifts: ["sinceridade", "se recuperar rápido"], shadows: ["explodir por pouco", "pressa para resolver"], power: "a sinceridade de um coração sem disfarce", comfort: "Para acalmar {n}, ajuda deixar gastar energia antes de conversar: correr, pular, dançar.", example: "Na vida real: depois de uma birra, {n} pode estar rindo dez minutos depois." },
  taurus: { headline: "{n} se acalma com rotina e colo", text: "{n} fica bem quando sabe o que vai acontecer. Mudanças de última hora mexem muito com a paz dessa criança.", gifts: ["calma", "carinho constante"], shadows: ["resistir a mudanças", "se apegar a objetos"], power: "a calma de quem sabe esperar", comfort: "Para acalmar {n}, ajuda o colo, um lanche gostoso e avisar antes das mudanças.", example: "Na vida real: trocar o horário do banho ou do jantar pode virar uma grande confusão." },
  gemini: { headline: "{n} entende o que sente conversando", text: "{n} precisa falar sobre o que aconteceu para se acalmar. O tédio é o que mais deixa essa criança irritada.", gifts: ["falar dos sentimentos", "bom humor"], shadows: ["mudar de humor rápido", "agitação antes de dormir"], power: "a leveza de quem conta tudo", comfort: "Para acalmar {n}, ajuda perguntar \"me conta o que aconteceu?\" e ouvir até o fim.", example: "Na vida real: {n} costuma contar o dia inteiro na hora de dormir." },
  cancer: { headline: "{n} sente tudo com o coração", text: "{n} é muito sensível ao clima da casa e às pessoas que ama. Precisa de colo, de rotina e de se sentir em segurança.", gifts: ["carinho", "memória afetiva"], shadows: ["se magoar fácil", "se fechar quando algo chateia"], power: "o carinho de quem acolhe", comfort: "Para acalmar {n}, ajuda o abraço, o cantinho preferido e dizer \"eu estou aqui\".", example: "Na vida real: dormir fora de casa pode ser mais difícil para {n} do que para outras crianças." },
  leo: { headline: "{n} precisa se sentir especial", text: "{n} fica feliz quando recebe atenção e elogio. Quando ninguém repara no que fez, sente mais do que mostra.", gifts: ["generosidade", "calor humano"], shadows: ["sofrer com a indiferença", "fazer drama para chamar atenção"], power: "o calor de um coração generoso", comfort: "Para acalmar {n}, ajuda um elogio sincero e um tempo só de vocês dois.", example: "Na vida real: um \"que lindo o seu desenho!\" muda o dia inteiro de {n}." },
  virgo: { headline: "{n} se acalma quando tudo está em ordem", text: "{n} fica bem quando sabe como as coisas funcionam. Bagunça, confusão e regras que mudam toda hora deixam essa criança ansiosa.", gifts: ["cuidado", "ajudar sem pedir nada"], shadows: ["se preocupar demais", "se criticar muito"], power: "o cuidado que aparece nos detalhes", comfort: "Para acalmar {n}, ajuda explicar o que vai acontecer, passo a passo.", example: "Na vida real: {n} gosta de saber a programação do dia antes de sair de casa." },
  libra: { headline: "{n} precisa de paz para ficar bem", text: "{n} sofre com briga e gritaria, mesmo quando não tem nada a ver com a briga. Fica bem em lugares calmos, bonitos e com gente gentil.", gifts: ["gentileza", "saber escutar"], shadows: ["engolir o que sente para não brigar", "indecisão"], power: "a gentileza que acalma qualquer clima", comfort: "Para acalmar {n}, ajuda falar baixo, com calma, e mostrar que está tudo bem entre os adultos.", example: "Na vida real: uma discussão dos adultos na mesa pode deixar {n} quieto o resto do dia." },
  scorpio: { headline: "{n} sente tudo em dobro", text: "{n} tem emoções muito fortes e nem sempre mostra. Precisa confiar muito para contar o que está sentindo.", gifts: ["profundidade", "lealdade"], shadows: ["guardar mágoa", "ciúme"], power: "a profundidade de quem sente de verdade", comfort: "Para acalmar {n}, ajuda dar tempo, sem pressionar, e cumprir sempre o que prometeu.", example: "Na vida real: {n} lembra de uma promessa quebrada por muito tempo." },
  sagittarius: { headline: "{n} se cura com liberdade e risada", text: "{n} fica bem com espaço, ar livre e brincadeira. Lugar fechado e muita regra deixam essa criança impaciente.", gifts: ["otimismo", "bom humor"], shadows: ["fugir de conversa séria", "agitação"], power: "a alegria que contagia", comfort: "Para acalmar {n}, ajuda um passeio ao ar livre ou uma brincadeira engraçada.", example: "Na vida real: um dia inteiro dentro de casa costuma terminar em agitação." },
  capricorn: { headline: "{n} guarda o que sente", text: "{n} não costuma mostrar tristeza logo de cara. Tenta resolver tudo por conta própria e fica bem quando sente que as coisas estão sob controle.", gifts: ["maturidade", "calma nas crises"], shadows: ["esconder o que sente", "dificuldade de pedir ajuda"], power: "a firmeza de quem não desaba", comfort: "Para acalmar {n}, ajuda dizer que pode chorar e pedir ajuda, sem achar que é fraqueza.", example: "Na vida real: {n} pode dizer que está tudo bem quando não está." },
  aquarius: { headline: "{n} precisa de espaço para sentir", text: "{n} lida com as emoções pensando nelas, do próprio jeito. Não gosta de pressão nem de muita gente em cima.", gifts: ["respeitar o espaço dos outros", "amizade"], shadows: ["parecer distante quando está triste", "fugir de abraço na hora errada"], power: "a liberdade de sentir do próprio jeito", comfort: "Para acalmar {n}, ajuda dar um tempo e depois conversar sem cobrança.", example: "Na vida real: {n} pode preferir ficar no quarto um pouco antes de contar o que houve." },
  pisces: { headline: "{n} sente o que ninguém fala", text: "{n} percebe o clima da casa assim que entra. Se emociona com filmes, músicas e histórias, e sente a dor dos outros como se fosse a própria.", gifts: ["empatia", "intuição"], shadows: ["absorver a tristeza dos adultos", "medo do escuro e de pesadelos"], power: "a intuição de quem sente antes de saber", comfort: "Para acalmar {n}, ajuda uma história, uma música calma e uma luz acesa.", example: "Na vida real: {n} chora junto quando vê alguém chorando." },
};

// ---------------------------------------------------------------------------
// ASCENDENTE: como a criança chega nos lugares
// ---------------------------------------------------------------------------
const ASC: Record<SignKey, Omit<KidPoint, "power">> = {
  aries: { headline: "{n} chega chegando", text: "Nos lugares novos, {n} logo quer participar, correr e testar tudo. Os outros veem uma criança cheia de energia.", gifts: ["iniciativa", "presença"], shadows: ["atropelar a vez dos outros", "se machucar por pressa"] },
  taurus: { headline: "{n} chega com calma", text: "Nos lugares novos, {n} observa primeiro e entra no seu tempo. Os outros veem uma criança tranquila e carinhosa.", gifts: ["passar calma", "doçura"], shadows: ["demorar para se soltar", "resistir a mudar de atividade"] },
  gemini: { headline: "{n} puxa conversa com todo mundo", text: "Nos lugares novos, {n} logo faz perguntas e faz amigos. Os outros veem uma criança esperta e falante.", gifts: ["fazer amigos", "comunicação"], shadows: ["falar mais do que escutar", "se distrair"] },
  cancer: { headline: "{n} chega devagarinho", text: "Nos lugares novos, {n} fica perto de quem conhece até se sentir em segurança. Os outros veem uma criança doce e tímida no começo.", gifts: ["doçura", "cuidado"], shadows: ["timidez no começo", "levar críticas para o coração"] },
  leo: { headline: "{n} chama atenção sem esforço", text: "Nos lugares novos, {n} logo aparece: conta histórias, faz graça, lidera a brincadeira. Os outros veem uma criança radiante.", gifts: ["carisma", "liderança"], shadows: ["querer ser sempre o centro", "ficar triste quando outra criança é escolhida"] },
  virgo: { headline: "{n} chega observando tudo", text: "Nos lugares novos, {n} repara em cada detalhe antes de se soltar. Os outros veem uma criança educada e atenta.", gifts: ["atenção", "educação"], shadows: ["se incomodar com bagunça", "medo de errar na frente dos outros"] },
  libra: { headline: "{n} é a simpatia em pessoa", text: "Nos lugares novos, {n} sorri, cumprimenta e conquista todo mundo. Os outros veem uma criança gentil.", gifts: ["simpatia", "gentileza"], shadows: ["dificuldade de dizer não", "querer agradar todo mundo"] },
  scorpio: { headline: "{n} tem um olhar que observa tudo", text: "Nos lugares novos, {n} fala pouco e analisa as pessoas antes de confiar. Os outros veem uma criança misteriosa e atenta.", gifts: ["percepção", "discrição"], shadows: ["demorar para confiar", "parecer de cara fechada sem estar"] },
  sagittarius: { headline: "{n} chega animando a turma", text: "Nos lugares novos, {n} logo quer brincar, correr e explorar. Os outros veem uma criança alegre e aventureira.", gifts: ["alegria", "coragem para explorar"], shadows: ["falar sem filtro", "não parar quieto"] },
  capricorn: { headline: "{n} parece uma pessoa mais velha", text: "Nos lugares novos, {n} se comporta com seriedade e respeito. Os outros veem uma criança madura e responsável.", gifts: ["responsabilidade", "respeito"], shadows: ["parecer que não quer brincar", "demorar para relaxar e brincar"] },
  aquarius: { headline: "{n} tem um jeito muito próprio", text: "Nos lugares novos, {n} faz as coisas do jeito próprio, sem copiar ninguém. Os outros veem uma criança original.", gifts: ["originalidade", "mente aberta"], shadows: ["parecer distante", "não seguir o grupo"] },
  pisces: { headline: "{n} tem um jeito doce e sonhador", text: "Nos lugares novos, {n} encanta com o jeito delicado. Os outros veem uma criança sensível e fácil de gostar.", gifts: ["doçura", "empatia"], shadows: ["se distrair", "se assustar com barulho e confusão"] },
};

// ---------------------------------------------------------------------------
// Capítulos do completo
// ---------------------------------------------------------------------------
const MERCURY: Record<SignKey, { text: string; example: string; tip: string }> = {
  aries: { text: "{n} aprende fazendo e na hora. Gosta de desafios rápidos e perde o interesse em explicações longas.", example: "Na vida real: {n} começa o dever antes de ler o enunciado inteiro.", tip: "Transforme o estudo em desafio: \"será que você consegue fazer isso em cinco minutos?\"." },
  taurus: { text: "{n} aprende devagar e de um jeito que não esquece mais. Prefere ver, tocar e repetir.", example: "Na vida real: {n} aprende melhor montando, cozinhando ou desenhando do que só ouvindo.", tip: "Dê tempo e use as mãos: massinha, blocos e materiais que dá para pegar." },
  gemini: { text: "{n} aprende rápido e conversando. Gosta de perguntar o porquê de tudo e de pular de assunto.", example: "Na vida real: {n} faz dez perguntas antes de você terminar de responder a primeira.", tip: "Estude em blocos curtos e varie as atividades para não dar tédio." },
  cancer: { text: "{n} aprende melhor quando sente acolhimento. Lembra das coisas pelo que sentiu.", example: "Na vida real: {n} aprende muito mais com uma professora carinhosa.", tip: "Estude junto, com calma e elogiando o esforço, não só a nota." },
  leo: { text: "{n} aprende quando pode brilhar: apresentar, mostrar e receber elogio pelo que fez.", example: "Na vida real: {n} adora explicar para a família o que aprendeu na escola.", tip: "Peça para {n} \"dar aula\" do que aprendeu: é o jeito que a matéria fixa." },
  virgo: { text: "{n} aprende com ordem e passo a passo. Gosta de entender cada detalhe e de fazer direitinho.", example: "Na vida real: {n} apaga e refaz a letra até ficar perfeita.", tip: "Ajude a lembrar que errar faz parte de aprender: \"feito é melhor que perfeito\"." },
  libra: { text: "{n} aprende melhor em dupla ou em grupo, num ambiente bonito e tranquilo.", example: "Na vida real: {n} rende mais estudando com alguém do lado do que sem companhia.", tip: "Ajude {n} a escolher: dê duas opções em vez de muitas." },
  scorpio: { text: "{n} aprende fundo quando o assunto interessa. Gosta de mistérios e de descobrir o que está escondido.", example: "Na vida real: {n} pode saber tudo sobre dinossauros, espaço ou um assunto preferido.", tip: "Comece pelo que desperta a curiosidade de {n} e ligue a matéria a isso." },
  sagittarius: { text: "{n} aprende explorando: passeios, histórias, viagens e perguntas grandes sobre o mundo.", example: "Na vida real: {n} aprende mais num museu ou num passeio do que numa folha de exercício.", tip: "Leve o aprendizado para fora: um passeio vira aula de ciências." },
  capricorn: { text: "{n} aprende com disciplina e gosta de metas claras. Sente orgulho de cumprir tarefas.", example: "Na vida real: {n} gosta de riscar da lista o que já fez.", tip: "Use quadros de metas e comemore cada etapa, sem pressão demais." },
  aquarius: { text: "{n} aprende do seu jeito, muitas vezes diferente do esperado. Gosta de tecnologia e de ideias novas.", example: "Na vida real: {n} encontra um caminho diferente para resolver a conta e chega no resultado certo.", tip: "Deixe {n} explicar o caminho que usou: a criatividade também é inteligência." },
  pisces: { text: "{n} aprende com imagens, histórias, música e imaginação.", example: "Na vida real: {n} lembra da matéria se ela virar uma história ou uma música.", tip: "Use desenhos, histórias e músicas para ensinar: a imaginação é o caminho de {n}." },
};

const VENUS: Record<SignKey, { text: string; example: string; tip: string }> = {
  aries: { text: "Nas amizades, {n} é quem chama para brincar e toma a frente. Gosta de amigos animados.", example: "Na vida real: {n} chega no parquinho e já organiza a brincadeira.", tip: "Ensine {n} a perguntar \"do que você quer brincar?\" para os amigos." },
  taurus: { text: "Nas amizades, {n} é leal e prefere poucos amigos de verdade, de muito tempo.", example: "Na vida real: {n} tem um melhor amigo desde pequeno.", tip: "Ajude {n} a se abrir para amigos novos aos poucos, sem forçar." },
  gemini: { text: "Nas amizades, {n} faz amigos fácil e gosta de conversar com todo mundo.", example: "Na vida real: {n} volta de qualquer lugar com um amigo novo.", tip: "Ajude {n} a cuidar das amizades antigas também, não só das novas." },
  cancer: { text: "Nas amizades, {n} cuida dos amigos como se fossem da família.", example: "Na vida real: {n} divide o lanche e consola quem está triste.", tip: "Ensine {n} que também pode pedir carinho, não só dar." },
  leo: { text: "Nas amizades, {n} tem generosidade e gosta da admiração da turma.", example: "Na vida real: {n} adora organizar a festa ou a apresentação da turma.", tip: "Ensine {n} a dividir o palco e a aplaudir os amigos também." },
  virgo: { text: "Nas amizades, {n} demonstra carinho ajudando: empresta material, explica a lição.", example: "Na vida real: {n} é quem ajuda o colega com o dever.", tip: "Mostre para {n} que ninguém precisa ser perfeito para ser um bom amigo." },
  libra: { text: "Nas amizades, {n} tem gentileza, senso de justiça e odeia ver briga entre os amigos.", example: "Na vida real: {n} é quem tenta fazer as pazes quando os amigos discutem.", tip: "Ensine {n} a dizer o que quer, mesmo que o amigo discorde." },
  scorpio: { text: "Nas amizades, {n} tem intensidade e muita lealdade, mas sofre se sente que houve traição.", example: "Na vida real: {n} pode sofrer muito se um amigo contar um segredo.", tip: "Converse com {n} sobre perdoar e sobre ter mais de um amigo." },
  sagittarius: { text: "Nas amizades, {n} é pura diversão e aventura, e faz amizade com todo mundo.", example: "Na vida real: {n} topa qualquer brincadeira nova.", tip: "Ensine {n} a cuidar das palavras: a sinceridade de {n} às vezes machuca sem querer." },
  capricorn: { text: "Nas amizades, {n} tem lealdade e responsabilidade, mas às vezes demora para se soltar.", example: "Na vida real: {n} prefere amigos mais calmos ou mais velhos.", tip: "Incentive brincadeiras soltas, só pela diversão, sem regra nem meta." },
  aquarius: { text: "Nas amizades, {n} gosta de turmas e de amigos diferentes, com quem pode ser do seu jeito.", example: "Na vida real: {n} tem amigos de grupos bem diferentes.", tip: "Valorize o jeito original de {n}: {n} não precisa ser igual aos outros para ter amigos." },
  pisces: { text: "Nas amizades, {n} tem doçura e acolhe todo mundo, mas pode se deixar levar pelos outros.", example: "Na vida real: {n} chora junto quando o amigo se machuca.", tip: "Ensine {n} a dizer não com carinho, quando algo não está legal." },
};

const MARS: Record<SignKey, { text: string; example: string; tip: string }> = {
  aries: { text: "{n} tem muita energia e precisa gastá-la todo dia. Quando ouve um não, reage na hora.", example: "Na vida real: um dia sem correr pode virar uma noite sem dormir.", tip: "Esportes com movimento e competição saudável fazem muito bem para {n}." },
  taurus: { text: "{n} tem uma energia constante e firme. Quando ouve um não, empaca e não muda de ideia fácil.", example: "Na vida real: quanto mais você insiste, mais {n} finca o pé.", tip: "Dê opções em vez de ordens: \"você quer tomar banho antes ou depois do desenho?\"." },
  gemini: { text: "{n} tem energia agitada, que vai de uma coisa para outra. Quando ouve um não, argumenta muito.", example: "Na vida real: {n} sempre tem um \"mas por quê?\" para cada regra.", tip: "Explique o motivo das regras: {n} aceita melhor quando entende." },
  cancer: { text: "{n} usa a energia para proteger quem ama. Quando ouve um não, pode se fechar ou chorar.", example: "Na vida real: {n} defende o irmão menor, mesmo depois de brigar com ele.", tip: "Acolha primeiro, converse depois: o choro de {n} passa mais rápido com colo." },
  leo: { text: "{n} tem energia de palco: quer fazer, aparecer e liderar. Quando ouve um não, o orgulho fala alto.", example: "Na vida real: perder no jogo pode virar um drama.", tip: "Elogie o esforço, não só a vitória: assim {n} aprende a perder sem sofrer tanto." },
  virgo: { text: "{n} usa a energia para fazer as coisas direitinho. Quando ouve um não, se irrita e reclama.", example: "Na vida real: {n} pode se irritar se mudarem as regras do jogo no meio.", tip: "Avise as mudanças com antecedência e combine as regras antes." },
  libra: { text: "{n} prefere resolver as coisas na conversa. Quando ouve um não, pode guardar a chateação para si.", example: "Na vida real: {n} diz \"tá bom\" mas guarda a chateação por dentro.", tip: "Pergunte com calma \"o que você queria de verdade?\"." },
  scorpio: { text: "{n} tem uma energia intensa e muita força de vontade. Quando ouve um não, pode sentir muita raiva.", example: "Na vida real: {n} não esquece fácil quando sente uma injustiça.", tip: "Ensine maneiras de colocar a raiva para fora: desenhar, falar, socar uma almofada." },
  sagittarius: { text: "{n} tem uma energia aventureira e precisa de espaço. Quando ouve um não, fica impaciente.", example: "Na vida real: {n} sobe em tudo e quer ir sempre mais longe.", tip: "Ofereça aventuras seguras: trilhas, parques, esportes ao ar livre." },
  capricorn: { text: "{n} usa a energia com foco e paciência. Quando ouve um não, fecha a cara e fica em silêncio.", example: "Na vida real: {n} treina muito até conseguir fazer algo difícil.", tip: "Mostre que brincar também é importante, não só fazer tarefas." },
  aquarius: { text: "{n} usa a energia para inventar e fazer do jeito próprio. Quando ouve um não, se afasta.", example: "Na vida real: {n} cria regras novas para o jogo.", tip: "Dê espaço para {n} criar, e combine juntos as regras da casa." },
  pisces: { text: "{n} tem uma energia mais suave, que vai e volta. Quando ouve um não, pode fugir para o mundo da imaginação.", example: "Na vida real: {n} parece estar \"no mundo da lua\" quando algo chateia.", tip: "Atividades como dança, natação e arte ajudam {n} a gastar energia com leveza." },
};

const JUPITER: Record<SignKey, { text: string; tip: string }> = {
  aries: { text: "{n} tem talento para liderar e para os esportes.", tip: "Ofereça oportunidades de ser capitão do time ou líder de uma atividade." },
  taurus: { text: "{n} tem talento para artes manuais, música, culinária e natureza.", tip: "Uma horta, um instrumento ou uma aula de culinária podem revelar dons." },
  gemini: { text: "{n} tem talento para comunicação, idiomas e escrita.", tip: "Livros, gibis e um segundo idioma rendem muito para {n}." },
  cancer: { text: "{n} tem talento para cuidar: de pessoas, de animais e de plantas.", tip: "Um bichinho de estimação ou uma planta para cuidar fazem {n} florescer." },
  leo: { text: "{n} tem talento para o palco: teatro, dança, música e apresentações.", tip: "Teatro e aulas de expressão são ótimas apostas para {n}." },
  virgo: { text: "{n} tem talento para organização, ciências e trabalhos detalhados.", tip: "Quebra-cabeças, kits de ciência e montar coisas são ótimos para {n}." },
  libra: { text: "{n} tem talento para artes, desenho, moda e para fazer amigos.", tip: "Aulas de desenho ou música e atividades em grupo combinam com {n}." },
  scorpio: { text: "{n} tem talento para investigar, pesquisar e entender as pessoas.", tip: "Jogos de mistério, enigmas e livros de detetive encantam {n}." },
  sagittarius: { text: "{n} tem talento para aprender sobre o mundo: geografia, idiomas, esportes.", tip: "Viagens, mapas e esportes ao ar livre abrem horizontes para {n}." },
  capricorn: { text: "{n} tem talento para construir e para ter disciplina.", tip: "Blocos de montar, xadrez e projetos de longo prazo combinam com {n}." },
  aquarius: { text: "{n} tem talento para tecnologia, invenções e ideias novas.", tip: "Robótica, programação e experiências científicas são o mundo de {n}." },
  pisces: { text: "{n} tem talento para arte, música e imaginação.", tip: "Pintura, música e contação de histórias fazem {n} brilhar." },
};

const SATURN: Record<SignKey, { text: string; tip: string }> = {
  aries: { text: "{n} pode precisar de ajuda para ter paciência e esperar a vez.", tip: "Jogos de tabuleiro, com turnos, são um ótimo treino." },
  taurus: { text: "{n} pode precisar de ajuda para aceitar mudanças.", tip: "Avise antes, explique o porquê e mantenha algo conhecido por perto." },
  gemini: { text: "{n} pode precisar de ajuda para terminar o que começa.", tip: "Divida as tarefas em partes bem pequenas e comemore cada uma." },
  cancer: { text: "{n} pode precisar de ajuda para se sentir em segurança longe de casa.", tip: "Um objeto de conforto e despedidas tranquilas ajudam muito." },
  leo: { text: "{n} pode precisar de ajuda para lidar com críticas e com perder.", tip: "Mostre que errar e perder também fazem parte, sem diminuir o valor de {n}." },
  virgo: { text: "{n} pode precisar de ajuda para não se cobrar tanto.", tip: "Elogie o esforço e mostre os seus próprios erros com bom humor." },
  libra: { text: "{n} pode precisar de ajuda para tomar decisões e dizer não.", tip: "Dê escolhas pequenas no dia a dia e respeite a decisão de {n}." },
  scorpio: { text: "{n} pode precisar de ajuda para confiar e para perdoar.", tip: "Cumpra as promessas e converse sobre sentimentos difíceis sem julgar." },
  sagittarius: { text: "{n} pode precisar de ajuda para seguir regras e ter limites.", tip: "Explique as regras com sentido e dê liberdade dentro de limites claros." },
  capricorn: { text: "{n} pode precisar de ajuda para relaxar e brincar sem se cobrar.", tip: "Tenha momentos de brincadeira sem objetivo, só pela diversão." },
  aquarius: { text: "{n} pode precisar de ajuda para se sentir parte do grupo.", tip: "Ajude {n} a encontrar amigos com os mesmos interesses." },
  pisces: { text: "{n} pode precisar de ajuda para ter rotina e foco.", tip: "Rotinas visuais, com desenhos, ajudam {n} a se organizar." },
};

const LIFE: Record<number, { text: string; tip: string }> = {
  1: { text: "{n} veio para liderar e ter ideias próprias.", tip: "Deixe {n} tomar pequenas decisões por conta própria desde cedo." },
  2: { text: "{n} veio para unir as pessoas e cuidar das parcerias.", tip: "Valorize a sensibilidade de {n}, sem pedir para endurecer." },
  3: { text: "{n} veio para se expressar e espalhar alegria.", tip: "Dê espaço para {n} cantar, desenhar e contar histórias." },
  4: { text: "{n} veio para construir coisas com cuidado e capricho.", tip: "Rotina e organização dão segurança para {n}." },
  5: { text: "{n} veio para experimentar e descobrir o mundo.", tip: "Ofereça experiências novas com segurança: passeios, esportes, brincadeiras diferentes." },
  6: { text: "{n} veio para cuidar e trazer harmonia para a família.", tip: "Mostre para {n} que não precisa resolver os problemas dos adultos." },
  7: { text: "{n} veio para pensar fundo e entender a vida.", tip: "Respeite os momentos de silêncio de {n} e responda às perguntas com paciência." },
  8: { text: "{n} veio para realizar e conquistar.", tip: "Ensine desde cedo o valor do esforço e do dinheiro, de um jeito leve." },
  9: { text: "{n} veio para ajudar o mundo com um coração enorme.", tip: "Incentive pequenas ações de ajuda, como doar brinquedos." },
  11: { text: "{n} tem um número especial, o 11: veio para inspirar, com muita intuição.", tip: "Acolha a sensibilidade de {n} e cuide do descanso." },
  22: { text: "{n} tem um número especial, o 22: veio para construir coisas grandes.", tip: "Apoie os projetos de {n}, mesmo os que parecem grandes demais." },
  33: { text: "{n} tem um número especial, o 33: veio para cuidar e ensinar com amor.", tip: "Mostre para {n} que cuidar de si também é importante." },
};

const NOUN: Record<SignKey, string> = {
  aries: "Faísca", taurus: "Raiz", gemini: "Ponte", cancer: "Lareira", leo: "Estrela", virgo: "Lente",
  libra: "Balança", scorpio: "Fênix", sagittarius: "Flecha", capricorn: "Montanha", aquarius: "Ventania", pisces: "Maré",
};
const ADJ: Record<SignKey, string> = {
  aries: "Destemida", taurus: "Serena", gemini: "Curiosa", cancer: "Acolhedora", leo: "Radiante", virgo: "Cuidadosa",
  libra: "Gentil", scorpio: "Intensa", sagittarius: "Livre", capricorn: "Firme", aquarius: "Original", pisces: "Sonhadora",
};

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------
export function buildKidFreeReading(input: {
  firstName: string;
  sun: PlacementLike;
  moon: PlacementLike;
  ascendant: PlacementLike | null;
  mercury: PlacementLike;
  venus: PlacementLike;
  mars: PlacementLike;
  jupiter: PlacementLike;
}): FreeReading {
  const n = input.firstName;
  const f = (text: string) => fill(text, n);
  const sun = SUN[input.sun.signKey];
  const moon = MOON[input.moon.signKey];
  const asc = input.ascendant ? ASC[input.ascendant.signKey] : null;

  const layers: FreeReading["layers"] = [
    { id: "sun", symbol: "☉", role: "Sol", question: `Quem ${n} é por dentro`, sign: input.sun.sign, headline: f(sun.headline), text: f(sun.text), gifts: sun.gifts, shadows: sun.shadows },
    { id: "moon", symbol: "☾", role: "Lua", question: `Como ${n} sente`, sign: input.moon.sign, headline: f(moon.headline), text: f(moon.text), gifts: moon.gifts, shadows: moon.shadows },
  ];
  if (input.ascendant && asc) {
    layers.push({ id: "ascendant", symbol: "↑", role: "Ascendente", question: `Como ${n} chega nos lugares`, sign: input.ascendant.sign, headline: f(asc.headline), text: f(asc.text), gifts: asc.gifts, shadows: asc.shadows });
  }

  const sameSign =
    input.sun.signKey === input.moon.signKey
      ? `O Sol e a Lua de ${n} estão em ${input.sun.sign}: o jeito de ser e o jeito de sentir andam juntos.`
      : null;

  return {
    audience: "child",
    archetype: {
      name: `A ${NOUN[input.sun.signKey]} ${ADJ[input.moon.signKey]}`,
      text: `${NOUN[input.sun.signKey]}, pelo Sol em ${input.sun.sign}. ${ADJ[input.moon.signKey]}, pela Lua em ${input.moon.sign}. É um retrato do jeito de ${n} hoje, que vai crescer e mudar junto com ${n}.`,
      combinations: input.ascendant
        ? `Existem 1.728 combinações de Sol, Lua e Ascendente. A de ${n} é uma delas.`
        : `Existem 144 combinações de Sol e Lua. A de ${n} é uma delas.`,
    },
    layers,
    mirror: {
      title: input.ascendant ? `${n} em três partes` : `${n} em duas partes`,
      text: input.ascendant
        ? `Quem vê ${n} pela primeira vez: ${f(asc!.headline)}. Quem convive: ${f(sun.headline)}. Quem está bem perto: ${f(moon.headline)}.`
        : `Quem convive: ${f(sun.headline)}. Quem está bem perto: ${f(moon.headline)}.`,
      harmony: `Isso é um ponto de partida para conhecer ${n} melhor, nunca um rótulo: toda criança muda, aprende e surpreende.`,
      sameSign,
    },
    superpower: `O superpoder de ${n} é juntar ${sun.power} com ${moon.power}.`,
    attention: `Fique de olho: às vezes ${n} pode ${sun.shadows[0]} ou ${moon.shadows[1]}. É normal: com apoio, isso vira aprendizado.`,
    teasers: [
      { id: "amor", symbol: "☿", label: "Aprender", title: `Como ${n} aprende`, opening: f(MERCURY[input.mercury.signKey].text), cliff: `E existe um jeito simples de deixar o estudo de ${n} muito mais leve:`, locked: ["O jeito natural de aprender", "Um exemplo do dia a dia", "Uma dica prática para casa e escola"] },
      { id: "carreira", symbol: "♀", label: "Amizades", title: `Como ${n} faz amigos`, opening: f(VENUS[input.venus.signKey].text), cliff: "Mas o mapa também mostra o que pode ficar difícil nas amizades. Às vezes, essa criança pode", locked: ["Como demonstra carinho", "O que pode pesar nas amizades", "Como ajudar"] },
      { id: "dinheiro", symbol: "♂", label: "Energia", title: `A energia de ${n}`, opening: f(MARS[input.mars.signKey].text), cliff: "E tem um jeito de lidar com as birras e os nãos que funciona muito melhor com essa criança:", locked: ["Como gasta a energia", "Como reage quando ouve um não", "O que ajuda na hora difícil"] },
      { id: "momento", symbol: "♃", label: "Talentos", title: `Os talentos de ${n}`, opening: f(JUPITER[input.jupiter.signKey].text), cliff: "E o mapa também mostra onde essa criança vai precisar de mais apoio para crescer:", locked: ["Talentos para incentivar", "Onde precisa de apoio", "Atividades que combinam"] },
    ],
    noTimeNote: input.ascendant
      ? null
      : `Sem o horário de nascimento, não dá para calcular o Ascendente de ${n}. Se encontrar o horário (está na certidão), refaça o mapa para ver a terceira parte.`,
  };
}

export function buildKidPremiumReading(input: {
  firstName: string;
  moon: PlacementLike;
  mercury: PlacementLike;
  venus: PlacementLike;
  mars: PlacementLike;
  jupiter: PlacementLike;
  saturn: PlacementLike;
  lifePath: number;
}): PremiumReading {
  const n = input.firstName;
  const f = (text: string) => fill(text, n);
  const merc = MERCURY[input.mercury.signKey];
  const venus = VENUS[input.venus.signKey];
  const mars = MARS[input.mars.signKey];
  const moon = MOON[input.moon.signKey];
  const jup = JUPITER[input.jupiter.signKey];
  const sat = SATURN[input.saturn.signKey];
  const life = LIFE[input.lifePath] ?? LIFE[1];

  const chapters: PremiumChapter[] = [
    {
      id: "aprender", symbol: "☿", label: "Aprender", title: `Como ${n} aprende`,
      source: `Mercúrio em ${input.mercury.sign}. Mercúrio cuida do jeito de pensar e de aprender.`,
      intro: f(merc.text),
      payoff: { lead: `E existe um jeito simples de deixar o estudo de ${n} muito mais leve:`, rest: f(merc.tip) },
      blocks: [{ title: "Como isso aparece no dia a dia", text: `Esse é o jeito natural de ${n} aprender. Quando a escola e a casa respeitam esse jeito, aprender fica mais gostoso.`, example: f(merc.example) }],
    },
    {
      id: "amizades", symbol: "♀", label: "Amizades", title: `Como ${n} faz amigos`,
      source: `Vênus em ${input.venus.sign}. Vênus cuida do carinho e das amizades.`,
      intro: f(venus.text),
      payoff: { lead: "Mas o mapa também mostra o que pode ficar difícil nas amizades. Às vezes, essa criança pode", rest: `${f(moon.shadows[0])}.` },
      blocks: [{ title: "Como ajudar", text: f(venus.tip), example: f(venus.example) }],
    },
    {
      id: "energia", symbol: "♂", label: "Energia", title: `A energia de ${n}`,
      source: `Marte em ${input.mars.sign}. Marte cuida da energia e de como a criança reage quando contrariada.`,
      intro: f(mars.text),
      payoff: { lead: "E tem um jeito de lidar com as birras e os nãos que funciona muito melhor com essa criança:", rest: f(mars.tip) },
      blocks: [{ title: "Como isso aparece no dia a dia", text: `Toda criança testa limites, e ${n} faz isso do próprio jeito. Entender esse jeito evita muita briga.`, example: f(mars.example) }],
    },
    {
      id: "emocoes", symbol: "☾", label: "Emoções", title: `Como acalmar ${n}`,
      source: `Lua em ${input.moon.sign}. A Lua cuida das emoções e do que traz segurança.`,
      intro: f(moon.comfort),
      blocks: [{ title: "Como isso aparece no dia a dia", text: `Quando ${n} está com raiva, medo ou tristeza, o jeito de acolher faz toda a diferença: a criança aprende a lidar com as emoções vendo como os adultos lidam com elas.`, example: f(moon.example) }],
    },
    {
      id: "talentos", symbol: "♃", label: "Talentos", title: `Os talentos de ${n}`,
      source: `Júpiter em ${input.jupiter.sign} (os dons) e Saturno em ${input.saturn.sign} (onde precisa de apoio).`,
      intro: f(jup.text),
      payoff: { lead: "E o mapa também mostra onde essa criança vai precisar de mais apoio para crescer:", rest: f(sat.text) },
      blocks: [
        { title: "Como incentivar os talentos", text: f(jup.tip) },
        { title: "Como apoiar onde é mais difícil", text: f(sat.tip) },
      ],
    },
    {
      id: "numero", symbol: String(input.lifePath), label: "O número", title: `O número de destino de ${n} é ${input.lifePath}`,
      source: "Numerologia: a soma de todos os números da data de nascimento.",
      intro: f(life.text),
      blocks: [{ title: "Uma dica para quem cuida", text: f(life.tip) }],
    },
  ];

  return {
    letter: {
      title: `O mapa completo de ${n}`,
      text: `Este mapa é um convite para conhecer ${n} ainda melhor: como aprende, faz amigos, gasta energia, se acalma e quais talentos merecem incentivo. Cada parte vem com um exemplo do dia a dia e uma dica prática para quem cuida.`,
    },
    chapters,
    months: [],
    closing: `Toda criança muda, cresce e surpreende. Use este mapa como uma lanterna para enxergar ${n} com mais carinho, nunca como um rótulo.`,
  };
}
