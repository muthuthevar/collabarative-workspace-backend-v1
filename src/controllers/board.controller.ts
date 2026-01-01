import type { Response, NextFunction } from "express";
import { BoardService } from "../services/Board.service.js";
import { ResponseHandler } from "../utils/response.js";
import { type AuthRequest } from "../middleware/auth.middleware.js";

export class BoardController {
  constructor(private boardService: BoardService) {}

  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const board = await this.boardService.createBoard({
        ...req.body,
        createdBy: req.user!.userId,
      });
      ResponseHandler.created(res, board, "Board created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const board = await this.boardService.getBoardById(
        req.params.id!,
        req.user!.userId
      );
      ResponseHandler.success(res, board);
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceBoards(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const boards = await this.boardService.getWorkspaceBoards(
        req.params.workspaceId!,
        req.user!.userId
      );
      ResponseHandler.success(res, boards);
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await this.boardService.updateBoard(
        req.params.id!,
        req.user!.userId,
        req.body
      );
      ResponseHandler.success(res, null, "Board updated successfully");
    } catch (error) {
      next(error);
    }
  }
}
