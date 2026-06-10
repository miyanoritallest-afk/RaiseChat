import 'dotenv/config'
import { init as sentryInit } from '@sentry/nestjs'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  // Sentry を NestFactory.create より前に初期化してリクエストトレーシングを有効にする
  if (process.env.SENTRY_DSN) {
    sentryInit({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: 1.0,
    })
  }

  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useWebSocketAdapter(new IoAdapter(app))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter())

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  const config = new DocumentBuilder()
    .setTitle('RaiseChat API')
    .setDescription('RaiseChat バックエンド REST API ドキュメント')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  })

  const port = process.env.PORT ?? 4000
  await app.listen(port)
}

void bootstrap()
