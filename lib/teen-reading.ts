// Leitura para adolescentes (13 a 17 anos). Fala direto com o jovem ("você"),
// de igual para igual, sem palavras de gênero. No mapa completo, cada parte
// termina com uma dica para quem cuida. Sem amor romântico e sem dinheiro.

import type { FreeReading, SignKey } from "./free-reading";
import type { PremiumChapter, PremiumReading } from "./premium-reading";

type PlacementLike = { sign: string; signKey: SignKey };
type Point = { headline: string; text: string; gifts: string[]; shadows: string[]; power: string };

const SUN: Record<SignKey, Point> = {
  aries: { headline: "Você não espera ninguém para começar", text: "Você tem pressa de viver e gosta de testar as coisas na prática. Quando decide algo, quer fazer agora, e isso puxa a turma junto.", gifts: ["coragem", "iniciativa", "franqueza"], shadows: ["perder a paciência", "largar quando fica chato"], power: "a coragem de ir primeiro" },
  taurus: { headline: "Você sabe o que gosta e não muda por pressão", text: "Você tem gostos firmes, gosta de conforto e de fazer as coisas no seu ritmo. Quando abraça uma ideia, é difícil te tirar dela.", gifts: ["constância", "lealdade", "calma"], shadows: ["teimosia", "resistir a mudanças"], power: "a firmeza de quem não se perde" },
  gemini: { headline: "Sua cabeça tem mil abas abertas", text: "Você se interessa por muita coisa ao mesmo tempo, aprende rápido e sempre tem um assunto novo. Conversar é o seu jeito de entender o mundo.", gifts: ["curiosidade", "humor", "agilidade"], shadows: ["dispersão", "começar e não terminar"], power: "a curiosidade que não para" },
  cancer: { headline: "Você sente tudo e cuida de quem gosta", text: "Família, amigos próximos e o seu cantinho importam muito para você. Você percebe quando alguém não está bem, mesmo sem a pessoa falar.", gifts: ["empatia", "cuidado", "memória afetiva"], shadows: ["se magoar fácil", "se fechar no quarto"], power: "o cuidado com quem você gosta" },
  leo: { headline: "Você nasceu para ser visto", text: "Você tem presença, gosta de criar e de se expressar. Quando algo te anima, todo mundo em volta sente.", gifts: ["carisma", "criatividade", "generosidade"], shadows: ["sofrer com a indiferença", "dificuldade de admitir erro"], power: "o brilho que anima a turma" },
  virgo: { headline: "Você repara no que ninguém repara", text: "Você gosta de fazer as coisas direito e de entender os detalhes. É quem os amigos procuram quando precisam resolver alguma coisa.", gifts: ["atenção", "organização", "vontade de ajudar"], shadows: ["autocobrança", "ansiedade com erros"], power: "o olhar para os detalhes" },
  libra: { headline: "Você busca equilíbrio em tudo", text: "Você não gosta de briga, tem bom gosto e enxerga os dois lados de uma história. É quem tenta fazer as pazes na turma.", gifts: ["diplomacia", "senso de justiça", "simpatia"], shadows: ["indecisão", "dizer sim querendo dizer não"], power: "o dom de unir as pessoas" },
  scorpio: { headline: "Você vai fundo em tudo", text: "Você não faz nada pela metade e percebe o que as pessoas escondem. Confia em poucos, mas quando confia, é para valer.", gifts: ["intensidade", "lealdade", "percepção"], shadows: ["desconfiar demais", "guardar raiva"], power: "a força de quem sente de verdade" },
  sagittarius: { headline: "Você quer o mundo inteiro", text: "Você ama novidade, liberdade e conhecer gente diferente. É otimista e fica sem ar quando a vida vira só obrigação.", gifts: ["otimismo", "sinceridade", "espírito de aventura"], shadows: ["impaciência com regras", "prometer demais"], power: "o otimismo que contagia" },
  capricorn: { headline: "Você já pensa no futuro", text: "Você leva as coisas a sério, gosta de metas e quer provar do que é capaz. Muita gente acha que você tem maturidade demais para a idade.", gifts: ["responsabilidade", "persistência", "foco"], shadows: ["se cobrar demais", "esconder o que sente"], power: "a persistência de quem chega lá" },
  aquarius: { headline: "Você pensa diferente, e não está nem aí", text: "Você tem ideias próprias, questiona regras sem sentido e valoriza muito os amigos. Muitas vezes está um passo à frente da turma.", gifts: ["originalidade", "amizade", "mente aberta"], shadows: ["parecer distante", "teimar nas próprias ideias"], power: "a coragem de ser diferente" },
  pisces: { headline: "Você sente o mundo com o coração", text: "Você tem muita imaginação e sensibilidade. Música, arte, séries e histórias mexem com você, e você entende os outros sem precisar de palavras.", gifts: ["empatia", "imaginação", "intuição"], shadows: ["fugir da realidade", "absorver o drama dos outros"], power: "a imaginação que cria mundos" },
};

