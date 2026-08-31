# 项目宪法 — 多品牌仪器仪表企业站点 (instrument-site)

> 本文件是本项目唯一的行为真源。任何 AI、开发者或工具在本项目内工作时，必须遵守本宪法。
> 本宪法基于通用 Agent 宪法模板适配，只保留本项目真实使用的规则。

## 项目标识

- **项目名**：多品牌仪器仪表企业站点（内部代号 `instrument-site`）
- **真源入口**：`dev-docs/README.md`
- **产品边界**：B2B 营销型官网 — 多品牌（代理多家厂商）仪器仪表产品展示 + 在线询价/留言 → 后台线索管理
- **多语言**：中英双语上线，后期扩展俄语
- **访问者**：公网展示为主，运营人员（单管理员账号）后台维护内容

## 核心原则

- 架构优先、设计优先、真源优先、严格验收。
- 开始编码前必须想清楚：为什么这样做、是否正确、是否有更简单且符合当前系统的做法。
- 敢于指出不合理的需求、错误的架构方向、冲突的规则和缺失的验收条件。
- **禁止补丁式开发**：不得用散落 if、临时兼容分支、硬编码、sleep、全局 flag、mock 或假数据绕过架构问题。
- **禁止选项剧场**：给方案时只给一个推荐主线，备选只用于解释为什么不选。
- **禁止偷懒、糊弄和留尾巴**。完成定义必须包含可验证结果、未闭合风险和下一步边界。
- 用户明确否定的概念必须从代码、文档、计划和命名中删除，禁止换名保留。
- 当用户说"先看""不动代码""先给判断"时，必须保持只读审查，直到用户明确要求执行。

## 产品边界（做什么 / 不做什么）

**做**：
- 多品牌产品展示（品牌 → 产品类别 → 产品系列 → 产品型号）
- 产品参数规格表、产品图片、PDF 技术资料下载
- 在线询价/留言表单 → 后台线索管理（待处理/已报价/已成交）
- 新闻/技术文章内容发布
- 中英双语（后期俄语）
- 单管理员后台运营

**不做（非目标）**：
- 在线支付、购物车、交易商城（第一版是询价制）
- 多租户 SaaS（公司自有，单站）
- 移动端 APP（响应式网站覆盖手机访问）
- ERP/CRM 深度集成（第一版不做）

**已否决方向**：JeeSite（Java 框架，团队不熟且偏后台管理）、WordPress（已用不满意，定制受限）。实现不得把项目带回这些方向。

## 真源优先级

事实冲突时按以下顺序处理：
1. 当前源码、测试、脚本、schema、运行日志、实机/用户侧证据、当前 git 状态。
2. 本文件（`AGENTS.md`）。
3. `dev-docs/README.md` 指向的内部真源索引。
4. 当前 active 的 charter、architecture、data-model、stages、acceptance 文档。
5. 当前代码或用户仍确认有效的 `docs/`、README、commit history。
6. archive 历史文档、旧会话只能作为模式证据，不能覆盖当前项目事实。

真源缺失、互相矛盾或技术上明显错误时，先报告冲突、证据和推荐处理方式，再等用户确认。

## Owner Map（每个概念只有一个主人）

| 概念 | 唯一 Owner | 说明 |
|---|---|---|
| 产品定位/边界/验收 | `dev-docs/charter.md` | 只有这里定 |
| 数据模型（品牌/产品/询价/资料） | `prisma/schema.prisma` | 改产品结构从这里改 |
| 前台页面/路由/组件 | `app/`（Next.js 路由） | 只做展示和接线 |
| 后台管理（运营登录） | `app/(admin)/` | 登录/权限在此 |
| 多语言文案 | `messages/` + next-intl 配置 | 所有 UI 文案必须走这里，禁止硬编码 |
| 产品批量导入 | `scripts/import/` | 独立模块，可复用 |
| 产品采集 | `scripts/crawler/`（后期） | 独立模块，不影响主站稳定 |
| 架构决策 | `dev-docs/architecture.md` | 跨模块决策记录在此 |
| 阶段计划 | `dev-docs/stages.md` | 开发进度和里程碑 |

adapter、controller、UI、HTTP、worker 只做协议映射、展示和接线，不拥有核心业务语义。

## 必需工作流

对立项、接管、功能、重构、修 bug、发布和文档任务，默认遵循：

```
当前真源审计
  -> 推理闸
  -> 唯一 owner 与合同设计
  -> 测试 / fixture / 门禁计划
  -> 核心实现
  -> 薄 adapter / UI / API 接线
  -> 针对性验收
  -> 文档回写
  -> git 边界复核
```

