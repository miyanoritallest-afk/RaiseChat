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
  params: { dmRoomId?: string }
}

@Injectable()
export class DmRoomMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userId = request.user.id
    const dmRoomId = request.params.dmRoomId

    if (!dmRoomId) return false

    const member = await this.prisma.dmRoomMember.findUnique({
      where: { dmRoomId_userId: { dmRoomId, userId } },
      select: { id: true },
    })

    if (!member) {
      throw new HttpException('このDMへのアクセス権限がありません', HttpStatus.FORBIDDEN)
    }

    return true
  }
}
