import { prisma } from "../../config/prisma.config.js";
import { Board } from "../../domain/entities/Board.entity.js";
import type {
  IBoardRepository,
  CreateBoardDto,
  UpdateBoardDto,
} from "../interfaces/IBoardRepository.js";

export class BoardRepository implements IBoardRepository {
  async findById(id: string): Promise<Board | null> {
    const board = await prisma.board.findUnique({ where: { id } });
    return board as Board | null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Board[]> {
    const boards = await prisma.board.findMany({ where: { workspaceId } });
    return boards as Board[];
  }

  async create(data: CreateBoardDto): Promise<Board> {
    const board = await prisma.board.create({
      data: {
        workspaceId: data.workspaceId,
        title: data.title,
        content: data.content || {},
        createdBy: data.createdBy,
      },
    });
    return board as Board;
  }

  async update(id: string, data: UpdateBoardDto): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    await prisma.board.update({
      where: { id },
      data: updateData,
    });
  }
}
