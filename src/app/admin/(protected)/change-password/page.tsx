import Link from "next/link";
import ChangePasswordForm from "./change-password-form";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">修改密码</h1>
        <p className="mt-1 text-sm text-slate-500">修改当前管理员的登录密码</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <ChangePasswordForm />
      </div>

      <div>
        <Link href="/admin" className="text-sm text-sky-600 hover:underline">
          ← 返回仪表盘
        </Link>
      </div>
    </div>
  );
}
