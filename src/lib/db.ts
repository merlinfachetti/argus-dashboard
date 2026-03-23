// db.ts — Prisma client com lazy initialization
// Nunca instancia o PrismaClient na importação do módulo — só na primeira chamada.
// Isso evita erros de build quando @prisma/client não foi gerado (sem DATABASE_URL).

let _prisma: import("@prisma/client").PrismaClient | undefined;

export function getDb() {
  if (!_prisma) {
    // Importação dinâmica inline — não executa durante o build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
    _prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return _prisma;
}

// Alias para compatibilidade com código existente que usa `db.*`
export const db = new Proxy({} as import("@prisma/client").PrismaClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});
