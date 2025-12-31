import { Board } from "../domain/entities/Board.entity.js";
import { Permission, hasPermission } from "../domain/enums/Permission.enum.js";
import { Role } from "../domain/enums/Role.enum.js";
import { ActivityType } from "../domain/enums/ActivityType.enum.js";
import { type IBoardRepository } from "../repositories/interfaces/IBoardRepository.js";
import { type IWorkspaceRepository } from "../repositories/interfaces/IWorkspaceRepository.js";
import { type IActivityLogRepository } from "../repositories/interfaces/IActivityLogRepository.js";
import { BoardRepository } from "../repositories/implementations/Board.repository.js";
import { WorkspaceRepository } from "../repositories/implementations/Workspace.repository.js";
import { ActivityLogRepository } from "../repositories/implementations/ActivityLog.repository.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface CreateBoardDto {
  workspaceId: string;
  title: string;
  content?: object | null;
  createdBy: string;
}

export interface UpdateBoardDto {
  title?: string;
  content?: object | null;
}

export class BoardService {
  private boardRepository: IBoardRepository;
  private workspaceRepository: IWorkspaceRepository;
  private activityLogRepository: IActivityLogRepository;

  constructor(
    boardRepository?: IBoardRepository,
    workspaceRepository?: IWorkspaceRepository,
    activityLogRepository?: IActivityLogRepository
  ) {
    this.boardRepository = boardRepository || new BoardRepository();
    this.workspaceRepository = workspaceRepository || new WorkspaceRepository();
    this.activityLogRepository =
      activityLogRepository || new ActivityLogRepository();
  }

  async createBoard(data: CreateBoardDto): Promise<Board> {
    await this.checkPermission(
      data.workspaceId,
      data.createdBy,
      Permission.BOARD_CREATE
    );

    const board = await this.boardRepository.create(data);

    await this.activityLogRepository.create({
      workspaceId: data.workspaceId,
      userId: data.createdBy,
      action: ActivityType.BOARD_CREATED,
      metadata: { boardId: board.id, title: board.title },
    });

    logger.info(`Board created: ${board.id}`);

    return board;
  }

  async getBoardById(boardId: string, userId: string): Promise<Board> {
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }

    await this.checkPermission(
      board.workspaceId,
      userId,
      Permission.BOARD_READ
    );

    return board;
  }

  async getWorkspaceBoards(
    workspaceId: string,
    userId: string
  ): Promise<Board[]> {
    await this.checkPermission(workspaceId, userId, Permission.BOARD_READ);

    return await this.boardRepository.findByWorkspaceId(workspaceId);
  }

  async updateBoard(
    boardId: string,
    userId: string,
    data: UpdateBoardDto
  ): Promise<void> {
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new NotFoundError("Board not found");
    }

    await this.checkPermission(
      board.workspaceId,
      userId,
      Permission.BOARD_UPDATE
    );

    await this.boardRepository.update(boardId, data);

    await this.activityLogRepository.create({
      workspaceId: board.workspaceId,
      userId,
      action: ActivityType.BOARD_UPDATED,
      metadata: { boardId, updates: data },
    });

    logger.info(`Board updated: ${boardId}`);
  }

  private async checkPermission(
    workspaceId: string,
    userId: string,
    permission: Permission
  ): Promise<void> {
    const role = await this.workspaceRepository.getMemberRole(
      workspaceId,
      userId
    );

    if (!role) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    if (!hasPermission(role as Role, permission)) {
      throw new ForbiddenError("You do not have permission for this action");
    }
  }
}
