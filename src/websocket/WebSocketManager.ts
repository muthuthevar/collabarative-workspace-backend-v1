import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../utils/logger.js";
import { RedisConfig } from "../config/redis.config.js";
import type { IncomingMessage } from "node:http";
import { JwtUtil } from "../utils/jwt.util.js";
import {
  WebSocketEventType,
  type WebSocketMessage,
  type BoardUpdatePayload,
  type CursorPosition,
} from "./types.js";
import type { RedisClientType } from "redis";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string | null;
  workspaceId?: string | null;
  boardId?: string | null;
  isAlive?: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private boardClients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private workspaceClients: Map<string, Set<AuthenticatedWebSocket>> =
    new Map();
  private redis: RedisClientType | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.initializeRedis();
    this.setupHeartbeat();
    this.setupConnectionCleanup();
  }

  public handleConnection(
    ws: AuthenticatedWebSocket,
    request: IncomingMessage
  ) {
    logger.info(`New WebSocket connection attempt`);
    const token = this.extractToken(request);
    if (!token) {
      ws.close(1008, "Authentication required");
      return;
    }

    try {
      const payload = JwtUtil.verifyAccessToken(token);
      ws.userId = payload.userId;
      ws.isAlive = true;
      logger.info(`WebSocket authenticated for user: ${ws.userId}`);

      if (!this.clients.has(ws.userId)) {
        this.clients.set(ws.userId, new Set());
      }
      this.clients.get(ws.userId)!.add(ws);

      ws.on("message", (data: Buffer) => this.handleMessage(ws, data));
      ws.on("close", () => this.handleDisconnect(ws));
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Send connection confirmation
      this.sendToClient(ws, {
        type: WebSocketEventType.CONNECT,
        payload: { userId: ws.userId, message: "Connected successfully" },
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error("WebSocket authentication error:", error);
      ws.close(1008, "Authentication failed");
    }
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as AuthenticatedWebSocket;

        if (client.isAlive === false) {
          logger.info(
            `Terminating inactive connection for user: ${client.userId}`
          );
          return client.terminate();
        }

        client.isAlive = false;
        client.ping();
      });
    }, 30000); // 30 seconds
  }

  private setupConnectionCleanup(): void {
    this.wss.on("close", () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
    });
  }

  private async initializeRedis() {
    try {
      this.redis = await RedisConfig.getInstance();
    } catch (error) {
      logger.error("Failed to initialize Redis for WebSocket:", error);
    }
  }

  private extractToken(request: IncomingMessage): string | null {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    return url.searchParams.get("token");
  }

  private async handleMessage(
    ws: AuthenticatedWebSocket,
    data: Buffer
  ): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      message.userId = ws.userId!;
      message.timestamp = Date.now();
      logger.debug(`WebSocket message received: ${message.type}`);

      switch (message.type) {
        case WebSocketEventType.BOARD_JOIN:
          await this.handleBoardJoin(ws, message);
          break;
        case WebSocketEventType.BOARD_LEAVE:
          await this.handleBoardLeave(ws, message);
          break;
        case WebSocketEventType.BOARD_UPDATE:
          await this.handleBoardUpdate(ws, message);
          break;
        case WebSocketEventType.BOARD_CURSOR:
          await this.handleCursorUpdate(ws, message);
          break;
        case WebSocketEventType.WORKSPACE_JOIN:
          await this.handleWorkspaceJoin(ws, message);
          break;
        case WebSocketEventType.WORKSPACE_LEAVE:
          await this.handleWorkspaceLeave(ws, message);
          break;
        case WebSocketEventType.USER_TYPING:
          await this.handleUserTyping(ws, message);
          break;
        default:
          this.sendError(ws, `Unknown event type: ${message.type}`);
      }
    } catch (error) {
      logger.error("Error handling WebSocket message:", error);
      this.sendError(ws, "Invalid message format");
    }
  }

  private async handleBoardJoin(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const { boardId } = message.payload;

    if (!boardId) {
      this.sendError(ws, "Board ID required");
      return;
    }

    // Remove from previous board if any
    if (ws.boardId && ws.boardId !== boardId) {
      await this.handleBoardLeave(ws, {
        type: WebSocketEventType.BOARD_LEAVE,
        payload: { boardId: ws.boardId },
        timestamp: Date.now(),
        userId: ws.userId!,
      });
    }

    ws.boardId = boardId;
    if (!this.boardClients.has(boardId)) {
      this.boardClients.set(boardId, new Set());
    }

    this.boardClients.get(boardId)!.add(ws);
    logger.info(`User ${ws.userId} joined board ${boardId}`);

    this.broadcastToBoard(
      boardId,
      {
        type: WebSocketEventType.USER_PRESENCE,
        payload: {
          userId: ws.userId,
          status: "online",
          boardId,
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private async handleBoardLeave(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const { boardId } = message.payload || { boardId: ws.boardId };

    if (!boardId || !ws.boardId) {
      return;
    }

    const clients = this.boardClients.get(boardId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.boardClients.delete(boardId);
      }
    }

    ws.boardId = null;
    logger.info(`User ${ws.userId} left board ${boardId}`);

    this.broadcastToBoard(
      boardId,
      {
        type: WebSocketEventType.USER_PRESENCE,
        payload: {
          userId: ws.userId,
          status: "offline",
          boardId,
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private async handleBoardUpdate(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const payload = message.payload as BoardUpdatePayload;
    const { boardId, content } = payload;

    if (!boardId || !content) {
      this.sendError(ws, "Board ID and content required");
      return;
    }

    if (ws.boardId !== boardId) {
      this.sendError(ws, "You are not connected to this board");
      return;
    }

    // Broadcast update to all clients in the board
    this.broadcastToBoard(
      boardId,
      {
        type: WebSocketEventType.BOARD_UPDATE,
        payload: {
          boardId,
          content,
          userId: ws.userId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private async handleCursorUpdate(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const payload = message.payload as CursorPosition;
    const { boardId, x, y } = payload;

    if (!boardId || x === undefined || y === undefined) {
      this.sendError(ws, "Board ID, x, and y coordinates required");
      return;
    }

    if (ws.boardId !== boardId) {
      this.sendError(ws, "You are not connected to this board");
      return;
    }

    // Broadcast cursor position to other clients
    this.broadcastToBoard(
      boardId,
      {
        type: WebSocketEventType.BOARD_CURSOR,
        payload: {
          boardId,
          userId: ws.userId,
          userName: payload.userName,
          x,
          y,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private async handleWorkspaceJoin(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const { workspaceId } = message.payload;

    if (!workspaceId) {
      this.sendError(ws, "Workspace ID required");
      return;
    }

    // Remove from previous workspace if any
    if (ws.workspaceId && ws.workspaceId !== workspaceId) {
      await this.handleWorkspaceLeave(ws, {
        type: WebSocketEventType.WORKSPACE_LEAVE,
        payload: { workspaceId: ws.workspaceId },
        timestamp: Date.now(),
        userId: ws.userId!,
      });
    }

    ws.workspaceId = workspaceId;
    if (!this.workspaceClients.has(workspaceId)) {
      this.workspaceClients.set(workspaceId, new Set());
    }

    this.workspaceClients.get(workspaceId)!.add(ws);
    logger.info(`User ${ws.userId} joined workspace ${workspaceId}`);

    this.broadcastToWorkspace(
      workspaceId,
      {
        type: WebSocketEventType.USER_PRESENCE,
        payload: {
          userId: ws.userId,
          status: "online",
          workspaceId,
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private async handleWorkspaceLeave(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const { workspaceId } = message.payload || { workspaceId: ws.workspaceId };

    if (!workspaceId || !ws.workspaceId) {
      return;
    }

    const clients = this.workspaceClients.get(workspaceId);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.workspaceClients.delete(workspaceId);
      }
    }

    ws.workspaceId = null;
    logger.info(`User ${ws.userId} left workspace ${workspaceId}`);

    this.broadcastToWorkspace(
      workspaceId,
      {
        type: WebSocketEventType.USER_PRESENCE,
        payload: {
          userId: ws.userId,
          status: "offline",
          workspaceId,
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private async handleUserTyping(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const { boardId, isTyping } = message.payload;

    if (!boardId) {
      this.sendError(ws, "Board ID required");
      return;
    }

    if (ws.boardId !== boardId) {
      this.sendError(ws, "You are not connected to this board");
      return;
    }

    this.broadcastToBoard(
      boardId,
      {
        type: WebSocketEventType.USER_TYPING,
        payload: {
          userId: ws.userId,
          boardId,
          isTyping: Boolean(isTyping),
        },
        timestamp: Date.now(),
      },
      ws.userId!
    );
  }

  private handleDisconnect(ws: AuthenticatedWebSocket): void {
    logger.info(`WebSocket disconnected for user: ${ws.userId}`);

    // Remove from user clients
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }

    // Remove from board
    if (ws.boardId) {
      this.handleBoardLeave(ws, {
        type: WebSocketEventType.BOARD_LEAVE,
        payload: { boardId: ws.boardId },
        timestamp: Date.now(),
        userId: ws.userId!,
      });
    }

    // Remove from workspace
    if (ws.workspaceId) {
      this.handleWorkspaceLeave(ws, {
        type: WebSocketEventType.WORKSPACE_LEAVE,
        payload: { workspaceId: ws.workspaceId },
        timestamp: Date.now(),
        userId: ws.userId!,
      });
    }
  }

  private broadcastToBoard(
    boardId: string,
    message: WebSocketMessage,
    excludeUserId?: string
  ): void {
    const clients = this.boardClients.get(boardId);
    if (!clients) return;

    clients.forEach((client) => {
      if (
        client.userId !== excludeUserId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private broadcastToWorkspace(
    workspaceId: string,
    message: WebSocketMessage,
    excludeUserId?: string
  ): void {
    const clients = this.workspaceClients.get(workspaceId);
    if (!clients) return;

    clients.forEach((client) => {
      if (
        client.userId !== excludeUserId &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Public method to broadcast board updates (called from services)
  public broadcastBoardUpdate(
    boardId: string,
    update: BoardUpdatePayload
  ): void {
    this.broadcastToBoard(boardId, {
      type: WebSocketEventType.BOARD_UPDATE,
      payload: update,
      timestamp: Date.now(),
    });
  }

  private sendError(ws: AuthenticatedWebSocket, error: string): void {
    this.sendToClient(ws, {
      type: WebSocketEventType.ERROR,
      payload: { error },
      timestamp: Date.now(),
    });
  }

  private sendToClient(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
