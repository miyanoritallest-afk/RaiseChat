// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../../../node_modules/.prisma/client')

export default async function globalTeardown() {
  const prisma = new PrismaClient()

  await prisma.$disconnect()
}
