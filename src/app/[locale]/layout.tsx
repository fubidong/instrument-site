import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import SiteLink from "next/link";
import { getSiteSettings, getSiteCategories, getSiteBrands } from "@/lib/site";
import { getNavTree } from "@/lib/nav";
import type { NavNode } from "@/lib/nav";
import SiteNav, { type SiteNavNode } from "@/components/site-nav";
import SiteNavMobile from "@/components/site-nav-mobile";
import SiteSearch from "@/components/site-search";
import BrandSiteSwitcher from "@/components/brand-site-switcher";
import { brandPath } from "@/lib/brand-locale";
import { Phone, Mail, MapPin, ShieldCheck, FileText, Ban, Headphones } from "lucide-react";
import LocaleSwitcher from "./locale-switcher";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const [settings, categories, brands, navTree] = await Promise.all([
    getSiteSettings(locale),
    getSiteCategories(locale),
    getSiteBrands(locale),
    getNavTree({ brandId: null, includeHidden: false }),
  ]);

  // 页脚"产品中心"列仍用品类（导航本体由 NavMenu 驱动）
  const topCategories = categories.filter((c) => !c.parentId && c.showInNav);
  const isEn = locale === "en";
  const navHref = (n: { path: string }) => `/${locale}${n.path === "/" ? "" : n.path}`;
  // server 端递归预算每个节点的 href（外链用其自身 URL），避免把函数跨边界传给 client 组件
  const withHref = (ns: NavNode[]): SiteNavNode[] =>
    ns.map((n) => ({
      ...n,
      href: n.isExternal ? n.path : navHref(n),
      children: withHref(n.children),
    }));
  const navNodes = withHref(navTree);
  // 品牌站点下拉（进入各品牌站）
  const brandSites = brands
    .map((b) => ({
      code: b.code,
      name: isEn ? b.enName : b.zhName,
      href: brandPath(b.code, isEn ? "en" : "zh"),
      logo: b.logo,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex min-h-screen flex-col bg-white text-slate-800">
        {/* 顶部信息条：克制的发丝线条，仅热线 / 语言 / 询价 */}
        <div className="border-b border-slate-200 bg-white">
          <div className="ui-wrap flex h-9 items-center justify-between gap-4 text-xs">
            <p className="hidden truncate text-slate-500 sm:block">
              {settings.siteName} ·{" "}
              {isEn ? "Authorized Test & Measurement Supplier" : "专业测试测量仪器授权供应商"}
            </p>
            <div className="ml-auto flex items-center gap-4">
              {settings.phone && (
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Phone width={12} height={12} className="text-slate-400" aria-hidden="true" />
                  <span className="ui-num font-medium">{settings.phone}</span>
                </span>
              )}
              <span className="hidden h-3 w-px bg-slate-200 sm:block" aria-hidden="true" />
              <LocaleSwitcher locale={locale} />
              <Link
                href="/contact"
                className="font-medium text-primary transition-colors hover:underline"
              >
                {isEn ? "Inquiry" : "在线询价"}
              </Link>
            </div>
          </div>
        </div>

        {/* 主导航 */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="ui-wrap flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-bold text-primary-foreground">
                {settings.siteName.slice(0, 1)}
              </div>
              <div className="leading-tight">
                <div className="text-base font-bold text-slate-900">{settings.siteName}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  {settings.siteNameEn}
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              <SiteNav nodes={navNodes} isEn={isEn} />
              <Link
                href="/catalog"
                className="relative whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
              >
                {isEn ? "Catalog" : "产品目录"}
              </Link>
            </nav>

            <div className="hidden items-center gap-2.5 md:flex">
              <SiteSearch locale={locale} isEn={isEn} />
              <BrandSiteSwitcher brands={brandSites} isEn={isEn} currentBrand="" />
            </div>

            <div className="md:hidden">
              <SiteNavMobile nodes={navTree} locale={locale} isEn={isEn} phone={settings.phone ?? undefined} />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* 页脚：紧凑四列 + 信任信号 */}
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="ui-wrap grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* 品牌 + 联系 */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {settings.siteName.slice(0, 1)}
                </div>
                <div className="text-base font-bold text-slate-900">{settings.siteName}</div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {isEn
                  ? "Authorized distributor of world-renowned test & measurement instruments, offering selection consulting, custom solutions and technical support."
                  : "专业代理销售全球知名品牌的测试与测量仪器，提供选型咨询、方案定制与技术支持。"}
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-500">
                {settings.phone && (
                  <li className="flex items-center gap-2">
                    <Phone width={14} height={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="ui-num font-medium text-slate-700">{settings.phone}</span>
                  </li>
                )}
                {settings.email && (
                  <li className="flex items-center gap-2">
                    <Mail width={14} height={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="break-all">{settings.email}</span>
                  </li>
                )}
                {settings.address && (
                  <li className="flex items-start gap-2">
                    <MapPin width={14} height={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span>{settings.address}</span>
                  </li>
                )}
              </ul>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline"
              >
                {isEn ? "Send Inquiry" : "在线提交询价"} <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* 产品中心 */}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isEn ? "Products" : "产品中心"}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-500">
                {topCategories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/products?category=${c.code}`}
                      className="transition-colors hover:text-primary"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 代理品牌 */}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isEn ? "Brands" : "代理品牌"}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-500">
                {brands.map((b) => (
                  <li key={b.id}>
                    <SiteLink
                      href={brandPath(b.code, isEn ? "en" : "zh")}
                      className="transition-colors hover:text-primary"
                    >
                      {b.name}
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* 信任保障 */}
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {isEn ? "Why Us" : "服务保障"}
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck width={16} height={16} className="shrink-0 text-[var(--ui-trust)]" aria-hidden="true" />
                  <span>{isEn ? "Authorized distributor" : "授权代理，正品保障"}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <FileText width={16} height={16} className="shrink-0 text-[var(--ui-trust)]" aria-hidden="true" />
                  <span>{isEn ? "Inquiry-based procurement" : "询价采购，方案定制"}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Ban width={16} height={16} className="shrink-0 text-[var(--ui-trust)]" aria-hidden="true" />
                  <span>{isEn ? "No shopping cart · B2B only" : "无购物车 · 纯 B2B 业务"}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Headphones width={16} height={16} className="shrink-0 text-[var(--ui-trust)]" aria-hidden="true" />
                  <span>{isEn ? "Pre-sales & after-sales support" : "选型咨询与售后技术支持"}</span>
                </li>
              </ul>
              <span className="ui-badge ui-badge-trust mt-5">
                <ShieldCheck width={12} height={12} aria-hidden="true" />
                {isEn ? "Trusted B2B Partner" : "可信赖 B2B 合作伙伴"}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200">
            <div className="ui-wrap flex flex-col gap-1 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {isEn
                  ? "B2B test & measurement instrument distributor — authorized brands, inquiry-based, no shopping cart."
                  : "B2B 测试测量仪器代理商城 — 授权品牌、询价采购、无购物车。"}
              </p>
              <p>
                © {new Date().getFullYear()} {settings.siteName} {isEn ? "All Rights Reserved" : "版权所有"}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
