import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const PRODUCT_LINE_NAMES = {
  "UHCT": "超高频柔性电流探头",
  "HCTS": "高频柔性电流探头(标准)",
  "HCTM": "高频柔性电流探头(微型)",
  "HCTL": "高频柔性电流探头(长型)",
  "HCTM3000A-2CH": "高频柔性电流探头(2通道)",
  "MCTD/B": "中频柔性电流探头(B型)",
  "MCTD-3CH": "中频柔性电流探头(3通道)",
  "LCTD/B": "低频柔性电流探头(B型)",
  "Hmini": "Mini高频柔性电流探头",
  "HMR": "高频纳秒脉冲电流探头",
  "MMR": "中频纳秒脉冲电流探头",
  "OMMR": "超中频纳秒脉冲电流探头",
  "LMR": "低频微秒脉冲电流探头",
  "MCM": "同轴电流监视器",
  "HP6012A": "高压单端探头(60MHz/12kV)",
  "HP6015A": "高压单端探头(70MHz/15kV)",
  "HP6060A": "高压单端探头(120MHz/60kV)",
  "HDP6000K": "高压差分探头(高精度型)",
  "HDP6000": "高压差分探头(标准型)",
  "MDP5000": "高压差分探头(M系列)",
  "MDP4000K": "高压差分探头(K系列)",
  "MDP4000": "高压差分探头(4000系列)",
  "UDP8000K": "差分测试仪(高精度型)",
  "HDP7000": "差分测试仪(7000系列)",
  "HST8000": "高压测试仪(8000系列)",
  "HST3000": "高压测试仪(3000系列)",
  "MZ5000": "多功能精密校准器",
  "MCTU": "0.001%精度电流传感器",
  "MCTH": "0.01%精度电流传感器",
  "MCTL": "0.1%精度电流传感器",
  "MCTP-6000": "高精度传感器电源(6000系列)",
  "MCTP-5000": "高精度传感器电源(5000系列)",
  "MCTP-4000": "高精度传感器电源(4000系列)",
  "MCTP-3000": "高精度传感器电源(3000系列)",
  "MCTP-2000": "高精度传感器电源(2000系列)",
  "MCTP-1224": "高精度传感器电源(1224型号)",
  "MCTP-1000L": "高精度传感器电源(1000L)",
  "MCTP-1000H": "高精度传感器电源(1000H)",
  "MiP-1000": "电流探头专用电源(MiP-1000)",
  "MCP-2000": "电流探头专用电源(2000系列)",
  "MCP-3000": "电流探头专用电源(3000系列)",
  "MPS8000": "多通道可移动大电流测试平台(8000系列)",
  "MPS7000": "多通道可移动大电流测试平台(7000系列)",
  "MZ1000": "多路数据记录仪",
  "MZS2000": "多通道采集系统(2000系列)",
};

async function main() {
  const brand = await db.brand.findUnique({ where: { code: "meastek" } });
  if (!brand) {
    console.log("Brand not found");
    return;
  }

  for (const [code, name] of Object.entries(PRODUCT_LINE_NAMES)) {
    const pl = await db.productLine.findFirst({ where: { code } });
    if (!pl) continue;

    // 更新产品线翻译
    await db.productLineTranslation.upsert({
      where: { productLineId_locale: { productLineId: pl.id, locale: "zh" } },
      update: { name },
      create: { productLineId: pl.id, locale: "zh", name },
    });

    console.log(`更新: ${code} -> ${name}`);
  }

  console.log("全部完成！");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
