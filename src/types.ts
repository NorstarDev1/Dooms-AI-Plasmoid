export type UIInbound =
  | { type: "ping" }
  | { type: "listServers" }
  | { type: "listTools"; serverId: string }
  | { type: "callTool"; serverId: string; toolName: string; args?: unknown }
  | { type: "prompt"; serverId: string; text: string; meta?: Record<string, unknown> };

export type UIOutbound =
  | { type: "pong" }
  | { type: "status"; status: "connecting" | "connected" | "disconnected"; serverId?: string }
  | { type: "servers"; servers: Array<{ id: string; name: string }> }
  | { type: "tools"; serverId: string; tools: Array<{ name: string; description?: string }> }
  | { type: "toolResult"; serverId: string; toolName: string; result: unknown }
  | { type: "message"; serverId: string; role: "assistant" | "server" | "system"; text: string }
  | { type: "error"; message: string; detail?: unknown };

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};