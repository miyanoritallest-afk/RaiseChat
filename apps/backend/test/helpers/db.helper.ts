// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../../../../node_modules/.prisma/client')

export async function cleanDatabase(): Promise<void> {
  const prisma = new PrismaClient()
  try {
    // 外部キー制約の順番でテーブルをクリア

    await prisma.$transaction([
      prisma.messageAttachment.deleteMany(),

      prisma.reaction.deleteMany(),

      prisma.pin.deleteMany(),

      prisma.notification.deleteMany(),

      prisma.message.deleteMany(),

      prisma.dmMessageAttachment.deleteMany(),

      prisma.dmMessage.deleteMany(),

      prisma.dmRoomMember.deleteMany(),

      prisma.dmRoom.deleteMany(),

      prisma.channelMember.deleteMany(),

      prisma.channel.deleteMany(),

      prisma.workspaceMember.deleteMany(),

      prisma.workspace.deleteMany(),

      prisma.user.deleteMany(),
    ])
  } finally {
    await prisma.$disconnect()
  }
}
