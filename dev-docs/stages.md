# 分阶段开发计划

> 本文件是开发进度和里程碑的真源。每个阶段完成后必须更新状态和验收证据。

## 阶段总览

| 阶段 | 名称 | 目标 | 状态 |
|---|---|---|---|
| 0 | 立项与环境搭建 | 项目初始化、宪法、依赖、数据库 | ✅ 完成 |
| 1 | 后台骨架与认证 | 管理员登录、后台布局、基础框架 | ✅ 完成 |
| 2 | 产品库与参数系统管理 | 品牌/类别/系列/型号/资料的后台 CRUD + 动态参数模板 | ✅ 完成 |
| 2.5 | 后台高效操作增强 | 素材库 + 列表筛选/搜索/复制/批量操作 | ✅ 完成 |
| 3 | 前台展示与选型 | 首页/品牌/产品列表(参数筛选)/详情/对比/询价 | ✅ 完成 |
| 4 | 多语言完善 | 中英双语全站打通 | ✅ 完成 |
| 5 | 内容与批量导入 | 新闻管理、产品批量导入、真实数据录入 | ⏳ 待开始 |
| 6 | 测试与上线 | 本地完整测试 → 阿里云部署 | ⏳ 待开始 |
| 后期 | 扩展 | 俄语、采集工具、OSS 迁移 | ⏳ 待定 |

---

## 阶段 0：立项与环境搭建

**目标**：项目可运行，数据库可连接，基础页面能打开。

**任务清单**：
- [x] 创建 Next.js 项目（TypeScript、Tailwind、shadcn/ui、next-intl）
- [x] 配置 Prisma + PostgreSQL（schema 已设计完成，待 migration）
- [x] 初始化数据库 schema（按 data-model.md 设计，20+ 张表）
- [x] 配置环境变量（.env / .env.example）
- [x] 配置 ESLint + Prettier（Next.js 内置）
- [x] 初始化 git 仓库，首次提交并推送到 Gitee
- [x] 安装全部依赖（i18n/ORM/表单/表格/富文本/认证）
- [x] shadcn/ui 初始化
- [x] 动态参数系统设计（数据模型 + 架构文档）
- [x] 启动 PostgreSQL（本地原生安装 PostgreSQL 18.6，服务 postgresql-x64-18，已运行）
- [x] 执行 prisma migrate dev 建表（migration 20260831035408_init 已应用）
- [x] 搭建基础布局（前台 Header/Footer、后台布局）【待后续阶段】
- [x] 首页占位页可访问（http://localhost:3000 返回 200）
- [x] pnpm dev 启动验证（Ready in 9.3s，HTTP 200）
- [x] Prisma 7 适配（prisma.config.ts + @prisma/adapter-pg + src/generated/prisma）

> **环境变更记录**：原计划用 Docker 跑 PostgreSQL，因 Docker Desktop 内存占用过高已弃用。改为本地原生安装 PostgreSQL 18.6（服务自动启动，内存占用低）。Docker 相关文件（docker-compose.yml）保留但未使用。

**验收**：
- `pnpm dev` 启动后，`http://localhost:3000` 可访问
- `pnpm typecheck && pnpm build` 通过
- `pnpm prisma migrate dev` 成功建表
- git 仓库有首次提交

**预计产出**：可运行的项目骨架

---

## 阶段 1：后台骨架与认证

**目标**：运营管理员可登录后台，后台基础框架可用。

**任务清单**：
- [x] 实现管理员登录（session + bcrypt）— iron-session 8 + bcryptjs，统一错误提示防用户名枚举
- [x] 后台路由保护（未登录跳转登录页）— (protected) 路由组 + requireAdmin()
- [x] 后台布局（侧边栏导航、顶部栏、退出登录）
- [x] 管理员密码修改功能（校验当前密码、新密码≥8位、二次确认）
- [x] 登录日志记录（新增 LoginLog 表，记录用户名/IP/UA/成功失败/原因，migration 20260831040350_add_login_log）
- [x] 初始管理员 seed 脚本（scripts/seed-admin.mjs，幂等，账号密码来自 .env）
- [x] 后台各模块占位页（品牌/类别/产品/参数/资料/内容/询价/设置）

