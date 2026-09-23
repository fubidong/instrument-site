// warmup-routes.js — Next.js dev 首次路由扫描修复
// 背景：Next 16 dev(Turbopack/webpack) 首次扫描会漏掉深层动态路由
// (brand/[brand]/category/[category]/[series]/[modelX])，访问返回 404。
// 修改该路由文件 mtime 会触发 Turbopack 增量重扫描并注册路由。
// 本脚本在 dev server Ready 后执行，必要时重试直到目标路由返回 200。
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = "E:\\cxy\\instrument-site";
const ROUTE_FILES = [
  "src\\app\\brand\\[brand]\\category\\[category]\\[series]\\[modelX]\\page.tsx",
];

// 从 _dev_server.log 读取服务就绪状态
function isReady() {
  try {
    const log = fs.readFileSync(path.join(ROOT, "..\\_dev_server.log"), "utf8");
    return log.includes("Ready");
  } catch {
    return false;
  }
}

function touchAll() {
  const now = new Date();
  for (const rel of ROUTE_FILES) {
    const p = path.join(ROOT, rel);
    fs.utimesSync(p, now, now);
    console.log("[warmup] touched:", rel);
  }
}

function checkRoute() {
  try {
    const out = execFileSync("curl.exe", [
      "-s", "-o", "NUL", "-w", "%{http_code}",
      "http://localhost:3000/uni-t-meter/category/uni-meter-multimeter/professional-multimeter/UT171A",
    ], { encoding: "utf8" });
    return out.trim() === "200";
  } catch {
    return false;
  }
}

function main() {
  const deadline = Date.now() + 120000; // 最多等 2 分钟 Ready
  while (!isReady()) {
    if (Date.now() > deadline) {
      console.error("[warmup] dev server 未在 2 分钟内就绪，跳过 warmup");
      process.exit(1);
    }
    const { execSync } = require("node:child_process");
    try { execSync("timeout /t 2 /nobreak >nul", { shell: true }); } catch {}
  }
  console.log("[warmup] dev server Ready，开始预热路由");
  for (let i = 0; i < 5; i++) {
    touchAll();
    try {
      const { execSync } = require("node:child_process");
      execSync("timeout /t 3 /nobreak >nul", { shell: true });
    } catch {}
    if (checkRoute()) {
      console.log("[warmup] 路由预热成功: model 级页面 200");
      process.exit(0);
    }
    console.warn(`[warmup] 第 ${i + 1} 次预热后仍非 200，重试...`);
  }
  console.error("[warmup] 预热失败：model 级页面仍非 200，请人工检查");
  process.exit(1);
}

main();
