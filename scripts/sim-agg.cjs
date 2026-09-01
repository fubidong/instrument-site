const { Client } = require("pg");
function parseFreqMHz(s) {
  if (!s) return null;
  const t = s.trim().replace(/[；;]/g, "");
  if (/sa\/?\s*s?$/i.test(t) || /sa\/?s/i.test(t)) return null;
  const m = t.match(/([\d.]+)\s*(GHZ|MHZ|KHz|KHZ|HZ|G|M|K)/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.includes("ghz") || unit === "g") return num * 1000;
  if (unit.includes("mhz") || unit === "m") return num;
  if (unit.includes("khz") || unit === "k") return num / 1000;
  if (unit.includes("hz")) return num / 1e6;
  return null;
}
function normParamValue(s) {
  if (!s) return "";
  return s.replace(/[\s\u00A0]+/g, "").replace(/[；;，,。、\u00A0]+$/g, "").replace(/(通道|channels?)$/i, "").toLowerCase();
}
function formatFreq(mhz) {
  const fmt = (n) => { const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ""); return s; };
  if (mhz >= 1000) return `${fmt(mhz / 1000)} GHz`;
  return `${fmt(mhz)} MHz`;
}
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 模拟 page.tsx 聚合：freqRange def ids
  const defIds = ["8beec95e-d69b-49cb-99e9-ca173edefbc8"];
  const rows = await c.query(
    `SELECT "valueString" FROM "ProductParamValue" WHERE "paramDefinitionId" = ANY($1)`,
    [defIds]
  );
  const freqMap = new Map();
  const otherMap = new Map();
  let skipped = 0;
  for (const r of rows.rows) {
    if (!r.valueString) continue;
    const v = r.valueString.trim().replace(/[；;，,。、\u00A0]+$/g, "");
    if (!v) continue;
    if (/[~～\-–—]/.test(v)) { skipped++; continue; }
    const mhz = parseFreqMHz(v);
    if (mhz !== null) {
      if (!freqMap.has(mhz)) freqMap.set(mhz, formatFreq(mhz));
    } else {
      const norm = normParamValue(v);
      if (!norm) continue;
      const existing = otherMap.get(norm);
      if (!existing || v.length < existing.length) otherMap.set(norm, v);
    }
  }
  console.log("skipped(含~):", skipped, "/ total:", rows.rows.length);
  console.log("freqMap:", [...freqMap.entries()]);
  console.log("otherMap:", [...otherMap.entries()]);
  await c.end();
})();
