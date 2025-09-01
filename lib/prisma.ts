import { PrismaClient } from "@/app/generated/prisma/client";

const globalforPrisma = global as unknown as {prsima: PrismaClient};
export const prisma = globalforPrisma.prsima || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalforPrisma.prsima = prisma;