const MOON: Record<SignKey, Point & { comfort: string; example: string }> = {
  aries: { headline: "Sua raiva vem rápido e vai rápido", text: "Quando algo te irrita, você sente na hora e quer resolver já. Depois de explodir, esquece logo.", gifts: ["sinceridade", "se recuperar rápido"], shadows: ["explodir por pouco", "falar no calor do momento"], power: "a sinceridade sem filtro", comfort: "O que te acalma: se mexer. Treinar, andar, dançar, qualquer coisa que gaste a energia antes de conversar.", example: "Na vida real: você responde a mensagem com raiva e depois se arrepende do tom." },
  taurus: { headline: "Você precisa de rotina para ficar bem", text: "Mudança de última hora tira a sua paz. Você se sente em segurança com as coisas de sempre: a sua cama, a comida preferida, as pessoas de confiança.", gifts: ["calma", "constância"], shadows: ["empacar", "resistir a mudanças"], power: "a calma de quem sabe esperar", comfort: "O que te acalma: conforto. Uma comida gostosa, uma playlist, a sua cama, sem pressa.", example: "Na vida real: quando mudam o plano em cima da hora, o seu humor muda junto." },
  gemini: { headline: "Você precisa falar para entender o que sente", text: "Conversar, mandar áudio, escrever: é assim que você organiza as emoções. O tédio é o que mais te derruba.", gifts: ["falar dos sentimentos", "leveza"], shadows: ["pensar demais", "mudar de humor rápido"], power: "a leveza de quem fala", comfort: "O que te acalma: desabafar com alguém de confiança ou escrever o que está sentindo.", example: "Na vida real: você só entende o que sentiu depois de contar para alguém." },
  cancer: { headline: "Seu humor muda com o clima de casa", text: "Você sente muito o que acontece em casa e com as pessoas que ama. Quando algo machuca, a tendência é se fechar.", gifts: ["carinho", "empatia"], shadows: ["se fechar", "ficar remoendo"], power: "o carinho de quem acolhe", comfort: "O que te acalma: um lugar seguro e alguém que escute sem julgar.", example: "Na vida real: uma briga em casa pode estragar a sua semana inteira." },
  leo: { headline: "Você precisa se sentir importante para alguém", text: "Um elogio sincero muda o seu dia, e ser ignorado dói mais do que parece. Você demonstra carinho com generosidade.", gifts: ["generosidade", "calor humano"], shadows: ["sofrer com a indiferença", "fazer drama"], power: "o calor de um coração generoso", comfort: "O que te acalma: sentir que alguém reparou em você e no seu esforço.", example: "Na vida real: quando ninguém comenta o que você postou ou fez, bate uma tristeza." },
  virgo: { headline: "A ansiedade aparece quando sai do controle", text: "Bagunça, prova sem estudar e coisas mal explicadas mexem com você. Você se sente melhor quando organiza a vida.", gifts: ["cuidado", "praticidade"], shadows: ["se preocupar demais", "se criticar muito"], power: "o cuidado nos detalhes", comfort: "O que te acalma: fazer uma lista, organizar o que dá para resolver e soltar o resto.", example: "Na vida real: você pensa na prova da semana que vem já no domingo." },
  libra: { headline: "Você precisa de paz para ficar bem", text: "Clima pesado te deixa mal, mesmo quando a briga não é sua. Você quase sempre pensa no outro antes de pensar em você.", gifts: ["gentileza", "saber escutar"], shadows: ["engolir o que sente", "querer agradar todo mundo"], power: "a gentileza que acalma", comfort: "O que te acalma: um ambiente tranquilo e uma conversa calma, sem gritaria.", example: "Na vida real: você concorda só para a discussão acabar e depois se chateia." },
  scorpio: { headline: "Você sente tudo em dobro", text: "Suas emoções são fortes e você não mostra para qualquer um. Quando confia, se entrega; quando se decepciona, demora a esquecer.", gifts: ["profundidade", "lealdade"], shadows: ["ciúme", "demorar a perdoar"], power: "a profundidade de quem sente de verdade", comfort: "O que te acalma: tempo sozinho e, depois, uma conversa honesta com alguém de confiança.", example: "Na vida real: você lembra por muito tempo de quem quebrou a sua confiança." },
  sagittarius: { headline: "Você se cura com liberdade e risada", text: "Quando está mal, você precisa de espaço, de ar livre ou de uma boa risada com os amigos. Drama e controle te sufocam.", gifts: ["otimismo", "bom humor"], shadows: ["fugir de conversa séria", "fingir que está tudo bem"], power: "a esperança que sempre vê saída", comfort: "O que te acalma: sair, ver gente, fazer algo novo.", example: "Na vida real: quando te prendem demais em casa, você fica impaciente com todo mundo." },
  capricorn: { headline: "Você sente mais do que mostra", text: "Você tenta resolver tudo por conta própria e não gosta de parecer frágil. Mas guardar tudo pesa.", gifts: ["maturidade", "calma nas crises"], shadows: ["esconder o que sente", "não pedir ajuda"], power: "a firmeza que não desaba", comfort: "O que te acalma: um plano. Saber o próximo passo te devolve o chão.", example: "Na vida real: você diz \"tô de boa\" quando não está." },
  aquarius: { headline: "Você precisa de espaço para sentir do seu jeito", text: "Você lida com as emoções pensando nelas, meio de longe. Cobrança e pressão te afastam.", gifts: ["respeitar o espaço dos outros", "amizade"], shadows: ["parecer distante sem ser", "se isolar"], power: "a liberdade de sentir do próprio jeito", comfort: "O que te acalma: um tempo só seu, com as suas coisas, e depois conversar sem cobrança.", example: "Na vida real: quando insistem para você falar, você fala menos ainda." },
  pisces: { headline: "Você sente o que ninguém fala", text: "Você percebe o clima de um lugar assim que entra e sente a dor dos outros como se fosse sua. Precisa de momentos de silêncio para recarregar.", gifts: ["empatia", "intuição"], shadows: ["absorver o drama dos outros", "fugir para o celular"], power: "a intuição de quem sente antes de saber", comfort: "O que te acalma: música, arte, banho demorado e um tempo longe das telas.", example: "Na vida real: um vídeo triste pode mexer com você o dia inteiro." },
};

