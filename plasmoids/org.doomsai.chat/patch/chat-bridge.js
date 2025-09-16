(function(){
    const BRIDGE_URL = "ws://127.0.0.1:8765";
    let ws; let servers = []; let currentServer = null; let tools = [];
  
    function log(s){ console.debug("[bridge]", s); }
  
    function connect(){
      ws = new WebSocket(BRIDGE_URL);
      ws.onopen = () => {
        renderStatus("connected");
        ws.send(JSON.stringify({ type: "listServers" }));
      };
      ws.onclose = () => renderStatus("disconnected");
      ws.onerror = () => renderStatus("error");
      ws.onmessage = (ev) => handle(JSON.parse(ev.data));
    }
  
    function handle(msg){
      if(msg.type === "status"){ renderStatus(msg.status); }
      if(msg.type === "servers"){ servers = msg.servers; renderServers(); }
      if(msg.type === "tools"){ if(currentServer && msg.serverId===currentServer) { tools = msg.tools; renderTools(); } }
      if(msg.type === "toolResult"){ appendChat(`[${msg.toolName}] → ${JSON.stringify(msg.result, null, 2)}`); }
      if(msg.type === "message"){ appendChat(msg.text); }
      if(msg.type === "error"){ appendChat(`⚠️ ${msg.message}`); }
    }
  
    function renderStatus(s){
      const el = document.querySelector("#bridge-status");
      if(el) el.textContent = `Bridge: ${s}`;
    }
  
    function renderServers(){
      const sel = document.querySelector("#server-select");
      if(!sel) return;
      sel.innerHTML = "";
      for(const s of servers){
        const opt = document.createElement("option");
        opt.value = s.id; opt.textContent = s.name || s.id; sel.appendChild(opt);
      }
      if(servers[0]){ currentServer = servers[0].id; sel.value = currentServer;
        ws.send(JSON.stringify({ type: "listTools", serverId: currentServer }));
      }
    }
  
    function renderTools(){
      const list = document.querySelector("#tools-list");
      if(!list) return;
      list.innerHTML = "";
      for(const t of tools){
        const btn = document.createElement("button");
        btn.textContent = t.name;
        btn.onclick = () => {
          const args = prompt(`Args for ${t.name} (JSON)`, "{}");
          let parsed={}; try{ parsed = JSON.parse(args||"{}"); }catch{}
          ws.send(JSON.stringify({ type: "callTool", serverId: currentServer, toolName: t.name, args: parsed }));
        };
        list.appendChild(btn);
      }
    }
  
    function appendChat(text){
      const box = document.querySelector("#chat-log");
      const div = document.createElement("div");
      div.className = "msg server"; div.textContent = text; box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
  
    // Wire existing send button
    function wireSend(){
      const btn = document.querySelector("#send-btn");
      const input = document.querySelector("#chat-input");
      btn?.addEventListener("click", () => {
        const text = input?.value?.trim(); if(!text) return;
        ws?.send(JSON.stringify({ type: "prompt", serverId: currentServer, text }));
        input.value = "";
      });
    }
  
    // Startup
    document.addEventListener("DOMContentLoaded", () => {
      const mount = document.querySelector("#bridge-mount");
      if(mount){
        mount.innerHTML = `
          <div class="bridge-bar">
            <span id="bridge-status">Bridge: offline</span>
            <select id="server-select"></select>
            <button id="reload-tools">Reload Tools</button>
          </div>
          <div id="tools-list" class="tools"></div>
        `;
        mount.querySelector("#reload-tools")?.addEventListener("click", ()=>{
          if(currentServer) ws?.send(JSON.stringify({ type: "listTools", serverId: currentServer }));
        });
      }
      connect(); wireSend();
    });
  })();
  