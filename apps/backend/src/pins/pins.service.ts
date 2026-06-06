import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PinsRepository } from './pins.repository'
import { MessagesRepository } from '../messages/messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'

@Injectable()
export class PinsService {
  constructor(
    private readonly pinsRepository: PinsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly workspacesRepository: WorkspacesRepository,
  ) {}

  async getPins(channelId: string) {
    return this.pinsRepository.findManyByChannelId(channelId)
  }

  async addPin(messageId: string, channelId: string, userId: string) {
    // Layer2 IDOR: メッセージが指定チャンネルに属するかクロスチェック
    const message = await this.messagesRepository.findById(messageId)
    if (!message || message.channelId !== channelId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }

    const existing = await this.pinsRepository.findByMessageAndChannel(messageId, channelId)
    if (existing) {
      throw new HttpException('このメッセージは既にピン留めされています', HttpStatus.CONFLICT)
    }

    return this.pinsRepository.create(messageId, channelId, userId)
  }

  async removePin(messageId: string, channelId: string, userId: string, workspaceId: string) {
    const pin = await this.pinsRepository.findByMessageAndChannel(messageId, channelId)
    if (!pin) {
      throw new HttpException('ピン留めが見つかりません', HttpStatus.NOT_FOUND)
    }

    // Layer2 IDOR: ピンが指定チャンネルに属するかクロスチェック（findByMessageAndChannelで保証済みだが明示）
    if (pin.channelId !== channelId) {
      throw new HttpException('ピン留めが見つかりません', HttpStatus.NOT_FOUND)
    }

    // 権限: ピン追加者 または ワークスペースオーナーのみ削除可
    const isPinner = pin.userId === userId
    if (!isPinner) {
      const isOwner = await this.workspacesRepository.isOwner(userId, workspaceId)
      if (!isOwner) {
        throw new HttpException('このピン留めを削除する権限がありません', HttpStatus.FORBIDDEN)
      }
    }

    return this.pinsRepository.delete(pin.id)
  }
}
