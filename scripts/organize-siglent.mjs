// 整理鼎阳主仪器产品 → 结构化清单（分类/系列/型号/参数/图片）
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "siglent-raw.json"), "utf8"));
const dm = raw.dataMap;
const cm = raw.categoryMap;

// 排除的分类（非主仪器）
const EXCLUDE_CATS = ["附件", "软件与选件", "已停产产品", "翻新测试设备", "其他产品", "示波器附件", "示波器软件", "其他产品附件", "模块化附件", "模块化仪器选件", "其他产品软件"];
// 附件类分类也排除（名字含"附件"）
const EXCLUDE_HAS = ["附件", "软件", "停产", "翻新"];

function isExcluded(p) {
  const cats = p.categories || [];
  // 附件/软件/停产类
  if (cats.some((c) => c.name === "附件" || c.name === "软件与选件" || c.name === "已停产产品" || c.name === "翻新测试设备")) return true;
  // 探头类排除（示波器探头等属于附件）
  if (cats.some((c) => c.name.includes("探头"))) return true;
  return false;
}

// 主产品线判定：找 categories 里的顶层主分类
function mainLine(p) {
  const cats = p.categories || [];
  const top = cats.find((c) => c.isTopLevel);
  if (!top) return null;
  const name = top.name;
  const MAP = {
    "示波器": "OSCILLOSCOPE",
    "函数/任意波形发生器": "FUNCTION_GEN",
    "频谱分析仪": "SPECTRUM",
    "矢量网络分析仪": "VNA",
    "射频/微波信号发生器": "RF_GEN",
    "直流电源/源表": "POWER",
    "电子负载": "LOAD",
    "数字万用表": "MULTIMETER",
    "模块化仪器": "MODULAR",
  };
  return MAP[name] || null;
}

const products = [];
for (const id in dm) {
  const p = dm[id];
  if (isExcluded(p)) continue;
  const line = mainLine(p);
  if (!line) continue;
  products.push({
    id: p.id,
    slug: p.slug,
    name: p.name,
    line,
    cats: p.categories.map((c) => c.name),
    series: (p.attributes.find((a) => a.taxonomy === "pa_产品系列")?.terms || []).map((t) => t.name),
    models: (p.attributes.find((a) => a.taxonomy === "pa_product-model")?.terms || []).map((t) => t.name),
    image: p.featuredImage,
    excerpt: (p.excerpt || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
    attrs: p.attributes.map((a) => ({
      tax: a.taxonomy,
      name: a.name,
      values: a.terms.map((t) => t.name),
    })),
  });
}

// 按产品线统计
const byLine = {};
products.forEach((p) => {
  (byLine[p.line] = byLine[p.line] || []).push(p);
});

let out = "# 鼎阳主仪器产品清单\n\n";
for (const [line, list] of Object.entries(byLine)) {
  out += `## ${line} (${list.length}个系列)\n`;
  list.forEach((p) => {
    out += `- ${p.name} [${p.models.join("/")}] cats=${p.cats.join("+")}\n`;
  });
}
fs.writeFileSync(path.join(__dirname, "data", "siglent-products.md"), out);
console.log("主仪器系列数:", products.length);
console.log("按产品线:", Object.entries(byLine).map(([k, v]) => `${k}:${v.length}`).join(" "));

// 保存结构化 JSON
fs.writeFileSync(path.join(__dirname, "data", "siglent-products.json"), JSON.stringify(products, null, 1));
console.log("saved siglent-products.json");
