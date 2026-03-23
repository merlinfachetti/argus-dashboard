# Argus — Private Job Radar

> Um cockpit privado para transformar job hunting em operação de elite.

Argus não é um agregador de vagas. É uma ferramenta de operação — coleta, estrutura, prioriza, pontua e acompanha oportunidades com foco total no perfil do candidato. Em vez de abrir 12 abas e anotar em planilha, você tem um pipeline rastreável, um score de aderência real e uma mensagem pronta para o recruiter.

---

## O problema que resolve

Job hunting manual é um sistema quebrado por design:

- Vagas espalhadas em 10+ portais sem estrutura comum
- Nenhuma leitura objetiva de "vale meu tempo ou não?"
- Copy-paste de CV para cada aplicação
- Perda de contexto entre abordagem, resposta e follow-up
- Sem noção do que está ativo, pausado ou morto no pipeline

Argus comprime esse custo. O ganho não está em achar mais vagas — está em eliminar fricção repetitiva de toda a rotina diária.

---

## O que entrega hoje

### Discovery automático

Três conectores reais buscam vagas diretamente dos portais públicos das empresas:

| Empresa | Estratégia |
|---|---|
| **Siemens** | Crawler da listagem pública alemã com enriquecimento por vaga |
| **Rheinmetall** | Listagem pública com detalhe enriquecido direto da vaga |
| **BWI** | Stellenangebote portal com captura e enriquecimento por item |

Mais 12 portais catalogados e prontos para os próximos conectores: Hensoldt, Bayer, SAP, Eviden, Utimaco, Hornetsecurity, G DATA, Rohde & Schwarz, secunet, Diehl, TKMS e Airbus.

### Intake manual

Quando o crawler não alcança — vaga chegou por email, portal fechado ou indicação — você cola o JD cru. O Argus estrutura automaticamente:

- Título, empresa, localização, senioridade
- Modelo de trabalho e tipo de contrato
- Idiomas requeridos
- Stack técnica (36 tecnologias mapeadas)
- Resumo da vaga (até 600 chars de contexto real)

### Motor de match

Não é só keyword matching. O score combina:

- **Cobertura de stack** — quantas das skills pedidas você tem (até 50 pts)
- **Fit de senioridade** — Senior/Lead bônus, Junior penalidade (até 15 pts)
- **Compatibilidade de localização** — Remote Germany, Hybrid, NRW próximo (até 12 pts)
- **Tipo de role** — Software/Platform/SRE sinaliza aderência (até 10 pts)
- **Sinais de domínio** — automação, reliability, liderança cruzando perfil×vaga (até 8 pts)
- **Idioma** — bônus por alemão disponível, risco se exigido sem declaração (±6 pts)

O resultado é um score de 32–97 com verdict: **Alta prioridade** (≥78), **Boa aderência** (≥62) ou **Aderência parcial**.

Além do número, o sistema gera:

- **Strengths dinâmicos** — o que especificamente favorece nessa vaga
- **Risks dinâmicos** — gaps reais de stack, idioma e escopo de seniority

### Recruiter message multilíngue

Mensagem pronta para abordar o recruiter gerada em três idiomas:

- 🇬🇧 **EN** — padrão para portais internacionais
- 🇩🇪 **DE** — tom formal alemão (`Guten Tag`, `Sie-Form`)
- 🇧🇷 **PT** — natural para recrutadores brasileiros

Seletor de idioma inline no Control Center. A mensagem usa o score real, o stack atual e o foco da cover letter.

### Pipeline operacional

Cada vaga no radar passa por estados rastreáveis:

```
Nova → Pronta para revisar → Aplicar → Aplicada → Entrevista
                          ↘ Requer triagem
```

Histórico de cada mudança de status com timestamp. Avanço rápido direto no kanban do Dashboard.

### Digest matinal

Todo dia útil o Argus consolida o radar e envia um email com:

- Vagas priorizadas por score
- Status atual de cada item
- Motivo de destaque de cada oportunidade

Preview em `/digests`, envio manual via API, cron automático via Vercel às 06:00 UTC (07:00/08:00 Berlin dependendo do horário de verão).

---

## Arquitetura de produto

```
┌─────────────────────────────────────────────────────────┐
│                        ARGUS V2                         │
├──────────────┬──────────────────┬───────────────────────┤
│   Discovery  │   Intake manual  │   Perfil ativo        │
│   (crawlers) │   (JD paste)     │   (CV + cover letter) │
└──────┬───────┴────────┬─────────┴──────────┬────────────┘
       │                │                    │
       ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                   Motor de intake                       │
│   parseJobDescription → analyzeJobMatch → buildMessage  │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      Radar (DB)                         │
│   JobPosting + JobMatch + JobStatusEvent + DailyDigest  │
└──────┬───────────┬──────────┬────────────┬──────────────┘
       │           │          │            │
       ▼           ▼          ▼            ▼
   /jobs       /dashboard  /control-   /digests
   Explorer    Pipeline    center      Morning
                           Cockpit     review
```

### Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 strict |
| Banco | PostgreSQL via Prisma 6 |
| Deploy | Vercel (edge-ready) |
| Email | Resend |
| Crawler | fetch + Cheerio |
| Auth | Sessão privada por senha (cookie HTTP-only) |
| Estilo | Tailwind CSS v4 |

---

## Páginas e áreas

| Rota | Função | Pergunta que responde |
|---|---|---|
| `/` | Home com nav cards e snapshot do perfil | Onde começo? |
| `/control-center` | Cockpit da vaga ativa | O que faço com essa vaga agora? |
| `/jobs` | Explorer com filtros, spotlight e preview | Qual vaga vale investigar? |
| `/dashboard` | Kanban por status + KPIs + top-3 | Onde estão meus gargalos? |
| `/sources` | Mapa dos conectores (live + fila) | O que está sendo coletado? |
| `/digests` | Preview do email matinal | O que preciso revisar hoje? |
| `/ops` | Readiness board de produção | O que ainda bloqueia orgulho total? |
| `/jobs/[id]` | Leitura dedicada de uma vaga | Qual o contexto completo? |

---

## Setup local

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

### Variáveis obrigatórias

```bash
# Banco de dados (Supabase, Neon, Railway ou qualquer Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
DIRECT_URL="postgresql://user:pass@host:5432/db?schema=public"

# Autenticação privada
ARGUS_ACCESS_PASSWORD="sua-senha-privada"
ARGUS_SESSION_SECRET="string-aleatoria-longa-32-chars+"

# Email (Resend)
RESEND_API_KEY="re_..."
ARGUS_DIGEST_FROM_EMAIL="argus@seudominio.com"
ARGUS_DIGEST_TO_EMAIL="voce@email.com"

# Cron (Vercel)
CRON_SECRET="string-aleatoria-para-proteger-o-endpoint"
```

### Banco

```bash
# Aplicar migrations em produção
npm run prisma:migrate:deploy

# Gerar client após mudanças no schema
npm run prisma:generate
```

### Scripts disponíveis

```bash
npm run dev              # Desenvolvimento local
npm run build            # Build de produção
npm run lint             # ESLint
npm run typecheck        # TypeScript sem emit
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:validate  # Validar schema
npm run prisma:migrate:deploy  # Aplicar migrations
```

---

## Deploy na Vercel

1. Conecte o repositório no painel da Vercel
2. Adicione todas as variáveis de ambiente em **Settings → Environment Variables**
3. O `prebuild` executa `prisma generate` automaticamente
4. O `vercel.json` já configura o cron às 06:00 UTC

> ⚠️ `DATABASE_URL` precisa estar configurada no Vercel mesmo para o build step funcionar. O Prisma precisa gerar os tipos durante o build.

---

## Modelo de dados

```prisma
CandidateProfile   — perfil base do candidato (CV, stack, idiomas)
JobSource          — portais catalogados com estratégia de crawler
JobPosting         — vagas coletadas ou inseridas manualmente
JobMatch           — score, verdict, strengths, risks e recruiterMessage
JobStatusEvent     — histórico de mudanças de status
DailyDigest        — digest diário persistido para auditoria
```

---

## CI/CD

O GitHub Actions roda em cada push:

1. `npm run typecheck` — TypeScript
2. `npm run lint` — ESLint
3. `npm run build` — Build de produção

O Vercel faz deploy automático em cada merge na `main`.

---

## Próximas etapas e roadmap

### Fase atual — consolidação operacional

- [x] Motor de match com 36 skills e scoring granular
- [x] Recruiter message em EN/DE/PT
- [x] Conectores reais: Siemens, Rheinmetall, BWI
- [x] Pipeline com kanban, histórico e avanço rápido
- [x] Digest matinal com cron e preview
- [x] Interface mobile-first com nav drawer
- [x] DB persistido com Prisma + Postgres
- [ ] Fix definitivo de contraste em elementos dinâmicos (Tailwind v4 JIT)
- [ ] Quick-intake integrado na página Sources

### Próxima onda — expansão de discovery

Conectores a implementar por prioridade:

| Empresa | Prioridade | Estratégia |
|---|---|---|
| **Hensoldt** | Alta — já mapeado | Listagem pública + detalhe por vaga |
| **Rohde & Schwarz** | Alta | Careers hub com filtro por área |
| **secunet** | Alta — cybersecurity fit | Listagem pequena, parseable |
| **Airbus** | Média | Hub corporativo complexo |
| **Bayer** | Média | API interna ou crawler de listing |
| **SAP** | Média | Filtros de locale no portal público |

