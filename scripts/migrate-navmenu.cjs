// 导航菜单迁移：创建 NavMenu 表 + NavMenuTranslation 表
const { Client } = require("pg");
(async () => {
  const c = new Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/instrument_site" });
  await c.connect();
  const check = await c.query(`SELECT to_regclass('public."NavMenu"') AS t`);
  if (check.rows[0].t) {
    console.log("NavMenu 表已存在，跳过建表");
  } else {
    await c.query(`
      CREATE TABLE "NavMenu" (
        "id" TEXT NOT NULL,
        "parentId" TEXT,
        "icon" TEXT,
        "path" TEXT NOT NULL DEFAULT '/',
        "permission" TEXT,
        "sort" INTEGER NOT NULL DEFAULT 0,
        "isVisible" BOOLEAN NOT NULL DEFAULT true,
        "isExternal" BOOLEAN NOT NULL DEFAULT false,
        "target" TEXT NOT NULL DEFAULT '_self',
        "platform" TEXT NOT NULL DEFAULT 'web',
        "brandId" TEXT,
        "deletedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NavMenu_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX "NavMenu_parentId_sort_idx" ON "NavMenu"("parentId", "sort");
      CREATE INDEX "NavMenu_platform_brandId_isVisible_deletedAt_idx" ON "NavMenu"("platform", "brandId", "isVisible", "deletedAt");
      ALTER TABLE "NavMenu" ADD CONSTRAINT "NavMenu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "NavMenu" ADD CONSTRAINT "NavMenu_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

      CREATE TABLE "NavMenuTranslation" (
        "id" TEXT NOT NULL,
        "navMenuId" TEXT NOT NULL,
        "locale" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        CONSTRAINT "NavMenuTranslation_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX "NavMenuTranslation_navMenuId_locale_key" ON "NavMenuTranslation"("navMenuId", "locale");
      ALTER TABLE "NavMenuTranslation" ADD CONSTRAINT "NavMenuTranslation_navMenuId_fkey" FOREIGN KEY ("navMenuId") REFERENCES "NavMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    console.log("NavMenu 表已创建");
  }
  await c.end();
})();
