# Argus — Private Job Radar

> Vigilância total, decisão precisa.

Argus é um cockpit privado de job hunting. Coleta, estrutura, pontua e acompanha oportunidades com foco total no perfil do candidato. Em vez de abrir portais e anotar em planilha, você tem um pipeline rastreável, score de aderência real e mensagem pronta para o recruiter.

---

## V3 — O que mudou

A V3 é um refactor completo de UI, arquitetura de i18n e experiência de uso:

- **Dark theme** com CSS variables (`--bg`, `--surf`, `--card`, `--gold`, `--blue`, `--emerald`, `--text`, `--muted`, `--dim`)
- **i18n bilíngue** (EN/PT) via JSON locale files com dot-notation keys e toggle no header
- **OmniSearch** (Cmd+K) com busca bilíngue, normalização de acentos e navegação por teclado
- **12 conectores de discovery** live (Siemens, Rheinmetall, BWI, Hensoldt, secunet, Rohde & Schwarz, Airbus, Bayer, SAP, Eviden, Diehl, TKMS)
- **Loading state** com hourglass animado (Suspense boundary + client gate)
- **Mobile-first** com grid responsivo, pipeline strip horizontal e sidebar compacta
- **Login com guia** step-by-step para o usuário, warning de auth não configurada
- **Status i18n** com mapeamento PT-BR (DB) → display traduzido via `statusToDisplay()`

---

## O que entrega

### Discovery automático

12 conectores buscam vagas diretamente dos portais públicos das empresas:

| Empresa | Status |
|---|---|
| Siemens | Live |
| Rheinmetall | Live |
| BWI | Live |
| Hensoldt | Live |
| secunet | Live |
| Rohde & Schwarz | Live |
| Airbus | Live |
| Bayer | Live |
| SAP | Live |
| Eviden | Live |
| Diehl | Live |
| TKMS | Live |

### Intake manual

Cole o JD cru. O Argus estrutura automaticamente: título, empresa, localização, senioridade, modelo de trabalho, idiomas, stack técnica (36+ tecnologias) e resumo.

### Motor de match

Score de 32–97 combinando cobertura de stack (até 50 pts), fit de senioridade (±15 pts), compatibilidade de localização (até 12 pts), tipo de role (até 10 pts), sinais de domínio (até 8 pts) e idioma (±6 pts). Gera strengths, risks e verdict: Alta prioridade (≥78), Boa aderência (≥62) ou Aderência parcial.

### Recruiter message multilíngue

Mensagem pronta em EN, DE e PT gerada a partir do score, stack e cover letter do candidato.

### Pipeline operacional

Estados rastreáveis: Nova → Pronta para revisar → Aplicar → Aplicada → Entrevista (+ Requer triagem). Histórico com timestamp de cada mudança.

### Digest matinal

Email diário com vagas priorizadas por score, status e motivo de destaque. Preview em `/digests`, cron automático via Vercel às 06:00 UTC.

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19, TypeScript 5 strict |
| Banco | PostgreSQL via Prisma 6 (Neon) |
| Deploy | Vercel |
| Email | Resend |
| Crawler | fetch + Cheerio |
| Auth | Sessão por senha única (cookie HTTP-only, JWT, 14 dias) |
| Estilo | Tailwind CSS v4 + CSS variables dark theme |
| i18n | JSON locale files (EN/PT) com dot-notation keys |

---

## Páginas

| Rota | Função |
|---|---|
| `/` | Home com nav cards e snapshot do perfil |
| `/control-center` | Cockpit da vaga ativa com discovery e intake |
| `/jobs` | Explorer com filtros, spotlight e preview lateral |
| `/dashboard` | Kanban por status + KPIs + top-3 |
| `/sources` | Mapa dos 12 conectores |
| `/digests` | Preview do email matinal |
| `/ops` | Readiness board de produção |
| `/jobs/[id]` | Leitura dedicada de uma vaga |
| `/login` | Autenticação com guia step-by-step |
| `/profile` | CV, cover letter e stack do candidato |

