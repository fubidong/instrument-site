import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// 品牌小写 code 列表（品牌站路径）
// 注意：需与数据库 Brand.code 对应（转小写）
const BRAND_CODES = ["siglent", "rigol"];

// 品牌站路径重写：
//   /siglent/...      → /brand/siglent/...  (header x-brand-locale: zh)
//   /siglent/en/...   → /brand/siglent/...  (header x-brand-locale: en)
function rewriteBrandPath(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  const first = segs[0].toLowerCase();
  if (!BRAND_CODES.includes(first)) return null;

  let rest = segs.slice(1);
  let locale = "zh";
  if (rest.length > 0 && ["zh", "en"].includes(rest[0])) {
    locale = rest[0];
    rest = rest.slice(1);
  }
  const target = `/brand/${first}${rest.length ? "/" + rest.join("/") : ""}`;
  const url = request.nextUrl.clone();
  url.pathname = target;
  const res = NextResponse.rewrite(url);
  res.headers.set("x-brand-locale", locale);
  return res;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // 后台和 API 不走 intl
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return;
  }
  // 品牌路径重写（在 intl 处理之前）
  const brandRewrite = rewriteBrandPath(request);
  if (brandRewrite) return brandRewrite;
  // 其余走 intl（综合站）
  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，排除 api、_next 静态资源和带扩展名的静态文件
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
