import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type AdminSession } from "./session";

/**
 * 获取当前请求的管理员 session（不抛出，未登录返回 isLoggedIn=false）
 */
export async function getSession(): Promise<IronSession<AdminSession>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, sessionOptions);
}

/**
 * 强制要求已登录；未登录跳转到 /admin/login
 * 用于后台 Server Components / Server Actions
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * 供后台 API 路由使用的保护函数：
 * 已登录返回 session，未登录返回 null（调用方据此返回 401）
 */
export async function getAdminOrNull() {
  const session = await getSession();
  return session.isLoggedIn ? session : null;
}