const ASC: Record<SignKey, Omit<Point, "power">> = {
  aries: { headline: "Você chega chegando", text: "Na primeira impressão, você passa energia, rapidez e franqueza.", gifts: ["presença", "iniciativa"], shadows: ["parecer de cara fechada sem estar", "atropelar"] },
  taurus: { headline: "Você passa calma e confiança", text: "Na primeira impressão, você passa tranquilidade e confiança, sem pressa.", gifts: ["passar segurança", "estilo próprio"], shadows: ["demorar a se soltar", "parecer devagar"] },
  gemini: { headline: "Você puxa assunto com qualquer pessoa", text: "Na primeira impressão, você tem papo fácil, esperteza e bom humor.", gifts: ["papo fácil", "humor"], shadows: ["falar mais do que escuta", "parecer que não leva nada a sério"] },
  cancer: { headline: "Você demora um pouco para se soltar", text: "Na primeira impressão, você observa antes de se soltar. Depois que se sente em casa, aparece o seu lado carinhoso.", gifts: ["acolher", "passar confiança"], shadows: ["timidez", "levar críticas para o coração"] },
  leo: { headline: "Você chama atenção sem esforço", text: "Na primeira impressão, você tem um brilho que as pessoas notam, com confiança e calor humano.", gifts: ["carisma", "confiança"], shadows: ["parecer que quer ser o centro", "se importar demais com a imagem"] },
  virgo: { headline: "Você passa a imagem de quem sabe o que faz", text: "Na primeira impressão, você passa discrição, educação e competência.", gifts: ["discrição", "competência"], shadows: ["parecer exigente", "travar com medo de errar"] },
  libra: { headline: "Você é a simpatia em pessoa", text: "Na primeira impressão, você tem um charme que agrada todo mundo e deixa o clima leve.", gifts: ["charme", "diplomacia"], shadows: ["tentar agradar a todos", "esconder o que incomoda"] },
  scorpio: { headline: "Você tem um olhar que impressiona", text: "Na primeira impressão, você tem um ar de mistério e observa tudo, e isso gera curiosidade.", gifts: ["presença marcante", "perceber intenções"], shadows: ["parecer difícil de conhecer", "passar uma imagem mais séria"] },
  sagittarius: { headline: "Você chega animando a turma", text: "Na primeira impressão, você passa alegria, abertura e espontaneidade.", gifts: ["alegria", "espontaneidade"], shadows: ["falar sem pensar", "não parar quieto"] },
  capricorn: { headline: "Você passa respeito logo de cara", text: "Na primeira impressão, você passa seriedade, como alguém mais velho. Com o tempo, aparece o seu bom humor.", gifts: ["credibilidade", "postura"], shadows: ["parecer distante", "demorar a relaxar"] },
  aquarius: { headline: "Você é diferente, e todo mundo percebe", text: "Na primeira impressão, você tem um estilo próprio e um jeito de pensar que não segue a multidão.", gifts: ["originalidade", "mente aberta"], shadows: ["parecer distante", "ser difícil de ler"] },
  pisces: { headline: "Você tem um jeito doce e sonhador", text: "Na primeira impressão, você passa gentileza e sensibilidade, e é fácil de gostar.", gifts: ["suavidade", "empatia"], shadows: ["parecer no mundo da lua", "dificuldade de dizer não"] },
};

type Chapter = { text: string; example: string; tip: string; care: string };

