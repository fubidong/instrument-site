import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-32 text-center">
      <div className="text-6xl font-bold text-slate-200">404</div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">页面不存在</h1>
      <p className="mt-2 text-sm text-slate-500">
        您访问的页面可能已被移除或链接有误。
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
        >
          返回首页
        </Link>
        <Link
          href="/products"
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          浏览产品
        </Link>
      </div>
    </div>
  );
}
