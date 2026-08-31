import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";

export type AdminSession = {
  userId: string;
  username: string;
  isLoggedIn: boolean;
};

const SESSION_COOKIE = "instrument-admin-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 天

/**
 * 手动用 sealData + cookies().set() 读写 session cookie。
 * 不用 iron-session 的 getIronSession().save()（在 Next.js 下存在静默失败写不进去 cookie 的 bug）。
 * 注意：save() 必须用 this 读取当前对象的最新字段，否则会 seal 到初始值。
 */
export async function getSession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;

  let data: AdminSession = { userId: "", username: "", isLoggedIn: false };
  if (raw) {
    try {
      const d = await unsealData<Partial<AdminSession>>(raw, {
        password: process.env.SESSION_SECRET!,
      });
      data = {
        userId: d.userId ?? "",
        username: d.username ?? "",
        isLoggedIn: !!d.isLoggedIn,
      };
    } catch {
      data = { userId: "", username: "", isLoggedIn: false };
    }
  }

  const session: AdminSession & {
    save: () => Promise<void>;
    destroy: () => Promise<void>;
  } = {
    ...data,
    async save() {
      const sealed = await sealData(
        {
          userId: this.userId,
          username: this.username,
          isLoggedIn: this.isLoggedIn,
        },
        { password: process.env.SESSION_SECRET! }
      );
      const s = await cookies();
      s.set(SESSION_COOKIE, sealed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      });
    },
    async destroy() {
      const s = await cookies();
      s.delete(SESSION_COOKIE);
    },
  };

  return session;
}