const STUDY: Record<SignKey, Chapter> = {
  aries: { text: "Você estuda melhor em blocos curtos e intensos, com desafio e prazo.", example: "Na vida real: você estuda na véspera, no gás, e às vezes dá certo.", tip: "Use o cronômetro: 25 minutos focados e 5 de pausa. Vira um jogo.", care: "Transforme metas em desafios curtos; sermão longo não funciona." },
  taurus: { text: "Você aprende devagar e de um jeito que não esquece mais. Precisa de rotina e de um lugar confortável para estudar.", example: "Na vida real: você rende muito mais estudando sempre no mesmo lugar e horário.", tip: "Crie um cantinho fixo de estudo e um horário que se repita.", care: "Respeite o ritmo: pressão para ir mais rápido trava em vez de ajudar." },
  gemini: { text: "Você aprende rápido, conversando e misturando assuntos. O problema é manter o foco.", example: "Na vida real: você abre o caderno e, cinco minutos depois, está no celular.", tip: "Explique a matéria em voz alta, como se fosse um vídeo: é assim que você fixa.", care: "Ajude com blocos curtos e variados; uma tarefa enorme de uma vez assusta." },
  cancer: { text: "Você aprende melhor quando se sente bem com o professor e com a turma. O clima emocional pesa muito.", example: "Na vida real: as suas notas sobem com um professor que te trata bem.", tip: "Estude em um lugar onde você se sinta em paz, e com alguém de confiança perto se ajudar.", care: "Pergunte como está a escola emocionalmente, não só as notas." },
  leo: { text: "Você aprende quando pode mostrar o que sabe: apresentar, criar, ser reconhecido.", example: "Na vida real: trabalho em grupo com apresentação é a sua chance de brilhar.", tip: "Ensine a matéria para alguém: quando você explica, você aprende.", care: "Elogie o esforço, não só a nota; reconhecimento move essa pessoa." },
  virgo: { text: "Você aprende com método, resumos e passo a passo. Gosta de entender tudo antes de seguir.", example: "Na vida real: os seus resumos são tão bons que os amigos pedem emprestado.", tip: "Lembre que \"bom o bastante\" também passa. Não refaça o resumo três vezes.", care: "Ajude a baixar a autocobrança: mostre que errar faz parte." },
  libra: { text: "Você aprende melhor em dupla ou em grupo, num ambiente bonito e tranquilo.", example: "Na vida real: estudar com um amigo rende mais do que estudar sozinho.", tip: "Monte um grupo de estudo, mas com hora para começar e para terminar.", care: "Ajude nas escolhas: muitas opções ao mesmo tempo paralisam." },
  scorpio: { text: "Você aprende fundo quando o assunto te interessa. Gosta de entender o porquê de tudo.", example: "Na vida real: você sabe tudo de um assunto que ama e nada de outro que acha chato.", tip: "Ligue a matéria chata a algo que você curte: sempre existe uma ponte.", care: "Descubra o que desperta o interesse e use isso como porta de entrada." },
  sagittarius: { text: "Você aprende explorando: vídeos, viagens, histórias e grandes perguntas sobre o mundo.", example: "Na vida real: você aprende mais num documentário do que numa apostila.", tip: "Procure vídeos e histórias sobre a matéria antes de estudar o livro.", care: "Mostre para que serve aquilo na vida real; sem sentido, não engaja." },
  capricorn: { text: "Você aprende com disciplina e metas claras. Gosta de ver o próprio progresso.", example: "Na vida real: você risca da lista o que já estudou e sente orgulho disso.", tip: "Faça um quadro de metas por semana e comemore cada uma.", care: "Cuide do descanso: essa pessoa tende a estudar até a exaustão." },
  aquarius: { text: "Você aprende do seu jeito, muitas vezes diferente do esperado. Tecnologia e ideias novas te prendem.", example: "Na vida real: você acha um jeito diferente de resolver o exercício e chega no resultado certo.", tip: "Use aplicativos, vídeos e mapas mentais: o caminho tradicional não precisa ser o seu.", care: "Valorize o raciocínio diferente em vez de exigir um único método." },
  pisces: { text: "Você aprende com imagens, música, histórias e imaginação.", example: "Na vida real: você lembra da matéria se ela virar uma música ou um desenho.", tip: "Faça resumos com desenhos e cores, ou grave áudios explicando.", care: "Ajude a manter uma rotina simples; a distração é o maior desafio." },
};

const FRIENDS: Record<SignKey, Chapter> = {
  aries: { text: "Na turma, você é quem chama para os rolês e toma a frente.", example: "Na vida real: se ninguém decide nada, é você quem decide.", tip: "Pergunte de vez em quando o que os outros querem fazer.", care: "Incentive esportes e atividades em grupo para gastar essa energia de liderança." },
  taurus: { text: "Você prefere poucos amigos de verdade e de muito tempo.", example: "Na vida real: o seu melhor amigo é o mesmo há anos.", tip: "Dê chance para gente nova: nem toda mudança é ruim.", care: "Não force uma vida social agitada; poucos amigos fiéis já bastam." },
  gemini: { text: "Você conversa com todo mundo e circula em várias turmas.", example: "Na vida real: você tem amigos da escola, do curso, da internet e do prédio.", tip: "Cuide das amizades antigas também, não só das novas.", care: "Conheça os amigos online de um jeito leve, sem interrogatório." },
  cancer: { text: "Você cuida dos amigos como família e sente muito quando te deixam de lado.", example: "Na vida real: você é quem lembra do aniversário de todo mundo.", tip: "Você também pode pedir colo, não só dar.", care: "Fique de olho em exclusão na turma: isso pesa muito para essa pessoa." },
  leo: { text: "Você tem generosidade com os amigos e gosta da admiração da turma.", example: "Na vida real: você organiza a festa, o vídeo, a apresentação.", tip: "Divida o palco: aplaudir os amigos também te faz brilhar.", care: "Reconheça os talentos em casa para diminuir a busca por aprovação fora." },
  virgo: { text: "Você demonstra amizade ajudando: explica a matéria, dá conselho, resolve problema.", example: "Na vida real: os amigos te procuram quando estão com algum problema.", tip: "Nem todo desabafo precisa de solução; às vezes é só escutar.", care: "Ajude a perceber que não precisa ser útil o tempo todo para receber amor." },
  libra: { text: "Você é a pessoa que todo mundo gosta e que tenta manter a paz na turma.", example: "Na vida real: quando os amigos brigam, você fica no meio.", tip: "Ter opinião não estraga amizade; dizer o que pensa é saudável.", care: "Ensine a dizer não sem culpa: a pressão do grupo pesa mais nessa pessoa." },
  scorpio: { text: "Você confia em poucos e é muito leal, mas sofre muito com traição.", example: "Na vida real: um segredo espalhado pode acabar uma amizade para você.", tip: "Nem todo erro é traição: dá para conversar antes de cortar alguém.", care: "Converse sobre confiança e perdão sem minimizar o que a pessoa sente." },
  sagittarius: { text: "Você é diversão garantida, tem sinceridade e faz amizade com todo mundo.", example: "Na vida real: você topa qualquer programa novo.", tip: "Cuidado com a sinceridade sem filtro: ela pode machucar sem querer.", care: "Dê liberdade com combinados claros: horário, lugar, contato." },
  capricorn: { text: "Você tem lealdade e responsabilidade, e às vezes prefere amigos mais velhos ou mais sérios.", example: "Na vida real: você é quem os pais dos amigos confiam.", tip: "Permita-se só curtir, sem objetivo nenhum.", care: "Incentive momentos de lazer sem cobrança de resultado." },
  aquarius: { text: "Você gosta de turmas diferentes e de amigos com quem pode ser você de verdade.", example: "Na vida real: os seus amigos não são parecidos entre si.", tip: "Encontrar a sua turma leva tempo, e tudo bem.", care: "Valorize o jeito diferente; a pressão para ser \"normal\" afasta." },
  pisces: { text: "Você tem doçura e acolhe todo mundo, mas pode se deixar levar pelo grupo.", example: "Na vida real: você sente o problema do amigo como se fosse seu.", tip: "Você pode ajudar sem carregar o peso do outro.", care: "Converse sobre limites: dizer não com carinho também é amizade." },
};

