// 探测 store.siglent.com 原始图 URL 模式
const { execSync } = require("child_process");
const models = ["SDS5054X-HD","SDS2074X-Plus","SDG1062X","SNA5006X-E","SPD3303X","SPS5041X","SMM3311X","SDM4065A","SDL1030X","SHS1102X","SSA3015X-Plus"];
const dirs = ["2025/07","2025/08","2025/09","2025/10","2026/01","2026/06"];
let hit = 0;
for (const m of models) {
  let found = null;
  for (const d of dirs) {
    for (const ext of ["png","jpg"]) {
      const url = `https://store.siglent.com/wp-content/uploads/${d}/0-${m}.${ext}`;
      try {
        const out = execSync(`curl.exe -s -o NUL -w "%{http_code}" -I "${url}"`, { encoding: "utf8", timeout: 15000 }).trim();
        if (out === "200") { found = url; break; }
      } catch (e) {}
    }
    if (found) break;
  }
  if (found) { hit++; console.log("✓", m.padEnd(16), found); }
  else console.log("✗", m.padEnd(16), "未找到");
}
console.log("\n命中率:", hit, "/", models.length);
