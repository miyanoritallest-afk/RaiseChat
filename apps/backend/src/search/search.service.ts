import { Injectable } from '@nestjs/common'
import { SearchRepository } from './search.repository'
import { SearchMessagesDto } from './dto/search-messages.dto'

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async searchMessages(workspaceId: string, userId: string, dto: SearchMessagesDto) {
    const limit = dto.limit ?? 20
    const rows = await this.searchRepository.searchMessages(
      workspaceId,
      userId,
      dto.q,
      dto.cursor,
      limit,
    )

    const hasMore = rows.length > limit
    const messages = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? messages[messages.length - 1].id : null

    return { messages, nextCursor, hasMore }
  }
}
