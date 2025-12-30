import { PrismaClient } from "../generated/prisma/index.js";
import { logger } from "../utils/logger.js";

class PrismaConfig {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaConfig.instance) {
      PrismaConfig.instance = new PrismaClient({
        log: [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
      });

      PrismaConfig.instance.$on("query" as never, (e: any) => {
        logger.debug("Query: " + e.query);
        logger.debug("Duration: " + e.duration + "ms");
      });

      PrismaConfig.instance.$on("error" as never, (e: any) => {
        logger.error("Prisma error:", e);
      });

      PrismaConfig.instance.$on("warn" as never, (e: any) => {
        logger.warn("Prisma warning:", e);
      });

      logger.info("Prisma client initialized");
    }

    return PrismaConfig.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaConfig.instance) {
      await PrismaConfig.instance.$disconnect();
      logger.info("Prisma client disconnected");
    }
  }
}

export const prisma = PrismaConfig.getInstance();
export { PrismaConfig };
