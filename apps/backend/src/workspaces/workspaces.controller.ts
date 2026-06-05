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
import { WorkspacesService } from './workspaces.service'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { JoinWorkspaceDto } from './dto/join-workspace.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { WorkspaceOwnerGuard } from '../common/guards/workspace-owner.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getMyWorkspaces(@CurrentUser() user: JwtUser) {
    return this.workspacesService.getMyWorkspaces(user.id)
  }

  @Post()
  async createWorkspace(@CurrentUser() user: JwtUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(user.id, dto)
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinWorkspace(@CurrentUser() user: JwtUser, @Body() dto: JoinWorkspaceDto) {
    return this.workspacesService.joinWorkspace(user.id, dto)
  }

  @Get(':wsId')
  @UseGuards(WorkspaceMemberGuard)
  async getWorkspace(@Param('wsId') wsId: string) {
    return this.workspacesService.getWorkspace(wsId)
  }

  @Get(':wsId/members')
  @UseGuards(WorkspaceMemberGuard)
  async getMembers(@Param('wsId') wsId: string) {
    return this.workspacesService.getMembers(wsId)
  }

  @Delete(':wsId/members/:userId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('wsId') wsId: string, @Param('userId') userId: string) {
    return this.workspacesService.removeMember(wsId, userId)
  }
}
