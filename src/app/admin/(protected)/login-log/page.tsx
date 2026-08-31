import Link from "next/link";
import { db } from "@/lib/db";

export default async function LoginLogPage() {
  const logs = await db.loginLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">登录日志</h1>
        <p className="mt-1 text-sm text-slate-500">最近 100 条登录记录</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">暂无记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">用户名</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">结果</th>
                  <th className="px-4 py-3 font-medium">说明</th>
                  <th className="px-4 py-3 font-medium">浏览器</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {log.createdAt.toLocaleString("zh-CN", { hour12: false })}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{log.username}</td>
                    <td className="px-4 py-3 text-slate-600">{log.ip ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.success
                            ? "text-green-600"
                            : "text-red-500"
                        }
                      >
                        {log.success ? "成功" : "失败"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.message ?? "-"}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-400" title={log.userAgent ?? ""}>
                      {log.userAgent ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-sky-600 hover:underline">
          ← 返回仪表盘
        </Link>
      </div>
    </div>
  );
}
