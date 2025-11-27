import envConfig from '@/config'
import { PrismaClient } from '@/prisma'

const prisma = new PrismaClient({
  datasourceUrl: envConfig.DATABASE_URL,
  log: ['info']
})

export default prisma
