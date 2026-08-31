import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">仪器仪表站点后台</h1>
          <p className="mt-2 text-sm text-slate-400">运营管理系统</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
