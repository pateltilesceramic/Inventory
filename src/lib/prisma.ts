import { PrismaClient } from "@prisma/client"
import { PrismaD1 } from "@prisma/adapter-d1"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const getClient = (): PrismaClient => {
  let d1Binding: any = (process.env as any).DB || (globalThis as any).DB || (globalThis as any).__env__?.DB;

  // 1. Attempt to get D1 binding from OpenNext context safely
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

  if (d1Binding) {
    // If already initialized as D1 client, return it
    if (globalForPrisma.prisma && (globalForPrisma as any).isD1) {
      return globalForPrisma.prisma;
    }
    try {
      const adapter = new PrismaD1(d1Binding);
      globalForPrisma.prisma = new PrismaClient({ adapter });
      (globalForPrisma as any).isD1 = true;
    } catch (err) {
      console.error("Failed to initialize PrismaD1 adapter:", err);
      globalForPrisma.prisma = new PrismaClient();
      (globalForPrisma as any).isD1 = false;
    }
    return globalForPrisma.prisma;
  }

  // If local dev or build time, reuse or initialize local client
  if (globalForPrisma.prisma && !(globalForPrisma as any).isD1) {
    return globalForPrisma.prisma;
  }

  try {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const localAdapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL || "file:./dev.db"
    });
    globalForPrisma.prisma = new PrismaClient({ adapter: localAdapter });
    (globalForPrisma as any).isD1 = false;
  } catch (err) {
    globalForPrisma.prisma = new PrismaClient();
    (globalForPrisma as any).isD1 = false;
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


