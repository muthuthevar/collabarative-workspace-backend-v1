import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../utils/logger.js";
import { RedisConfig } from "../config/redis.config.js";
import type { IncomingMessage } from "node:http";
import { JwtUtil } from "../utils/jwt.util.js";
import { WebSocketEventType, type WebSocketMessage } from "./types.js";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  workspaceId?: string;
  boardId?: string;
  isAlive?: boolean;
}
export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private boardClients = new Map();
  private redis: any;
  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.initializeRedis();
    this.setupHeartbeat();
  }

  public handleConnection(
    ws: AuthenticatedWebSocket,
    request: IncomingMessage
  ) {
    logger.info(`New Websocket connection attempt`);
    const token = this.extractToken(request);
    console.log(token)
    if (!token) {
      ws.close(1008, "Authentication required");
      return;
    }

    try {
      const payload = JwtUtil.verifyAccessToken(token);
      ws.userId = payload.userId;
      ws.isAlive = true;
      logger.info(`Websocket authenticated for user: ${ws.userId}`);
      if (!this.clients.has(ws.userId)) {
        this.clients.set(ws.userId, new Set());
      }
      this.clients.get(ws.userId)!.add(ws);

      ws.on("message", (data: Buffer) => this.handleMessage(ws, data));
    } catch (error) {
      logger.error(`Failed to connect: Error:${error}`)
    }
  }

  private setupHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as AuthenticatedWebSocket;

        if (client.isAlive === false) {
          logger.info(
            `Terminating inactive connection for user: ${client.userId}`
          );
          return client.terminate();
        }
      });
    });
  }

  private async initializeRedis() {
    this.redis = await RedisConfig.getInstance();
  }

  /**
   * Extracts the token from the WebSocket connection request.
   * 
   * To send the token from Postman, you can do the following:
   * 1. Use the "New WebSocket Request" feature (only Postman desktop app supports WS requests).
   * 2. Add the token as a query parameter in the WebSocket URL, e.g.:
   *    ws://localhost:3000/ws?token=YOUR_JWT_TOKEN
   *    (replace YOUR_JWT_TOKEN with your actual token)
   * 3. Alternatively, you can send the token as a header "Sec-WebSocket-Protocol" or in cookies,
   *    but this code currently only supports tokens in the query string.
   */
  private extractToken(request: IncomingMessage) {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    return url.searchParams.get("token");
  }

  private async handleMessage(
    ws: AuthenticatedWebSocket,
    data: Buffer
  ): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      message.userId = ws.userId;
      message.timestamp = Date.now();
      logger.debug(`Websocket message received: ${message.type}`);
      switch (message.type) {
        case WebSocketEventType.BOARD_JOIN:
          await this.handleBoardJoin(ws, message);
      }
    } catch (error) { }
  }

  private handleBoardJoin(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ): Promise<void> {
    const { boardId } = message.payload;

    if (!boardId) {
      this.sendError(ws, "Board ID required");
      return;
    }

    ws.boardId = boardId;
    if (!this.boardClients.has(boardId)) {
      this.boardClients.set(boardId, new Set());
    }

    this.boardClients.get(boardId).add(ws);
    logger.info(`User ${ws.userId} joined board ${boardId}`);

    this.broadCastToBoard(
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
      ws.userId
    );
  }

  private broadCastToBoard(
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

  private handleBoardLeave() { }

  private handleBoardUpdate() { }

  private handleCursorUpdate() { }

  private handleWorkspaceJoin() { }

  private handleWorkspaceLeave() { }

  private handleUserTyping() { }

  private sendError(ws: AuthenticatedWebSocket, error: string): void {
    this.sendToClient(ws, {
      type: WebSocketEventType.ERROR,
      payload: error,
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
