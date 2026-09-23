import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import AdminSidebar, { type NavItem } from "./admin-sidebar";

const navItems: NavItem[] = [
  { href: "/admin", label: "仪表盘", icon: "📊" },
  { href: "/admin/inquiries", label: "询价线索", icon: "📩" },
  { href: "/admin/brands", label: "品牌管理", icon: "🏷" },
  { href: "/admin/categories", label: "产品类别", icon: "🗂" },
  { href: "/admin/navigation", label: "导航设置", icon: "🧭" },
  { href: "/admin/products", label: "产品管理", icon: "📦" },
  { href: "/admin/params", label: "参数模板", icon: "⚙" },
  { href: "/admin/documents", label: "资料管理", icon: "📄" },
  { href: "/admin/support-articles", label: "支持中心", icon: "💬" },
  { href: "/admin/media", label: "素材库", icon: "🖼" },
  { href: "/admin/posts", label: "内容管理", icon: "📝" },
  { href: "/admin/catalog", label: "产品目录", icon: "📚" },
  { href: "/admin/home-config", label: "首页配置", icon: "🎨" },
  { href: "/admin/settings", label: "站点设置", icon: "🔧" },
  { href: "/admin/login-log", label: "登录日志", icon: "📋" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* 侧边栏（可折叠） */}
      <AdminSidebar navItems={navItems} />

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="text-sm text-slate-500">运营管理系统</div>
          <div className="flex items-center gap-3">
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
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