const CONFLICT: Record<SignKey, Chapter> = {
  aries: { text: "Em casa, quando ouve um não, você reage na hora e pode subir o tom.", example: "Na vida real: a discussão começa por causa do celular e vira briga em dois minutos.", tip: "Antes de responder, saia do cômodo por cinco minutos. Volte e fale a mesma coisa com calma.", care: "Não discuta no calor: combine de conversar depois que a raiva passar." },
  taurus: { text: "Quando contrariam você, você finca o pé e é difícil mudar de ideia.", example: "Na vida real: quanto mais insistem, mais você resiste.", tip: "Ouça o argumento até o fim antes de dizer não.", care: "Dê opções em vez de ordens; imposição gera muro." },
  gemini: { text: "Nas discussões, você argumenta muito e às vezes vence pelo cansaço.", example: "Na vida real: você tem um \"mas\" para cada regra.", tip: "Ganhar a discussão não é o mesmo que resolver o problema.", care: "Explique o motivo das regras; essa pessoa aceita o que entende." },
  cancer: { text: "Quando se magoa, você se fecha no quarto e lembra de coisas antigas.", example: "Na vida real: uma frase dura em casa fica na sua cabeça por dias.", tip: "Diga \"isso me magoou\" em vez de se fechar.", care: "Acolha antes de corrigir: primeiro o sentimento, depois a regra." },
  leo: { text: "Nos conflitos, o orgulho fala alto e pedir desculpa primeiro é difícil.", example: "Na vida real: você prefere ficar sem falar a dar o braço a torcer.", tip: "Pedir desculpa não diminui ninguém; mostra força.", care: "Corrija em particular, nunca na frente dos outros." },
  virgo: { text: "Nos conflitos, você aponta os erros com detalhes e pode soar exigente demais.", example: "Na vida real: você lembra exatamente quem disse o quê e quando.", tip: "Fale também do que está bom, não só do que está errado.", care: "Mostre que regras mudam por bons motivos; mudança sem explicação gera ansiedade." },
  libra: { text: "Você evita briga a qualquer custo e pode guardar o que incomoda.", example: "Na vida real: você diz \"tanto faz\" e depois se chateia.", tip: "Dizer o que quer com calma não é briga, é conversa.", care: "Pergunte \"o que você queria de verdade?\"; essa pessoa raramente diz espontaneamente." },
  scorpio: { text: "Nos conflitos, você vai fundo e pode usar o silêncio como arma.", example: "Na vida real: você para de falar com alguém em vez de discutir.", tip: "O silêncio cansa os dois. Diga o que sente, mesmo que seja difícil.", care: "Nunca use segredos ou confidências contra essa pessoa." },
  sagittarius: { text: "Você detesta controle e reage quando sente que perdeu a liberdade.", example: "Na vida real: proibição sem motivo vira vontade de fazer escondido.", tip: "Negocie a liberdade mostrando responsabilidade.", care: "Combine regras junto, com espaço para conquistar mais liberdade." },
  capricorn: { text: "Nos conflitos, você fecha a cara e fica em silêncio, tentando resolver com lógica.", example: "Na vida real: parece que você não liga, mas liga muito.", tip: "Mostrar o que sente não é fraqueza.", care: "Abra espaço para emoção, não só para resultado." },
  aquarius: { text: "Nos conflitos, você se afasta para pensar e defende as suas ideias com firmeza.", example: "Na vida real: você some no quarto e volta com um argumento pronto.", tip: "Avise quando precisar de espaço: \"depois a gente conversa\".", care: "Respeite o tempo dessa pessoa e discuta ideias, não a pessoa." },
  pisces: { text: "Nos conflitos, você se magoa fácil e pode chorar ou fugir do assunto.", example: "Na vida real: você coloca o fone e some do mundo.", tip: "Fugir alivia na hora, mas o problema volta. Escolha um momento calmo para falar.", care: "Fale com delicadeza: gritos travam essa pessoa por completo." },
};

