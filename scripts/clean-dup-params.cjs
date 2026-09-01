// 清理旧模板与新模板语义重复的参数（保留有值参数的迁移）
const { Client } = require("pg");
const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });

async function migrate(catCode, oldKey, newKey) {
  const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [catCode]);
  const catId = cat.rows[0].id;
  const oldD = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key=$2`, [catId, oldKey]);
  const newD = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key=$2`, [catId, newKey]);
  if (!oldD.rows[0] || !newD.rows[0]) { console.log("skip", catCode, oldKey, "->", newKey, "(missing)"); return; }
  const oldId = oldD.rows[0].id, newId = newD.rows[0].id;
  await c.query(`UPDATE "ProductParamValue" SET "paramDefinitionId"=$1 WHERE "paramDefinitionId"=$2`, [newId, oldId]);
  await c.query(`DELETE FROM "ParamDefinitionTranslation" WHERE "paramDefinitionId"=$1`, [oldId]);
  await c.query(`DELETE FROM "ParamDefinition" WHERE id=$1`, [oldId]);
  console.log("migrated", catCode, oldKey, "->", newKey);
}

async function delDef(catCode, key) {
  const cat = await c.query(`SELECT id FROM "Category" WHERE code=$1`, [catCode]);
  const catId = cat.rows[0].id;
  const d = await c.query(`SELECT id FROM "ParamDefinition" WHERE "categoryId"=$1 AND key=$2`, [catId, key]);
  if (!d.rows[0]) { console.log("skip delete", catCode, key, "(missing)"); return; }
  const did = d.rows[0].id;
  await c.query(`DELETE FROM "ProductParamValue" WHERE "paramDefinitionId"=$1`, [did]);
  await c.query(`DELETE FROM "ParamDefinitionTranslation" WHERE "paramDefinitionId"=$1`, [did]);
  await c.query(`DELETE FROM "ParamDefinition" WHERE id=$1`, [did]);
  console.log("deleted", catCode, key);
}

c.connect().then(async () => {
  // 迁移有值旧参数
  await migrate("SIGLENT-FUNCTION-GEN", "maxFreq", "maxFrequency");
  // 删除无值重复参数
  await delDef("SIGLENT-FUNCTION-GEN", "arbLength");
  await delDef("SIGLENT-SPECTRUM", "rbw");
  await delDef("SIGLENT-RF-GEN", "maxOutputPower");
  await delDef("SIGLENT-RF-GEN", "freqRes");
  await delDef("SIGLENT-MULTIMETER", "sampleRate");
  await delDef("SIGLENT-MULTIMETER", "dcAccuracy");
  await delDef("SIGLENT-MODULAR", "type");
  await c.end();
  console.log("DONE");
});
