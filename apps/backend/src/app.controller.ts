import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'ルートヘルスチェック' })
  @ApiResponse({ status: 200, description: 'サービス稼働中' })
  healthCheck(): { status: string } {
    return this.appService.healthCheck()
  }

  @Get('health')
  @ApiOperation({ summary: 'ヘルスチェック' })
  @ApiResponse({ status: 200, description: 'OK' })
  health(): { status: string } {
    return { status: 'ok' }
  }
}