**验收记录**（2026-08-31，浏览器实测）：
- ✅ 访问 `/admin` 未登录时 307 重定向到 `/admin/login`
- ✅ 正确账号密码（admin/Admin@123456）登录成功，进入后台首页
- ✅ 登录日志正确记录成功/失败登录（IP、UA、原因）
- ✅ 错误当前密码修改被拦截（提示"当前密码错误"）
- ✅ 密码修改成功 → 退出 → 新密码可登录 → 改回原密码（全链路验证）
- ✅ 退出登录后回到登录页，无法访问后台
- ⚠️ 速率限制（同 IP 每分钟 5 次）为阶段 3 询价防刷的一部分，登录接口暂未强制启用（单管理员本地环境）

**验收**：
- 访问 `/admin` 未登录时跳转登录页
- 正确账号密码可登录，进入后台首页
- 错误密码提示错误
- 退出登录后无法访问后台页面

**预计产出**：可用的后台骨架

---

## 阶段 2：产品库与参数系统管理（后台核心）

**目标**：运营人员可在后台完整管理品牌→类别→系列→型号→资料，并为每个类别定义动态参数模板。

**任务清单**：
- [x] 品牌管理（列表/新增/编辑/删除/排序/启用停用，多语言）
- [x] 类别管理（树形结构，多语言）
- [x] 产品系列管理（归属品牌+类别，多语言）
- [x] 产品型号管理（图片上传、PDF 关联、多语言）
- [x] 资料管理（PDF 上传、关联产品/系列、类型/语言/版本标注）
- [x] **参数分组管理**（按类别创建分组，如"基本参数""输入特性"）
- [x] **参数定义管理**（按类别创建参数：名称/类型/单位/是否筛选/是否对比/是否必填/校验规则，多语言）
- [x] **参数模板复制**（从其他类别复制参数模板，类似类别快速复用）
- [x] **产品参数填写**（按类别模板自动渲染表单：数值/范围/枚举/布尔/文本，必填校验，卖点标记）
- [x] 文件上传（图片/PDF，本地存储）

**验收**（浏览器实测通过）：
- 品牌管理：创建 SIGLENT(鼎阳)、RIGOL(普源精电) 成功，编辑保存"保存成功"，多语言、Logo 上传正常
- 类别管理：创建 示波器/电源/直流电源(子类) 成功，树形缩进+父级选择正确
- 参数分组：示波器下创建 BASIC(基本参数)、INPUT(输入特性)
- 参数定义：创建 带宽(number, MHz, 可筛选+对比)、通道数(enum, 选项 1/2/4, 可筛选+对比)，数据库确认 isFilterable/isComparable/unit 正确
- 参数模板复制：示波器模板(2分组2参数)一键复制到直流电源，跳转后分组/参数/选项完整
- 产品系列：创建 SDS1000X(鼎阳/示波器) 成功
- 产品型号：创建 SDS1104X-E 成功；**参数表单按类别模板自动渲染**（带宽数值输入+通道数下拉），带宽=100 / 通道数="4" 正确写入 ProductParamValue
- 资料管理：上传 PDF 成功，创建"SDS1000X 系列用户手册"(数据手册/中文/鼎阳/SDS1000X系列)
- 关联删除检查：SDS1000X 系列(有1产品)删除被拒并 alert 提示，数据保留
- 测试数据：SDS1104X-E 产品 id=0e66045d-ebc5-4b16-a379-811d06aaf12c

**已记录踩坑**：
- useActionState 内 redirect() 失效 → action 返回 {success, redirect}，客户端 useEffect window.location.href 跳转
- Server Component 传 onSubmit 500 → 删除确认独立客户端组件
- bu.click 对 React onClick 不触发 → bu.js 原生 .click()
- 产品新增时 productLineId 用 select 需 initialProductLineId 预选，否则 required 校验阻止提交
- FileUpload 必须受控（state 管理 URL + hidden input），否则上传 URL 不同步到表单
- 页面多个 form 时 requestSubmit 需精确匹配（含 name=model 的 form），避免误触 logout

