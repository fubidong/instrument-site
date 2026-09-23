import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const CATEGORIES = [
  { code: "flexible-current-probe", name: "柔性电流探头" },
  { code: "rigid-current-probe", name: "刚性电流探头" },
  { code: "high-voltage-probe", name: "高压探头" },
  { code: "differential-probe", name: "差分探头" },
  { code: "calibrator", name: "校准器" },
  { code: "current-sensor", name: "电流传感器" },
  { code: "sensor-power", name: "传感器电源" },
  { code: "multi-channel-test-platform", name: "多通道测试平台" },
  { code: "data-acquisition", name: "数据采集系统" },
];

const PRODUCTS = [
  { model: "UHCT", name: "超高频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/uhct/" },
  { model: "HCTS", name: "高频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/hcts/" },
  { model: "HCTM", name: "高频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/hctm/" },
  { model: "HCTL", name: "高频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/hctl/" },
  { model: "HCTM3000A-2CH", name: "高频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/hctm3000a-2ch/" },
  { model: "MCTD/B", name: "中频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/mctd-b/" },
  { model: "MCTD-3CH", name: "中频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/mctd3ch/" },
  { model: "LCTD/B", name: "低频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/lctd-b/" },
  { model: "Hmini", name: "Mini高频柔性电流探头", category: "柔性电流探头", url: "https://www.meastek.com/products/hmini/" },
  { model: "HMR", name: "高频纳秒脉冲系列", category: "刚性电流探头", url: "https://www.meastek.com/products/hmr/" },
  { model: "MMR", name: "中频纳秒脉冲系列", category: "刚性电流探头", url: "https://www.meastek.com/products/mmr/" },
  { model: "OMMR", name: "中频纳秒脉冲系列", category: "刚性电流探头", url: "https://www.meastek.com/products/ommr/" },
  { model: "LMR", name: "低频微秒脉冲系列", category: "刚性电流探头", url: "https://www.meastek.com/products/lmr/" },
  { model: "MCM", name: "同轴电流监视器", category: "刚性电流探头", url: "https://www.meastek.com/products/mcm-1k200/" },
  { model: "HP6012A", name: "高压单端探头", category: "高压探头", url: "https://www.meastek.com/products/hp6012a/" },
  { model: "HP6015A", name: "高压单端探头", category: "高压探头", url: "https://www.meastek.com/products/hp6015a/" },
  { model: "HP6060A", name: "高压单端探头", category: "高压探头", url: "https://www.meastek.com/products/hp6060a/" },
  { model: "HDP6000K", name: "高压差分探头", category: "差分探头", url: "https://www.meastek.com/products/hdp6000k/" },
  { model: "HDP6000", name: "高压差分探头", category: "差分探头", url: "https://www.meastek.com/products/hdp6000/" },
  { model: "MDP5000", name: "高压差分探头", category: "差分探头", url: "https://www.meastek.com/products/mdp5000/" },
  { model: "MDP4000K", name: "高压差分探头", category: "差分探头", url: "https://www.meastek.com/products/mdp4000k/" },
  { model: "MDP4000", name: "高压差分探头", category: "差分探头", url: "https://www.meastek.com/products/mdp4000/" },
  { model: "UDP8000K", name: "差分测试仪", category: "差分探头", url: "https://www.meastek.com/products/udp8000k/" },
  { model: "HDP7000", name: "差分测试仪", category: "差分探头", url: "https://www.meastek.com/products/hdp7000/" },
  { model: "HST8000", name: "高压测试仪", category: "差分探头", url: "https://www.meastek.com/products/hst8000/" },
  { model: "HST3000", name: "高压测试仪", category: "差分探头", url: "https://www.meastek.com/products/hst3000/" },
  { model: "MZ5000", name: "多功能精密校准器", category: "校准器", url: "https://www.meastek.com/products/mz5000/" },
  { model: "MCTU", name: "0.001%精度电流传感器", category: "电流传感器", url: "https://www.meastek.com/products/mctu/" },
  { model: "MCTH", name: "0.01%精度电流传感器", category: "电流传感器", url: "https://www.meastek.com/products/mcth/" },
  { model: "MCTL", name: "0.1%精度电流传感器", category: "电流传感器", url: "https://www.meastek.com/products/mctl/" },
  { model: "MCTP-6000", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-6000/" },
  { model: "MCTP-5000", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-5000/" },
  { model: "MCTP-4000", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-4000/" },
  { model: "MCTP-3000", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-3000/" },
  { model: "MCTP-2000", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-2000/" },
  { model: "MCTP-1224", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-1224/" },
  { model: "MCTP-1000L", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mcpl-1000l/" },
  { model: "MCTP-1000H", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mctp-1000h/" },
  { model: "MiP-1000", name: "高精度传感器电源", category: "传感器电源", url: "https://www.meastek.com/products/mip-1000/" },
  { model: "MCP-2000", name: "电流探头专用电源", category: "传感器电源", url: "https://www.meastek.com/products/mcp-2000/" },
  { model: "MCP-3000", name: "电流探头专用电源", category: "传感器电源", url: "https://www.meastek.com/products/mcp-3000/" },
  { model: "MPS8000", name: "多通道可移动大电流测试平台", category: "多通道测试平台", url: "https://www.meastek.com/products/mps8000/" },
  { model: "MPS7000", name: "多通道可移动大电流测试平台", category: "多通道测试平台", url: "https://www.meastek.com/products/mps7000/" },
  { model: "MZ1000", name: "多路数据记录仪", category: "数据采集系统", url: "https://www.meastek.com/products/mz1000/" },
  { model: "MZS2000", name: "多通道采集系统", category: "数据采集系统", url: "https://www.meastek.com/products/mzs2016/" },
];

async function main() {
  let brand = await db.brand.findUnique({ where: { code: "meastek" } });
  if (!brand) {
    brand = await db.brand.create({
      data: {
        code: "meastek",
        website: "https://www.meastek.com",
        sortOrder: 50,
        translations: {
          create: [
            { locale: "zh", name: "脉知", description: "脉知科技专业电流探头与传感器" },
            { locale: "en", name: "Meastek", description: "Meastek current probes and sensors" },
          ],
        },
      },
    });
    console.log("品牌已创建:", brand.code);
  } else {
    console.log("品牌已存在:", brand.code);
  }

  const catMap = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    let category = await db.category.findUnique({ where: { code: "meastek-" + cat.code } });
    if (!category) {
      category = await db.category.create({
        data: {
          code: "meastek-" + cat.code,
          brandId: brand.id,
          sortOrder: i,
          translations: {
            create: [
              { locale: "zh", name: cat.name },
              { locale: "en", name: cat.name },
            ],
          },
        },
      });
      console.log("分类已创建:", cat.name);
    }
    catMap[cat.name] = category.id;
  }

  for (const product of PRODUCTS) {
    const categoryId = catMap[product.category];
    if (!categoryId) {
      console.log("跳过（无分类）:", product.model);
      continue;
    }

    let productLine = await db.productLine.findFirst({
      where: { brandId: brand.id, code: product.model },
    });
    if (!productLine) {
      productLine = await db.productLine.create({
        data: {
          brandId: brand.id,
          categoryId,
          code: product.model,
          translations: {
            create: [
              { locale: "zh", name: product.name },
              { locale: "en", name: product.name },
            ],
          },
        },
      });
      console.log("产品系列已创建:", product.model);
    }

    let existing = await db.product.findUnique({ where: { model: product.model } });
    if (!existing) {
      await db.product.create({
        data: {
          model: product.model,
          brandId: brand.id,
          categoryId,
          productLineId: productLine.id,
          translations: {
            create: [
              { locale: "zh", name: product.name, description: "产品官网: " + product.url },
              { locale: "en", name: product.name, description: "Product URL: " + product.url },
            ],
          },
        },
      });
      console.log("产品已创建:", product.model);
    }
  }

  console.log("完成！共", PRODUCTS.length, "个产品");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
