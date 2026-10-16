import fs from "node:fs";
import { randomBytes } from "node:crypto";

for (const app of ["server", "client", "cms"]) {
  const file = `apps/${app}/.env`;
  if (!fs.existsSync(file)) fs.copyFileSync(`${file}.example`, file);
}
const file = "apps/server/.env";
let content = fs.readFileSync(file, "utf8");
if (!/^JWT_SECRET=.+$/m.test(content)) content += `\nJWT_SECRET=${randomBytes(48).toString("base64url")}\n`;
fs.writeFileSync(file, content);
console.log("Local environment files are ready; existing database credentials were preserved.");
