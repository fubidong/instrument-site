const { Client } = require("pg");
const fs = require("fs");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(`SELECT model, "coverImage" FROM "Product" WHERE "brandId"=(SELECT id FROM "Brand" WHERE code='SIGLENT')`);
  const list = r.rows.filter((x) => x.coverImage).map((x) => ({ model: x.model, path: "E:/cxy/instrument-site/public" + x.coverImage }));
  fs.writeFileSync("C:/cxy/covers.json", JSON.stringify(list, null, 1));
  console.log("导出", list.length, "个 cover");
  await c.end();
})();
