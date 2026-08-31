import Link from "next/link";
import BrandForm from "../brand-form";

export default function NewBrandPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">新增品牌</h1>
          <p className="mt-1 text-sm text-slate-500">
            创建后自动跳转到编辑页补充详细内容
          </p>
        </div>
        <Link href="/admin/brands" className="text-sm text-sky-600 hover:underline">
          ← 返回列表
        </Link>
      </div>
      <BrandForm brand={null} />
    </div>
  );
}
