# Design.md — instrument-site 视觉重构冻结规范（Hallmark redesign）

> 本文件是本轮视觉重构的**唯一设计真源**。所有 redesign 子代理必须严格遵守，不得各自发挥。
> 生成依据：`.hallmark/audits/audit-2026-09-21.md`。范围：首页、品牌列表/详情、产品详情、关于/联系、全局导航与页脚。
> **绝对禁止改动**：`src/app/[locale]/catalog/` 整个目录。

## 1. 定位与 genre

- 类型：B2B 测试测量仪器**代理商城**（询价制，无购物车）。访客是工程师、采购、技术负责人。
- genre：**技术目录 / 工业 editorial（technical-catalog）**。气质 = 克制、精确、可信赖、数据密度高。
- 明确**反对**：SaaS 营销腔、居中大字 hero 后接三等分卡片、渐变铺底、emoji、紫色/粉色、圆角药丸、拟物阴影、玻璃拟态泛滥。
- 这是"made, not generated"的站：像一份排版精良的选型样本/技术手册，不像 AI landing page。

## 2. 色彩 token（锁死，所有页面引用，禁止新写裸色值）

在 `src/app/globals.css` 的 `:root` 与 `@theme` 中落地并统一使用：

```
/* 品牌强调色：单一工程蓝，全站唯一彩色，面积 ≤ 5% */
--primary: oklch(0.546 0.16 248);            /* 工程蓝，替代 sky-600 */
--primary-hover: oklch(0.48 0.15 248);
--primary-foreground: oklch(0.985 0 0);
--ring: oklch(0.546 0.16 248);

/* 中性色：基于 slate 家族，让语义 token 真正生效 */
--background: oklch(1 0 0);
--foreground: oklch(0.21 0.02 260);          /* slate-900 微蓝 tint，非纯灰 */
--muted-foreground: oklch(0.55 0.015 260);   /* slate-500 */
--border: oklch(0.92 0.01 260);
--radius: 0.5rem;                            /* 10px → 8px，更硬朗 */
```

规则：
- 所有强调色（按钮主色、链接 hover、active 态、focus ring、当前态）一律用 `--primary`，Tailwind 里写作 `bg-primary` / `text-primary` / `border-primary` / `ring-primary`。
- **禁止**新写 `sky-*`。原 `sky-600/sky-500` 出现处一律替换为 primary token。
- 中性文字/边框可用 Tailwind 既有 `slate-*` 阶（slate-50/100/200/300/500/700/900），保持一致；不要再引入 stone/zinc/neutral 混用。
- 禁止渐变（`bg-gradient-*`）、禁止 `from-*/via-*/to-*`。hero 用纯色实底或白底 + hairline。
- 圆角：卡片/按钮基 8px（`rounded-lg`）；**禁止** `rounded-2xl/3xl/full` 做普通卡片；标签可用 `rounded`（4px）。

## 3. 字体与排版（锁死）

- 修复接线：`globals.css` `@theme` 里把 `--font-sans: var(--font-sans)`（自引用 bug）改为 `--font-sans: var(--font-geist-sans)`。Geist Sans 已在 root layout 加载。
- 双字体纪律：
  - **正文/标题**：Geist Sans（`font-sans`）。
  - **技术数据面**：Geist Mono（`font-mono`）——用于产品型号、SKU、规格数值、eyebrow 小标签、面包屑、编号。这是"仪器目录"感的关键，不要滥用在正文。
- 标题全部 roman（`font-style: normal`），禁止斜体强调。用字重/颜色/下划线表达强调。
- type scale（Tailwind 默认刻度内）：display ~text-4xl/5xl tight tracking-tight；h1 ~text-3xl；h2 ~text-xl/2xl；eyebrow 小标签 = `font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground`。
- 型号/长词容器必须 `min-w-0 overflow-wrap-anywhere`（`min-w-0` + `break-words` 或 Tailwind `min-w-0`），防窄屏溢出。

## 4. 结构与版式规则（破 AI 模板）

- **Hero（首页）**：左对齐/非对称，h1 + lede + CTA 不落在同一中轴；背景为纯白或单色深底（如 slate-900 实底，无渐变）；CTA 主按钮实心 primary，次按钮 hairline outline。
- **产品/品牌卡**：不要 `lg:grid-cols-3` 等宽等距模板。用更紧的栅格（`sm:grid-cols-2 lg:grid-cols-3` 可接受但卡片样式要有变化感），hairline 边框（`border-slate-200`），hover **只给一种信号**（边框变 primary 或文字变 primary），禁止 `hover:shadow-lg` 大阴影。
- **指标/stat**：删除虚构数字（首页 `1000+`、`7×24`）。不得编造指标。可渲染**真实**数据（如真实品牌数量 `brands.length`），或干脆删掉 stat 条。
- **导航**：桌面保留三栏但可非对称；**必须补移动端汉堡抽屉**（client 组件，`use client`）；多级下拉必须 `:focus-within` 展开 + 可点 trigger（button + `aria-expanded`），不能只靠 hover。
- **Footer**：保留产品/品牌链接列；加一句 colophon 式站点定位；版权行**左对齐**（不要居中）；品牌链接走 i18n 感知 Link（`@/i18n/navigation` 的 Link 或 `brandPath`），不要裸 next/link 丢 locale。
- **产品详情**：唯一一个 `<h1>`；品牌详情页把重复 h1 降为 h2。规格表用 `font-mono` 数值 + hairline 分隔，走技术手册感。
- **微交互**：每个元素只保留一种 hover 信号；transition 写明属性（`transition-colors`）；尊重 `prefers-reduced-motion`。
- 图片：新写/替换图片用 `next/image`（不要原生 `<img>` + eslint-disable），补 `sizes`。

## 5. 工程约束（项目宪法，硬规则）

- Next.js 16 App Router；Server Component 默认，需要交互才 `"use client"`。
- 用 **pnpm**，禁止 npm/yarn。
- 文案：本轮**不做**硬编码文案 → messages 的全量迁移（属已知遗留债）。但**不得新增**硬编码中/英字符串；改样式时保留现有 `isEn ? ... : ...` 文本原样，不要动文案内容。
- 不改路由、不改数据获取逻辑、不改 Prisma、不动 admin、不动 catalog。
- globals.css 中 `.rich-text` 及之后（约 L132 起）的品牌抄站样式**不要删改**（产品富文本渲染依赖）。本次只改顶部 token / @theme 段与新增公共类。
- 完成后必须 `pnpm typecheck` 通过；不要引入 TS 报错、不要 `any`。
- 改完后 dev server (localhost:3000) 各页面应正常渲染、无水平滚动。

## 6. 页面归属（子代理分工）

- Foundation（全局）：globals.css token、`[locale]/layout.tsx`（顶栏/header/footer）、`site-nav.tsx`（含移动抽屉、可访问下拉）。
- 首页：`[locale]/page.tsx`。
- 品牌：`[locale]/brands/page.tsx` + `[locale]/brands/[code]/page.tsx`。
- 产品详情：`[locale]/products/[model]/page.tsx`。
- 关于/联系：`[locale]/contact/page.tsx`（+ `contact/success`）。
