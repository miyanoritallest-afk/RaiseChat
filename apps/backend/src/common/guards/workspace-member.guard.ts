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
  params: { wsId?: string }
  workspaceMemberRole?: string
}

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userId = request.user.id
    const workspaceId = request.params.wsId

    if (!workspaceId) return false

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { role: true },
    })

    if (!member) {
      throw new HttpException(
        'このワークスペースへのアクセス権限がありません',
        HttpStatus.FORBIDDEN,
      )
    }

    request.workspaceMemberRole = member.role
    return true
  }
}
