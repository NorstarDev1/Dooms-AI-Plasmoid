// SIVERSE Labs — MCP Bridge (TypeScript) and Plasmoid UI Patch
// ─────────────────────────────────────────────────────────────
// This single document contains a minimal, working scaffold you can paste into a folder.
// Files are delineated with `// FILE: <path>` markers. Create them as separate files.

// FILE: package.json


// FILE: tsconfig.json


// FILE: .env.example
// Copy to .env and edit as needed.


// FILE: src/types.ts


// FILE: src/gateway.ts


// FILE: src/index.ts


// FILE: README.md


# Plasmoid patch (chat.html)

Below is a minimal, non-destructive patch to the Dooms-AI-Plasmoid chat UI. It adds a connection toggle, a tools drawer, and routes Send to the bridge. Adjust selectors to match the actual file if needed.

// FILE: plasmoid/patch/chat-bridge.js

/* FILE: plasmoid/patch/chat.html.diff (illustrative)
--- a/plasmoid/chat.html
+++ b/plasmoid/chat.html
@@
   <body>
     <div id="app">
+      <div id="bridge-mount"></div>
       <div id="chat-log" class="log"></div>
       <div class="composer">
         <input id="chat-input" placeholder="Type a message" />
         <button id="send-btn">Send</button>
       </div>
     </div>
-    <script src="./chat.js"></script>
+    <script src="./chat.js"></script>
+    <script src="./patch/chat-bridge.js"></script>
   </body>
 */

/* CSS hint (optional)
.tools { display:flex; gap:.5rem; flex-wrap:wrap; margin:.5rem 0; }
.bridge-bar { display:flex; gap:.5rem; align-items:center; font-size:.9rem; opacity:.9; }
*/
