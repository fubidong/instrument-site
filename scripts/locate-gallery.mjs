// 定位 store 详情页 gallery 主图区在 HTML 的位置
import https from "https";
import { TextDecoder } from "util";

function getRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }, (r) => {
      const chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => resolve(new TextDecoder("utf-8").decode(Buffer.concat(chunks))));
    }).on("error", reject);
  });
}

const html = await getRaw("https://store.siglent.com/product/sds804x-hd-%e9%ab%98%e6%b8%85%e7%a4%ba%e6%b3%a2%e5%99%a8/");

// 找 gallery 相关容器
const galleryMarks = [...html.matchAll(/class="([^"]*gallery[^"]*)"/gi)].map((m) => m[1]).slice(0, 10);
console.log("gallery classes:", galleryMarks.join(", "));

// 产品图通常以 data-large_image 或特定 class 标识
const largeImg = [...html.matchAll(/data-large_image="([^"]+)"/g)].map((m) => m[1]).slice(0, 5);
console.log("data-large_image:", largeImg.join("\n"));

// 找 woocommerce gallery 的图
const wooImgs = [...html.matchAll(/<img[^>]*class="[^"]*woocommerce[^"]*"[^>]*src="([^"]+)"/g)].map((m) => m[1]).slice(0, 5);
console.log("woo imgs:", wooImgs.join("\n"));

// 检查 产品标题前后的 img 顺序（gallery 通常在 title 前或紧邻）
const titleIdx = html.indexOf("SDS804X HD 高清示波器");
console.log("title at:", titleIdx);
const around = html.slice(Math.max(0, titleIdx - 3000), titleIdx + 1000);
const imgsNearTitle = [...around.matchAll(/https:\/\/store\.siglent\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|png)/g)].map((m) => m[0]);
console.log("imgs near title:", [...new Set(imgsNearTitle)].slice(0, 8).join("\n"));