const TALENT: Record<SignKey, { text: string; tip: string; care: string }> = {
  aries: { text: "Você tem talento para liderar, para esportes e para empreender.", tip: "Experimente um esporte, um projeto ou um negócio pequeno.", care: "Ofereça desafios reais; responsabilidade motiva." },
  taurus: { text: "Você tem talento para música, culinária, arte manual e natureza.", tip: "Um instrumento ou uma habilidade com as mãos pode virar algo grande.", care: "Invista em algo concreto que dá para ver evoluir." },
  gemini: { text: "Você tem talento para comunicação, idiomas, escrita e redes sociais.", tip: "Crie conteúdo, escreva, aprenda um idioma.", care: "Canalize o tempo de tela para criar, não só consumir." },
  cancer: { text: "Você tem talento para cuidar: saúde, educação, animais, gastronomia.", tip: "Trabalho voluntário pode mostrar um caminho.", care: "Valorize a sensibilidade como talento, não como fraqueza." },
  leo: { text: "Você tem talento para palco, artes, comunicação e liderança.", tip: "Teatro, música, vídeo ou grêmio da escola.", care: "Apoie a exposição com segurança: palco sim, superexposição não." },
  virgo: { text: "Você tem talento para ciências, organização, saúde e análise.", tip: "Olimpíadas de conhecimento e projetos de ciência combinam com você.", care: "Elogie o processo, não a perfeição." },
  libra: { text: "Você tem talento para design, moda, direito, arte e trabalho com pessoas.", tip: "Desenho, fotografia ou debate podem revelar o seu dom.", care: "Ajude a escolher um foco sem fechar as outras portas." },
  scorpio: { text: "Você tem talento para investigar, pesquisar, psicologia e tudo que é profundo.", tip: "Livros, podcasts e cursos sobre temas difíceis te prendem.", care: "Respeite os interesses intensos; eles podem virar profissão." },
  sagittarius: { text: "Você tem talento para idiomas, viagens, esportes e ensinar.", tip: "Intercâmbio, idiomas e esportes ao ar livre abrem portas para você.", care: "Mostre o mundo: viagens e experiências ensinam mais que sermão." },
  capricorn: { text: "Você tem talento para gestão, engenharia e construir algo seu.", tip: "Projetos de longo prazo e metas grandes combinam com você.", care: "Ajude a equilibrar ambição com descanso." },
  aquarius: { text: "Você tem talento para tecnologia, inovação e causas sociais.", tip: "Programação, robótica e projetos de impacto são o seu mundo.", care: "Apoie as ideias diferentes, mesmo as que parecem estranhas." },
  pisces: { text: "Você tem talento para arte, música, cinema e ajudar pessoas.", tip: "Um caderno de criação, um instrumento ou um projeto artístico.", care: "Ajude a transformar sensibilidade em projeto com começo, meio e fim." },
};

const GROWTH: Record<SignKey, string> = {
  aries: "Você pode precisar de mais paciência para terminar o que começa.",
  taurus: "Você pode precisar de mais abertura para mudanças.",
  gemini: "Você pode precisar de mais foco para aprofundar um assunto.",
  cancer: "Você pode precisar de mais segurança para se arriscar fora de casa.",
  leo: "Você pode precisar de mais autoconfiança, mesmo sem aplausos.",
  virgo: "Você pode precisar de mais leveza com os próprios erros.",
  libra: "Você pode precisar de mais firmeza para tomar decisões.",
  scorpio: "Você pode precisar de mais confiança nas pessoas certas.",
  sagittarius: "Você pode precisar de mais compromisso com os seus planos.",
  capricorn: "Você pode precisar de mais descanso e menos autocobrança.",
  aquarius: "Você pode precisar de mais paciência para se sentir parte de um grupo.",
  pisces: "Você pode precisar de mais rotina e limites claros.",
};

const LIFE: Record<number, { text: string; tip: string }> = {
  1: { text: "Você veio para abrir caminhos e ter ideias próprias.", tip: "Para quem cuida: deixe tomar decisões reais e assumir as consequências." },
  2: { text: "Você veio para unir pessoas e criar parcerias.", tip: "Para quem cuida: valorize a sensibilidade em vez de pedir dureza." },
  3: { text: "Você veio para se expressar e espalhar alegria.", tip: "Para quem cuida: dê espaço para arte, música e conversa." },
  4: { text: "Você veio para construir com cuidado e constância.", tip: "Para quem cuida: rotina e combinados claros dão segurança." },
  5: { text: "Você veio para experimentar e descobrir o mundo.", tip: "Para quem cuida: liberdade com combinados funciona melhor que proibição." },
  6: { text: "Você veio para cuidar e trazer harmonia.", tip: "Para quem cuida: não coloque essa pessoa no meio dos problemas dos adultos." },
  7: { text: "Você veio para pensar fundo e entender a vida.", tip: "Para quem cuida: respeite os momentos de silêncio e as perguntas difíceis." },
  8: { text: "Você veio para realizar coisas grandes.", tip: "Para quem cuida: ensine o valor do esforço e do dinheiro desde já." },
  9: { text: "Você veio para ajudar o mundo com um coração grande.", tip: "Para quem cuida: incentive causas e voluntariado." },
  11: { text: "Você tem um número especial, o 11: veio para inspirar, com muita intuição.", tip: "Para quem cuida: acolha a sensibilidade e cuide do sono e do descanso." },
  22: { text: "Você tem um número especial, o 22: veio para construir algo grande.", tip: "Para quem cuida: apoie os sonhos grandes com passos pequenos." },
  33: { text: "Você tem um número especial, o 33: veio para cuidar e ensinar.", tip: "Para quem cuida: lembre que essa pessoa também precisa ser cuidada." },
};

