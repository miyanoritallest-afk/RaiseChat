import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

type AuthenticatedRequest = {
  user: { id: string; username: string }
  params: { channelId?: string }
}

@Injectable()
export class ChannelMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userId = request.user.id
    const channelId = request.params.channelId

    if (!channelId) return false

    const member = await this.prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } },
      select: { id: true },
    })

    if (!member) {
      throw new HttpException('このチャンネルへのアクセス権限がありません', HttpStatus.FORBIDDEN)
    }

    return true
  }
}
