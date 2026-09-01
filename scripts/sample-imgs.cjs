const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const r = await c.query(
    `SELECT model, "coverImage" FROM "Product"
     WHERE model IN ('SDS5054X HD','SDS5104X HD','SDS2074X Plus','SDS1104X-E','SDG1062X','SNA5006X-E','SSA3015X PLUS','SPD3303X','SMM3311X','SDL1030X','SDM4065A','SHS1102X')
     ORDER BY model`
  );
  r.rows.forEach((x) => console.log(x.model.padEnd(16), x.coverImage));
  await c.end();
})();