const NOUN: Record<SignKey, string> = {
  aries: "Faísca", taurus: "Raiz", gemini: "Ponte", cancer: "Lareira", leo: "Estrela", virgo: "Lente",
  libra: "Balança", scorpio: "Fênix", sagittarius: "Flecha", capricorn: "Montanha", aquarius: "Ventania", pisces: "Maré",
};
const ADJ: Record<SignKey, string> = {
  aries: "Destemida", taurus: "Serena", gemini: "Curiosa", cancer: "Acolhedora", leo: "Radiante", virgo: "Cuidadosa",
  libra: "Gentil", scorpio: "Intensa", sagittarius: "Livre", capricorn: "Firme", aquarius: "Original", pisces: "Sonhadora",
};

export function buildTeenFreeReading(input: {
  sun: PlacementLike;
  moon: PlacementLike;
  ascendant: PlacementLike | null;
  mercury: PlacementLike;
  venus: PlacementLike;
  mars: PlacementLike;
  jupiter: PlacementLike;
}): FreeReading {
  const sun = SUN[input.sun.signKey];
  const moon = MOON[input.moon.signKey];
  const asc = input.ascendant ? ASC[input.ascendant.signKey] : null;
  const layers: FreeReading["layers"] = [
    { id: "sun", symbol: "☉", role: "Seu Sol", question: "Quem você é por dentro", sign: input.sun.sign, headline: sun.headline, text: sun.text, gifts: sun.gifts, shadows: sun.shadows },
    { id: "moon", symbol: "☾", role: "Sua Lua", question: "Como você sente", sign: input.moon.sign, headline: moon.headline, text: moon.text, gifts: moon.gifts, shadows: moon.shadows },
  ];
  if (input.ascendant && asc) {
    layers.push({ id: "ascendant", symbol: "↑", role: "Seu Ascendente", question: "Como os outros veem você", sign: input.ascendant.sign, headline: asc.headline, text: asc.text, gifts: asc.gifts, shadows: asc.shadows });
  }
  return {
    audience: "teen",
    archetype: {
      name: `A ${NOUN[input.sun.signKey]} ${ADJ[input.moon.signKey]}`,
      text: `${NOUN[input.sun.signKey]}, pelo seu Sol em ${input.sun.sign}. ${ADJ[input.moon.signKey]}, pela sua Lua em ${input.moon.sign}. É o seu retrato agora, e ele vai mudar e crescer junto com você.`,
      combinations: input.ascendant
        ? "Existem 1.728 combinações de Sol, Lua e Ascendente. A sua é uma delas."
        : "Existem 144 combinações de Sol e Lua. A sua é uma delas.",
    },
    layers,
    mirror: {
      title: input.ascendant ? "Você em três camadas" : "Você em duas camadas",
      text: input.ascendant
        ? `Quem te vê pela primeira vez: ${asc!.headline.toLowerCase()}. Quem convive: ${sun.headline.toLowerCase()}. Quem está bem perto: ${moon.headline.toLowerCase()}.`
        : `Quem convive: ${sun.headline.toLowerCase()}. Quem está bem perto: ${moon.headline.toLowerCase()}.`,
      harmony: "Ninguém é uma coisa só. Você está descobrindo quem é, e isso é uma das partes mais legais de ter a sua idade.",
      sameSign: input.sun.signKey === input.moon.signKey ? `O seu Sol e a sua Lua estão em ${input.sun.sign}: quem você é e o que você sente apontam para o mesmo lado.` : null,
    },
    superpower: `Seu superpoder é juntar ${sun.power} com ${moon.power}.`,
    attention: moon.comfort,
    teasers: [
      { id: "amor", symbol: "☿", label: "Estudos", title: "Como você aprende", opening: STUDY[input.mercury.signKey].text, cliff: "E existe um truque que pode deixar o seu estudo muito mais leve:", locked: ["O seu jeito natural de aprender", "Um truque para estudar melhor", "Uma dica para quem cuida"] },
      { id: "carreira", symbol: "♀", label: "Turma", title: "Você e os amigos", opening: FRIENDS[input.venus.signKey].text, cliff: "Mas o seu mapa também mostra o que pode pesar nas amizades. Isso aparece mais quando", locked: ["O seu papel na turma", "O que pode pesar", "Como lidar"] },
      { id: "dinheiro", symbol: "♂", label: "Conflitos", title: "Quando a casa ferve", opening: CONFLICT[input.mars.signKey].text, cliff: "E tem um jeito de lidar com as brigas que funciona muito melhor para você:", locked: ["Como você reage", "O que fazer na hora", "O que ajuda quem convive com você"] },
      { id: "momento", symbol: "♃", label: "Talentos", title: "Os seus talentos", opening: TALENT[input.jupiter.signKey].text, cliff: "E o seu mapa também mostra onde você vai crescer mais nos próximos anos:", locked: ["Talentos para investir", "Onde você vai crescer", "Ideias de atividades"] },
    ],
    noTimeNote: input.ascendant
      ? null
      : "Sem o horário de nascimento, não dá para calcular o seu Ascendente. Se descobrir o horário (ele está na certidão), refaça o mapa.",
  };
}

