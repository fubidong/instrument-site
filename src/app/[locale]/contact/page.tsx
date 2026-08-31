import { setRequestLocale } from "next-intl/server";
import { getSiteSettings } from "@/lib/site";
import { routing } from "@/i18n/routing";
import InquiryForm from "./inquiry-form";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";
  const settings = await getSiteSettings(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEn ? "Contact Us" : "联系我们"}
        </h1>
        <p className="mt-2 text-slate-500">
          {isEn
            ? "Whether you need selection advice, bulk purchase quotes, or technical support, feel free to contact us."
            : "无论您需要选型建议、批量采购报价，还是技术支持，欢迎随时与我们联系。"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEn ? "Contact Information" : "联系方式"}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <span className="w-12 text-slate-400">{isEn ? "Phone" : "电话"}</span>
                <span className="font-medium text-slate-800">
                  {settings.phone || (isEn ? "Coming soon" : "敬请期待")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-12 text-slate-400">{isEn ? "Email" : "邮箱"}</span>
                <span className="font-medium text-slate-800">
                  {settings.email || (isEn ? "Coming soon" : "敬请期待")}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-12 text-slate-400">{isEn ? "Address" : "地址"}</span>
                <span className="font-medium text-slate-800">
                  {settings.address || (isEn ? "Coming soon" : "敬请期待")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEn ? "Our Services" : "服务范围"}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {(
                isEn
                  ? [
                      "Instrument selection and parameter comparison",
                      "Bulk purchasing and long-term partnership quotes",
                      "Instrument rental, calibration and repair consultation",
                      "Custom industry solutions",
                    ]
                  : [
                      "测试测量仪器选型与参数对比",
                      "批量采购与长期合作报价",
                      "仪器租赁、校准与维修咨询",
                      "行业解决方案定制",
                    ]
              ).map((s) => (
                <li key={s}>· {s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <InquiryForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
