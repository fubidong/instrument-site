import LeadDialog from "./lead-dialog";
import { CompareToggle } from "./compare-bar";
import ShareFavorites from "./share-favorites";

export type HighlightItem = { name: string; value: string; unit?: string };

/** 测量类通用图标（关键参数卡片用） */
function MetricIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 shrink-0" style={{ color }}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4v16M3 20h18M7 16l3-5 3 3 4-7"
      />
    </svg>
  );
}

/**
 * 产品详情页顶部核心区（产品概览）：
 * 左主图 + 右信息区（标题/属性标签/简介/关键参数/联系方式/行动按钮组）
 */
export default function ProductOverview({
  locale,
  isEn,
  model,
  name,
  brand,
  series,
  summary,
  highlights = [],
  phone,
  phoneEnabled = true,
  productId,
  productModel,
  productName,
  isSampleEnabled,
}: {
  locale: string;
  isEn: boolean;
  model: string;
  name: string;
  brand: string;
  series: string;
  summary?: string | null;
  highlights?: HighlightItem[];
  phone?: string;
  phoneEnabled?: boolean;
  productId: string;
  productModel: string;
  productName: string;
  isSampleEnabled: boolean;
}) {
  const I = {
    brand: isEn ? "Brand" : "品牌",
    series: isEn ? "Series" : "系列",
    model: isEn ? "Model" : "型号",
    contact: isEn ? "Contact" : "咨询热线",
    highlights: isEn ? "Key Specifications" : "关键参数",
  };

  // 关键参数完整显示（不限 4 个，由后台重要指标 isHighlight 控制）
  const showHighlights = highlights;
  const palette = ["#0284c7", "#0d9488", "#7c3aed", "#d97706", "#db2777", "#65a30d"];

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* 右侧信息区直接由调用方渲染左栏主图，这里只渲染右栏 */}
      <div className="flex-1">
        {/* 标题：产品完整名称（加粗醒目） */}
        <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">
          {model}
        </h1>
        {name && name !== model && <div className="mt-1.5 text-lg text-slate-600">{name}</div>}

        {/* 属性标签：品牌 / 系列 / 型号 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
            {I.brand}：{brand}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {I.series}：{series}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {I.model}：{productModel}
          </span>
        </div>

        {/* 产品简介 */}
        {summary && <p className="mt-4 text-sm leading-6 text-slate-600">{summary}</p>}

        {/* 关键参数：图标 + 数值 */}
        {showHighlights.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-sm font-semibold text-slate-800">{I.highlights}</div>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {showHighlights.map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-center transition hover:border-sky-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-center gap-1 text-[11px] leading-tight text-slate-400">
                    <MetricIcon color={palette[i % palette.length]} />
                    <span className="whitespace-nowrap">{h.name}</span>
                  </div>
                  <div className="mt-1 whitespace-nowrap text-base font-bold leading-tight text-slate-800">
                    {h.value}
                    {h.unit && <span className="ml-0.5 text-[11px] font-normal text-slate-400">{h.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 联系方式：电话显著展示（后台可控制开关） */}
        {phoneEnabled && phone && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-sky-100 bg-sky-50/70 px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0 text-sky-600">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
              />
            </svg>
            <div>
              <div className="text-xs text-sky-600/80">{I.contact}</div>
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="text-lg font-bold text-sky-700 hover:underline"
              >
                {phone}
              </a>
            </div>
          </div>
        )}

        {/* 行动按钮组：获取报价(主) + 申请样机(主，紧邻) + 加入对比 + 收藏 */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <LeadDialog
            type="inquiry"
            locale={locale}
            productId={productId}
            productModel={productModel}
            productName={productName}
          />
          {isSampleEnabled && (
            <LeadDialog
              type="sample"
              locale={locale}
              productId={productId}
              productModel={productModel}
              productName={productName}
              buttonClassName="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
            />
          )}
          <CompareToggle
            locale={locale}
            productId={productId}
            productModel={productModel}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
          />
          <ShareFavorites model={productModel} isEn={isEn} />
        </div>
      </div>
    </div>
  );
}
