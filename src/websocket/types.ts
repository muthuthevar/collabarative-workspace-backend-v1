export enum WebSocketEventType {
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  ERROR = "error",
  BOARD_JOIN = "board:join",
  BOARD_LEAVE = "board:leave",
  BOARD_UPDATE = "board:update",
  BOARD_CURSOR = "board:cursor",
  WORKSPACE_JOIN = "workspace:join",
  WORKSPACE_LEAVE = "workspace:leave",
  WORKSPACE_UPDATE = "workspace:update",
  USER_TYPING = "user:typing",
  USER_PRESENCE = "user:presence",
}

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface BoardUpdatePayload {
  boardId: string;
  content: string;
  userId: string;
  timestamp: number;
}

export interface CursorPosition {
  boardId: string;
  userId?: string;
  x: number;
  y: number;
  userName?: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: "online" | "away" | "offline";
  lastSeen: number;
}
