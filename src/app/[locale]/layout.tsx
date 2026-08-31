import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getSiteSettings, getSiteCategories, getSiteBrands } from "@/lib/site";
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
  const [settings, categories, brands] = await Promise.all([
    getSiteSettings(locale),
    getSiteCategories(locale),
    getSiteBrands(locale),
  ]);

  const topCategories = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const isEn = locale === "en";

  return (
    <NextIntlClientProvider messages={messages}>
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      {/* 顶部信息条 */}
      <div className="bg-slate-900 text-slate-300">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span>
            {settings.siteName} · {isEn ? "Test & Measurement Supplier" : "专业测试测量仪器供应服务商"}
          </span>
          <div className="flex items-center gap-4">
            {settings.phone && (
              <span>
                {isEn ? "Hotline: " : "服务热线："}
                {settings.phone}
              </span>
            )}
            <LocaleSwitcher locale={locale} />
            <Link href="/contact" className="hover:text-white">
              {isEn ? "Inquiry" : "在线询价"}
            </Link>
          </div>
        </div>
      </div>

      {/* 主导航 */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-sky-600 text-lg font-bold text-white">
              {settings.siteName.slice(0, 1)}
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-slate-900">
                {settings.siteName}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                {settings.siteNameEn}
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {isEn ? "Home" : "首页"}
            </Link>
            {/* 产品中心下拉 */}
            <div className="group relative">
              <Link
                href="/products"
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {isEn ? "Products" : "产品中心"}
                <span className="ml-1 text-xs">▾</span>
              </Link>
              <div className="invisible absolute left-0 top-full z-50 w-56 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                {topCategories.map((c) => {
                  const subs = childrenOf(c.id);
                  return (
                    <div key={c.id}>
                      <Link
                        href={`/products?category=${c.code}`}
                        className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                      >
                        {c.name}
                      </Link>
                      {subs.length > 0 && (
                        <div className="ml-3 border-l border-slate-100 pl-2">
                          {subs.map((s) => (
                            <Link
                              key={s.id}
                              href={`/products?category=${s.code}`}
                              className="block rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                            >
                              {s.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Link
              href="/brands"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {isEn ? "Brands" : "代理品牌"}
            </Link>
            <Link
              href="/documents"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {isEn ? "Resources" : "资料下载"}
            </Link>
            <Link
              href="/contact"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {isEn ? "Contact" : "联系我们"}
            </Link>
          </nav>

          <Link
            href="/contact"
            className="hidden rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 md:block"
          >
            {isEn ? "Get a Quote" : "获取报价"}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* 页脚 */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-base font-bold text-slate-900">{settings.siteName}</div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isEn
                ? "Authorized distributor of world-renowned test & measurement instruments, offering selection consulting, custom solutions and technical support."
                : "专业代理销售全球知名品牌的测试与测量仪器，提供选型咨询、方案定制与技术支持。"}
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              {isEn ? "Products" : "产品中心"}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {topCategories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/products?category=${c.code}`} className="hover:text-sky-600">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              {isEn ? "Brands" : "代理品牌"}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-500">
              {brands.slice(0, 8).map((b) => (
                <li key={b.id}>
                  <Link href={`/brands/${b.code}`} className="hover:text-sky-600">
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">
              {isEn ? "Contact" : "联系方式"}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {settings.phone && (
                <li>
                  {isEn ? "Phone: " : "电话："}
                  {settings.phone}
                </li>
              )}
              {settings.email && (
                <li>
                  {isEn ? "Email: " : "邮箱："}
                  {settings.email}
                </li>
              )}
              {settings.address && (
                <li>
                  {isEn ? "Address: " : "地址："}
                  {settings.address}
                </li>
              )}
              <li>
                <Link href="/contact" className="text-sky-600 hover:underline">
                  {isEn ? "Send Inquiry →" : "在线提交询价 →"}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {settings.siteName} {isEn ? "All Rights Reserved" : "版权所有"}
        </div>
      </footer>
    </div>
    </NextIntlClientProvider>
  );
}
