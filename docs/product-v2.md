# Argus V2

## Visao geral

Argus e um portal privado para descobrir, estruturar, priorizar e operar vagas de emprego com foco no perfil de Merlin Fachetti.

O produto junta quatro frentes em um unico workspace:

- descoberta de vagas em portais reais
- intake manual de job descriptions baguncados
- match entre vaga e perfil do candidato
- operacao diaria com radar, status, historico e digest

Em vez de funcionar como um painel passivo, o objetivo do Argus e operar como uma mesa de decisao:

- encontrar oportunidades cedo
- dizer o que vale atacar agora
- facilitar outreach e aplicacao
- manter o pipeline de vagas limpo e rastreavel

## O que a V2 entrega hoje

### Produto e experiencia

- shell visual premium com header, footer, heroes e navegacao por paginas
- autenticacao privada por senha com sessao protegida
- pagina `Jobs` como explorer operacional
- pagina `Dashboard` como board de prioridade e pipeline
- pagina `Control Center` como cockpit principal da vaga ativa
- pagina `Job Detail` para leitura dedicada de uma vaga
- pagina `Sources` para governanca das fontes de discovery
- pagina `Digests` para preview do email diario
- pagina `Ops` para readiness operacional

### Inteligencia de vaga

- parser heuristico para transformar JD cru em estrutura
- extracao de:
  - titulo
  - empresa
  - localizacao
  - senioridade
  - work model
  - employment type
  - idiomas
  - skills
  - resumo
- score de match com verdict
- strengths e risks
- mensagem sugerida para recruiter
- recalculo dinamico quando CV e cover letter mudam

### Operacao do radar

- radar de vagas com persistencia
- status editavel por vaga
- historico de status
- snapshot operacional da vaga ativa
- filtros por origem, tipo de intake, score e senioridade
- comparativo das melhores vagas
- spotlight automatico no explorer

### Discovery e fontes

Fontes com discovery real implementado:

- Siemens
- Rheinmetall
- BWI

Fontes catalogadas no inventario para proximas ondas:

- Bayer
- SAP
- Hensoldt
- Eviden
- Utimaco
- Hornetsecurity
- G DATA
- Rohde & Schwarz
- secunet
- Diehl
- TKMS
- Airbus

### Automacao e plataforma

- digest diario com preview
- endpoint de envio manual do digest
- rota de cron protegida por `CRON_SECRET`
- baseline de banco com Prisma
- CI com `lint`, `typecheck` e `build`
- deploy pronto para Vercel

## Como o produto funciona

## 1. Entrada da vaga

O Argus recebe vagas por dois caminhos principais.

### Discovery real

Quando a empresa tem listagem publica utilizavel, o sistema:

- busca a listagem
- extrai cards de vagas
- enriquece o detalhe quando a fonte permite
- normaliza os dados
- calcula match
- joga o resultado no radar

### Intake manual

Quando o crawler nao e possivel ou a vaga chegou por outra via, o usuario:

- cola o texto do JD
- o Argus estrutura a vaga
- gera score, verdict e mensagem
- persiste o item no radar

## 2. Estruturacao e match

O motor de job intake usa heuristicas para transformar texto cru em um objeto de vaga. Depois disso:

- compara a vaga com o perfil ativo
- cruza stack, idiomas, contexto e sinais de experiencia
- produz score, verdict, strengths e risks
- gera um texto inicial de abordagem para recruiter

O match nao promete contratacao. Ele entrega uma leitura de prioridade e aderencia para reduzir tempo perdido.

## 3. Vaga ativa

No `Control Center`, uma vaga vira a referencia principal do trabalho.

Ela passa a mostrar:

- signal atual
- stage atual
- proximo passo recomendado
- ultimo toque
- resumo
- match
- mensagem
- historico

## 4. Radar e pipeline

Todas as vagas processadas entram no radar. A partir dai:

- podem ser filtradas e ordenadas
- podem mudar de status
- geram historico
- podem ser abertas no `Jobs`, `Dashboard` ou `Control Center`

## 5. Digest diario

O digest diario:

- puxa vagas priorizadas do radar
- resume contexto e motivos
- gera HTML e texto
- pode ser visualizado na pagina `/digests`
- pode ser enviado manualmente
- pode ser executado por cron

## Paginas da aplicacao

## Home `/`

Entrega a tese do produto e direciona para as areas principais.

Deve entregar:

- entendimento rapido do valor do produto
- navegacao clara para areas operacionais

## Login `/login`

Entrada privada do portal.

Deve entregar:

- protecao do workspace
- feedback visual de senha
- animacao de entrada consistente com a identidade do produto

## Control Center `/control-center`

Cockpit principal de operacao.

Deve entregar:

- uma vaga ativa como foco
- intake manual e discovery real sem poluicao
- decisao rapida sobre atacar, revisar ou manter no radar

## Jobs `/jobs`

Explorer de vagas.

Deve entregar:

- busca global
- filtros locais
- spotlight das melhores vagas
- preview de decisao
- acesso rapido ao detalhe e ao control center

