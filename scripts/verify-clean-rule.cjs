// 验证规则：从 store 详情页选干净主图（排除 og 促销、附件、细节图）
const { execFileSync } = require("child_process");
const fs = require("fs");
function curl(url, out) { execFileSync("curl.exe", ["-s", "-L", "-o", out, "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "--max-time", "25", url], { timeout: 35000 }); }

// 附件/非产品图关键字
const ATTACH_RE = /FX-USB|10M_OCXO|注册|电源线缆|无线鼠标|RMK|F503|STB-3|N-BNC|PP215|TPA|UKit|RRC|SAG1021|一致性分析|SigVSA|SiglQPro|选件|软件|线缆|鳄鱼夹|香蕉接头|SNA5000-SA|SNA5000-TDA|SNA5000-TDR|SNA5000-PV|SNA5000-SA\b|EMC|校准|说明书|手册|背板|把手|挂架|_L-|_L-5/i;
const DETAIL_RE = /^\d+-\d+\./; // 细节图 1-22.jpg

function pickClean(model) {
  const slug = model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  curl(`https://store.siglent.com/product/${slug}/`, "C:/cxy/_c.html");
  const h = fs.readFileSync("C:/cxy/_c.html", "utf8");
  const og = (h.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || "";
  const re = /https:\/\/store\.siglent\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\\<> ]+\.(?:jpg|jpeg|png)/g;
  const all = [...new Set(h.match(re) || [])].filter((u) => !/150x150/.test(u));
  const base = (u) => decodeURIComponent(u.split("/").pop());
  const clean = all.filter((u) => {
    const b = base(u);
    if (u === og) return false;
    if (ATTACH_RE.test(b)) return false;
    if (DETAIL_RE.test(b)) return false;
    return true;
  });
  return { model, og: og.slice(0, 95), clean: clean.map((u) => u.slice(0, 110)), all: all.length };
}

const tests = ["SDG1062X", "SDS1104X-E", "SPS5041X", "SSG6083A", "SDS802X-HD", "SNA5052X", "SDG2082X", "SSA3015X-Plus", "SDS5104X", "SDM4065A"];
for (const m of tests) {
  const r = pickClean(m);
  console.log("###", r.model, "| 全尺寸", r.all);
  console.log("  og:", r.og);
  console.log("  候选:", r.clean.length ? r.clean.slice(0, 4).join("\n         ") : "无");
}
