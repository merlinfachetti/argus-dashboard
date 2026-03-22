# Claude Instructions for Argus

Leia tambem:

- `AGENTS.md`
- `docs/product-v2.md`

## Missao

Voce esta trabalhando no Argus, um portal privado para descobrir, estruturar, priorizar e operar vagas de emprego com foco no perfil de Merlin Fachetti.

Seu trabalho nao e gerar demos bonitas. Seu trabalho e construir um produto premium, funcional e operacional, com foco real em:

- discovery de vagas
- intake manual de job descriptions
- match entre vaga e perfil
- operacao diaria via radar, dashboard e control center
- automacao por digest e crawler

## Regra principal

Sempre priorize:

1. funcionalidade real
2. clareza de uso
3. sensacao de produto premium
4. consistencia entre paginas
5. readiness de producao

Nunca priorize enfeite visual acima de usabilidade.

## Como pensar sobre o produto

Argus deve parecer uma ferramenta de operacao de alto valor, nao um dashboard genérico.

A experiencia precisa comunicar:

- foco
- prioridade
- decisao
- controle
- velocidade

Cada area do produto deve ajudar o usuario a responder uma pergunta objetiva:

- `Jobs`: o que vale investigar agora?
- `Dashboard`: onde estao minhas prioridades e gargalos?
- `Control Center`: o que eu faco com esta vaga agora?
- `Job Detail`: qual o contexto completo desta oportunidade?
- `Sources`: o que esta vivo no discovery e o que ainda falta ligar?
- `Digests`: o que preciso revisar e agir pela manha?
- `Ops`: o que ainda impede orgulho total em producao?

## UX e UI

Ao trabalhar interface:

- evite paginas poluidas, apertadas ou cheias de caixas sem hierarquia
- crie respiro visual real
- use poucas decisoes visuais, mas fortes e consistentes
- faca cada pagina ter uma funcao clara
- evite repetir o mesmo bloco visual sem intencao
- mantenha o produto moderno, premium e operacional

### O que evitar

- cara de template
- tabela seca sem contexto
- excesso de texto introdutorio
- gradientes sem funcao
- cards demais sem prioridade
- varias acoes brigando entre si

### O que buscar

- headers claros
- secoes bem separadas
- previews uteis
- spotlight das melhores vagas
- proximo passo evidente
- sinais visuais de prioridade, stage e acao

## Forma de trabalhar

Quando receber uma tarefa:

1. entenda em qual parte do produto ela impacta
2. preserve a logica atual se ela ja estiver funcionando
3. melhore primeiro a experiencia principal, nao os detalhes perifericos
4. valide sempre com `lint`, `typecheck` e `build`
5. commit e push quando a rodada estiver consistente

## Fluxos criticos do produto

Sempre trate estes fluxos como sagrados:

### 1. Intake manual

O usuario cola um JD cru.

O sistema deve:

- estruturar a vaga
- calcular match
- gerar mensagem
- salvar no radar

### 2. Discovery real

O sistema coleta em fontes reais.

O fluxo deve:

- buscar listagem
- enriquecer detalhe quando possivel
- normalizar dados
- inserir no radar

### 3. Vaga ativa

No `Control Center`, a vaga ativa deve ser o centro da experiencia.

Ela precisa mostrar com clareza:

- signal
- stage
- next move
- match
- mensagem
- historico

### 4. Operacao diaria

O radar precisa sustentar:

- filtros
- ordenacao
- historico
- mudanca de status
- comparacao
- exploracao rapida

## Estado atual do produto

Hoje o produto ja tem:

- auth privada
- shell premium
- `Jobs`, `Dashboard`, `Control Center`, `Job Detail`, `Sources`, `Digests`, `Ops`
- radar persistente
- historico de status
- digest diario em codigo
- discovery real para Siemens, Rheinmetall e BWI
- fontes catalogadas para proximas ondas

Ao trabalhar, nao trate o projeto como MVP inicial. Trate como V2 em consolidacao.

## Prioridades de engenharia

Sempre considere estas prioridades:

### Alta

- nao quebrar fluxos existentes
- manter persistencia do radar
- manter match e recruiter message funcionando
- manter auth funcional
- manter build de producao verde

### Media

- ampliar discovery live
- melhorar ranking e heuristicas
- deixar docs e ops refletirem a realidade

### Baixa

- micro detalhes esteticos sem impacto funcional

## Deploy e producao

Sempre lembre:

- o projeto deve rodar bem na Vercel
- o banco usa Prisma + Postgres
- build usa `prebuild: prisma generate`
- existem envs obrigatorias para fechar producao real

As envs criticas sao:

- `DATABASE_URL`
- `DIRECT_URL`
- `ARGUS_ACCESS_PASSWORD`
- `ARGUS_SESSION_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `ARGUS_DIGEST_FROM_EMAIL`
- `ARGUS_DIGEST_TO_EMAIL`

## Conectores e crawler

Ao trabalhar em fontes:

- prefira listagem publica simples
- enriqueça o detalhe quando possivel
- normalize sempre para o mesmo contrato interno
- preserve fallback manual como fluxo de seguranca

Nao assuma que todos os portais suportam o mesmo tipo de crawler.

## Definition of done

Uma tarefa so esta realmente pronta quando:

- entrega valor real no produto
- melhora a experiencia principal
- nao degrada consistencia visual
- passa `lint`
- passa `typecheck`
- passa `build`
- fica documentada se mudar comportamento relevante

## Estilo de resposta esperado do Claude

Seja:

- objetivo
- pragmatico
- assertivo
- orientado a produto

Evite:

- longas explicacoes teoricas
- enrolacao
- sugestoes vagas
- alternativas demais quando uma direcao clara ja existe

## Direcao final

Sempre trabalhe para que o Argus pareca:

- caro
- confiavel
- rapido
- focado
- unico

Mas lembre:

o que vai fazer o produto valer dinheiro de verdade nao e o brilho visual sozinho. E a combinacao de discovery, estruturacao, match, operacao e automacao funcionando como uma unica maquina.
