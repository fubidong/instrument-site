import { Phone } from "lucide-react";
import LeadDialog from "./lead-dialog";
import { CompareToggle } from "./compare-bar";
import ShareFavorites from './share-favorites';
import FotricVariantsSelector from './fotric-variants-selector';

export type HighlightItem = { name: string; value: string; unit?: string };

/**
 * 产品详情页顶部核心区（产品概览）：
 * 型号（等宽 ui-num）/ 品牌 / 一句话概述前置；关键参数提炼为"规格摘要卡"；询价 CTA 清晰
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
  compact = false,
  fotricVariants = [],
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
  /** 紧凑模式（品牌专属官网风格）：仅标题+简介+热线+按钮，不渲染品牌/系列/型号标签与关键参数卡片 */
  compact?: boolean;
  /** 飞础科专属：版本型号胶囊列表 */
  fotricVariants?: string[];
}) {
  const I = {
    brand: isEn ? "Brand" : "品牌",
    series: isEn ? "Series" : "系列",
    contact: isEn ? "Sales Hotline" : "销售热线",
    highlights: isEn ? "Key Specifications" : "关键参数",
  };

  // 关键参数完整显示（不限数量，由后台重要指标 isHighlight 控制）
  const showHighlights = highlights;

  return (
    <div className="min-w-0 flex-1">
      {/* 眉题：品牌 / 系列（前置信号） */}
      <p className="ui-eyebrow">{[brand, series].filter(Boolean).join(" · ")}</p>

      {/* 型号：等宽 .ui-num，全页唯一 h1 */}
      <h1
        className={`ui-num mt-2 min-w-0 break-words font-bold leading-tight tracking-tight text-slate-900 ${
          compact ? "text-3xl sm:text-4xl" : "text-2xl sm:text-4xl"
        }`}
      >
        {compact ? name : model}
      </h1>
      {!compact && name && name !== model && (
        <div className="mt-1.5 min-w-0 break-words text-base text-slate-600 sm:text-lg">{name}</div>
      )}

      {/* 官网风格分隔线（compact） */}
      {compact && <div className="mt-4 h-px w-16 bg-primary" />}

      {/* 一句话概述（限制行数，超出截断并加省略号） */}
      {summary && (
        <p
          className={`${
            compact ? "mt-5 text-[15px] leading-7 text-slate-700" : "ui-lede mt-3 max-w-2xl"
          }`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: compact ? 6 : 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
          title={summary}
        >
          {summary}
        </p>
      )}

      {/* 飞础科专属：版本型号可选中 */}
      {fotricVariants.length > 0 && <FotricVariantsSelector variants={fotricVariants} />}

      {/* 规格摘要卡：关键参数前置，工程师一眼看到核心指标 */}
      {!compact && showHighlights.length > 0 && (
        <section className="ui-card mt-6" aria-label={I.highlights}>
          <div className="ui-card-pad">
            <div className="ui-eyebrow">{I.highlights}</div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">
              {showHighlights.map((h, i) => (
                <div key={i} className="min-w-0">
                  <dt className="truncate text-xs text-slate-500" title={h.name}>
                    {h.name}
                  </dt>
                  <dd className="ui-num mt-1 break-words text-sm font-semibold leading-snug text-slate-900 sm:text-base">
                    {h.value}
                    {h.unit && (
                      <span className="ml-1 font-sans text-xs font-normal text-slate-500">{h.unit}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* 联系方式：hairline 卡片，电话 primary */}
      {phoneEnabled && phone && (
        <div className="ui-card mt-5">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <div className="text-xs text-slate-500">{I.contact}</div>
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="ui-num text-lg font-bold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {phone}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 行动按钮组：询价(主) + 申请样机(次) + 加入对比 + 收藏 */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <LeadDialog
          type="inquiry"
          locale={locale}
          productId={productId}
          productModel={productModel}
          productName={productName}
          buttonClassName="ui-btn-primary"
        />
        {isSampleEnabled && (
          <LeadDialog
            type="sample"
            locale={locale}
            productId={productId}
            productModel={productModel}
            productName={productName}
            buttonClassName="ui-btn-ghost"
          />
        )}
        <CompareToggle
          locale={locale}
          productId={productId}
          productModel={productModel}
          className="ui-btn-ghost"
        />
        <ShareFavorites model={productModel} isEn={isEn} />
      </div>
    </div>
  );
}
