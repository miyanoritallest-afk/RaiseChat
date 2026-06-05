import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

type JwtUser = {
  id: string
  username: string
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtUser }>()
    return request.user
  },
)
