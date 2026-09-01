const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  // 找鼎阳示波器品牌分类
  const cat = await c.query(`
    SELECT cat.id, cat.code, tr.name FROM "Category" cat
    LEFT JOIN "CategoryTranslation" tr ON tr."categoryId"=cat.id AND tr.locale='zh'
    WHERE cat.code ILIKE '%oscillo%' OR tr.name LIKE '%示波器%'`);
  console.log("示波器品类:");
  cat.rows.forEach((r) => console.log("  ", r.id, r.code, r.name));

  // 插入示例选项卡（探头配件）到第一个示波器品牌分类
  if (cat.rows.length > 0) {
    const cid = cat.rows[0].id;
    const dup = await c.query(`SELECT id FROM "ProductTab" WHERE "categoryId"=$1 AND code='probes'`, [cid]);
    if (dup.rows.length === 0) {
      const tab = await c.query(
        `INSERT INTO "ProductTab" (id,"categoryId",code,icon,"sortOrder","isActive","createdAt","updatedAt")
         VALUES (gen_random_uuid(), $1, 'probes', '🔬', 1, true, now(), now()) RETURNING id`,
        [cid]
      );
      const tid = tab.rows[0].id;
      await c.query(
        `INSERT INTO "ProductTabTranslation" (id,"productTabId",locale,title,content) VALUES
         (gen_random_uuid(), $1, 'zh', '探头配件', $2),
         (gen_random_uuid(), $1, 'en', 'Probes & Accessories', $3)`,
        [tid, '<p>以下是推荐配套的探头与配件：</p><ul><li>SP6150A 无源探头（500 MHz）</li><li>SP5050A 无源探头（500 MHz）</li><li>HPB4010 有源差分探头（1 GHz）</li><li>STB3 示波器探头测试附件套件</li></ul>', '<p>Recommended probes and accessories:</p><ul><li>SP6150A Passive Probe (500 MHz)</li><li>SP5050A Passive Probe (500 MHz)</li><li>HPB4010 Active Differential Probe (1 GHz)</li><li>STB3 Probe Accessory Kit</li></ul>']
      );
      console.log("已插入探头配件选项卡:", tid);
    } else {
      console.log("探头配件选项卡已存在");
    }
  }

  // 开启部分产品申请样机（示波器前 5 个）
  const upd = await c.query(`UPDATE "Product" SET "isSampleEnabled"=true
    WHERE id IN (SELECT p.id FROM "Product" p JOIN "ProductLine" pl ON pl.id=p."productLineId"
      WHERE pl."categoryId"=$1 ORDER BY p."sortOrder" LIMIT 5) RETURNING model`, [cat.rows[0]?.id]);
  console.log("开启申请样机的产品:", upd.rows.map((r) => r.model).join(", ") || "(无)");
  await c.end();
})();
