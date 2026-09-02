import { db } from "@/lib/db";
import SettingsForm from "./settings-form";

function val(rows: { key: string; value: string; locale: string | null }[], key: string, locale: string | null) {
  const hit = rows.find((r) => r.key === key && (r.locale ?? null) === locale);
  return hit?.value ?? "";
}

export default async function SettingsPage() {
  const rows = await db.siteSetting.findMany();
  const initial = {
    siteNameZh: val(rows, "site_name", "zh"),
    siteNameEn: val(rows, "site_name", "en"),
    phone: val(rows, "contact_phone", null),
    email: val(rows, "contact_email", null),
    address: val(rows, "contact_address", null),
    introZh: val(rows, "company_intro", "zh"),
    introEn: val(rows, "company_intro", "en"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">站点设置</h1>
        <p className="mt-1 text-sm text-slate-500">站点名称、联系方式、公司简介等基础配置</p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
