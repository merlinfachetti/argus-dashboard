# Argus — Implementation Roadmap

## Status atual (março 2026)

O produto saiu do MVP e está em consolidação V2. As fases 0–1 estão completas. Fase 2 (discovery) está parcialmente entregue. Fases 3–4 em andamento.

---

## Fase 0 — Bootstrap ✅ Completo

- Definição de produto e escopo do MVP
- Nome, estrutura de projeto e foundation Next.js
- Perfil base bootstrappado de CV e dados LinkedIn
- Primeiros portais-alvo catalogados

---

## Fase 1 — Core flow ✅ Completo

- Intake manual de JD com parser heurístico
- Motor de match com score 32–97, verdict e análise dinâmica
- Recruiter message em EN, DE e PT
- Dashboard UI com kanban e pipeline
- Autenticação privada por senha com sessão HTTP-only
- Radar persistido no banco (Prisma + Postgres)
- Histórico de status por vaga (JobStatusEvent)
- Interface V2 mobile-first: header com nav drawer, Control Center como cockpit, Jobs Explorer, Dashboard kanban

---

## Fase 2 — Source ingestion 🔄 Parcial

**Entregue:**
- Conector Siemens (listagem pública alemã + enriquecimento por vaga)
- Conector Rheinmetall (listagem + detalhe)
- Conector BWI (Stellenangebote + detalhe)
- Pipeline normalizado de ingestion
- 12 portais adicionais catalogados com estratégia definida

**Pendente:**
- [ ] Conector Hensoldt (pronto para implementar — listagem mapeada)
- [ ] Conector Rohde & Schwarz
- [ ] Conector secunet
- [ ] Conector Airbus
- [ ] Retries e failure logging por fonte
- [ ] Deduplicação mais robusta por externalId + título

---

## Fase 3 — Automation & intelligence 🔄 Parcial

**Entregue:**
- Digest diário com preview, persistência e envio manual
- Cron automático via Vercel (`vercel.json`)
- Motor de match reescrito com 36 skills, scoring granular e análise dinâmica
- Recruiter message multilíngue regenerada por idioma no CC

**Pendente:**
- [ ] Gap analysis por vaga — identificar qual skill falta e sugerir posicionamento
- [ ] Cover letter personalizada por vaga (LLM opcional)
- [ ] Cronômetro de follow-up por vaga aplicada
- [ ] Score de timing (data publicação + velocidade histórica da empresa)
- [ ] Alertas proativos para vagas score ≥80 (webhook ou email imediato)
- [ ] Matching semântico via LLM (Claude Haiku) como camada opcional

---

## Fase 4 — Production platform 🔄 Em andamento

**Entregue:**
- Repositório GitHub com CI (lint, typecheck, build)
- Deploy Vercel configurado e ativo
- Build resiliente a falhas de `prisma generate` sem `DATABASE_URL`
- `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` no `vercel.json`

**Pendente:**
- [ ] Branch protection e required checks no GitHub
- [ ] Preview deploys por PR (GitHub + Vercel integration)
- [ ] Observabilidade de falhas de crawler (logs estruturados)
- [ ] Rate limiting nas rotas de discovery

---

## Fase 5 — Intelligence layer (não iniciada)

Funcionalidades que transformam o Argus de operacional em estratégico:

### 5.1 Análise de pipeline histórico
- Taxa de conversão por empresa, score range e fonte
- Tempo médio entre cada status
- "Qual empresa responde quando tenho score ≥X?"

### 5.2 Modo de preparação para entrevista
- Ativar no status "Entrevista"
- Perguntas típicas por empresa (base curada + LLM)
- Checklist de pesquisa: produto, tech stack, cultura, notícias recentes
- Histórico do processo (quem contactou, quando, sobre o quê)

### 5.3 Digest semanal de mercado
- Volume de vagas por empresa na semana
- Tendências de stack nos JDs coletados
- Novas fontes ativas vs. fontes degradadas

### 5.4 Exportação de candidatura
- Agrupa: CV base, cover letter customizada, recruiter message, link, checklist
- Pronto para copiar ou exportar como PDF

### 5.5 Score de mercado contextual
- Combinar score de aderência com: senioridade pedida vs. oferecida, data publicação, histórico de response rate da empresa
- Score composto que considera urgência + oportunidade + esforço

---

## Fase 6 — Multi-perfil e colaboração (roadmap futuro)

- Suporte a múltiplos perfis de candidato (diferentes stacks/senioridades)
- Modo compartilhado para orientação de carreira (mentor + candidato)
- Exportação de relatório de busca ativa para terceiros

---

## Prioridades imediatas (próximas sessões)

1. **Fix contraste Tailwind v4** — converter todas as funções `*Tone()` para `style` inline (em progresso)
2. **Página Sources melhorada** — quick-intake inline + links diretos para career pages
3. **Conector Hensoldt** — primeiro da segunda onda, estrutura já conhecida
4. **Gap analysis básico** — versão simples: listar skills do JD não cobertas pelo perfil com sugestão de posicionamento
5. **Cover letter por vaga** — parágrafo customizado gerado a partir do JD estruturado

---

## Decisões técnicas registradas

| Decisão | Motivo |
|---|---|
| App Router (Next.js 16) | Server Components + streaming, colocação de API routes |
| Prisma 6 + Postgres | Type-safety no acesso a dados, migrations versionadas |
| Tailwind v4 | Tokens CSS nativos, sem config file |
| Inline styles para cores dinâmicas | Tailwind v4 JIT não gera classes em template strings dinâmicas |
| fetch + Cheerio para crawlers | Zero dependências pesadas, controlável por portal |
| Resend para email | API simples, bom deliverability, tier gratuito adequado |
| Cookie HTTP-only para sessão | Proteção contra XSS sem biblioteca de auth externa |
| `prebuild: prisma generate \|\| echo` | Build não aborta sem DATABASE_URL no CI |
