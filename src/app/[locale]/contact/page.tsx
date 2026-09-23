import { setRequestLocale } from "next-intl/server";
import { getSiteSettings } from "@/lib/site";
import { routing } from "@/i18n/routing";
import {
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Headset,
  Wrench,
  ShoppingCart,
} from "lucide-react";
import InquiryForm from "./inquiry-form";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ productId?: string; productModel?: string; subject?: string; article?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const settings = await getSiteSettings(locale);

  // 仅当存在任意联系方式字段时才渲染联系信息卡，空字段整行不渲染
  const hasContact = Boolean(settings.phone || settings.email || settings.address);

  // 获客模式预填：支持中心文章跳转表单（productId/productModel/subject）
  const leadPrefill = {
    productId: sp.productId,
    productModel: sp.productModel,
    productName: sp.productModel,
    initialMessage: sp.subject ? (isEn ? `Regarding: ${sp.subject}` : `关于：${sp.subject}`) : undefined,
  };

  const contactRows = [
    settings.phone && {
      icon: Phone,
      label: isEn ? "Phone" : "电话",
      value: settings.phone,
      mono: true,
    },
    settings.email && {
      icon: Mail,
      label: isEn ? "Email" : "邮箱",
      value: settings.email,
      mono: true,
    },
    settings.address && {
      icon: MapPin,
      label: isEn ? "Address" : "地址",
      value: settings.address,
      mono: false,
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value: string;
    mono: boolean;
  }[];

  const services = [
    {
      icon: BadgeCheck,
      title: isEn ? "Authorized distributor" : "授权代理",
      desc: isEn
        ? "Genuine products, sourced directly from manufacturers."
        : "原厂授权供货，正品可溯。",
    },
    {
      icon: Headset,
      title: isEn ? "Selection consulting" : "选型咨询",
      desc: isEn
        ? "Engineers help you compare models and specifications."
        : "工程师协助选型与参数对比。",
    },
    {
      icon: Wrench,
      title: isEn ? "Technical support" : "技术支持",
      desc: isEn
        ? "Setup, calibration and repair consultation across the lifecycle."
        : "安装、校准、维修全流程支持。",
    },
    {
      icon: ShoppingCart,
      title: isEn ? "Inquiry & procurement" : "询价采购",
      desc: isEn
        ? "Volume quotes and long-term partnership programs."
        : "批量报价与长期合作采购。",
    },
  ];

  return (
    <div className="ui-wrap">
      <section className="ui-section">
        <header className="max-w-2xl">
          <p className="ui-eyebrow">{isEn ? "Contact" : "联系我们"}</p>
          <h1 className="ui-h1 mt-3">{isEn ? "Talk to an instrument specialist" : "与仪器专家取得联系"}</h1>
          <p className="ui-lede">
            {isEn
              ? "Whether you need selection advice, bulk purchase quotes, or technical support, our team responds within one business day."
              : "无论您需要选型建议、批量采购报价，还是技术支持，我们的团队将在一个工作日内回复您。"}
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          {/* Left: contact info + service commitments */}
          <div className="space-y-6 lg:col-span-5">
            {hasContact && (
              <div className="ui-card ui-card-pad">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="ui-h3">{isEn ? "Contact information" : "联系方式"}</h2>
                  <span className="ui-badge ui-badge-trust">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {isEn ? "Authorized partner" : "授权代理"}
                  </span>
                </div>
                <dl className="mt-5 space-y-5">
                  {contactRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} className="flex items-start gap-4">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--ui-line)] text-[var(--primary)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ui-mute)]">
                            {row.label}
                          </dt>
                          <dd
                            className={`mt-1 break-all text-sm text-[var(--ui-ink)] ${
                              row.mono ? "ui-num" : "leading-relaxed"
                            }`}
                          >
                            {row.value}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}

            <div className="ui-card ui-card-pad">
              <h2 className="ui-h3">{isEn ? "What we commit to" : "我们的服务承诺"}</h2>
              <ul className="mt-5 space-y-5">
                {services.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.title} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--ui-line)] text-[var(--primary)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--ui-ink)]">{s.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-[var(--ui-mute)]">{s.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right: inquiry form */}
          <div className="lg:col-span-7">
            <InquiryForm
              locale={locale}
              productId={leadPrefill.productId}
              productModel={leadPrefill.productModel}
              productName={leadPrefill.productName}
              initialMessage={leadPrefill.initialMessage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
