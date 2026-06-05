import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type SafeUser = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  statusMessage: string | null
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<(SafeUser & { passwordHash: string }) | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        statusMessage: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        statusMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async createUser(data: {
    username: string
    displayName: string
    passwordHash: string
  }): Promise<SafeUser> {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        statusMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }
}
