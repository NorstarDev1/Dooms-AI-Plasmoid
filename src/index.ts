import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { McpGatewayClient } from "./gateway.js";
import type { UIInbound, UIOutbound } from "./types.js";

const GATEWAY_WS = process.env.MCP_GATEWAY_WS ?? "ws://127.0.0.1:63342";
const BRIDGE_PORT = Number(process.env.BRIDGE_PORT ?? 8765);
const CLIENT_NAME = process.env.CLIENT_NAME ?? "SIVERSE-Bridge";

const gateway = new McpGatewayClient(GATEWAY_WS);

const server = createServer();
const wss = new WebSocketServer({ server });

function send(ws: WebSocket, msg: UIOutbound) {
  ws.send(JSON.stringify(msg));
}

wss.on("connection", async (ws) => {
  send(ws, { type: "status", status: "connecting" });
  try {
    await gateway.connect();
    send(ws, { type: "status", status: "connected" });
  } catch (e) {
    send(ws, { type: "error", message: "Failed to connect to MCP Gateway", detail: String(e) });
  }

  ws.on("message", async (data) => {
    let msg: UIInbound;
    try {
      msg = JSON.parse(String(data));
    } catch (e) {
      return send(ws, { type: "error", message: "Invalid JSON from UI" });
    }

    try {
      if (msg.type === "ping") return send(ws, { type: "pong" });

      if (msg.type === "listServers") {
        const res = (await gateway.listServers()) as { servers: Array<{ id: string; name: string }> };
        return send(ws, { type: "servers", servers: res.servers ?? [] });
      }

      if (msg.type === "listTools") {
        const tools = (await gateway.listTools(msg.serverId)) as { tools: Array<{ name: string; description?: string }> };
        return send(ws, { type: "tools", serverId: msg.serverId, tools: tools.tools ?? [] });
      }

      if (msg.type === "callTool") {
        const result = await gateway.callTool(msg.serverId, msg.toolName, msg.args);
        return send(ws, { type: "toolResult", serverId: msg.serverId, toolName: msg.toolName, result });
      }

      if (msg.type === "prompt") {
        const result = (await gateway.sendPrompt(msg.serverId, msg.text, msg.meta)) as { text?: string };
        return send(ws, { type: "message", serverId: msg.serverId, role: "server", text: result?.text ?? "" });
      }
    } catch (e) {
      return send(ws, { type: "error", message: "Bridge error", detail: String(e) });
    }
  });
});

server.listen(BRIDGE_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[${CLIENT_NAME}] MCP bridge listening on ws://127.0.0.1:${BRIDGE_PORT}/`);
});