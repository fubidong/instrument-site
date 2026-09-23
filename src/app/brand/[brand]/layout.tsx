import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteSettings, getSiteBrands } from "@/lib/site";
import { getBrand, getBrandCategories } from "@/lib/brand";
import { getNavTree } from "@/lib/nav";
import type { NavNode } from "@/lib/nav";
import SiteNav, { type SiteNavNode } from "@/components/site-nav";
import SiteSearch from "@/components/site-search";
import BrandSiteSwitcher from "@/components/brand-site-switcher";
import { getBrandLocale, brandPath } from "@/lib/brand-locale";
import BrandLocaleSwitcher from "./brand-locale-switcher";
import HorizontalScroll from "@/components/horizontal-scroll";

const slugOf = (code: string) =>
  code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandCode } = await params;
  const locale = await getBrandLocale();
  setRequestLocale(locale);
  const messages = await getMessages();
  const isEn = locale === "en";

  const brand = await getBrand(brandCode);
  if (!brand || !brand.isActive) notFound();
  const brandName = brand.name[locale]?.name ?? brand.name["zh"]?.name ?? brand.code;

  const categories = await getBrandCategories(brand.id, locale);
  const topCats = categories.filter((c) => !c.parentId && c.showInNav);

  const settings = await getSiteSettings(locale);
  const base = brandPath(brand.code, locale);
  const navTree = await getNavTree({ brandId: brand.id, includeHidden: false });
  const navHref = (n: { path: string }) => `${base}${n.path === "/" ? "" : n.path}`;
  const withHref = (ns: NavNode[]): SiteNavNode[] =>
    ns.map((n) => ({
      ...n,
      href: n.isExternal ? n.path : navHref(n),
      children: withHref(n.children),
    }));
  const navNodes = withHref(navTree);

  const allBrands = await getSiteBrands("zh");
  const brandSites = allBrands
    .map((b) => ({
      code: b.code,
      name: isEn ? b.enName : b.zhName,
      href: brandPath(b.code, locale),
      logo: b.logo,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col bg-white text-slate-800">
        {/* 顶部信息条：与综合站一致的白底发丝线 */}
        <div className="border-b border-slate-200 bg-white">
          <div className="ui-wrap flex h-9 items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <Link
                href={isEn ? "/en" : "/"}
                className="flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {isEn ? "Main Site" : "返回总站"}
              </Link>
              <span className="truncate text-slate-500">
                {isEn ? `${brandName} · Authorized Distributor` : `${brandName} · 授权代理商`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {settings.phone && (
                <span className="text-slate-600">
                  {isEn ? `Hotline: ${settings.phone}` : `服务热线：${settings.phone}`}
                </span>
              )}
              <BrandLocaleSwitcher brandCode={brand.code.toLowerCase()} locale={locale} />
            </div>
          </div>
        </div>

        {/* 主导航：与综合站一致 */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="ui-wrap flex h-16 items-center justify-between gap-3">
            <Link href={base} className="flex shrink-0 items-center gap-2">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brandName} className="h-8 object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {brandName.slice(0, 1)}
                </div>
              )}
              <div className="hidden leading-tight lg:block">
                <div className="text-sm font-bold text-slate-900">{brandName}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">
                  {brand.name["en"]?.name ?? brand.code}
                </div>
              </div>
            </Link>

            <HorizontalScroll className="hidden flex-1 md:flex">
              <div className="flex items-center justify-center gap-0.5">
                <SiteNav nodes={navNodes} isEn={isEn} />
              </div>
            </HorizontalScroll>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <BrandSiteSwitcher brands={brandSites} isEn={isEn} currentBrand={brand.code} />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* 页脚：与综合站一致的四列布局 */}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="ui-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-base font-bold text-slate-900">{brandName}</div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {isEn
                  ? `Authorized distributor of ${brandName} test & measurement instruments.`
                  : `${brandName} 测试测量仪器授权经销商。`}
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isEn ? "Products" : "产品中心"}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-500">
                {topCats.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`${base}/category/${slugOf(c.code)}`}
                      className="transition-colors hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isEn ? "Quick Links" : "快捷入口"}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><Link href={base} className="transition-colors hover:text-primary">{isEn ? "Brand Home" : "品牌首页"}</Link></li>
                <li><Link href="/" className="transition-colors hover:text-primary">{isEn ? "Main Site" : "综合站"}</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-primary">{isEn ? "Inquiry" : "在线询价"}</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isEn ? "Contact" : "联系方式"}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {settings.phone && <li>{isEn ? "Phone: " : "电话："}{settings.phone}</li>}
                {settings.email && <li>{isEn ? "Email: " : "邮箱："}{settings.email}</li>}
                {settings.address && <li>{isEn ? "Address: " : "地址："}{settings.address}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {settings.siteName} · {brandName}
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
