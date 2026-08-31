import Link from "next/link";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          该模块将在后续阶段开发，敬请期待
        </p>
      </div>

      <div>
        <Link href="/admin" className="text-sm text-sky-600 hover:underline">
          ← 返回仪表盘
        </Link>
      </div>
    </div>
  );
}
