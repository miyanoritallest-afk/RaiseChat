import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'ユーザー登録' })
  @ApiResponse({ status: 201, description: '登録成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 409, description: 'ユーザー名重複' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ログイン' })
  @ApiResponse({ status: 200, description: 'ログイン成功・JWTトークン返却' })
  @ApiResponse({ status: 401, description: '認証失敗' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'ログアウト' })
  @ApiResponse({ status: 200, description: 'ログアウト成功' })
  logout() {
    // JWTはステートレスのためサーバー側での処理なし
    // クライアント側でトークンを削除する責務を持つ
    return { message: 'ログアウトしました' }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '自分のプロフィール取得' })
  @ApiResponse({ status: 200, description: 'ユーザー情報' })
  @ApiResponse({ status: 401, description: '未認証' })
  async getMe(@CurrentUser() user: JwtUser) {
    return this.authService.getMe(user.id)
  }
}
