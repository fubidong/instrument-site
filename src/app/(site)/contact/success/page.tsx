import Link from "next/link";

export default function InquirySuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">询价提交成功</h1>
      <p className="mt-3 text-slate-500">
        感谢您的咨询！我们已收到您的需求，销售顾问会尽快通过您留下的联系方式与您联系。
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/products"
          className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
        >
          继续浏览产品
        </Link>
        <Link
          href="/"
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
