import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { AuthRepository } from './auth.repository'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

type AuthResponse = {
  token: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.authRepository.findByUsername(dto.username)
    if (existing) {
      throw new ConflictException('このユーザー名は既に使用されています')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.authRepository.createUser({
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
    })

    const token = this.jwtService.sign({ sub: user.id, username: user.username })
    return { token, user }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepository.findByUsername(dto.username)
    // ユーザー存在確認とパスワード不一致を同じエラーにする（ユーザー列挙攻撃対策）
    if (!user) {
      throw new UnauthorizedException('ユーザー名またはパスワードが正しくありません')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('ユーザー名またはパスワードが正しくありません')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...safeUser } = user
    const token = this.jwtService.sign({ sub: safeUser.id, username: safeUser.username })
    return { token, user: safeUser }
  }

  async getMe(userId: string): Promise<AuthResponse['user']> {
    const user = await this.authRepository.findById(userId)
    if (!user) {
      throw new NotFoundException('ユーザーが見つかりません')
    }
    return user
  }
}
