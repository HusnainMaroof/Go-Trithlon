import { envConfig } from "../config/envConfig";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ 
  connectionString: envConfig.DATABASE_URL 
});

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}



declare const globalThis : {
  prismaGlobal : ReturnType<typeof prismaClientSingleton> ;
}& typeof global;


export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (envConfig.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma