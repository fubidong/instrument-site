import { db } from "@/lib/db";
import CatalogClient from "./catalog-client";

export const dynamic = "force-dynamic";

// 品类归纳规则：把细分品类合并成大类展示
function consolidateCategories(cats: { id: string; name: string; children: { id: string; name: string }[] }[]) {
  // 归一化名称，用于去重
  const seen = new Set<string>();
  const result: { name: string; sub: string[] }[] = [];

  // 显式大类归并映射：子品类关键词 → 大类名
  const groupMap: { key: RegExp; group: string }[] = [
    { key: /示波器/.test("示波器") && /示波器|高分辨率示波器|数字示波器|紧凑型示波器|混合信号示波器|便携.*示波|手持.*示波/i ? /示波器|高分辨率|紧凑型|混合信号|便携.*示波/i : /示波器/i, group: "示波器" },
  ];
  // 简化：直接按关键词归并
  function classify(name: string): string {
    if (/手持.*示波|示波表|手持表/i.test(name)) return "手持示波表";
    if (/示波器/.test(name)) return "示波器";
    if (/直流电源|线性电源|开关电源|交流电源/i.test(name)) return "直流电源";
    if (/源测|源表|数字源表|源测量|SMU/i.test(name)) return "数字源表";
    if (/电子负载|交流负载/i.test(name)) return "电子负载";
    if (/电池测试|电池模拟|电池化成/i.test(name)) return "电池测试系统";
    if (/探头|逻辑探头|电流探头|光隔离|高压差分/i.test(name)) return "示波器探头";
    if (/频谱分析仪|信号分析仪|频谱/i.test(name)) return "频谱分析仪";
    if (/矢网|网络分析/i.test(name)) return "矢量网络分析仪";
    if (/信号发生器|信号源|波形发生器|任意波形/i.test(name)) return "信号发生器";
    if (/万用表|多用表/i.test(name)) return "数字万用表";
    if (/钳形表|钳表/i.test(name)) return "钳形表";
    if (/红外测温|热像仪|热成像/i.test(name)) return "红外热像仪";
    if (/数据采集|采集系统|开关系统/i.test(name)) return "数据采集系统";
    if (/半导体/i.test(name)) return "半导体测试";
    if (/安规|耐压|绝缘|耐电压/i.test(name)) return "安规测试仪";
    if (/LCR|阻抗|电桥/i.test(name)) return "LCR表";
    if (/功率分析|功率计/i.test(name)) return "功率分析仪";
    if (/绝缘电阻|兆欧表/i.test(name)) return "绝缘电阻测试仪";
    if (/接地电阻/i.test(name)) return "接地电阻测试仪";
    if (/回路电阻/i.test(name)) return "回路电阻测试仪";
    if (/电磁兼容|EMC|浪涌|脉冲|群脉冲/i.test(name)) return "电磁兼容测试";
    if (/电源测试|电源分析/i.test(name)) return "电源测试仪";
    if (/光功率|光损耗|光时域|OTDR|光纤/i.test(name)) return "光通信测试";
    if (/线缆|网线|网络测试/i.test(name)) return "线缆测试仪";
    if (/毫欧|微欧|低电阻/i.test(name)) return "低电阻测试仪";
    if (/交流电源/i.test(name)) return "交流电源";
    return name;
  }

  for (const c of cats) {
    const g = classify(c.name);
    if (!seen.has(g)) {
      seen.add(g);
      result.push({ name: g, sub: [] });
    }
  }
  // 把子品类也归并
  for (const c of cats) {
    for (const ch of c.children) {
      const g = classify(ch.name);
      const row = result.find((r) => r.name === g);
      if (row && !row.sub.includes(ch.name) && ch.name !== g) row.sub.push(ch.name);
    }
  }
  return result;
}

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const localeFilter = locale as "zh" | "en";

  const [brands, tags, infoRows, allCategories] = await Promise.all([
    db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: localeFilter } },
        ownCategories: {
          include: {
            translations: { where: { locale: localeFilter } },
            children: {
              include: {
                translations: { where: { locale: localeFilter } },
                children: { include: { translations: { where: { locale: localeFilter } } } },
              },
            },
          },
        },
      },
    }),
    db.catalogTag.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.companyInfo.findMany(),
    db.category.findMany({
      where: { brandId: null },
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale: localeFilter } } },
    }),
  ]);

  const info: Record<string, string> = {};
  infoRows.forEach((r: any) => (info[r.key] = r.value));

  const brandData = brands.map((b: any) => {
    const t = b.translations[0];
    return {
      id: b.id,
      code: b.code,
      name: t?.name ?? b.code,
      description: t?.description ?? "",
      logo: b.logo ?? "",
      website: b.website ?? "",
      tags: b.tags ?? [],
      categories: (b.ownCategories ?? [])
        .filter((c: any) => c.showInNav !== false)
        .map((c: any) => {
          const ct = c.translations[0];
          return {
            id: c.id,
            name: ct?.name ?? c.code,
            icon: c.icon ?? "",
            children: (c.children ?? [])
              .filter((ch: any) => ch.showInNav !== false)
              .map((ch: any) => {
                const cht = ch.translations[0];
                return {
                  id: ch.id,
                  name: cht?.name ?? ch.code,
                  icon: ch.icon ?? "",
                  children: (ch.children ?? [])
                    .filter((g: any) => g.showInNav !== false)
                    .map((g: any) => {
                      const gt = g.translations[0];
                      return { id: g.id, name: gt?.name ?? g.code };
                    }),
                };
              }),
          };
        }),
    };
  });

  const categoryData = allCategories.map((c: any) => {
    const ct = c.translations[0];
    return { name: ct?.name ?? c.code, sub: [] as string[] };
  });

  return (
    <CatalogClient
      brands={brandData}
      tags={tags.map((t: any) => ({ name: t.name, color: t.color }))}
      info={info}
      categories={categoryData}
      locale={locale}
    />
  );
}
