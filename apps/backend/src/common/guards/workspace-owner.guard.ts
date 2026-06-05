import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common'

type AuthenticatedRequest = {
  workspaceMemberRole?: string
}

@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (request.workspaceMemberRole !== 'OWNER') {
      throw new HttpException('オーナー権限が必要です', HttpStatus.FORBIDDEN)
    }

    return true
  }
}
