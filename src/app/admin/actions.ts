"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuthActionState = {
  error?: string;
  success?: string;
};

/**
 * 管理员登录
 */
export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = (formData.get("username") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const userAgent = headerStore.get("user-agent") ?? "";

  // 基础校验
  if (!username || !password) {
    return { error: "请输入用户名和密码" };
  }

  const admin = await db.adminUser.findUnique({ where: { username } });

  // 用户不存在或密码错误：统一提示，避免用户名枚举
  const passwordOk =
    admin && (await bcrypt.compare(password, admin.passwordHash));

  if (!admin || !passwordOk) {
    await db.loginLog.create({
      data: {
        username,
        ip,
        userAgent,
        success: false,
        message: admin ? "密码错误" : "用户不存在",
        adminId: admin?.id ?? null,
      },
    });
    return { error: "用户名或密码错误" };
  }

  // 记录成功登录
  await db.loginLog.create({
    data: { username, ip, userAgent, success: true, message: "登录成功", adminId: admin.id },
  });
  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await getSession();
  session.userId = admin.id;
  session.username = admin.username;
  session.isLoggedIn = true;
  await session.save();

  // 不在这里 redirect：改为前端检测成功后整页跳转，确保 cookie 先落到浏览器
  return { success: "ok" };
}

/**
 * 管理员退出登录
 */
export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

/**
 * 修改管理员密码
 */
export async function changePasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/admin/login");
  }

  const currentPassword = (formData.get("currentPassword") as string) ?? "";
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "请填写完整" };
  }
  if (newPassword.length < 8) {
    return { error: "新密码至少 8 位" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "两次输入的新密码不一致" };
  }

  const admin = await db.adminUser.findUnique({ where: { id: session.userId } });
  if (!admin) {
    return { error: "管理员不存在" };
  }

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) {
    return { error: "当前密码错误" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  return { success: "密码已修改" };
}
