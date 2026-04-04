// ─── Argus i18n — EN (default) + PT-BR ───────────────────────────────────────
// Princípio: EN é o default e o idioma de produção.
// PT-BR é suporte completo para usuário brasileiro.
// Dados de vagas (JDs, títulos) permanecem no idioma original.

export type Lang = "en" | "pt";

export const strings = {
  // ── Nav ─────────────────────────────────────────────────────────────────────
  nav: {
    home:          { en: "Home",           pt: "Início" },
    controlCenter: { en: "Control Center", pt: "Centro de Controle" },
    dashboard:     { en: "Dashboard",      pt: "Dashboard" },
    jobs:          { en: "Jobs",           pt: "Vagas" },
    digests:       { en: "Digests",        pt: "Digests" },
    sources:       { en: "Sources",        pt: "Fontes" },
    ops:           { en: "Ops",            pt: "Ops" },
    logout:        { en: "Sign out",       pt: "Sair" },
    search:        { en: "Search jobs...", pt: "Buscar vagas..." },
  },

  // ── Header / global ─────────────────────────────────────────────────────────
  global: {
    loading:    { en: "Loading...",    pt: "Carregando..." },
    error:      { en: "Error",         pt: "Erro" },
    save:       { en: "Save",          pt: "Salvar" },
    cancel:     { en: "Cancel",        pt: "Cancelar" },
    open:       { en: "Open",          pt: "Abrir" },
    back:       { en: "Back",          pt: "Voltar" },
    copy:       { en: "Copy",          pt: "Copiar" },
    copied:     { en: "✓ Copied",      pt: "✓ Copiado" },
    send:       { en: "Send",          pt: "Enviar" },
    retry:      { en: "Retry",         pt: "Tentar novamente" },
    clearFilters: { en: "Clear filters", pt: "Limpar filtros" },
    noResults:  { en: "No results",    pt: "Sem resultados" },
    live:       { en: "live",          pt: "ativo" },
    all:        { en: "All",           pt: "Todos" },
    active:     { en: "active",        pt: "ativo" },
  },

  // ── Home ────────────────────────────────────────────────────────────────────
  home: {
    headline:     { en: "Private job radar.",                       pt: "Radar privado de vagas." },
    subheadline:  { en: "Argus — private cockpit for job hunting.", pt: "Argus — cockpit privado para job hunting." },
    description:  { en: "Real discovery, fit score, recruiter message and trackable pipeline in one place.", pt: "Discovery real, score de aderência, mensagem para recruiter e pipeline rastreável em um lugar." },
    openCC:       { en: "Open Control Center", pt: "Abrir Centro de Controle" },
    viewJobs:     { en: "View Jobs",           pt: "Ver Vagas" },
    liveSources:  { en: "Live sources",        pt: "Fontes ativas" },
    stack:        { en: "Profile stack",       pt: "Stack do perfil" },
    profile:      { en: "Profile",             pt: "Perfil" },
    languages:    { en: "Languages",           pt: "Idiomas" },
    operate:      { en: "Operate",             pt: "Operar" },
    explore:      { en: "Explore",             pt: "Explorar" },
    pipeline:     { en: "Pipeline",            pt: "Pipeline" },
    goTo:         { en: "Go →",                pt: "Acessar →" },
  },

  // ── Jobs mode ───────────────────────────────────────────────────────────────
  jobs: {
    title:         { en: "Jobs — search, filter, prioritise.",  pt: "Vagas — buscar, filtrar, priorizar." },
    searchPlaceholder: { en: "Filter list...", pt: "Filtrar lista..." },
    allResults:    { en: "All results",         pt: "Todos os resultados" },
    searchActive:  { en: "Search:",             pt: "Busca:" },
    noResults:     { en: "No jobs found for current filters", pt: "Nenhuma vaga para os filtros atuais" },
    radarEmpty:    { en: "Radar empty",          pt: "Radar vazio" },
    radarEmptyHint: { en: "Add jobs via Control Center to start the radar.", pt: "Adicione vagas pelo Centro de Controle para começar o radar." },
    goToCC:        { en: "Go to Control Center", pt: "Ir para Centro de Controle" },
    preview:       { en: "In focus",             pt: "Em foco" },
    operateInCC:   { en: "Operate in CC",        pt: "Operar no CC" },
    viewDetail:    { en: "View detail",          pt: "Ver detalhe" },
    match:         { en: "Match",                pt: "Match" },
    selectJob:     { en: "Select a job to preview", pt: "Selecione uma vaga para ver o preview" },
    addJob:        { en: "Add job",              pt: "Adicionar vaga" },
    spotlight:     { en: "Spotlight",            pt: "Destaque" },
    sortRecent:    { en: "Recent",               pt: "Recentes" },
    sortScore:     { en: "Score",                pt: "Score" },
    sortCompany:   { en: "Company",              pt: "Empresa" },
    filterCrawler: { en: "Crawler",              pt: "Crawler" },
    filterManual:  { en: "Manual",               pt: "Manual" },
    filterPriority:{ en: "≥ 70%",               pt: "≥ 70%" },
    seniority:     { en: "Seniority",            pt: "Senioridade" },
    jobs:          { en: "jobs",                 pt: "vagas" },
  },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  dashboard: {
    title:        { en: "Pipeline — funnel, gaps and priority.", pt: "Pipeline — funil, gargalos e prioridade." },
    totalRadar:   { en: "Total radar",     pt: "Total radar" },
    highPriority: { en: "High priority",  pt: "Alta prioridade" },
    inInterview:  { en: "In interview",   pt: "Em entrevista" },
    execQueue:    { en: "Exec queue",     pt: "Fila execução" },
    topOpps:      { en: "Top opportunities", pt: "Top oportunidades" },
    empty:        { en: "Empty",          pt: "Vazio" },
    pipelineEmpty: { en: "Pipeline empty", pt: "Pipeline vazio" },
    pipelineHint:  { en: "Add jobs via Control Center to see funnel, gaps and priorities here.", pt: "Adicione vagas pelo Centro de Controle para ver o funil, gargalos e prioridades aqui." },
    advance:      { en: "→",              pt: "→" },
    open:         { en: "Open",           pt: "Abrir" },
  },

  // ── Control Center ──────────────────────────────────────────────────────────
  cc: {
    title:           { en: "Control Center — act on the active job.", pt: "Centro de Controle — agir sobre a vaga ativa." },
    activeJob:       { en: "Active job",          pt: "Vaga ativa" },
    nextAction:      { en: "Next action",         pt: "Próxima ação" },
    copyMessage:     { en: "Copy message",        pt: "Copiar mensagem" },
    messageCopied:   { en: "✓ Message copied",    pt: "✓ Mensagem copiada" },
    originalJob:     { en: "Original post ↗",     pt: "Vaga original ↗" },
    advanceStage:    { en: "Advance stage →",     pt: "Avançar stage →" },
    tabSummary:      { en: "Summary",             pt: "Resumo" },
    tabMatch:        { en: "Match",               pt: "Match" },
    tabMessage:      { en: "Message",             pt: "Mensagem" },
    tabHistory:      { en: "History",             pt: "Histórico" },
    tabGap:          { en: "Gap",                 pt: "Gap" },
    roleBrief:       { en: "Role brief",          pt: "Resumo da vaga" },
    strengths:       { en: "Strengths",           pt: "Pontos fortes" },
    risks:           { en: "Risks & gaps",        pt: "Riscos & gaps" },
    noStrengths:     { en: "No strengths identified.", pt: "Nenhum ponto de força identificado." },
    noRisks:         { en: "No risks identified.", pt: "Nenhum risco identificado." },
    recruiterMsg:    { en: "Recruiter message",   pt: "Mensagem para recruiter" },
    statusHistory:   { en: "Status history",      pt: "Histórico de status" },
    noHistory:       { en: "No history yet.",     pt: "Sem histórico ainda." },
    discoveryReal:   { en: "Real discovery",      pt: "Discovery real" },
    manualIntake:    { en: "Manual intake",       pt: "Intake manual" },
    processing:      { en: "Processing...",       pt: "Processando..." },
    structureJob:    { en: "Structure job",       pt: "Estruturar vaga" },
    searching:       { en: "Searching...",        pt: "Buscando..." },
    pasteJD:         { en: "Paste the full job description, even if messy.", pt: "Cole o texto da vaga (mesmo desorganizado). O Argus estrutura, calcula match e salva no radar." },
    radarEmpty:      { en: "Radar empty — add your first job",  pt: "Radar vazio — adicione a primeira vaga" },
    radarEmptyHint:  { en: "Use real discovery to pull jobs from connected portals, or paste a JD manually.", pt: "Use discovery real para puxar vagas dos portais conectados, ou cole um JD manualmente." },
    loadingRadar:    { en: "Connecting to radar...", pt: "Conectando ao radar..." },
    loadingJobs:     { en: "Loading jobs...",      pt: "Carregando vagas..." },
    startDiscovery:  { en: "Start discovery →",   pt: "Iniciar discovery →" },
    pasteJDShort:    { en: "Paste JD →",           pt: "Colar JD →" },
  },

  // ── Sync / radar status ─────────────────────────────────────────────────────
  sync: {
    connected:    { en: "Radar connected",          pt: "Radar conectado" },
    checking:     { en: "Connecting to radar...",   pt: "Conectando ao radar..." },
    offline:      { en: "Database not configured",  pt: "Banco não configurado" },
    error:        { en: "Sync failed",              pt: "Falha no sync" },
    radar:        { en: "Radar",                    pt: "Radar" },
    all:          { en: "All",                      pt: "Todos" },
    priority:     { en: "≥70%",                     pt: "≥70%" },
    noJobs:       { en: "Radar empty",              pt: "Radar vazio" },
    noJobsFilter: { en: "No jobs with score ≥ 70%", pt: "Nenhuma vaga com score ≥ 70%" },
    viewAll:      { en: "View all",                 pt: "Ver todas" },
  },

  // ── Profile / CV ────────────────────────────────────────────────────────────
  profile: {
    cvAndCover:    { en: "CV & Cover Letter",   pt: "CV & Cover Letter" },
    cvLabel:       { en: "CV",                  pt: "CV" },
    cvFullText:    { en: "CV (full text)",       pt: "CV (texto completo)" },
    coverLabel:    { en: "Cover letter",        pt: "Cover letter" },
    coverBase:     { en: "Cover letter (base paragraph)", pt: "Cover letter (parágrafo base)" },
    cvPlaceholder: { en: "Paste your full CV text or use 'Upload file' above...", pt: "Cole o texto completo do seu CV ou use 'Subir arquivo' acima..." },
    coverPlaceholder: { en: "Paste your base cover letter paragraph...", pt: "Cole o parágrafo base da sua cover letter..." },
    syncNote:      { en: "Updating CV and cover letter recalculates all job matches automatically.", pt: "Atualizar o CV e a cover letter recalcula o match de todas as vagas automaticamente." },
    synced:        { en: "✓ Synced",      pt: "✓ Sincronizado" },
    syncing:       { en: "Saving...",     pt: "Salvando..." },
    syncError:     { en: "Sync error",   pt: "Erro ao salvar" },
    local:         { en: "Local",        pt: "Local" },
    checking:      { en: "Checking...", pt: "Verificando..." },
    liveSources:   { en: "live",         pt: "ativas" },
    uploadFile:    { en: "Upload file ↑", pt: "Subir arquivo ↑" },
    reading:       { en: "Reading...",   pt: "Lendo..." },
    saveNow:       { en: "Save now",     pt: "Salvar agora" },
    saveProfile:   { en: "Save profile", pt: "Salvar perfil" },
    saving:        { en: "Saving...",    pt: "Salvando..." },
    savedMsg:      { en: "Profile saved — match will be recalculated on next analysis.", pt: "Perfil salvo — match será recalculado nas próximas análises." },
    saveError:     { en: "Error saving",      pt: "Erro ao salvar" },
    connectionError: { en: "Connection failure", pt: "Falha na conexão" },
    identity:      { en: "Identity",           pt: "Identidade" },
    name:          { en: "Name",               pt: "Nome" },
    headline:      { en: "Headline",           pt: "Headline" },
    location:      { en: "Location",           pt: "Localização" },
    availability:  { en: "Availability",       pt: "Disponibilidade" },
    proSummary:    { en: "Professional summary", pt: "Resumo profissional" },
    skillsTargets: { en: "Skills & targets",   pt: "Competências & alvos" },
    documents:     { en: "Documents",          pt: "Documentos" },
    tagHelp:       { en: "Enter or comma to add · × to remove", pt: "Enter ou vírgula para adicionar · × para remover" },
  },

  // ── Job status labels ────────────────────────────────────────────────────────
  status: {
    nova:             { en: "New",             pt: "Nova" },
    prontaParaRevisar:{ en: "Ready to review", pt: "Pronta para revisar" },
    requerTriagem:    { en: "Needs triage",    pt: "Requer triagem" },
    aplicar:          { en: "Apply",           pt: "Aplicar" },
    aplicada:         { en: "Applied",         pt: "Aplicada" },
    entrevista:       { en: "Interview",       pt: "Entrevista" },
  },

  // ── Job field labels ─────────────────────────────────────────────────────────
  job: {
    seniority:    { en: "Seniority",         pt: "Senioridade" },
    workModel:    { en: "Work model",        pt: "Modelo" },
    contract:     { en: "Contract",          pt: "Contrato" },
    languages:    { en: "Languages",         pt: "Idiomas" },
    verdict:      { en: "Verdict",           pt: "Veredito" },
    origin:       { en: "Origin",            pt: "Origem" },
    stage:        { en: "Stage",             pt: "Stage" },
    lastTouch:    { en: "Last touch",        pt: "Último toque" },
    skills:       { en: "Skills",            pt: "Skills" },
    summary:      { en: "Summary",           pt: "Resumo" },
    signal:       { en: "Signal",            pt: "Signal" },
    nextMove:     { en: "Next move",         pt: "Próximo passo" },
    nextStep:     { en: "Next step",         pt: "Próximo passo" },
    notDetected:  { en: "Not detected",      pt: "Não detectados" },
    notFound:     { en: "Job not found",     pt: "Vaga não encontrada" },
    notFoundHint: { en: "This job was not found in the persisted radar or local state. Go back to the explorer.", pt: "Esta vaga não apareceu no radar persistido nem no estado local. Volte ao explorer." },
    notFoundRadar: { en: "Job not found in radar", pt: "Vaga não encontrada no radar" },
    noSummary:    { en: "No summary available.", pt: "Sem resumo disponível." },
    noLink:       { en: "No application link", pt: "Sem link de aplicação" },
    apply:        { en: "Apply to job ↗",    pt: "Aplicar na vaga ↗" },
    analyzeInCC:  { en: "Analyze in CC",     pt: "Analisar no CC" },
    inFocus:      { en: "Job in focus",      pt: "Vaga em foco" },
    whyMatch:     { en: "Why it matches",    pt: "Por que combina" },
    gapsToAddress:{ en: "Gaps to address",   pt: "Gaps a endereçar" },
    noGaps:       { en: "No critical gap identified.", pt: "Nenhum gap crítico identificado." },
    highPriority: { en: "High priority — send message and apply today.", pt: "Alta prioridade — enviar mensagem e aplicar hoje." },
    goodOpportunity: { en: "Good opportunity — review gaps and customize message.", pt: "Boa oportunidade — revisar gaps e customizar mensagem." },
    partialMatch: { en: "Partial match — evaluate if worth the effort.", pt: "Compatibilidade parcial — avaliar se vale o esforço." },
    recruiterMsg: { en: "Recruiter message",  pt: "Mensagem para recruiter" },
    noHistory:    { en: "No history yet.",    pt: "Sem histórico ainda." },
    detail:       { en: "Detail",            pt: "Detalhe" },
  },

  // ── Sources ──────────────────────────────────────────────────────────────────
  sources: {
    title:        { en: "Sources — discovery and intake",     pt: "Fontes — discovery e intake" },
    subtitle:     { en: "Job portals — discovery and intake", pt: "Portais de vagas — discovery e intake" },
    autoDiscovery:{ en: "Automatic discovery",                pt: "Discovery automático" },
    catalogued:   { en: "Catalogued — direct portal access",  pt: "Catalogadas — acesso direto ao portal" },
    openDiscovery:{ en: "Search jobs",                        pt: "Buscar vagas" },
    openPortal:   { en: "Portal ↗",                           pt: "Portal ↗" },
    quickIntake:  { en: "Quick intake",                       pt: "Intake rápido" },
    pasteJD:      { en: "Paste a JD and send to Control Center", pt: "Cole um JD e envie para o Centro de Controle" },
    pasteAnyJD:   { en: "Paste any JD here",                  pt: "Cole qualquer JD aqui" },
    pasteAnyJDDesc: { en: "Works with any portal — even messy. Select a company above or paste directly.", pt: "Funciona com qualquer portal — mesmo desorganizado. Selecione uma empresa acima ou cole direto." },
    processInCC:  { en: "Process in CC →",                    pt: "Processar no CC →" },
    goToCC:       { en: "Go to Control Center",               pt: "Ir para Control Center" },
    clear:        { en: "Clear",                              pt: "Limpar" },
    intake:       { en: "Intake",                             pt: "Intake" },
    close:        { en: "× Close",                            pt: "× Fechar" },
    openCC:       { en: "Open Control Center",                pt: "Abrir Centro de Controle" },
    viewJobs:     { en: "View Jobs",                          pt: "Ver Vagas" },
    howToUse:     { en: "How to use",                         pt: "Como usar" },
    step01:       { en: "For live portals, click 'Search jobs' — discovery runs automatically.", pt: "Para portais live, clique em 'Buscar vagas' — o discovery roda automático." },
    step02:       { en: "For others, click '↗ Portal' to open, find the job and come back.", pt: "Para os outros, clique em '↗ Portal' para abrir, encontre a vaga e volte aqui." },
    step03:       { en: "Paste the full job text in the field and click 'Process in CC'.", pt: "Cole o texto completo da vaga no campo ao lado e clique em 'Processar no CC'." },
    step04:       { en: "Argus structures, calculates the score and creates the recruiter message in seconds.", pt: "O Argus estrutura, calcula o score e cria a mensagem para o recruiter em segundos." },
  },

  // ── Ops ──────────────────────────────────────────────────────────────────────
  ops: {
    title:   { en: "Ops — production readiness.",  pt: "Ops — readiness de produção." },
    ready:   { en: "ready",    pt: "pronto" },
    warning: { en: "warning",  pt: "atenção" },
    blocked: { en: "blocked",  pt: "bloqueado" },
    viewSources: { en: "View sources", pt: "Ver fontes" },
    backToApp:   { en: "Back to app",  pt: "Voltar ao app" },
  },

  // ── Digests ──────────────────────────────────────────────────────────────────
  digests: {
    title:         { en: "Morning digest — radar as daily routine.",   pt: "Digest matinal — radar em rotina diária." },
    description:   { en: "Preview of what will be consolidated tomorrow, email delivery status and cron control.", pt: "Preview do que será consolidado amanhã cedo, status do envio por email e controle do cron." },
    subject:       { en: "Subject",         pt: "Assunto" },
    actionQueue:   { en: "Action queue",    pt: "Fila de ação" },
    highPriority:  { en: "High priority",   pt: "Alta prioridade" },
    items:         { en: "Items",           pt: "Itens" },
    emailDelivery: { en: "Email delivery",  pt: "Entrega por email" },
    emailConfigured: { en: "Resend configured", pt: "Resend configurado" },
    emailPending:  { en: "Delivery pending configuration", pt: "Envio pendente de configuração" },
    scheduler:     { en: "Scheduler",       pt: "Agendador" },
    cronMapped:    { en: "Cron mapped on Vercel", pt: "Cron mapeado na Vercel" },
    cronNotFound:  { en: "Cron not found yet", pt: "Cron ainda não encontrado" },
    profileSource: { en: "Profile source",  pt: "Fonte do perfil" },
    profileDB:     { en: "Profile from database", pt: "Perfil vindo do banco" },
    profileFallback: { en: "Fallback to base profile", pt: "Fallback no perfil base" },
    emptyState:    { en: "Once the database is connected and the radar has jobs, the digest preview appears here automatically.", pt: "Assim que o banco estiver conectado e o radar tiver vagas, o preview do digest aparece aqui automaticamente." },
    opsTests:      { en: "Operational tests", pt: "Testes operacionais" },
    opsTestsHint:  { en: "Persist the preview in the database or fire a test email.", pt: "Persistir o preview no banco ou disparar um email de teste." },
    operationFailed: { en: "Operation failed", pt: "Falha na operação" },
    persist:       { en: "Persist preview", pt: "Persistir preview" },
    sendTest:      { en: "Send test email", pt: "Enviar email de teste" },
    ops:           { en: "Ops",             pt: "Ops" },
    viewOps:       { en: "View ops",        pt: "Ver ops" },
    backToJobs:    { en: "Back to jobs",    pt: "Voltar para jobs" },
  },

  // ── Login ─────────────────────────────────────────────────────────────────────
  login: {
    privateAccess: { en: "Private access",          pt: "Acesso privado" },
    appName:       { en: "Argus Intelligence",      pt: "Argus Intelligence" },
    description:   { en: "Use the private password configured for the application. Access is protected per session.", pt: "Use a senha privada definida para a aplicação. O acesso fica protegido por sessão." },
    configureEnv:  { en: "Configure ARGUS_ACCESS_PASSWORD and ARGUS_SESSION_SECRET to enable protection.", pt: "Configure ARGUS_ACCESS_PASSWORD e ARGUS_SESSION_SECRET para ativar a proteção." },
    passwordLabel: { en: "Access password",         pt: "Senha de acesso" },
    placeholder:   { en: "Argus private password",  pt: "Senha privada do Argus" },
    submit:        { en: "Authenticate",            pt: "Entrar" },
    authenticating:{ en: "Authenticating...",       pt: "Autenticando..." },
    authConfigured:{ en: "Auth ✓ configured",       pt: "Auth ✓ configurado" },
    authPending:   { en: "Auth ⚠ pending setup",    pt: "Auth ⚠ pendente de configuração" },
    weakPassword:  { en: "Weak password",           pt: "Senha fraca" },
    mediumPassword:{ en: "Medium password",         pt: "Senha mediana" },
    strongPassword:{ en: "Strong password",         pt: "Senha forte" },
    authFailure:   { en: "Unexpected authentication failure.", pt: "Falha inesperada ao autenticar." },
    authNotConfigured: { en: "Private auth not configured. Set environment variables first.", pt: "Auth privada ainda não configurada. Defina as variáveis de ambiente primeiro." },
  },

  // ── Gap analysis ─────────────────────────────────────────────────────────────
  gap: {
    title:          { en: "Gap analysis",           pt: "Análise de gaps" },
    missingSkills:  { en: "Missing skills",         pt: "Skills faltando" },
    critical:       { en: "critical",               pt: "crítico" },
    minor:          { en: "minor",                  pt: "menor" },
    suggestion:     { en: "Suggestion",             pt: "Sugestão" },
    languageGap:    { en: "Language gap",           pt: "Gap de idioma" },
    seniorityGap:   { en: "Seniority gap",          pt: "Gap de senioridade" },
    nextStep:       { en: "Recommended next step",  pt: "Próximo passo recomendado" },
    noGaps:         { en: "No critical gaps identified — profile covers the main requirements.", pt: "Sem gaps críticos — perfil cobre os requisitos principais." },
  },

  // ── Next action labels ────────────────────────────────────────────────────────
  nextAction: {
    prepareInterview: { en: "Prepare interview",    pt: "Preparar entrevista" },
    followUp:         { en: "Follow up",            pt: "Acompanhar retorno" },
    execute:          { en: "Execute application",  pt: "Executar candidatura" },
    finalReview:      { en: "Final review",         pt: "Revisão final" },
    triage:           { en: "Triage & context",     pt: "Triagem e contexto" },
  },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: string, lang: Lang): string {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = strings;
  for (const part of parts) {
    node = node?.[part];
    if (!node) return key;
  }
  if (typeof node === "object" && (node.en || node.pt)) {
    return node[lang] ?? node.en ?? key;
  }
  return key;
}