## Job Detail `/jobs/[jobId]`

Leitura dedicada de uma vaga.

Deve entregar:

- visao individual da oportunidade
- contexto para aprofundar antes da aplicacao

## Dashboard `/dashboard`

Pipeline visual e board de prioridade.

Deve entregar:

- leitura horizontal do pipeline
- gargalos por estagio
- vagas mais fortes do radar

## Sources `/sources`

Mapa das fontes do crawler.

Deve entregar:

- quais fontes estao live
- quais ainda estao catalogadas
- qual a estrategia por portal

## Digests `/digests`

Workspace de preview do email diario.

Deve entregar:

- preview do conteudo diario
- leitura do que sera enviado
- identificacao de bloqueios de configuracao

## Ops `/ops`

Painel de readiness.

Deve entregar:

- o que ja esta pronto
- o que ainda bloqueia producao plena
- quais envs e configuracoes faltam

## APIs atuais

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`

Perfil:

- `GET /api/profile`
- `POST /api/profile`

Radar:

- `GET /api/radar/jobs`
- `POST /api/radar/jobs`
- `POST /api/radar/jobs/[jobId]/status`

Sources:

- `GET /api/sources/siemens/discover`
- `GET /api/sources/rheinmetall/discover`
- `GET /api/sources/bwi/discover`

Digest:

- `GET /api/digests/today`
- `POST /api/digests/send`
- `GET /api/cron/daily-digest`

Ops:

- `GET /api/ops/readiness`

## Modelo de dados

O schema Prisma atual cobre:

- `CandidateProfile`
- `JobSource`
- `JobPosting`
- `JobMatch`
- `JobStatusEvent`
- `DailyDigest`

Isso permite:

- persistir perfil
- persistir vagas
- guardar match por vaga
- registrar historico de status
- versionar digests diarios

## Ambiente e operacao

Variaveis principais:

- `DATABASE_URL`
- `DIRECT_URL`
- `ARGUS_ACCESS_PASSWORD`
- `ARGUS_SESSION_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `ARGUS_DIGEST_FROM_EMAIL`
- `ARGUS_DIGEST_TO_EMAIL`

Scripts principais:

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run prisma:migrate:deploy`

## Estado atual da V2

Ja entregue:

- identidade visual premium em todas as areas principais
- auth privada
- radar persistente com historico
- digest diario pronto em codigo
- 3 conectores reais
- explorer, dashboard e control center em nivel muito melhor de UX

Ainda parcialmente dependente de configuracao externa:

- banco de producao real conectado
- envs reais de email
- migrations aplicadas no banco alvo
- branch protection e governanca final do GitHub

## O que cada modulo deve entregar

### Auth

Deve proteger o portal sem atrito desnecessario.

### Profile engine

Deve refletir o CV e a cover letter ativos e recalcular o match automaticamente.

### Job intake

Deve aceitar texto imperfeito e transformar isso em estrutura util.

### Match engine

Deve orientar decisao, nao apenas exibir numero.

### Radar

Deve ser a fonte unica de verdade das vagas em operacao.

### Jobs explorer

Deve reduzir tempo para encontrar a melhor oportunidade.

### Dashboard

Deve mostrar prioridades, gargalos e estado do pipeline.

### Control Center

Deve ser o lugar onde a vaga e realmente trabalhada.

### Digests

Deve transformar o radar num ritual diario de revisao e acao.

### Sources

Deve deixar claro o estado da malha de discovery.

### Ops

Deve mostrar readiness com honestidade e objetividade.

## Proximos passos

## Prioridade 1: fechar producao real

- configurar `DATABASE_URL` e `DIRECT_URL`
- aplicar `npm run prisma:migrate:deploy`
- configurar `RESEND_API_KEY`
- configurar `ARGUS_DIGEST_FROM_EMAIL` e `ARGUS_DIGEST_TO_EMAIL`
- validar cron real na Vercel

## Prioridade 2: ampliar discovery live

- Rohde & Schwarz
- Airbus
- secunet
- Bayer ou SAP como fonte corporativa de alto valor

## Prioridade 3: endurecer a operacao

- retries por fonte
- observabilidade de falhas de crawler
- deduplicacao mais forte
- pagina de historico de coletas

## Prioridade 4: elevar inteligencia

- parser mais robusto por LLM quando desejado
- ranking semantico mais forte
- gap analysis mais sofisticado
- mensagens de outreach por tipo de empresa e vaga

## Prioridade 5: fechar governanca de engenharia

- branch protection real
- required checks obrigatorios
- auto-merge controlado
- preview deploys por PR

## Resumo executivo

Argus V2 ja deixou de ser um MVP cru.

Hoje ele ja e:

- um portal privado
- um radar operacional
- um explorer de vagas
- um control center
- um dashboard de prioridade
- uma base pronta para crawler multi-fonte
- uma base pronta para digest diario

O que falta para a visao completa nao e mais definicao de produto. E fechamento operacional externo, expansao de conectores e refinamento da inteligencia.
