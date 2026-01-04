import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn'], // 生产可只保留 error
})

export default prisma
