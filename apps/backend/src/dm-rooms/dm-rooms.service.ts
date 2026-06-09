import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { DmRoomsRepository } from './dm-rooms.repository'
import { CreateDmRoomDto } from './dto/create-dm-room.dto'
import { GetDmMessagesDto } from './dto/get-dm-messages.dto'
import { UpdateDmMessageDto } from './dto/update-dm-message.dto'
import { UpdateDmRoomDto } from './dto/update-dm-room.dto'
import { CreateDmMessageDto } from './dto/create-dm-message.dto'

@Injectable()
export class DmRoomsService {
  constructor(private readonly dmRoomsRepository: DmRoomsRepository) {}

  async getDmRooms(userId: string) {
    return this.dmRoomsRepository.findManyByUserId(userId)
  }

  async updateDmRoom(dmRoomId: string, userId: string, dto: UpdateDmRoomDto) {
    const room = await this.dmRoomsRepository.findById(dmRoomId)
    if (!room) {
      throw new HttpException('DM部屋が見つかりません', HttpStatus.NOT_FOUND)
    }
    if (!room.isGroup) {
      throw new HttpException('1対1DMの名前は変更できません', HttpStatus.BAD_REQUEST)
    }
    const isMember = room.members.some((m) => m.userId === userId)
    if (!isMember) {
      throw new HttpException('このDM部屋のメンバーではありません', HttpStatus.FORBIDDEN)
    }
    return this.dmRoomsRepository.updateDmRoom(dmRoomId, dto.name)
  }

  async createDmRoom(myUserId: string, dto: CreateDmRoomDto) {
    const isGroup = dto.memberIds.length > 1

    if (isGroup) {
      return this.dmRoomsRepository.createGroupRoom(myUserId, dto.memberIds, dto.name)
    }

    // 1対1DMは既存部屋を使い回す（重複防止）
    return this.dmRoomsRepository.findOrCreateDirectRoom(myUserId, dto.memberIds[0])
  }

  async getDmMessages(dmRoomId: string, dto: GetDmMessagesDto) {
    const limit = dto.limit ?? 50
    const rows = await this.dmRoomsRepository.findMessagesByDmRoomId(dmRoomId, dto.cursor, limit)

    const hasMore = rows.length > limit
    const messages = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? messages[messages.length - 1].id : null

    return { messages, nextCursor, hasMore }
  }

  async createDmMessage(dmRoomId: string, userId: string, dto: CreateDmMessageDto) {
    return this.dmRoomsRepository.createMessage(dmRoomId, userId, dto)
  }

  async updateDmMessage(
    messageId: string,
    dmRoomId: string,
    userId: string,
    dto: UpdateDmMessageDto,
  ) {
    const message = await this.dmRoomsRepository.findMessageById(messageId)
    if (!message || message.dmRoomId !== dmRoomId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }
    if (message.userId !== userId) {
      throw new HttpException('このメッセージを編集する権限がありません', HttpStatus.FORBIDDEN)
    }
    return this.dmRoomsRepository.updateMessage(messageId, dto.content)
  }

  async deleteDmMessage(messageId: string, dmRoomId: string, userId: string) {
    const message = await this.dmRoomsRepository.findMessageById(messageId)
    if (!message || message.dmRoomId !== dmRoomId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }
    if (message.userId !== userId) {
      throw new HttpException('このメッセージを削除する権限がありません', HttpStatus.FORBIDDEN)
    }
    return this.dmRoomsRepository.softDeleteMessage(messageId)
  }
}