---

## Setup local

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

### Variáveis de ambiente

```bash
# Banco de dados (Neon ou qualquer Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Autenticação
ARGUS_ACCESS_PASSWORD="sua-senha-de-acesso"
ARGUS_SESSION_SECRET="string-aleatoria-longa-32-chars+"

# Email (Resend) — opcional
RESEND_API_KEY="re_..."
ARGUS_DIGEST_FROM_EMAIL="argus@seudominio.com"
ARGUS_DIGEST_TO_EMAIL="voce@email.com"

# Cron — opcional
CRON_SECRET="string-aleatoria-para-proteger-o-endpoint"
```

### Scripts

```bash
npm run dev                    # Desenvolvimento local
npm run build                  # Build de produção
npm run lint                   # ESLint
npm run typecheck              # TypeScript sem emit
npm run prisma:generate        # Gerar Prisma Client
npm run prisma:validate        # Validar schema
npm run prisma:migrate:deploy  # Aplicar migrations
```

---

## Deploy na Vercel

1. Conecte o repositório no painel da Vercel
2. Adicione as variáveis de ambiente em Settings → Environment Variables
3. O `prebuild` executa `prisma generate` automaticamente
4. O `vercel.json` configura o cron às 06:00 UTC

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Login / logout
│   │   ├── radar/jobs/     # CRUD do radar
│   │   ├── sources/        # 12 endpoints de discovery
│   │   ├── digests/        # Preview e envio
│   │   ├── profile/        # CV e cover letter
│   │   ├── ops/            # Readiness check
│   │   └── cron/           # Digest automático
│   ├── control-center/     # Cockpit + loading.tsx
│   ├── dashboard/          # Pipeline kanban
│   ├── jobs/               # Explorer + detalhe
│   ├── sources/            # Mapa de fontes
│   ├── digests/            # Preview do email
│   ├── login/              # Auth com guia
│   ├── profile/            # Perfil do candidato
│   └── ops/                # Readiness board
├── components/
│   ├── argus-workbench.tsx  # Motor de UI (jobs/dashboard/CC)
│   ├── omni-search.tsx      # OmniSearch (Cmd+K)
│   ├── app-header.tsx       # Nav com mobile drawer + i18n toggle
│   ├── app-footer.tsx       # Créditos
│   ├── page-hero.tsx        # Hero com 3 variantes
│   ├── login-form.tsx       # Form de autenticação
│   └── job-detail-workspace.tsx
└── lib/
    ├── i18n/
    │   ├── strings.ts       # Loader de locales
    │   ├── context.tsx       # useT() hook + I18nProvider
    │   └── locales/
    │       ├── en.json       # ~325 keys
    │       └── pt.json       # ~325 keys
    ├── job-intake.ts         # Parser + motor de match
    ├── radar-types.ts        # Types + statusToDisplay()
    ├── radar-store.ts        # Persistência do radar
    ├── profile-store.ts      # Perfil persistido
    ├── profile.ts            # Perfil base + fontes
    ├── daily-digest.ts       # Engine do digest
    ├── pipeline-analytics.ts # Funnel, source, timeline stats
    ├── interview-prep.ts     # Preparação de entrevista
    ├── export-candidacy.ts   # Exportação de candidatura
    ├── auth.ts               # Session management (JWT)
    ├── infrastructure.ts     # Env checks
    └── connectors/
        ├── siemens.ts
        ├── rheinmetall.ts
        ├── bwi.ts
        ├── hensoldt.ts
        ├── secunet.ts
        ├── rohde-schwarz.ts
        ├── airbus.ts
        ├── bayer.ts
        ├── sap.ts
        ├── eviden.ts
        ├── diehl.ts
        ├── tkms.ts
        └── dedup.ts
```

---

## License

MIT — veja [LICENSE](./LICENSE).

---

*Argus — built for signal over noise.*
