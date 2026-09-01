// 电源类综合回填：线性电源 SPD / 电子负载 SDL / 源表 SMM / 开关电源 SPS / 万用表 SDM / 模块化 MN-MS
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const prod = {};
  const pr = await c.query(`SELECT p.id, p.model FROM "Product" p`);
  for (const r of pr.rows) prod[r.model.toUpperCase().trim()] = r.id;

  async function catId(code) { return (await c.query(`SELECT id FROM "Category" WHERE code=$1`, [code])).rows[0].id; }
  async function defs(cat) {
    const r = await c.query(`SELECT key, id FROM "ParamDefinition" WHERE "categoryId"=$1`, [cat]);
    const m = {}; for (const x of r.rows) m[x.key] = x.id; return m;
  }
  const D = {
    linear: await defs(await catId("SIGLENT-LINEAR-POWER")),
    load: await defs(await catId("SIGLENT-LOAD")),
    smu: await defs(await catId("SIGLENT-SMU")),
    sps: await defs(await catId("SIGLENT-SWITCH-POWER")),
    meter: await defs(await catId("SIGLENT-MULTIMETER")),
    modular: await defs(await catId("SIGLENT-MODULAR")),
  };
  let count = 0;
  const upsert = async (pid, defId_, val) => {
    if (!pid || !defId_ || val === null || val === undefined) return;
    await c.query(
      `INSERT INTO "ProductParamValue" ("id","productId","paramDefinitionId","valueString","createdAt","updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
       ON CONFLICT ("productId","paramDefinitionId") DO UPDATE SET "valueString"=EXCLUDED."valueString", "updatedAt"=now()`,
      [pid, defId_, String(val)]
    );
    count++;
  };
  const set = async (model, d, k, v) => { await upsert(prod[model.toUpperCase()], d[k], v); };

  // ========== 线性电源 SPD ==========
  const spd = [
    ["SPD1168X", "1", "0-16 V", "0-8 A", "128 W", "1 mV/1 mA", "单通道"],
    ["SPD1168X-C", "1", "0-16 V", "0-8 A", "128 W", "10 mV/10 mA", "单通道"],
    ["SPD1305X", "1", "0-30 V", "0-5 A", "150 W", "1 mV/1 mA", "单通道"],
    ["SPD1305X-C", "1", "0-30 V", "0-5 A", "150 W", "10 mV/10 mA", "单通道"],
    ["SPD3303X", "3", "0-30 V", "0-3 A", "220 W", "1 mV/1 mA", "三通道（CH1/CH2 0-30V/0-3A，CH3 0-5V/0-3A）"],
    ["SPD3303X-C", "3", "0-30 V", "0-3 A", "220 W", "10 mV/10 mA", "三通道（CH1/CH2 0-30V/0-3A，CH3 0-5V/0-3A）"],
    ["SPD3303C", "3", "0-30 V", "0-3 A", "220 W", "10 mV/10 mA", "三通道（CH1/CH2 0-30V/0-3A，CH3 0-5V/0-3A）"],
    ["SPD4121X", "4", "0-15 V", "0-10 A", "285 W", "1 mV/1 mA", "四通道"],
    ["SPD4306X", "4", "0-30 V", "0-6 A", "400 W", "1 mV/1 mA", "四通道"],
    ["SPD4323X", "4", "0-32 V", "0-3.2 A", "240 W", "1 mV/1 mA", "四通道"],
  ];
  for (const [m, ch, vr, cr, mp, res, om] of spd) {
    await set(m, D.linear, "channels", ch);
    await set(m, D.linear, "voltageRange", vr);
    await set(m, D.linear, "currentRange", cr);
    await set(m, D.linear, "maxPower", mp);
    await set(m, D.linear, "voltageResolution", res);
    await set(m, D.linear, "currentResolution", res);
    await set(m, D.linear, "outputModes", om);
    console.log("  ✓ SPD", m, ch + "ch", vr, cr, mp);
  }

  // ========== 电子负载 SDL ==========
  const sdl = [
    ["SDL1020X", "1", "150 V", "30 A", "200 W", "0.1 mV/0.1 mA"],
    ["SDL1020X-E", "1", "150 V", "30 A", "200 W", "1 mV/1 mA"],
    ["SDL1030X", "1", "150 V", "30 A", "300 W", "0.1 mV/0.1 mA"],
    ["SDL1030X-E", "1", "150 V", "30 A", "300 W", "1 mV/1 mA"],
  ];
  for (const [m, ch, mv, mc, mp, res] of sdl) {
    await set(m, D.load, "channels", ch);
    await set(m, D.load, "maxInputVoltage", mv);
    await set(m, D.load, "maxInputCurrent", mc);
    await set(m, D.load, "maxPower", mp);
    await set(m, D.load, "power", mp);
    await set(m, D.load, "voltage", mv);
    await set(m, D.load, "current", mc);
    await set(m, D.load, "voltageReadbackRes", res);
    await set(m, D.load, "currentReadbackRes", res);
    await set(m, D.load, "modes", "CC/CV/CR/CP/LED");
    await set(m, D.load, "slewRate", "0.001 A/μs ~ 2.5 A/μs");
    await set(m, D.load, "ccDynamicFreq", "500 kHz（动态频率）");
    console.log("  ✓ SDL", m, ch + "ch", mv, mc, mp);
  }

  // ========== 源表 SMU SMM ==========
  for (const [m, ch] of [["SMM3311X", "1"], ["SMM3312X", "2"]]) {
    await set(m, D.smu, "channels", ch);
    await set(m, D.smu, "voltageRange", "±210 V");
    await set(m, D.smu, "currentRange", "±3 A");
    await set(m, D.smu, "powerRange", "31.8 W");
    await set(m, D.smu, "resolution", "10 fA / 100 nV");
    await set(m, D.smu, "voltageAccuracy", "±(0.015% + 0.0005%)（最佳）");
    await set(m, D.smu, "currentAccuracy", "±(0.03% + 0.005%)（最佳）");
    await set(m, D.smu, "modes", "四象限源/测量（SMU），可脉冲输出 ±10.5 A");
    await set(m, D.smu, "displaySize", "5 英寸");
    console.log("  ✓ SMM", m, ch + "ch", "±210V/±3A/31.8W");
  }

  // ========== 开关电源 SPS ==========
  const sps = [
    ["SPS5041X", "1", "0-40 V", "0-30 A", "360 W"],
    ["SPS5042X", "1", "0-40 V", "0-60 A", "720 W"],
    ["SPS5043X", "1", "0-40 V", "0-90 A", "1080 W"],
    ["SPS5044X", "2", "0-40 V", "0-30 A", "720 W"],
    ["SPS5045X", "3", "0-40 V", "0-30 A", "1080 W"],
    ["SPS5051X", "1", "0-50 V", "0-10 A", "180 W"],
    ["SPS5081X", "1", "0-80 V", "0-15 A", "360 W"],
    ["SPS5082X", "1", "0-80 V", "0-30 A", "720 W"],
    ["SPS5083X", "1", "0-80 V", "0-45 A", "1080 W"],
    ["SPS5084X", "2", "0-80 V", "0-15 A", "720 W"],
    ["SPS5085X", "3", "0-80 V", "0-15 A", "1080 W"],
    ["SPS5161X", "1", "0-160 V", "0-7.5 A", "360 W"],
    ["SPS5162X", "1", "0-160 V", "0-15 A", "720 W"],
    ["SPS5163X", "1", "0-160 V", "0-22.5 A", "1080 W"],
    ["SPS5164X", "2", "0-160 V", "0-7.5 A", "720 W"],
    ["SPS5165X", "3", "0-160 V", "0-7.5 A", "1080 W"],
    ["SPS6150X", "1", "0-100 V", "0-50 A", "1500 W"],
    ["SPS6225X", "1", "0-200 V", "0-25 A", "1500 W"],
    ["SPS6412X", "1", "0-40 V", "0-120 A", "1500 W"],
  ];
  for (const [m, ch, vr, cr, mp] of sps) {
    await set(m, D.sps, "channels", ch);
    await set(m, D.sps, "voltageRange", vr);
    await set(m, D.sps, "currentRange", cr);
    await set(m, D.sps, "maxPower", mp);
    await set(m, D.sps, "voltageResolution", "1 mV/1 mA");
    await set(m, D.sps, "currentResolution", "1 mV/1 mA");
    await set(m, D.sps, "rippleNoise", "≤ 50 mVpp（典型值）");
    console.log("  ✓ SPS", m, ch + "ch", vr, cr, mp);
  }

  // ========== 万用表 SDM ==========
  const sdm = [
    ["SDM3065X", "6½", "2,200,000", "直流电压精度 ±(0.0015%+0.0002%)"],
    ["SDM4055A", "5½", "220,000", "直流电压精度 ±(0.012%+0.001%)"],
    ["SDM4065A", "6½", "2,200,000", "直流电压精度 35 ppm"],
    ["SDM4065A-SC", "6½", "2,200,000", "直流电压精度 35 ppm"],
    ["SDM4075A", "7½", "22,000,000", "直流电压精度 20 ppm"],
    ["SDM4075A-SC", "7½", "22,000,000", "直流电压精度 20 ppm"],
  ];
  for (const [m, dig, cnt, acc] of sdm) {
    await set(m, D.meter, "displayDigits", dig);
    await set(m, D.meter, "dcVoltageRange", "0-1000 V");
    await set(m, D.meter, "dcVoltageAccuracy", acc);
    await set(m, D.meter, "measurementFunctions", "DCV/ACV/DCI/ACI/2W电阻/4W电阻/电容/频率/周期/二极管/温度");
    await set(m, D.meter, "resolution", cnt + " counts");
    await set(m, D.meter, "scanCard", m.endsWith("-SC") ? "支持" : "可选（-SC）");
    console.log("  ✓ SDM", m, dig, cnt + " counts");
  }

  // ========== 模块化 ==========
  const mod = [
    ["MS032A", "350 MHz", "2", "5 GSa/s", "12-bit", "1.25 Gpts", "模块化示波器（PXIe）"],
    ["MS052A", "500 MHz", "2", "5 GSa/s", "12-bit", "1.25 Gpts", "模块化示波器（PXIe）"],
    ["MS102A", "1 GHz", "2", "5 GSa/s", "12-bit", "1.25 Gpts", "模块化示波器（PXIe）"],
    ["MN514A", null, "2", null, null, null, "小型矢量网络分析仪（100 kHz~14 GHz）"],
    ["MN520A", null, "2", null, null, null, "小型矢量网络分析仪（100 kHz~20 GHz）"],
  ];
  for (const [m, bw, ch, sr, vr, sd, mt] of mod) {
    await set(m, D.modular, "moduleType", mt);
    await set(m, D.modular, "channels", ch);
    if (bw) await set(m, D.modular, "bandwidth", bw);
    if (sr) await set(m, D.modular, "sampleRate", sr);
    if (vr) await set(m, D.modular, "verticalResolution", vr);
    if (sd) await set(m, D.modular, "storageDepth", sd);
    console.log("  ✓ MOD", m, mt);
  }

  console.log("\n共写入/更新", count, "个参数值");
  await c.end();
});