export function buildTeenPremiumReading(input: {
  firstName: string;
  moon: PlacementLike;
  mercury: PlacementLike;
  venus: PlacementLike;
  mars: PlacementLike;
  jupiter: PlacementLike;
  saturn: PlacementLike;
  lifePath: number;
}): PremiumReading {
  const study = STUDY[input.mercury.signKey];
  const friends = FRIENDS[input.venus.signKey];
  const conflict = CONFLICT[input.mars.signKey];
  const moon = MOON[input.moon.signKey];
  const talent = TALENT[input.jupiter.signKey];
  const life = LIFE[input.lifePath] ?? LIFE[1];
  const careBlock = (text: string) => ({ title: "Para quem cuida", text });

  const chapters: PremiumChapter[] = [
    {
      id: "aprender", symbol: "☿", label: "Estudos", title: "Como você aprende",
      source: `Mercúrio em ${input.mercury.sign}. Mercúrio cuida da cabeça e do jeito de aprender.`,
      intro: study.text,
      payoff: { lead: "E existe um truque que pode deixar o seu estudo muito mais leve:", rest: study.tip },
      blocks: [{ title: "Como isso aparece no dia a dia", text: "Esse é o seu jeito natural de aprender. Quando você para de lutar contra ele, estudar fica menos chato.", example: study.example }, careBlock(study.care)],
    },
    {
      id: "amizades", symbol: "♀", label: "Turma", title: "Você e os amigos",
      source: `Vênus em ${input.venus.sign}. Vênus cuida do carinho e das amizades.`,
      intro: friends.text,
      payoff: { lead: "Mas o seu mapa também mostra o que pode pesar nas amizades. Isso aparece mais quando você tende a", rest: `${moon.shadows[0]}.` },
      blocks: [{ title: "Como lidar", text: friends.tip, example: friends.example }, careBlock(friends.care)],
    },
    {
      id: "energia", symbol: "♂", label: "Conflitos", title: "Quando a casa ferve",
      source: `Marte em ${input.mars.sign}. Marte cuida da energia e de como você reage quando alguém te contraria.`,
      intro: conflict.text,
      payoff: { lead: "E tem um jeito de lidar com as brigas que funciona muito melhor para você:", rest: conflict.tip },
      blocks: [{ title: "Como isso aparece no dia a dia", text: "Todo mundo briga em casa às vezes. Entender o seu jeito de reagir é o primeiro passo para brigar menos.", example: conflict.example }, careBlock(conflict.care)],
    },
    {
      id: "emocoes", symbol: "☾", label: "Emoções", title: "Quando bate a bad",
      source: `Lua em ${input.moon.sign}. A Lua cuida das emoções e do que te traz segurança.`,
      intro: `Quando o dia fica pesado, você tende a ${moon.shadows[1]}. Isso é normal, e conhecer esse padrão ajuda a sair dele mais rápido.`,
      blocks: [
        { title: "Como isso aparece no dia a dia", text: "Emoção não é defeito: é um aviso. Aprender a ouvir esse aviso é um superpoder para a vida inteira.", example: moon.example },
        careBlock("Pergunte \"como você está?\" e aceite a resposta sem corrigir. Se a tristeza durar semanas, procure ajuda profissional junto."),
      ],
    },
    {
      id: "talentos", symbol: "♃", label: "Talentos", title: "Os seus talentos",
      source: `Júpiter em ${input.jupiter.sign} (os dons) e Saturno em ${input.saturn.sign} (onde você vai crescer).`,
      intro: talent.text,
      payoff: { lead: "E o seu mapa também mostra onde você vai crescer mais nos próximos anos:", rest: GROWTH[input.saturn.signKey] },
      blocks: [{ title: "Como investir nesses talentos", text: talent.tip }, careBlock(talent.care)],
    },
    {
      id: "numero", symbol: String(input.lifePath), label: "Seu número", title: `Seu número de destino é ${input.lifePath}`,
      source: "Numerologia: a soma de todos os números da sua data de nascimento.",
      intro: life.text,
      blocks: [{ title: "Para quem cuida", text: life.tip.replace(/^Para quem cuida: /, "") }],
    },
  ];

  return {
    letter: {
      title: `${input.firstName}, este é o seu mapa completo`,
      text: "Aqui você vai ver como aprende, como é com os amigos, como reage nas brigas, o que fazer quando bate a bad e quais são os seus talentos. No fim de cada parte tem uma dica para quem cuida de você: pode mostrar para eles.",
    },
    chapters,
    months: [],
    closing: "Você está em construção, e isso é ótimo. Este mapa não diz quem você tem que ser: só ajuda a entender quem você já é.",
  };
}
