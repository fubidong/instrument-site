import { getSiteSettings } from "@/lib/site";
import InquiryForm from "./inquiry-form";

export const metadata = { title: "联系我们 | 在线询价" };

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">联系我们</h1>
        <p className="mt-2 text-slate-500">
          无论您需要选型建议、批量采购报价，还是技术支持，欢迎随时与我们联系。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 联系信息 */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-800">联系方式</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <span className="w-12 text-slate-400">电话</span>
                <span className="font-medium text-slate-800">{settings.phone || "敬请期待"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-12 text-slate-400">邮箱</span>
                <span className="font-medium text-slate-800">{settings.email || "敬请期待"}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-12 text-slate-400">地址</span>
                <span className="font-medium text-slate-800">{settings.address || "敬请期待"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-800">服务范围</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>· 测试测量仪器选型与参数对比</li>
              <li>· 批量采购与长期合作报价</li>
              <li>· 仪器租赁、校准与维修咨询</li>
              <li>· 行业解决方案定制</li>
            </ul>
          </div>
        </div>

        {/* 询价表单 */}
        <div>
          <InquiryForm />
        </div>
      </div>
    </div>
  );
}
