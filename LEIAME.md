# AstroIA — pacote para instalação própria

Este diretório contém o código-fonte versionado do AstroIA e os arquivos necessários para instalar dependências, desenvolver, compilar e migrar o banco. Segredos e credenciais não estão incluídos. O arquivo `.env.example` lista somente os nomes das variáveis usadas pelo código.

## Requisitos e execução local

O projeto usa vinext/Vite com runtime Cloudflare Workers e banco D1. Requer Node.js `>=22.13.0` e npm.

1. Extraia o ZIP e entre na pasta do projeto.
2. Instale dependências: `npm ci`.
3. Copie `.env.example` para `.dev.vars` (ou configure as mesmas variáveis no ambiente do seu provedor) e preencha os valores necessários. Não envie `.dev.vars` ao Git.
4. Copie `wrangler.jsonc.example` para `wrangler.jsonc`; crie um banco D1 e substitua `database_id` pelo ID real.
5. Aplique as migrações locais: `npm run db:migrate:local`.
6. Inicie o site: `npm run dev`.
7. Compile com `npm run build`. Para publicar no Cloudflare Workers, use `npx wrangler deploy` depois de configurar a conta, o D1 e os segredos.

O projeto depende de APIs específicas do Cloudflare (`cloudflare:workers`, D1, Assets e Images). Por isso, ele não funciona como aplicação Node genérica em hospedagens como cPanel/VPS sem uma adaptação do acesso ao banco e do runtime. Para usar outro provedor, será necessário substituir essas integrações e ajustar as rotas que dependem de Workers.

## Serviços externos usados

- **Cloudflare Workers**: executa páginas e rotas de API.
- **Cloudflare D1**: banco SQLite gerenciado e armazenamento dos relatórios, mapas, pedidos e eventos de webhook.
- **Cloudflare Assets e Images**: entrega de arquivos estáticos e otimização de imagens (`ASSETS` e `IMAGES`).
- **Asaas**: criação e consulta de pagamentos e recebimento de notificações por webhook. Configure `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_AMOUNT_CENTS` e `PAYMENTS_ENABLED`. O preço padrão no código é R$ 19,90; o valor permitido pelo código vai de R$ 1,00 a R$ 19,90. Configure a URL pública em `ASTROIA_SITE_URL` para o retorno do checkout. A URL de webhook é `/api/asaas/webhook`.
- **Resend**: envio de links de acesso e mapas por e-mail. Configure `RESEND_API_KEY`, `ASTROIA_EMAIL_FROM` e `ASTROIA_SITE_URL`.
- **Open-Meteo Geocoding API**: busca cidade, latitude, longitude e fuso horário; não exige chave no código.
- **Mercado Pago**: há uma integração legada no código (`lib/mercado-pago.ts` e rota de webhook), mas o checkout principal usa Asaas. Só configure `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_MODE` se reativar essa integração.

Em Cloudflare Workers, cadastre segredos com `npx wrangler secret put NOME_DA_VARIAVEL`. Para testar localmente, use `.dev.vars`. O `.env.example` serve como referência de nomes; não contém valores. `DB`, `ASSETS` e `IMAGES` são bindings de plataforma, não segredos de `.env`.

## Cálculo astrológico e licenças

| Biblioteca | Uso no AstroIA | Versão do lockfile | Licença declarada |
|---|---|---:|---|
| [`circular-natal-horoscope-js`](https://github.com/0xStarcat/CircularNatalHoroscopeJS) | mapa natal, posições, casas, ascendente, meio do céu e aspectos | 1.1.0 | Unlicense (domínio público conforme o texto da licença) |
| [`astronomy-engine`](https://github.com/cosinekitty/astronomy) | posições astronômicas e fase da Lua/céu atual | 2.1.19 | MIT |
| `moment` 2.30.1 | data/hora, dependência transitiva | 2.30.1 | MIT |
| `moment-timezone` | conversão de fuso, dependência transitiva | 0.5.48 | MIT |
| `tz-lookup` | coordenada para fuso, dependência transitiva | 6.1.25 | CC0-1.0 |

O fuso horário da cidade é consultado na resposta da API de geocodificação do Open-Meteo. A numerologia (incluindo caminho de vida e ano pessoal) é implementada no próprio código do AstroIA; não usa uma biblioteca externa dedicada. A lista acima cobre as bibliotecas relacionadas ao cálculo astrológico e ao fuso; outras dependências do site estão declaradas em `package.json` e `package-lock.json`.

## Banco de dados e relatórios

As tabelas e o modelo ficam em `db/schema.ts`; as migrações SQL e seus metadados ficam em `drizzle/`. O binding chamado `DB` aponta para o banco D1 configurado no Wrangler.

Os dados são persistidos no D1: `guest_reports` guarda os dados da solicitação e a análise JSON; `astro_maps` guarda mapas vinculados a contas; `payment_orders` guarda estado e referência do pagamento; outras tabelas guardam contas, sessões, limites e eventos de webhook. O token de acesso dos relatórios de visitante é armazenado como hash.

O PDF é criado sob demanda pela rota `app/api/report-pdf/route.ts` e devolvido ao navegador/e-mail; o projeto não salva um arquivo PDF permanente no bucket. Para manter cópias, exporte o D1.

Exportar todo o banco remoto para SQL:

```bash
npx wrangler d1 export astroia --remote --output=./astroia-backup.sql
```

Exportar apenas uma tabela:

```bash
npx wrangler d1 export astroia --remote --table=guest_reports --output=./guest_reports.sql
```

Importar um backup SQL em outro D1 (revise o arquivo antes, pois contém dados pessoais):

```bash
npx wrangler d1 execute astroia-novo --remote --file=./astroia-backup.sql
```

Aplicar as migrações em produção:

```bash
npx wrangler d1 migrations apply astroia --remote
```

Os relatórios contêm dados pessoais e informações de nascimento. Guarde os backups com acesso restrito e siga os prazos de retenção e obrigações de privacidade aplicáveis.

## Pastas principais

- `app/`: páginas, componentes e rotas de API.
- `lib/`: cálculo astral, interpretações, numerologia, pagamentos, e-mail e PDF.
- `db/` e `drizzle/`: esquema e migrações do banco.
- `worker/`: entrada Cloudflare Worker.
- `public/`: imagens, fontes e outros arquivos públicos.
- `tests/`: testes automatizados.
- `.env.example`: nomes de variáveis, sem credenciais.
- `wrangler.jsonc.example`: exemplo de bindings Cloudflare para completar antes da publicação.

## Scripts principais

- `npm run dev` — desenvolvimento local.
- `npm run build` — build de produção.
- `npm run start` — inicia a versão compilada, conforme suporte do runtime local.
- `npm test` — build e testes.
- `npm run lint` — lint.
- `npm run db:migrate:local` / `npm run db:migrate:remote` — migrações D1.

O código foi preparado para transferência a partir do repositório atual. Antes de publicar, revise domínio, variáveis, URL e política de privacidade da sua operação.
