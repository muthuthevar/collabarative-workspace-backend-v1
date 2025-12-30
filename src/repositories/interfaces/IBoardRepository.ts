import type { Board } from "../../domain/entities/Board.entity.js";

export type CreateBoardDto = {
  workspaceId: string;
  title: string;
  content?: object | null;
  createdBy: string;
};

export type UpdateBoardDto = {
  title?: string;
  content?: object | null;
};

export interface IBoardRepository {
  findById(id: string): Promise<Board | null>;
  findByWorkspaceId(workspaceId: string): Promise<Board[]>;
  create(data: CreateBoardDto): Promise<Board>;
  update(id: string, data: UpdateBoardDto): Promise<void>;
}
