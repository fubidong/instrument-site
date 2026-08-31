import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

const navItems = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/inquiries", label: "询价线索" },
  { href: "/admin/brands", label: "品牌管理" },
  { href: "/admin/categories", label: "产品类别" },
  { href: "/admin/products", label: "产品管理" },
  { href: "/admin/params", label: "参数模板" },
  { href: "/admin/documents", label: "资料管理" },
  { href: "/admin/posts", label: "内容管理" },
  { href: "/admin/settings", label: "站点设置" },
  { href: "/admin/login-log", label: "登录日志" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* 侧边栏 */}
      <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="flex h-14 items-center border-b border-slate-800 px-4">
          <span className="text-sm font-bold text-white">仪器站点后台</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm transition hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="text-sm text-slate-500">运营管理系统</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-700">{session.username}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                退出登录
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
