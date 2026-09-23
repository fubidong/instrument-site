import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";


dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const PRODUCTS = [
  { model: "UHCT", url: "https://www.meastek.com/products/uhct/" },
  { model: "HCTS", url: "https://www.meastek.com/products/hcts/" },
  { model: "HCTM", url: "https://www.meastek.com/products/hctm/" },
  { model: "HCTL", url: "https://www.meastek.com/products/hctl/" },
  { model: "HCTM3000A-2CH", url: "https://www.meastek.com/products/hctm3000a-2ch/" },
  { model: "MCTD/B", url: "https://www.meastek.com/products/mctd-b/" },
  { model: "MCTD-3CH", url: "https://www.meastek.com/products/mctd3ch/" },
  { model: "LCTD/B", url: "https://www.meastek.com/products/lctd-b/" },
  { model: "Hmini", url: "https://www.meastek.com/products/hmini/" },
  { model: "HMR", url: "https://www.meastek.com/products/hmr/" },
  { model: "MMR", url: "https://www.meastek.com/products/mmr/" },
  { model: "OMMR", url: "https://www.meastek.com/products/ommr/" },
  { model: "LMR", url: "https://www.meastek.com/products/lmr/" },
  { model: "MCM", url: "https://www.meastek.com/products/mcm-1k200/" },
  { model: "HP6012A", url: "https://www.meastek.com/products/hp6012a/" },
  { model: "HP6015A", url: "https://www.meastek.com/products/hp6015a/" },
  { model: "HP6060A", url: "https://www.meastek.com/products/hp6060a/" },
  { model: "HDP6000K", url: "https://www.meastek.com/products/hdp6000k/" },
  { model: "HDP6000", url: "https://www.meastek.com/products/hdp6000/" },
  { model: "MDP5000", url: "https://www.meastek.com/products/mdp5000/" },
  { model: "MDP4000K", url: "https://www.meastek.com/products/mdp4000k/" },
  { model: "MDP4000", url: "https://www.meastek.com/products/mdp4000/" },
  { model: "UDP8000K", url: "https://www.meastek.com/products/udp8000k/" },
  { model: "HDP7000", url: "https://www.meastek.com/products/hdp7000/" },
  { model: "HST8000", url: "https://www.meastek.com/products/hst8000/" },
  { model: "HST3000", url: "https://www.meastek.com/products/hst3000/" },
  { model: "MZ5000", url: "https://www.meastek.com/products/mz5000/" },
  { model: "MCTU", url: "https://www.meastek.com/products/mctu/" },
  { model: "MCTH", url: "https://www.meastek.com/products/mcth/" },
  { model: "MCTL", url: "https://www.meastek.com/products/mctl/" },
  { model: "MCTP-6000", url: "https://www.meastek.com/products/mctp-6000/" },
  { model: "MCTP-5000", url: "https://www.meastek.com/products/mctp-5000/" },
  { model: "MCTP-4000", url: "https://www.meastek.com/products/mctp-4000/" },
  { model: "MCTP-3000", url: "https://www.meastek.com/products/mctp-3000/" },
  { model: "MCTP-2000", url: "https://www.meastek.com/products/mctp-2000/" },
  { model: "MCTP-1224", url: "https://www.meastek.com/products/mctp-1224/" },
  { model: "MCTP-1000L", url: "https://www.meastek.com/products/mcpl-1000l/" },
  { model: "MCTP-1000H", url: "https://www.meastek.com/products/mctp-1000h/" },
  { model: "MiP-1000", url: "https://www.meastek.com/products/mip-1000/" },
  { model: "MCP-2000", url: "https://www.meastek.com/products/mcp-2000/" },
  { model: "MCP-3000", url: "https://www.meastek.com/products/mcp-3000/" },
  { model: "MPS8000", url: "https://www.meastek.com/products/mps8000/" },
  { model: "MPS7000", url: "https://www.meastek.com/products/mps7000/" },
  { model: "MZ1000", url: "https://www.meastek.com/products/mz1000/" },
  { model: "MZS2000", url: "https://www.meastek.com/products/mzs2016/" },
];

function extractSection(html, heading) {
  const regex = new RegExp(`## ${heading}[\\s\\S]*?(?=## |$)`, "i");
  const match = html.match(regex);
  return match ? match[0] : "";
}

function htmlToText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTable(md) {
  const lines = md.split("\n");
  const tableLines = lines.filter((l) => l.trim().startsWith("|"));
  return tableLines.join("\n");
}

async function scrapeProduct(product) {
  try {
    console.log("正在采集:", product.model);
    const res = await fetch(product.url);
    const html = await res.text();

    // 提取产品特点
    const featuresSection = extractSection(html, "产品特点");
    const featuresText = htmlToText(featuresSection).replace(/^产品特点\s*/, "");

    // 提取产品参数
    const paramsSection = extractSection(html, "产品参数");
    const paramsTable = extractTable(paramsSection);

    // 提取资料下载 PDF 链接
    const pdfMatch = html.match(/href=["']([^"']*\.pdf[^"']*)["']/i);
    const pdfUrl = pdfMatch ? pdfMatch[1] : "";

    // 更新数据库
    const productRecord = await db.product.findUnique({ where: { model: product.model } });
    if (!productRecord) {
      console.log("产品不存在:", product.model);
      return;
    }

    // 更新中文翻译
    await db.productTranslation.upsert({
      where: { productId_locale: { productId: productRecord.id, locale: "zh" } },
      update: {
        description: featuresText ? `<p>${featuresText}</p>` : null,
        selection: paramsTable ? `<table>${paramsTable}</table>` : null,
      },
      create: {
        productId: productRecord.id,
        locale: "zh",
        name: product.model,
        description: featuresText ? `<p>${featuresText}</p>` : null,
        selection: paramsTable ? `<table>${paramsTable}</table>` : null,
      },
    });

    // 创建文档记录
    if (pdfUrl) {
      await db.document.upsert({
        where: { id: productRecord.id + "_manual" },
        update: {
          title: `${product.model} 产品说明书`,
          filePath: pdfUrl,
          docType: "user_manual",
        },
        create: {
          id: productRecord.id + "_manual",
          productId: productRecord.id,
          brandId: productRecord.brandId,
          title: `${product.model} 产品说明书`,
          filePath: pdfUrl,
          docType: "user_manual",
          language: "zh",
        },
      });
    }

    console.log("完成:", product.model, "PDF:", pdfUrl ? "有" : "无");
  } catch (err) {
    console.error("失败:", product.model, err.message);
  }
}

async function main() {
  for (const product of PRODUCTS) {
    await scrapeProduct(product);
  }
  console.log("全部完成！");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