空项目启动时，禁止直接写代码或选择框架；必须先完成产品定义、唯一主线、第一闭环、技术栈确认和验收标准。

### 推理闸（编码前必须回答）

- 实际要解决的问题是什么？
- 谁创建这个概念，谁调用它，谁消费它？
- 当前真源在哪里？是否已有同职责模块？
- 唯一 owner 是哪一层？哪些层禁止成为 owner？
- 更简单、更保守的设计是什么？为什么不够？
- 最大回归风险是什么？用什么测试/日志/截图/实机证据阻断？

推理闸没有闭合，不开始实现。

## 技术栈适配块

### @@ADAPTER:framework/nextjs@@
- **applies_when**: 项目使用 Next.js（App Router）
- **authority**: 低于通用宪法，高于普通建议
- **verification**: `pnpm typecheck && pnpm build`
- 遵循 Next.js App Router 约定：`app/` 目录路由、Server Components 默认、Client Components 显式标注 `"use client"`。
- 数据获取优先在 Server Component 中进行；需要交互的组件才用 Client Component。
- 路由参数、searchParams 必须做类型校验，禁止信任前端传入的未校验数据。
- 图片使用 `next/image`，字体使用 `next/font`，禁止裸 `<img>` 引用外部大图。
- API 路由（Route Handlers）必须做请求体校验、错误处理和速率限制（询价接口尤其重要）。

### @@ADAPTER:language-runtime/typescript@@
- **applies_when**: 项目使用 TypeScript
- **authority**: 低于通用宪法，高于普通建议
- **verification**: `pnpm typecheck`
- 全项目 TypeScript strict 模式，禁止 `any`（必要时用 `unknown` + 类型收窄）。
- 共享类型定义放在 `lib/types/`，禁止在组件内重复定义业务类型。
- 环境变量通过 `lib/env.ts` 统一校验和导出，禁止散落 `process.env` 读取。

### @@ADAPTER:database/prisma-postgresql@@
- **applies_when**: 项目使用 Prisma + PostgreSQL
- **authority**: 低于通用宪法，高于普通建议
- **verification**: `pnpm prisma validate && pnpm prisma migrate dev`
- `prisma/schema.prisma` 是数据模型唯一真源。改表结构必须通过 migration，禁止手改数据库。
- 多语言内容使用独立翻译表（如 `ProductTranslation`），禁止在主表塞多语言字段数组。
- 所有查询必须考虑 N+1 问题，列表页使用 `include` 或 `select` 精确取字段。
- 数据库连接池、超时、重试在 `lib/db.ts` 统一配置。

### @@ADAPTER:toolchain/pnpm@@
- **applies_when**: 项目使用 pnpm 包管理
- **authority**: 低于通用宪法，高于普通建议
- **verification**: `pnpm install --frozen-lockfile`
- 使用 pnpm 作为唯一包管理器，禁止混用 npm/yarn。
- `pnpm-lock.yaml` 必须提交，禁止删除后重新生成。

### @@ADAPTER:platform/aliyun-baota@@
- **applies_when**: 部署到阿里云 ECS + 宝塔面板
- **authority**: 低于通用宪法，高于普通建议
- **verification**: 本地 `pnpm build` 通过后，在服务器执行部署脚本并验证 HTTPS 可访问
- 部署流程：本地测试通过 → git push → 服务器 pull → `pnpm install --frozen-lockfile` → `pnpm prisma migrate deploy` → `pnpm build` → PM2 重启 → Nginx 反代。
- 生产环境变量通过宝塔面板的环境变量或 `.env.production` 管理，禁止硬编码密钥。
- 数据库备份通过宝塔计划任务定期执行，部署前确认备份存在。

### @@ADAPTER:design-system/tailwind-shadcn@@
- **applies_when**: 项目使用 Tailwind CSS + shadcn/ui
- **authority**: 低于通用宪法，高于普通建议
- **verification**: 浏览器视觉验收（桌面 + 移动端）
- 样式使用 Tailwind 工具类，禁止新增全局 CSS 覆盖组件样式（除非是主题 token）。
- shadcn/ui 组件源码在 `components/ui/`，可直接修改，但修改共享组件前必须确认既有消费者。
- 设计 token（颜色、间距、字体）在 `tailwind.config.ts` 和 `app/globals.css` 中统一管理。
- 响应式优先移动端设计，断点遵循 Tailwind 默认（sm/md/lg/xl）。

