const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  await c.query(`ALTER TABLE "NavMenuTranslation" ALTER COLUMN locale TYPE "Locale" USING locale::"Locale"`);
  console.log("NavMenuTranslation.locale 已转为 Locale enum");
  await c.end();
})();
