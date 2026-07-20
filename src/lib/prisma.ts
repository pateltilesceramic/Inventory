import { PrismaClient } from "@prisma/client"
import { PrismaD1 } from "@prisma/adapter-d1"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const getClient = (): PrismaClient => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  let d1Binding = (process.env as any).DB;

  // 1. Attempt to get D1 binding from OpenNext context
  if (!d1Binding) {
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      if (ctx && ctx.env && ctx.env.DB) {
        d1Binding = ctx.env.DB;
      }
    } catch (error) {
      // Ignore
    }
  }

  // 2. Check global context in Worker runtime
  if (!d1Binding && (globalThis as any).DB) {
    d1Binding = (globalThis as any).DB;
  }

  if (d1Binding) {
    const adapter = new PrismaD1(d1Binding)
    globalForPrisma.prisma = new PrismaClient({ adapter });
  } else {
    // Safe fallback for local dev vs worker runtime
    try {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const localAdapter = new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL || "file:./dev.db"
      });
      globalForPrisma.prisma = new PrismaClient({ adapter: localAdapter });
    } catch (err) {
      globalForPrisma.prisma = new PrismaClient();
    }
  }

  return globalForPrisma.prisma;
}

// Export a Proxy so the client is ONLY initialized when an actual database query is made.
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

// Note: Do NOT assign `prisma` (the Proxy) back to globalForPrisma.prisma
// in dev mode. getClient() already caches the real client there.

export default prisma


