// VNA（SNA/SHN/SVA）参数值回填：freqRange/maxFreq/ports 型号级 + dynamicRange 等系列级
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
c.connect().then(async () => {
  const catId = (await c.query(`SELECT id FROM "Category" WHERE code='SIGLENT-VNA'`)).rows[0].id;
  async function defId(key) {
    const r = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key=$2`, [catId, key]);
    return r.rows[0]?.id;
  }
  const D = {
    freqRange: await defId("freqRange"),
    maxFreq: await defId("maxFreq"),
    ports: await defId("ports"),
    dynamicRange: await defId("dynamicRange"),
    outputPower: await defId("outputPower"),
    ifBandwidth: await defId("ifBandwidth"),
    traceNoise: await defId("traceNoise"),
    sweepPoints: await defId("sweepPoints"),
    directivity: await defId("directivity"),
    measurementParams: await defId("measurementParams"),
    calibration: await defId("calibration"),
    timeDomain: await defId("timeDomain"),
    ioInterface: await defId("ioInterface"),
    remoteControl: await defId("remoteControl"),
    powerSupply: await defId("powerSupply"),
    displaySize: await defId("displaySize"),
  };

  const prod = {};
  const pr = await c.query(`SELECT p.id, p.model FROM "Product" p`);
  for (const r of pr.rows) prod[r.model.toUpperCase().trim()] = r.id;

  // [model, freqRange, maxFreq, ports]
  const models = [
    ["SNA5003X-E", "9 kHz~3 GHz", "3 GHz", 2],
    ["SNA5006X-E", "9 kHz~6.5 GHz", "6.5 GHz", 2],
    ["SNA5008X-E", "9 kHz~8.5 GHz", "8.5 GHz", 2],
    ["SNA5014X-E", "100 kHz~14 GHz", "14 GHz", 2],
    ["SNA5020X-E", "100 kHz~20 GHz", "20 GHz", 2],
    ["SNA5026X-E", "100 kHz~26.5 GHz", "26.5 GHz", 2],
    ["SNA5022A", "100 kHz~13.5 GHz", "13.5 GHz", 2],
    ["SNA5032A", "100 kHz~26.5 GHz", "26.5 GHz", 2],
    ["SNA5052X", "9 kHz~4.5 GHz", "4.5 GHz", 2],
    ["SNA5054X", "9 kHz~4.5 GHz", "4.5 GHz", 4],
    ["SNA5082X", "9 kHz~8.5 GHz", "8.5 GHz", 2],
    ["SNA5084X", "9 kHz~8.5 GHz", "8.5 GHz", 4],
    ["SNA6022A", "100 kHz~13.5 GHz", "13.5 GHz", 2],
    ["SNA6024A", "100 kHz~13.5 GHz", "13.5 GHz", 4],
    ["SNA6032A", "100 kHz~26.5 GHz", "26.5 GHz", 2],
    ["SNA6034A", "100 kHz~26.5 GHz", "26.5 GHz", 4],
    ["SNA6122A", "100 kHz~13.5 GHz", "13.5 GHz", 2],
    ["SNA6124A", "100 kHz~13.5 GHz", "13.5 GHz", 4],
    ["SNA6132A", "100 kHz~26.5 GHz", "26.5 GHz", 2],
    ["SNA6134A", "100 kHz~26.5 GHz", "26.5 GHz", 4],
    ["SNA6142A", "100 kHz~44 GHz", "44 GHz", 2],
    ["SNA6144A", "100 kHz~44 GHz", "44 GHz", 4],
    ["SNA6152A", "100 kHz~50 GHz", "50 GHz", 2],
    ["SNA6154A", "100 kHz~50 GHz", "50 GHz", 4],
    ["SHN914A", "30 kHz~14 GHz", "14 GHz", 2],
    ["SHN920A", "30 kHz~20 GHz", "20 GHz", 2],
    ["SHN926A", "30 kHz~26.5 GHz", "26.5 GHz", 2],
    ["SVA1015X", "9 kHz~1.5 GHz", "1.5 GHz", 2],
    ["SVA1032X", "9 kHz~3.2 GHz", "3.2 GHz", 2],
    ["SVA1075X", "9 kHz~7.5 GHz", "7.5 GHz", 2],
  ];

  // 系列级规格
  const seriesSpec = {
    "SNA5000X-E": { dynamicRange: "117 dB", outputPower: "-40 dBm ~ +10 dBm", traceNoise: "0.006 dB rms", ifBandwidth: "1 Hz~10 MHz" },
    "SNA5000A": { dynamicRange: "125 dB", outputPower: "-55 dBm ~ +10 dBm", traceNoise: "0.003 dB rms", ifBandwidth: "1 Hz~10 MHz" },
    "SNA5000X": { dynamicRange: "125 dB", outputPower: "-55 dBm ~ +10 dBm", traceNoise: "0.003 dB rms", ifBandwidth: "1 Hz~10 MHz" },
    "SNA6000A": { dynamicRange: "135 dB", outputPower: "-55 dBm ~ +10 dBm", traceNoise: "0.005 dB rms", ifBandwidth: "1 Hz~10 MHz" },
    "SHN900A": { dynamicRange: "100 dB", outputPower: "-45 dBm ~ +10 dBm", traceNoise: "0.003 dB rms", ifBandwidth: "10 Hz~3 MHz" },
    "SVA1000X": { dynamicRange: "70 dB（传输）", outputPower: "-40 dBm ~ +10 dBm", traceNoise: null, ifBandwidth: "1 Hz~3 MHz" },
  };
  const lineOf = {};
  const lr = await c.query(`SELECT p.model, pl.code AS line FROM "Product" p LEFT JOIN "ProductLine" pl ON pl.id=p."productLineId"`);
  for (const r of lr.rows) lineOf[r.model.toUpperCase().trim()] = r.line;

  const common = {
    sweepPoints: "2 ~ 100,001",
    ioInterface: "LAN, USB Device, USB Host(USB-GPIB)",
    remoteControl: "SCPI (USB-TMC/VXI-11/Socket/Telnet)",
    powerSupply: "100-240 V AC, 50/60 Hz",
    measurementParams: "S参数，差分（平衡）测量，接收机测量，时域分析，极限测试，带宽分析，阻抗转换，去嵌入",
    calibration: "响应校准，增强响应校准，全一端口/全双端口/全三端口/全四端口校准，TRL 校准",
    timeDomain: "时域反射/传输（TDR/TDT）分析（选件）",
    directivity: null,
  };
  const displayBySeries = { "SNA5000X-E": "8 英寸", "SNA5000A": "10.1 英寸", "SNA5000X": "10.1 英寸", "SNA6000A": "10.1 英寸", "SHN900A": "8.4 英寸", "SVA1000X": "8 英寸" };

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

  for (const [model, freq, maxf, ports] of models) {
    const pid = prod[model.toUpperCase()];
    if (!pid) { console.log("!! 未找到产品", model); continue; }
    const line = lineOf[model.toUpperCase()];
    const ss = seriesSpec[line];
    if (!ss) { console.log("!! 未找到系列规格", line); continue; }
    await upsert(pid, D.freqRange, freq);
    await upsert(pid, D.maxFreq, maxf);
    await upsert(pid, D.ports, String(ports));
    await upsert(pid, D.dynamicRange, ss.dynamicRange);
    await upsert(pid, D.outputPower, ss.outputPower);
    await upsert(pid, D.traceNoise, ss.traceNoise);
    await upsert(pid, D.ifBandwidth, ss.ifBandwidth);
    await upsert(pid, D.sweepPoints, common.sweepPoints);
    await upsert(pid, D.ioInterface, common.ioInterface);
    await upsert(pid, D.remoteControl, common.remoteControl);
    await upsert(pid, D.powerSupply, common.powerSupply);
    await upsert(pid, D.measurementParams, common.measurementParams);
    await upsert(pid, D.calibration, common.calibration);
    await upsert(pid, D.timeDomain, common.timeDomain);
    await upsert(pid, D.displaySize, displayBySeries[line]);
    console.log("  ✓", model, freq, "|", ports, "端口 |", ss.dynamicRange);
  }
  console.log("共写入/更新", count, "个参数值");
  await c.end();
});
