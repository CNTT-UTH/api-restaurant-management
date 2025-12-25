import envConfig from "@/config";
import { PrismaClient } from "@/prisma/client";
import { PrismaClientOptions } from "@/prisma/internal/prismaNamespace";
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = envConfig.DATABASE_URL

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({adapter})

export default prisma
