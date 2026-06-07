// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../../../../node_modules/.prisma/client')

export async function cleanDatabase(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const prisma = new PrismaClient()
  try {
    // 外部キー制約の順番でテーブルをクリア
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.$transaction([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.messageAttachment.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.reaction.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.pin.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.notification.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.message.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.dmMessageAttachment.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.dmMessage.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.dmRoomMember.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.dmRoom.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.channelMember.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.channel.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.workspaceMember.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.workspace.deleteMany(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      prisma.user.deleteMany(),
    ])
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await prisma.$disconnect()
  }
}
