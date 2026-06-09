import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { WorkspacesService } from './workspaces.service'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { JoinWorkspaceDto } from './dto/join-workspace.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { WorkspaceOwnerGuard } from '../common/guards/workspace-owner.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Workspaces')
@ApiBearerAuth('access-token')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: '所属ワークスペース一覧' })
  @ApiResponse({ status: 200 })
  async getMyWorkspaces(@CurrentUser() user: JwtUser) {
    return this.workspacesService.getMyWorkspaces(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'ワークスペース作成' })
  @ApiResponse({ status: 201 })
  async createWorkspace(@CurrentUser() user: JwtUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(user.id, dto)
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '招待コードでワークスペース参加' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: '招待コードが存在しない' })
  async joinWorkspace(@CurrentUser() user: JwtUser, @Body() dto: JoinWorkspaceDto) {
    return this.workspacesService.joinWorkspace(user.id, dto)
  }

  @Get(':wsId')
  @UseGuards(WorkspaceMemberGuard)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiOperation({ summary: 'ワークスペース詳細' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: '非所属' })
  @ApiResponse({ status: 404, description: '未存在' })
  async getWorkspace(@Param('wsId') wsId: string) {
    return this.workspacesService.getWorkspace(wsId)
  }

  @Get(':wsId/members')
  @UseGuards(WorkspaceMemberGuard)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiOperation({ summary: 'ワークスペースメンバー一覧' })
  @ApiResponse({ status: 200 })
  async getMembers(@Param('wsId') wsId: string) {
    return this.workspacesService.getMembers(wsId)
  }

  @Delete(':wsId/members/:userId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'userId', description: '削除対象ユーザーID' })
  @ApiOperation({ summary: 'メンバー削除（オーナーのみ）' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'オーナー以外' })
  async removeMember(@Param('wsId') wsId: string, @Param('userId') userId: string) {
    return this.workspacesService.removeMember(wsId, userId)
  }
}
