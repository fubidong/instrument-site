import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { t } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { sanitizeEmbeddedCss } from "@/lib/sanitize-html";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const TYPE_LABEL_ZH: Record<string, string> = {
  solution: "解决方案",
  tech: "技术文章",
  faq: "常见问题",
};
const TYPE_LABEL_EN: Record<string, string> = {
  solution: "Solution",
  tech: "Technical Article",
  faq: "FAQ",
};

function fmtDate(d: Date | null, isEn: boolean): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString(isEn ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function SupportArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  const article = await db.supportArticle.findUnique({
    where: { id },
    include: {
      brand: { include: { translations: true } },
      pdfLinks: { include: { pdfAsset: true } },
      productLinks: {
        include: {
          product: {
            include: {
              brand: { include: { translations: true } },
              translations: true,
            },
          },
        },
      },
      translations: true,
    },
  });

  if (!article || !article.isPublished) notFound();

  const tr = article.translations.find((x) => x.locale === locale) ?? article.translations[0];
  const brandName = article.brand
    ? t(article.brand.translations, locale, "name") || article.brand.code
    : isEn
      ? "General"
      : "通用";

  const safeHtml = sanitizeEmbeddedCss(tr?.content ?? "");

  // 多个 PDF（每个独立模式）
  const pdfList = article.pdfLinks;
  // 多个关联商品
  const prodList = article.productLinks.map((l) => l.product).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* 面包屑 / 返回 */}
      <nav className="text-sm text-slate-400">
        <Link href="/support" className="hover:text-sky-600">
          {isEn ? "← Back to Support Center" : "← 返回支持中心"}
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-bold leading-snug text-slate-900">{tr?.title ?? ""}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-sky-50 px-2 py-0.5 text-sky-700">
            {(isEn ? TYPE_LABEL_EN : TYPE_LABEL_ZH)[article.type] ?? article.type}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5">{brandName}</span>
          {article.publishedAt && <span>{fmtDate(article.publishedAt, isEn)}</span>}
        </div>
      </header>

      {tr?.summary && (
        <p className="mt-5 border-l-4 border-sky-200 bg-sky-50/50 px-4 py-3 text-sm leading-6 text-slate-600">
          {tr.summary}
        </p>
      )}

      <div className="rich-text mt-6">
        <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </div>

      {/* PDF 资料：多个 PDF，每个独立 直接下载 / 获客模式 */}
      {pdfList.length > 0 && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">
            {isEn ? "Related Documents" : "相关文档资料"}
          </div>
          <div className="space-y-3">
            {pdfList.map((link) => {
              const pdfUrl = link.pdfAsset?.path;
              const fileName = link.pdfAsset?.filename ?? "";
              const isLead = link.pdfMode === "lead";
              const leadHref = `/contact?subject=${encodeURIComponent(tr?.title ?? "")}&article=${encodeURIComponent(article.id)}&pdf=${encodeURIComponent(link.id)}`;
              return (
                <div key={link.id} className="flex flex-wrap items-center gap-4">
                  {isLead ? (
                    <>
                      <div className="flex-1 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{fileName}</span>
                        <span className="ml-2 text-slate-400">
                          {isEn ? "(fill form to get)" : "(填写表单获取)"}
                        </span>
                      </div>
                      <Link
                        href={leadHref}
                        className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
                      >
                        <span>📄</span>
                        {isEn ? "Get Document" : "获取资料"}
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">{fileName}</span>
                      </div>
                      <a
                        href={pdfUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
                      >
                        <span>↓</span>
                        {isEn ? "Download PDF" : "下载 PDF"}
                      </a>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 关联商品：多个 */}
      {prodList.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-800">
            {isEn ? "Related Products" : "关联商品"}
          </div>
          <div className="mt-3 space-y-3">
            {prodList.map((product) => {
              const productName =
                product.translations.find((x) => x.locale === locale)?.name ??
                product.translations.find((x) => x.locale === "zh")?.name ??
                product.model;
              return (
                <Link
                  key={product.id}
                  href={`/products/${encodeURIComponent(product.model)}`}
                  className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition hover:border-sky-300 hover:shadow-sm"
                >
                  {product.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.coverImage}
                      alt={product.model}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                      {isEn ? "No image" : "暂无图片"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">{product.model}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {productName}
                      {product.brand && (
                        <span className="ml-1 text-slate-400">
                          · {t(product.brand.translations, locale, "name") || product.brand.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="ml-auto shrink-0 text-sm text-sky-600">
                    {isEn ? "View →" : "查看 →"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {article.sourceUrl && (
        <div className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">
          {isEn ? "Source: " : "原文链接："}
          <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
            {article.sourceUrl}
          </a>
        </div>
      )}
    </div>
  );
}
