export const pipelineStages = [
  { id: "new", label: "Nova" },
  { id: "review", label: "Revisar" },
  { id: "apply", label: "Aplicar" },
  { id: "applied", label: "Aplicada" },
  { id: "interview", label: "Entrevista" },
  { id: "rejected", label: "Rejeitada" },
] as const;

export const implementationMilestones = [
  {
    title: "Persistencia do produto",
    status: "em andamento",
    detail:
      "Schema Prisma pronta para perfil, fontes, vagas, match e digest diario.",
  },
  {
    title: "Crawlers por portal",
    status: "proxima etapa",
    detail:
      "Siemens e SAP sao os melhores candidatos para iniciar discovery tecnico.",
  },
  {
    title: "Entrega operacional",
    status: "parcial",
    detail:
      "Repositorio conectado ao GitHub, Vercel ligada ao repo e CI inicial pronta.",
  },
] as const;
