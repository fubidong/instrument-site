import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [brandCount, categoryCount, productCount, inquiryCount, recentLogs] =
    await Promise.all([
      db.brand.count(),
      db.category.count(),
      db.product.count(),
      db.inquiry.count(),
      db.loginLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const stats = [
    { label: "品牌数", value: brandCount },
    { label: "产品类别", value: categoryCount },
    { label: "产品数", value: productCount },
    { label: "询价线索", value: inquiryCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">仪表盘</h1>
        <p className="mt-1 text-sm text-slate-500">站点运营数据概览</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">最近登录记录</h2>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-400">暂无记录</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {log.username}
                  <span className="text-slate-400"> · {log.ip}</span>
                </span>
                <span
                  className={
                    log.success ? "text-green-600" : "text-red-500"
                  }
                >
                  {log.success ? "成功" : "失败"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
