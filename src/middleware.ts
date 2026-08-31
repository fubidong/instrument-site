import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// admin 后台不需要 locale 前缀
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return;
  }
  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，排除 api、_next 静态资源和带扩展名的静态文件
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
