import { db } from "../src/lib/db";

const prisma = db;

const slugOf = (code: string) =>
  code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function generateBrandNavs() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  for (const brand of brands) {
    console.log(`\n=== Processing ${brand.code} ===`);

    // 获取所有分类
    const cats = await prisma.category.findMany({
      where: { brandId: brand.id, deletedAt: null },
      include: { translations: true },
      orderBy: { sortOrder: "asc" },
    });

    const topCats = cats.filter((c) => !c.parentId);
    const subCats = cats.filter((c) => c.parentId);

    console.log(`  Top cats: ${topCats.length}, Sub cats: ${subCats.length}`);

    // 先删除该品牌现有的导航菜单
    await prisma.navMenu.deleteMany({
      where: { brandId: brand.id, platform: "web" },
    });

    // 创建一级菜单（首页）
    await prisma.navMenu.create({
      data: {
        parentId: null,
        path: "/",
        sort: 0,
        isVisible: true,
        isExternal: false,
        target: "_self",
        platform: "web",
        brandId: brand.id,
        translations: {
          create: [
            { locale: "zh", name: "首页" },
            { locale: "en", name: "Home" },
          ],
        },
      },
    });

    // 创建产品一级菜单
    let sortOrder = 1;
    for (const topCat of topCats) {
      const zhName =
        topCat.translations.find((t) => t.locale === "zh")?.name || topCat.code;
      const enName =
        topCat.translations.find((t) => t.locale === "en")?.name || topCat.code;

      const catSlug = slugOf(topCat.code);

      // 创建一级分类菜单
      const parentMenu = await prisma.navMenu.create({
        data: {
          parentId: null,
          path: `/category/${catSlug}`,
          sort: sortOrder++,
          isVisible: true,
          isExternal: false,
          target: "_self",
          platform: "web",
          brandId: brand.id,
          translations: {
            create: [
              { locale: "zh", name: zhName },
              { locale: "en", name: enName },
            ],
          },
        },
      });

      // 查找该一级分类下的二级分类
      const children = subCats.filter((c) => c.parentId === topCat.id);
      for (const child of children) {
        const childZh =
          child.translations.find((t) => t.locale === "zh")?.name || child.code;
        const childEn =
          child.translations.find((t) => t.locale === "en")?.name || child.code;
        const childSlug = slugOf(child.code);

        await prisma.navMenu.create({
          data: {
            parentId: parentMenu.id,
            path: `/category/${childSlug}`,
            sort: 0,
            isVisible: true,
            isExternal: false,
            target: "_self",
            platform: "web",
            brandId: brand.id,
            translations: {
              create: [
                { locale: "zh", name: childZh },
                { locale: "en", name: childEn },
              ],
            },
          },
        });
      }
    }

    // 创建联系我们菜单
    await prisma.navMenu.create({
      data: {
        parentId: null,
        path: "/contact",
        sort: sortOrder++,
        isVisible: true,
        isExternal: false,
        target: "_self",
        platform: "web",
        brandId: brand.id,
        translations: {
          create: [
            { locale: "zh", name: "联系我们" },
            { locale: "en", name: "Contact" },
          ],
        },
      },
    });

    console.log(`  Done: ${sortOrder - 1} top-level menus`);
  }
}

generateBrandNavs()
  .then(() => {
    console.log("\n✅ All brand navs generated successfully!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });
