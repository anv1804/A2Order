import { spawn } from "node:child_process";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const jobs = ["apps/server", "apps/client", "apps/cms", "packages/shared"].map(workspace => spawn(npm, ["run", "dev", `--workspace=${workspace}`], { stdio: "inherit", shell: process.platform === "win32" }));
function stop(code = 0) { for (const job of jobs) job.kill(); process.exitCode = code; }
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
for (const job of jobs) job.on("exit", code => { if (code) stop(code); });
