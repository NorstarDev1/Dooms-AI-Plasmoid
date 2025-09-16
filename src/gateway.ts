import { WebSocket } from "ws";
import { v4 as uuid } from "uuid";
import type { JsonRpcRequest, JsonRpcResponse } from "./types.js";

type Pending = Map<string | number, (resp: JsonRpcResponse) => void>;

export class McpGatewayClient {
  readonly url: string;
  private ws?: WebSocket;
  private pending: Pending = new Map();

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.on("open", () => resolve());
      ws.on("error", (err) => reject(err));
      ws.on("message", (data) => this.handleMessage(data));
      ws.on("close", () => {
        // reject any pending calls
        for (const [, cb] of this.pending) {
          cb({ jsonrpc: "2.0", id: null, error: { code: -1, message: "Gateway closed" } });
        }
        this.pending.clear();
      });
    });
  }

  private handleMessage(data: WebSocket.RawData) {
    let msg: JsonRpcResponse | JsonRpcRequest;
    try {
      msg = JSON.parse(String(data));
    } catch (e) {
      return;
    }

    // If it's a response, resolve the pending call.
    if ("id" in msg && ("result" in msg || "error" in msg)) {
      const cb = this.pending.get(msg.id!);
      if (cb) {
        this.pending.delete(msg.id!);
        cb(msg as JsonRpcResponse);
      }
      return;
    }

    // If it's a request/notification from gateway, ignore or extend here if needed.
  }

  async call(method: string, params?: unknown): Promise<unknown> {
    await this.connect();
    const id = uuid();
    const req: JsonRpcRequest = { jsonrpc: "2.0", id, method, params };
    return await new Promise((resolve, reject) => {
      this.pending.set(id, (resp) => {
        if (resp.error) return reject(new Error(`${resp.error.code}: ${resp.error.message}`));
        resolve(resp.result);
      });
      this.ws!.send(JSON.stringify(req));
    });
  }

  // Convenience wrappers around common MCP Gateway methods (names align to a typical gateway)
  listServers() {
    return this.call("gateway/listServers");
  }
  listTools(serverId: string) {
    return this.call("mcp/listTools", { serverId });
  }
  callTool(serverId: string, toolName: string, args?: unknown) {
    return this.call("mcp/callTool", { serverId, tool: toolName, arguments: args ?? {} });
  }
  sendPrompt(serverId: string, text: string, meta?: Record<string, unknown>) {
    return this.call("mcp/sendMessage", { serverId, text, meta });
  }
}