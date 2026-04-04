const fs = require("fs");
const path = require("path");

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const root = process.cwd();
const distDb = path.join(root, "dist", "db");
fs.mkdirSync(distDb, { recursive: true });
fs.copyFileSync(path.join(root, "src", "db", "schema.sql"), path.join(distDb, "schema.sql"));
copyDir(path.join(root, "src", "db", "migrations"), path.join(distDb, "migrations"));
