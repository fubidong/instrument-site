const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 开启鼎阳示波器子分类下前 10 个产品的申请样机
  const upd = await c.query(`
    UPDATE "Product" SET "isSampleEnabled"=true
    WHERE id IN (
      SELECT p.id FROM "Product" p
      JOIN "ProductLine" pl ON pl.id=p."productLineId"
      JOIN "Brand" b ON b.id=pl."brandId"
      WHERE b.code='SIGLENT' AND pl."categoryId" IN (
        SELECT id FROM "Category" WHERE code IN ('SIGLENT-HI-RES-OSC','SIGLENT-DIGITAL-OSC','SIGLENT-COMPACT-OSC')
      )
      ORDER BY p."sortOrder" LIMIT 12
    )
    RETURNING model, "isSampleEnabled"`);
  console.log("开启申请样机的产品数:", upd.rows.length);
  upd.rows.forEach((r) => console.log("  ", r.model));
  const cnt = await c.query(`SELECT COUNT(*)::int AS n FROM "Product" WHERE "isSampleEnabled"=true`);
  console.log("全站已开启申请样机产品数:", cnt.rows[0].n);
  await c.end();
})();
