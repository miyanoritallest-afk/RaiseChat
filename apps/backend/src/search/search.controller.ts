import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SearchService } from './search.service'
import { SearchMessagesDto } from './dto/search-messages.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Search')
@ApiBearerAuth('access-token')
@Controller('workspaces/:wsId/search')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiOperation({ summary: 'メッセージ全文検索' })
  @ApiResponse({ status: 200 })
  async searchMessages(
    @Param('wsId') wsId: string,
    @CurrentUser() user: JwtUser,
    @Query() dto: SearchMessagesDto,
  ) {
    return this.searchService.searchMessages(wsId, user.id, dto)
  }
}
