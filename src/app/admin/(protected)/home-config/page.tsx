import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSiteBrands } from "@/lib/site";
import { BannerEditor } from "@/components/admin/banner-editor";
import { NavBannerEditor } from "@/components/admin/nav-banner-editor";

export const dynamic = "force-dynamic";

async function saveSetting(key: string, value: string, locale?: string) {
  const existing = await db.siteSetting.findFirst({ where: { key, locale: locale ?? null } });
  if (existing) {
    await db.siteSetting.update({ where: { id: existing.id }, data: { value } });
  } else {
    await db.siteSetting.create({ data: { key, value, locale: locale ?? null } });
  }
}

async function getSetting(key: string, locale?: string) {
  const row = await db.siteSetting.findFirst({ where: { key, locale: locale ?? null } });
  return row?.value ?? "";
}

export default async function HomeConfigPage() {
  const brands = await getSiteBrands("zh");
  const brandDescs: Record<string, { zh: string; en: string }> = {};
  for (const b of brands) {
    const dbBrand = await db.brand.findUnique({ where: { code: b.code }, include: { translations: true } });
    brandDescs[b.code] = {
      zh: dbBrand?.translations?.find((t: any) => t.locale === "zh")?.description || "",
      en: dbBrand?.translations?.find((t: any) => t.locale === "en")?.description || "",
    };
  }

  // 读取现有配置
  const homeHeroRaw = await getSetting("home_hero_config");
  let homeHero = {} as any;
  try { homeHero = JSON.parse(homeHeroRaw || "{}"); } catch {}

  const homeBannersRaw = await getSetting("home_banners");
  let homeBanners: any[] = [];
  try { homeBanners = JSON.parse(homeBannersRaw || "[]"); } catch {}

  const navBannerRaw = await getSetting("nav_banner_config");
  let navBanner = {} as any;
  try { navBanner = JSON.parse(navBannerRaw || "{}"); } catch {}

  async function saveForm(formData: FormData) {
    "use server";
    const type = formData.get("type") as string;

    if (type === "homeHero") {
      const config = {
        title: {
          zh: formData.get("title_zh") || "",
          en: formData.get("title_en") || "",
        },
        subtitle: {
          zh: formData.get("subtitle_zh") || "",
          en: formData.get("subtitle_en") || "",
        },
        imageUrl: formData.get("imageUrl") || "",
        primaryCta: {
          text: { zh: formData.get("cta1_zh") || "", en: formData.get("cta1_en") || "" },
          href: formData.get("cta1_href") || "",
        },
        secondaryCta: {
          text: { zh: formData.get("cta2_zh") || "", en: formData.get("cta2_en") || "" },
          href: formData.get("cta2_href") || "",
        },
        stats: [
          { value: formData.get("stat1_val") || "", label: { zh: formData.get("stat1_label_zh") || "", en: formData.get("stat1_label_en") || "" } },
          { value: formData.get("stat2_val") || "", label: { zh: formData.get("stat2_label_zh") || "", en: formData.get("stat2_label_en") || "" } },
          { value: formData.get("stat3_val") || "", label: { zh: formData.get("stat3_label_zh") || "", en: formData.get("stat3_label_en") || "" } },
        ],
      };
      await saveSetting("home_hero_config", JSON.stringify(config));
    }

    if (type === "brandHero") {
      const brandCode = (formData.get("brandCode") as string).toLowerCase();
      const existing = await getSetting(`brand_hero_config:${brandCode}`);
      let brandConfig = {} as any;
      try { brandConfig = JSON.parse(existing || "{}"); } catch {}

      brandConfig.tagline = {
        zh: formData.get("tagline_zh") || "",
        en: formData.get("tagline_en") || "",
      };
      brandConfig.imageUrl = formData.get("imageUrl") || "";
      brandConfig.primaryCta = {
        text: { zh: formData.get("cta_zh") || "", en: formData.get("cta_en") || "" },
        href: formData.get("cta_href") || "",
      };
      brandConfig.stats = [
        { value: formData.get("stat1_val") || "", label: { zh: formData.get("stat1_label_zh") || "", en: formData.get("stat1_label_en") || "" } },
        { value: formData.get("stat2_val") || "", label: { zh: formData.get("stat2_label_zh") || "", en: formData.get("stat2_label_en") || "" } },
        { value: formData.get("stat3_val") || "", label: { zh: formData.get("stat3_label_zh") || "", en: formData.get("stat3_label_en") || "" } },
        { value: formData.get("stat4_val") || "", label: { zh: formData.get("stat4_label_zh") || "", en: formData.get("stat4_label_en") || "" } },
      ];

      await saveSetting(`brand_hero_config:${brandCode}`, JSON.stringify(brandConfig));
    }

    if (type === "homeBanners") {
      const count = parseInt(formData.get("bannerCount") as string || "0");
      const banners = [];
      for (let i = 0; i < count; i++) {
        const imageUrl = formData.get(`b${i}_image`) as string;
        if (imageUrl) {
          banners.push({ imageUrl, link: formData.get(`b${i}_link`) || "", alt: formData.get(`b${i}_alt`) || "" });
        }
      }
      await saveSetting("home_banners", JSON.stringify(banners));
    }

    if (type === "navBanner") {
      const config = {
        imageUrl: formData.get("imageUrl") || "",
        href: formData.get("href") || "",
        alt: { zh: formData.get("alt_zh") || "", en: formData.get("alt_en") || "" },
        enabled: formData.get("enabled") === "on",
      };
      await saveSetting("nav_banner_config", JSON.stringify(config));
    }

    revalidatePath("/", "layout");
  }

  const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">首页配置</h1>

      <div className="space-y-8">
        {/* Tab 1: 综合站首页 */}
        <section className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">综合站首页 Hero</h2>
          <form action={saveForm} className="space-y-4">
            <input type="hidden" name="type" value="homeHero" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>标题（中）</label>
                <input name="title_zh" defaultValue={homeHero?.title?.zh || "专业测试测量仪器，一站选对、供好"} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>标题（英）</label>
                <input name="title_en" defaultValue={homeHero?.title?.en || "Professional Test & Measurement Instruments, Sourced Right"} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>副标题（中）</label>
                <textarea name="subtitle_zh" defaultValue={homeHero?.subtitle?.zh || "专业代理全球知名品牌的测试测量仪器，覆盖示波器、信号源、电源、万用表、频谱分析等全品类，提供产品选型、参数对比、批量供应与技术支持一站式服务。"} className={inputCls} rows={2} />
              </div>
              <div>
                <label className={labelCls}>副标题（英）</label>
                <textarea name="subtitle_en" defaultValue={homeHero?.subtitle?.en || "Authorized distributor of world-renowned test & measurement instruments. Covering oscilloscopes, signal generators, power supplies, multimeters, spectrum analyzers and more."} className={inputCls} rows={2} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Hero 配图 URL</label>
              <input name="imageUrl" defaultValue={homeHero?.imageUrl || ""} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>主 CTA 文字（中）</label>
                <input name="cta1_zh" defaultValue={homeHero?.primaryCta?.text?.zh || "浏览产品目录"} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>主 CTA 文字（英）</label>
                <input name="cta1_en" defaultValue={homeHero?.primaryCta?.text?.en || "Browse Product Catalog"} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>主 CTA 链接</label>
              <input name="cta1_href" defaultValue={homeHero?.primaryCta?.href || "/products"} className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>次 CTA 文字（中）</label>
                <input name="cta2_zh" defaultValue={homeHero?.secondaryCta?.text?.zh || "获取报价"} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>次 CTA 文字（英）</label>
                <input name="cta2_en" defaultValue={homeHero?.secondaryCta?.text?.en || "Get a Quote"} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>次 CTA 链接</label>
              <input name="cta2_href" defaultValue={homeHero?.secondaryCta?.href || "/contact"} className={inputCls} />
            </div>

            <div className="border-t pt-4">
              <label className={labelCls}>信任数字（3 个）</label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <input name={`stat${i + 1}_val`} defaultValue={homeHero?.stats?.[i]?.value || ["22", "3746", "10+"][i]} placeholder="数值" className={inputCls} />
                    <input name={`stat${i + 1}_label_zh`} defaultValue={homeHero?.stats?.[i]?.label?.zh || ["授权品牌", "在架型号", "服务工程师客户"][i]} placeholder="标签（中）" className={inputCls} />
                    <input name={`stat${i + 1}_label_en`} defaultValue={homeHero?.stats?.[i]?.label?.en || ["Authorized Brands", "Active Models", "Serving Engineers"][i]} placeholder="标签（英）" className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              保存综合站配置
            </button>
          </form>
        </section>

        {/* Tab 2: 品牌站首页 */}
        <section className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">品牌站 Hero 配置</h2>
          <form action={saveForm} className="space-y-4">
            <input type="hidden" name="type" value="brandHero" />

            <div>
              <label className={labelCls}>选择品牌</label>
              <select name="brandCode" className={inputCls} onChange="fillBrandDefaults(this)" data-brands={JSON.stringify(brandDescs)}>
                {brands.map((b) => (
                  <option key={b.code} value={b.code}>{b.zhName || b.code}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tagline（中）</label>
                <input name="tagline_zh" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tagline（英）</label>
                <input name="tagline_en" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Hero 配图 URL</label>
              <input name="imageUrl" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>主 CTA 文字（中）</label>
                <input name="cta_zh" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>主 CTA 文字（英）</label>
                <input name="cta_en" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>主 CTA 链接</label>
              <input name="cta_href" className={inputCls} />
            </div>

            <div className="border-t pt-4">
              <label className={labelCls}>品牌数据带（4 个数字）</label>
              <div className="grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <input name={`stat${i + 1}_val`} placeholder="数值" className={inputCls} />
                    <input name={`stat${i + 1}_label_zh`} placeholder="标签（中）" className={inputCls} />
                    <input name={`stat${i + 1}_label_en`} placeholder="标签（英）" className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              保存品牌配置
            </button>
          </form>
        </section>

        {/* 首页 Banner 轮播 */}
        <section className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">首页 Banner 轮播</h2>
          <BannerEditor banners={homeBanners} onSave={async (banners) => {
            "use server";
            await saveSetting("home_banners", JSON.stringify(banners));
            revalidatePath("/", "layout");
          }} />
        </section>

        {/* Tab 3: 导航 Banner */}
        <section className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold mb-4">导航 Banner</h2>
          <NavBannerEditor
            banner={{
              imageUrl: navBanner?.imageUrl || "",
              href: navBanner?.href || "",
              alt_zh: navBanner?.alt?.zh || "",
              alt_en: navBanner?.alt?.en || "",
              enabled: navBanner?.enabled || false,
            }}
            onSave={async (banner: any) => {
              "use server";
              const config = {
                imageUrl: banner.imageUrl,
                href: banner.href,
                alt: { zh: banner.alt_zh, en: banner.alt_en },
                enabled: banner.enabled,
              };
              await saveSetting("nav_banner_config", JSON.stringify(config));
              revalidatePath("/", "layout");
            }}
          />
        </section>
      </div>
    </div>
  );
}