**预计产出**：完整的产品库 + 动态参数系统后台

---

## 阶段 2.5：后台高效操作增强（用户强调的必备基础能力）

**目标**：后台列表具备筛选、搜索、复制、批量操作能力；文件统一进素材库管理。

**任务清单**：
- [x] **素材库（媒体库）**：新增 MediaAsset 表，/api/upload 上传自动入库；素材库页（分类筛选 图片/文档 + 业务分类、关键词搜索、网格展示、复制链接、单个/批量删除）
- [x] **通用筛选栏组件** `ListFilterBar`（客户端组件，URL 参数驱动，品牌/系列/资料/产品列表复用）
- [x] **产品列表增强**：筛选（品牌/类别/系列/状态 + 型号名称搜索）、复选框多选、批量删除/批量启用/批量停用
- [x] **单产品复制**：一键复制型号+翻译+参数值，新型号加 `-copy` 后缀，复制品默认停用，跳转编辑
- [x] 品牌列表筛选（状态 + 搜索）
- [x] 系列列表筛选（品牌 + 状态 + 搜索）
- [x] 资料列表筛选（类型 + 语言 + 品牌 + 搜索）
- [x] 安装 tsx（供 TS 数据脚本使用）

**验收**（浏览器实测通过）：
- 素材库：上传 test-osc.png 成功（写入 MediaAsset），`?kind=doc` 筛选正确过滤
- 产品单复制：SDS1104X-E → SDS1104X-E-copy 成功，参数值(2条)完整复制，复制品默认停用
- 产品状态筛选：`?status=inactive` 只显示停用产品
- 产品批量删除：勾选2个全部删除（均无产品级关联）
- 产品批量启用：SDS1104X-E-copy 停用→启用成功，提示"已启用 1 个产品"
- 资料类型筛选：选"用户手册" → URL `?type=user_manual` 过滤正确

**踩坑记录**：
- Server Component 内不能写事件处理器（onChange/onClick 报错）→ 抽共用客户端组件 ListFilterBar
- Prisma migration 后需重启 dev server 使新 client 生效（db.mediaAsset undefined）
- TS 脚本 top-level await 需包 async main()（package.json 无 type:module）

---

## 阶段 3：前台展示与选型

**目标**：公网访客可浏览品牌、产品，按参数筛选选型，对比产品，查看详情和资料，提交询价。

**任务清单**：
- [x] 首页（品牌展示、热门产品、产品类别、公司简介）
- [x] 品牌列表页 + 品牌详情页
- [x] 产品类别浏览页（按类别进入，左侧**动态参数筛选器**）
- [x] **参数筛选功能**（数值范围/枚举复选/布尔，筛选条件通过 URL 传递，实时刷新产品列表）
- [x] **产品对比功能**（勾选多个产品，对比页横向展示参数，差异高亮）
- [x] 产品详情页（参数表按分组展示、PDF 下载、询价按钮、卖点参数高亮）
- [x] 资料下载中心（按类型/品牌筛选 + 搜索）
- [x] 联系我们页（联系方式 + 通用询价表单）
- [x] 询价表单（前台提交 + 后端校验 + 写入 Inquiry 表）
- [x] 询价提交成功页
- [x] 404 页、SEO 元信息（title/description）
- [x] **后台询价线索管理**（原占位页改为完整页面：状态/搜索筛选、详情、状态流转、备注、单个/批量删除）

