import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

// The Orca dev tab starts alongside setup; npm writes this file once the install is complete
const installed = "node_modules/.package-lock.json";
if (!existsSync(installed)) console.log("Waiting for setup to finish npm ci…");
while (!existsSync(installed)) await sleep(1000);

// Same workspace, same port; other worktrees land elsewhere in 8100–8899, clear of the plain `npm run dev` 8080
let hash = 2166136261;
for (const c of basename(process.cwd())) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
const port = String(8100 + (hash % 800));

spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--port", port, ...process.argv.slice(2)], { stdio: "inherit" }).on("exit", (code) => process.exit(code ?? 1));
