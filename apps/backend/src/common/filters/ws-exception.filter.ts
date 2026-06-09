import { captureException } from '@sentry/nestjs'
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { Socket } from 'socket.io'

@Catch(WsException, PrismaClientKnownRequestError, Error)
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>()

    let message = 'エラーが発生しました'
    let code = 'INTERNAL_ERROR'

    if (exception instanceof WsException) {
      const msg = exception.message
      message = typeof msg === 'string' ? msg : JSON.stringify(msg)
      code = 'WS_ERROR'
    } else if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        message = '既に同じデータが存在します'
        code = 'CONFLICT'
      } else {
        this.logger.error(`Prisma WS error ${exception.code}: ${exception.message}`)
      }
    } else if (exception instanceof Error) {
      captureException(exception)
      this.logger.error(`Unexpected WS error: ${exception.message}`)
    }

    client.emit('error', { code, message })
  }
}
