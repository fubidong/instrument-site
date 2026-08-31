// 从官网详情页抓 og:description 补充产品 summary
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function fetch(url: string, redirects = 0): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
          let next = res.headers.location;
          if (next.startsWith("/")) next = "https://www.siglent.com" + next;
          res.resume();
          return resolve(fetch(next, redirects + 1));
        }
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: d }));
      })
      .on("error", reject);
  });
}

async function getDesc(slug: string): Promise<string | null> {
  try {
    const { status, body } = await fetch(`https://www.siglent.com/products-overview/${slug}/`);
    if (status !== 200) return null;
    const og = body.match(/property="og:description" content="([^"]*)"/);
    let desc = og ? og[1] : null;
    if (!desc) {
      const m = body.match(/<meta name="description" content="([^"]*)"/);
      desc = m ? m[1] : null;
    }
    // 去掉 HTML 实体和尾部 "附带..." 之类的采购清单噪声
    if (desc) {
      desc = desc.replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "").trim();
      // 截取到"校准证书"/"快速指南"等采购清单词前
      const cut = desc.search(/校准证书|快速指南|附带|USB数据线|电源线|无源探头/);
      if (cut > 30) desc = desc.slice(0, cut);
      desc = desc.trim();
      if (desc.length > 500) desc = desc.slice(0, 500);
    }
    return desc || null;
  } catch {
    return null;
  }
}

async function main() {
  const products = await prisma.product.findMany({ include: { translations: true } });
  console.log("产品数:", products.length);
  let updated = 0;
  let missed = 0;
  // 并发 4
  const queue = [...products];
  async function worker() {
    while (queue.length) {
      const p = queue.shift();
      if (!p) continue;
      const zh = p.translations.find((t) => t.locale === "zh");
      if (zh && zh.summary) continue; // 已有描述跳过
      const desc = await getDesc(p.model.toLowerCase());
      if (desc && zh) {
        await prisma.productTranslation.update({
          where: { id: zh.id },
          data: { summary: desc },
        });
        updated++;
      } else {
        missed++;
      }
      if ((updated + missed) % 10 === 0) console.log(`进度 ${updated + missed}/${products.length} 更新${updated} 缺失${missed}`);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  console.log("完成 更新:", updated, "缺失:", missed);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
