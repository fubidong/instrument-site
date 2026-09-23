import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CheckCircle2 } from "lucide-react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function InquirySuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEn = locale === "en";

  return (
    <div className="ui-wrap">
      <section className="ui-section flex justify-center">
        <div className="w-full max-w-xl">
          <div className="ui-card ui-card-pad px-6 py-10 text-center sm:px-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ui-trust)]/30 bg-[var(--ui-trust-soft)] text-[var(--ui-trust)]">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="ui-eyebrow mt-6">{isEn ? "Received" : "已收到"}</p>
            <h1 className="ui-h1 mt-2">{isEn ? "Inquiry submitted" : "询价提交成功"}</h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[var(--ui-mute)]">
              {isEn
                ? "Thank you for your inquiry! We have received your request and our sales team will contact you soon."
                : "感谢您的咨询！我们已收到您的需求，销售顾问会尽快通过您留下的联系方式与您联系。"}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/products" className="ui-btn-primary">
                {isEn ? "Continue browsing" : "继续浏览产品"}
              </Link>
              <Link href="/" className="ui-btn-ghost">
                {isEn ? "Back to home" : "返回首页"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
