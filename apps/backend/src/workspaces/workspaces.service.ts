import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { WorkspacesRepository } from './workspaces.repository'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { JoinWorkspaceDto } from './dto/join-workspace.dto'

@Injectable()
export class WorkspacesService {
  constructor(private readonly workspacesRepository: WorkspacesRepository) {}

  async getMyWorkspaces(userId: string) {
    return this.workspacesRepository.findManyByUserId(userId)
  }

  async getWorkspace(workspaceId: string) {
    const workspace = await this.workspacesRepository.findById(workspaceId)
    if (!workspace) {
      throw new HttpException('ワークスペースが見つかりません', HttpStatus.NOT_FOUND)
    }
    return workspace
  }

  async getMembers(workspaceId: string) {
    return this.workspacesRepository.findMembersByWorkspaceId(workspaceId)
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    return this.workspacesRepository.createWithGeneralChannel({
      name: dto.name,
      description: dto.description,
      ownerId: userId,
    })
  }

  async joinWorkspace(userId: string, dto: JoinWorkspaceDto) {
    const workspace = await this.workspacesRepository.joinByInviteCode(dto.inviteCode, userId)
    if (!workspace) {
      throw new HttpException('招待コードが無効です', HttpStatus.NOT_FOUND)
    }
    return workspace
  }

  async removeMember(workspaceId: string, targetUserId: string) {
    return this.workspacesRepository.removeMember(workspaceId, targetUserId)
  }
}