**验收记录**（2026-08-31，浏览器实测通过）：
- ✅ 首页完整渲染：Hero、代理品牌墙(鼎阳/普源精电)、推荐产品、产品类别、关于我们、页脚
- ✅ 产品列表：全部产品 + 示波器类别，左侧类别树/品牌筛选/搜索正常
- ✅ **动态参数筛选**：进入示波器类别，左侧自动出现"带宽(MHz) 数值范围"+"通道数 枚举(1/2/4)"；填带宽最小=100 + 通道数=4 → URL 变 `?category=OSCILLOSCOPE&p_bandwidth_min=100&p_channels=4` 且结果正确；带宽最小=500 → "共 0 款"+空状态（筛选逻辑真实验证）
- ✅ 产品详情页：型号/中英文名/品牌系列、**参数表按"基本参数Basic"分组**（带宽 100MHz、通道数 4）、卖点高亮区、PDF 下载、询价表单（自动带出咨询产品）
- ✅ 询价提交：前台填表提交 → "询价已提交" 成功页 → **后台仪表盘"询价线索 1"** → 后台询价页完整显示姓名/公司/产品/联系方式/留言/IP
- ✅ 询价管理：状态切换 待处理→已报价（标签变蓝）、备注保存显示、批量删除、全选
- ✅ 品牌页：列表(鼎阳2款/普源0款) + 鼎阳详情(简介/系列/产品)
- ✅ 资料中心：类型筛选(数据手册/用户手册...)、品牌筛选、资料卡片
- ✅ 对比：详情页"加入对比"→ localStorage → /compare 自动带 ?ids= 显示横向对比表（带宽/通道数两列），每产品详情/询价/移除按钮
- ✅ 404 页（带前台布局）

**本轮实现架构**：新增 `(site)` 路由组承载前台（layout 含 Header 类别下拉+Footer），与 /admin 隔离；`src/lib/site.ts` 提供站点设置/类别/品牌读取；产品列表用服务端组件查询 + 客户端筛选器（URL 参数驱动，参数用 `p_<key>_min/max/值` 约定）；询价写 Inquiry 表（notifyType=in_site）；对比用 localStorage + URL ids 透传。

**已记录踩坑**：
- 根 layout.tsx 的 `LayoutProps` 类型未导入 → typecheck 报错，改用 React.ReactNode（dev 热更新时此错被隐藏，.next 清理后才暴露）
- `(site)` 目录中 `[model]`/`[code]` 动态路由段，跨目录 import 需正确相对路径（brands/[code] → ../../products/product-grid）
- ParamDefinition 需 include paramGroup（含 translations）才能在前台分组渲染
- PowerShell 命令行内联 node/tsx -e 脚本转义繁琐 → 改用独立脚本文件（如 scripts/mark-featured.ts）

**预计产出**：可用的前台官网 + 参数选型系统

---

## 阶段 4：多语言完善

**目标**：中英双语全站打通，切换语言后内容正确变化。

**任务清单**：
- [x] 语言切换组件（Header 中，中文/EN）
- [x] UI 文案中英双语（messages/zh.json + en.json）
- [x] 产品/品牌/类别内容按当前 locale 取翻译（前台 `[locale]` 段 + src/lib/site.ts 按 locale 取词）
- [x] 路由多语言（`/{locale}/...`，middleware 前缀 + 重定向，默认 zh）
- [x] 后台 /admin 排除 locale 前缀（middleware matcher）
- [x] 询价提交按当前语言跳转成功页（server action 用 getLocale）
- [x] SEO 多语言（generateMetadata 按 locale + alternates.languages）
- [x] 前台 `(site)` 路由组迁移为 `[locale]` 段

**验收记录**（2026-08-31，浏览器实测通过）：
- ✅ 访问 `/` 自动重定向 `/zh`，中文首页完整渲染（导航/Hero/品牌墙/推荐/类别/关于我们）
- ✅ Header 点"EN"→ URL 变 `/en`，全站英文（Home/Products/Brands/Resources/Contact/Get a Quote、Partner Brands、Featured Products）
- ✅ 英文产品列表：Category/Brand/Parameter Filter（Bandwidth/Channels/Oscilloscope Total 2/View Details）
- ✅ 英文产品详情：Technical Specifications、参数表 Basic（Bandwidth带宽 100MHz、Channels通道数 4 中英对照）
- ✅ 英文询价提交 → 正确跳转 `/en/contact/success`（英文成功页）
- ✅ 后台 /admin 正常（不跳 locale 前缀），中文后台，询价线索 2 条（中+英各 1）
- ✅ pnpm build 生产构建通过（前台路由 SSG 静态预渲染）