### @@ADAPTER:i18n/next-intl@@
- **applies_when**: 项目使用 next-intl 做多语言
- **authority**: 低于通用宪法，高于普通建议
- **verification**: 切换中/英文后页面无硬编码残留、无 key 缺失警告
- 所有用户可见文案必须通过 `useTranslations` / `getTranslations` 获取，禁止硬编码中文/英文字符串。
- 语言文件在 `messages/{locale}.json`，新增文案必须同时添加中文和英文。
- 路由格式为 `/{locale}/...`，默认 locale 为 `zh`。
- 产品内容的多语言通过数据库翻译表管理，不放在语言文件中。

## 实现规则

- 从合同、schema、核心模型开始，而不是从 UI、HTTP handler 或临时脚本倒推核心。
- 不手改生成文件；项目有生成器时，运行生成器并检查输出。
- 不用旧记忆、旧输出或"应该是这样"代替当前命令和当前代码证据。
- 修改代码、接口、配置、架构边界、用户行为或产品语义后，必须同步项目文档。
- 生产路径必须用结构化错误返回失败；禁止用裸异常、固定字符串或静默吞错处理可恢复问题。
- 配置、密钥和权限必须显式下传或通过项目既有配置系统读取；禁止全局可变静态、硬编码密钥、日志明文输出敏感信息。
- 观测、指标、健康状态必须来自真实数据源。拿不到数据就返回 N/A 或结构化不可用原因，禁止固定值和伪健康状态。
- 用户可见文案、错误提示、按钮、空态必须遵守 i18n 真源；禁止临时硬编码自然语言后续再补。
- 所有外部输入（询价表单、搜索、URL 参数）必须有上界、校验和降级策略；禁止无界增长。

## 验收规则

- 验收必须匹配改动风险，不能只跑最轻命令就宣布完成。
- 声称"完成""修好""通过"前，必须提供本轮实际运行过的命令、测试、日志、截图、构建或用户侧证据。
- 如果无法运行某项关键验收，必须说明原因、影响范围和可替代证据，不能隐瞒。
- 发现失败时，先复现、收集证据、建立可证伪假设，再修改。禁止无复现地猜测原因。
- UI/前端改动必须检查真实渲染、交互、加载态、错误态和移动/桌面约束；不得只看代码。
- 询价接口、后台登录、数据库迁移相关改动必须扩大验收面。
- warning、lint warning、类型告警、格式漂移、文档索引缺失和本轮 TODO/TBD 都按缺陷处理；除非明确记录为非本轮债务，否则不能带着它们声称完成。
- **没有新鲜验证，不宣布完成。** 不许 mock 冒充完成，不许"代码写了"当完成。

## 文档分层

- 内部架构、宪法、owner map、验收门禁、阶段计划进入 `dev-docs/`。
- 外部用户文档只写使用、部署、配置、运维和排障（`README.md`）。
- 同一变更同时影响用户行为和内部机制时，必须分别写入对应层。
- 新增当前真源文档必须被 `dev-docs/README.md` 索引引用；完成、失效或一次性的文档必须归档或标注非当前。

## Git 规则

- 提交前确认 git root、`git status --short`、ignored 文件和 staged file list。
- 禁止 `git add .`。只 stage 与本任务相关的文件。
- 禁止 force-add ignored 文件，除非用户明确点名路径并要求。
- dirty worktree 中不得回滚、覆盖或吸入用户未授权的改动。
- 不使用破坏性 git 命令（force push、reset --hard 等），除非用户明确要求并确认风险。
- 提交信息格式：`{类型}: {简要描述}`，类型包括 feat/fix/docs/refactor/style/chore。

## 必须停止并询问的情况

- 用户需求、当前代码、本宪法、真源文档或验收结果互相冲突。
- 需要创建、改写或废弃本宪法、真源索引、产品命名、核心 API、schema、权限模型或部署流程。
- 需要删除旧 API、字段、路由、配置、缓存或迁移历史。
- 当前证据表明用户的目标会损害架构、数据、安全、权限、用户体验或长期可维护性。
- 上下文不足以判断 owner 边界，并且猜测会造成不可逆或大范围影响。

停止时必须给出：冲突证据、可选处理方向、推荐方向、需要用户确认的问题。

## 交接规则

当上下文过大、需要换窗口、需要交给另一个 agent，或任务尚未闭合时，必须产出可直接复制的交接文本，包含：
- 当前目标和已确认的产品/架构边界。
- 当前 git 状态、已改文件、未提交文件。
- 已完成工作、实际验收命令和结果。
- 未闭合风险、漂移警告和禁止触碰的用户改动。
- 下一步最安全命令和停止条件。
