// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../../../node_modules/.prisma/client')

export default async function globalTeardown() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const prisma = new PrismaClient()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await prisma.$disconnect()
}