### Diferenciais que mudam o jogo

As funcionalidades abaixo são o que transformam o Argus de "ferramenta útil" em "produto que nenhum outro candidato tem":

#### 1. Gap analysis por vaga
Não apenas dizer o score — identificar **qual skill específica** está faltando e sugerir como demonstrá-la ou compensá-la na abordagem. Ex: "Kubernetes não declarado no CV, mas há experiência Docker que pode ser posicionada como fundação."

#### 2. Matching semântico com LLM
O motor atual é baseado em regex + heurísticas. Com um passo de LLM (Claude Haiku para custo baixo), o match passaria a entender contexto real — "5 anos de liderança técnica" é equivalente a "Team Lead experience required".

#### 3. Cronômetro de follow-up
Para cada vaga no status "Aplicada", disparar um lembrete no digest após N dias sem resposta. Parâmetro configurável por empresa (FAANG: 2 semanas, startup: 5 dias).

#### 4. Score de timing de mercado
Combinar data de publicação da vaga com histórico de filling time por empresa. Vagas com >21 dias tendem a ter processo mais lento — comunicar isso no score.

#### 5. Análise de padrões do pipeline
Dashboard com métricas históricas: taxa de conversão por empresa, por score range, por fonte. Responde "Siemens responde quando tenho score ≥85?" com dado real, não intuição.

#### 6. Cover letter personalizada por vaga
Em vez de uma cover letter base, gerar um parágrafo customizado para cada vaga usando o JD estruturado + perfil + análise de fit. Editável antes de copiar.

#### 7. Modo de preparação para entrevista
Para vagas em status "Entrevista", ativar um modo especial no Control Center: perguntas típicas da empresa (via LLM ou base curada), checklist de pesquisa sobre a empresa e produto, histórico do processo.

#### 8. Digest semanal de mercado
Além do digest diário de vagas, um resumo semanal com: novas fontes ativas, volume por empresa, tendências de stack nos JDs coletados. Inteligência de mercado, não só operação.

#### 9. Exportação para candidatura
Botão "Preparar candidatura" que agrupa: CV base, cover letter customizada, recruiter message no idioma certo, link da vaga e checklist de aplicação. Pronto para copiar ou imprimir.

#### 10. Alertas proativos
Webhook ou email imediato quando uma vaga de alta prioridade (score ≥80) aparece no discovery — sem esperar o digest matinal.

---

## Por que o Argus tem valor real

A maioria dos candidatos senior gasta 4–6 horas por semana em hunting manual: abrir portais, ler JDs, avaliar fit, escrever mensagens, manter controle em planilha. O Argus comprime isso para 20–30 minutos de operação diária com mais informação e menos decisão bruta.

O diferencial não é ter uma UI bonita. É ter um sistema que:

1. **Descobre antes** — conectores puxam vagas novas antes de você abrir o portal
2. **Prioriza melhor** — score objetivo elimina o "será que vale meu tempo?"
3. **Opera mais rápido** — recruiter message pronta, status rastreado, contexto preservado
4. **Aprende com o tempo** — histórico de pipeline revela padrões que intuição não captura

Para um profissional senior em busca ativa no mercado alemão, isso é vantagem competitiva real — não ferramenta de conveniência.

---

## Estrutura do projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # Login / logout
│   │   ├── radar/jobs/     # CRUD do radar
│   │   ├── sources/        # Endpoints de discovery
│   │   ├── digests/        # Preview e envio
│   │   ├── profile/        # CV e cover letter
│   │   ├── ops/            # Readiness check
│   │   └── cron/           # Digest automático
│   ├── control-center/     # Cockpit principal
│   ├── dashboard/          # Pipeline kanban
│   ├── jobs/               # Explorer + detalhe
│   ├── sources/            # Mapa de fontes
│   ├── digests/            # Preview do email
│   └── ops/                # Readiness board
├── components/
│   ├── argus-workbench.tsx # Motor de UI (jobs/dashboard/CC)
│   ├── job-detail-workspace.tsx
│   ├── app-header.tsx      # Nav com mobile drawer
│   ├── page-hero.tsx       # Hero com 3 variantes
│   └── ...
└── lib/
    ├── job-intake.ts       # Parser + motor de match
    ├── radar-store.ts      # Persistência do radar
    ├── profile-store.ts    # Perfil persistido
    ├── profile.ts          # Perfil base + fontes
    ├── daily-digest.ts     # Engine do digest
    ├── ops-readiness.ts    # Checks de produção
    ├── infrastructure.ts   # Env checks
    ├── auth.ts             # Session management
    └── connectors/
        ├── siemens.ts
        ├── rheinmetall.ts
        └── bwi.ts
```

---

*Argus — built for signal over noise.*
