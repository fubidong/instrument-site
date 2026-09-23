# UI/UX 重设计规范 — B2B 仪器仪表站（InstrumentHub）

> 本文件是 ui-ux-pro-max 生成并经人工确认后的落地契约。所有页面子任务必须遵循。
> 基调：**Swiss 极简网格 + Data-Dense 数据密度**。不是活泼零售风。

## 1. 已确认的设计基调（不要再改）

- 风格：克制、专业、可信。白底、发丝线（hairline border）、清晰网格、充足留白。
- 配色：**沿用现有工程蓝 `--primary`（oklch 0.546 0.16 248）为主色**；石板中性色做文字/边框；认证/授权用克制深青 `--ui-trust`。
- 字体：沿用 Geist Sans（UI/正文）+ Geist Mono（型号、参数数值）。**不要换成圆体/花体。**
- 间距节奏：区块纵向 `py-14 sm:py-20`；容器 `max-w-7xl`。
- 圆角：卡片 `rounded-xl`，按钮 `rounded-md`，徽章 `rounded-full`。

## 2. 硬性禁区（违反即返工）

1. **绝不修改 `src/app/[locale]/catalog/` 下任何文件**（catalog.tsx / catalog-client.tsx 及其它），该页已优化完成。
2. **绝不修改 `globals.css` 里 `:root` 的原始变量值**（--primary / --foreground / --border 等），否则会波及 catalog。本任务只使用第 3 节新增的 `ui-*` 工具类。
3. 不要编辑 `globals.css`（多人并行会冲突）。需要的样式用 Tailwind 工具类内联 + 已有 `ui-*` 类。
4. 不要运行 `pnpm build` / `npm run build`。可用 `pnpm typecheck` 自检（整个项目，确保自己改的文件不新增类型错误）。
5. 用 **pnpm**，不要 npm。路径用 Windows 反斜杠。
6. 不要引入蓝紫渐变、霓虹色、模糊光斑、无意义装饰图形/emoji 图标。图标用 lucide-react（已装）。
7. 保持双语：页面靠 `isEn ? ... : ...` 或 next-intl 渲染，**两种语言文案都要保留**，不要只写中文。

## 3. 可用的设计系统工具类（已在 globals.css 落地，直接用）

- 容器/节奏：`.ui-wrap`、`.ui-section`、`.ui-sunken`（浅灰分区底）
- 标题体系：`.ui-eyebrow`（小号大写眉题，主色）、`.ui-h1`、`.ui-h2`、`.ui-h3`、`.ui-lede`（导语，次要色）
- 卡片：`.ui-card`（白底细边框圆角）、`.ui-card-pad`
- 徽章：`.ui-badge`、`.ui-badge-trust`（认证/授权，深青描边）
- 按钮：`.ui-btn-primary`（主 CTA）、`.ui-btn-ghost`（次按钮）
- 数据：`.ui-num`（等宽数字、tabular-nums，型号/参数值用它）
- 规格表：`.ui-spec-table`（th/td 已有发丝下划线与颜色）
- 变量：`--ui-line` `--ui-ink` `--ui-mute` `--ui-trust` `--ui-trust-soft` `--ui-sunken`

## 4. 响应式断点（必须通过）

375px（手机）/ 768px（平板）/ 1024px（小桌面）/ 1440px（桌面）。
- 移动端：规格**表格转卡片式**（每行参数一张小卡：左标签右值）；导航折叠为抽屉。
- 文字对比度 ≥ 4.5:1；可点击元素有 hover(150–300ms) 与可见 focus；尊重 `prefers-reduced-motion`。

## 5. 各区域重点

- **全局导航/页脚**：顶部信息条更克制；主导航清晰、当前项高亮；搜索与品牌切换对齐基线；页脚四列更紧凑专业，增加信任信号（授权代理、询价采购、无购物车说明）。
- **首页**：Hero 一句话价值主张 + 明确 CTA；品类/品牌网格；信任条（授权品牌数量、服务能力）；不堆动画。
- **品牌合作页**：强化信任——认证徽章（`.ui-badge-trust`）、品牌定位一句话、核心产品线概览网格；品牌详情页同理。
- **产品详情页**：参数呈现清晰、信息层次分明——关键参数前置成"规格摘要卡"，完整规格用 `.ui-spec-table`（桌面）/ 卡片（移动）；型号用 `.ui-num`。
- **关于/联系**：表单专业、字段分组、提交态清晰；增加联系方式与服务承诺。

## 6. 自检

- 自己改的文件 `pnpm typecheck` 不新增错误；dev server（localhost:3000）能热更新不报错。
- 375px 与 1440px 两档布局不溢出、不裁切。
- catalog 页视觉与代码零改动。