**已记录踩坑**：
- next-intl 4.14 必须用 `createNextIntlPlugin("./src/i18n/request.ts")` 包装 next.config.ts（不能只建 next-intl.config.ts）
- 客户端组件（LocaleSwitcher 用 useRouter/usePathname from next-intl/navigation）必须在 NextIntlClientProvider 内 → Provider 提到整个布局外层
- next-intl 的 navigation 用命名导出 `{ Link }`（非 default）
- middleware 需在函数内排除 /admin、/api（matcher 不够，需显式 return）
- 根 layout.tsx 的 getLocale() 在非 [locale] 路由下需 .catch 兜底
- PowerShell 对含括号/方括号路径操作需用 cmd 或 [System.IO.Directory]::Move

**预计产出**：完整中英双语站点

---

## 阶段 5：内容与批量导入

**目标**：运营人员可发布新闻，可批量导入产品数据，录入真实数据。

**任务清单**：
- [ ] 新闻/文章管理（后台 CRUD，多语言，富文本编辑）
- [ ] 前台新闻列表页 + 详情页
- [ ] 产品批量导入（Excel/CSV，按 data-model.md 模板）
- [ ] 导入报告（成功/失败/跳过明细）
- [ ] 站点设置（站点名称、SEO、联系方式）
- [ ] 录入真实数据（至少 1 品牌、3 类别、5 系列、10 型号）
- [ ] 运营操作手册（简版）

**验收**：
- 后台可发布新闻，前台可见
- 用 Excel 模板批量导入 10+ 产品成功，导入报告准确
- 站点设置修改后前台生效
- 真实数据录入后，前台展示完整

**预计产出**：内容可运营、数据可批量导入的完整站点

---

## 阶段 6：测试与上线

**目标**：本地完整测试通过，成功部署到阿里云，公网可访问。

**任务清单**：
- [ ] 全站功能测试（前台+后台，按 charter.md 验收标准逐项验证）
- [ ] 多语言测试（中英切换全流程）
- [ ] 移动端响应式测试
- [ ] 性能检查（Lighthouse，核心页面 LCP < 2.5s）
- [ ] 安全检查（询价防刷、后台保护、XSS/SQL 注入基本检查）
- [ ] 404/500 错误页
- [ ] 阿里云服务器环境准备（Node、PostgreSQL、PM2、Nginx、宝塔）
- [ ] 生产环境配置（.env.production、域名、HTTPS）
- [ ] 部署脚本编写
- [ ] 首次部署 + 验证
- [ ] 数据库备份策略（宝塔计划任务）

**验收**：
- 本地按验收标准全部通过
- 阿里云部署后，域名 HTTPS 可访问，功能正常
- 后台可登录，数据完整
- 询价提交正常收到
- 宝塔面板可查看运行状态和日志

**预计产出**：上线的生产站点

---

## 后期扩展（待定）

| 项目 | 说明 | 优先级 |
|---|---|---|
| 俄语支持 | 新增 ru 语言文件和翻译内容 | 中 |
| 产品采集工具 | 从厂商官网采集产品资料和图片（scripts/crawler/） | 中 |
| OSS 存储迁移 | PDF/图片迁移到阿里云 OSS | 低 |
| 站内搜索增强 | 全文搜索（产品+文章） | 低 |
| 线索导出 | 询价线索导出 Excel | 低 |
| 访问统计 | 接入百度统计/Google Analytics | 低 |

---

## 开发约定

- 每个阶段开始前，确认上一阶段已验收通过。
- 每个功能完成后，必须有实际运行的验证证据（截图/日志/命令输出）。
- 数据库结构变更必须通过 Prisma migration，禁止手改。
- 涉及多语言的功能，必须同时完成中文和英文，不允许只做一种语言。
- 每个阶段结束后更新本文件的状态和验收记录。
