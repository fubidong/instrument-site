# 多品牌仪器仪表企业站点 (instrument-site)

基于 Next.js + TypeScript + Tailwind + shadcn/ui + PostgreSQL 构建的多品牌仪器仪表代理商企业官网。

## 项目特性

- 多品牌产品展示（品牌 → 类别 → 系列 → 型号）
- 产品参数规格表、图片、PDF 技术资料下载
- 在线询价/留言 → 后台线索管理
- 中英双语（后期扩展俄语）
- 单管理员后台运营
- 产品批量导入（Excel/CSV）

## 技术栈

- **框架**：Next.js (App Router) + TypeScript
- **UI**：Tailwind CSS + shadcn/ui
- **多语言**：next-intl
- **数据库**：PostgreSQL + Prisma ORM
- **部署**：阿里云 ECS + 宝塔 + PM2 + Nginx

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
pnpm prisma migrate dev

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 项目结构

```
├── app/                    # Next.js 页面和路由
│   ├── (admin)/           # 后台管理
│   └── ...                # 前台页面
├── components/             # React 组件
│   └── ui/                # shadcn/ui 组件
├── lib/                    # 工具库、数据库连接、类型
├── prisma/                 # 数据库 schema 和 migrations
├── messages/               # 多语言文案
├── scripts/                # 批量导入、采集等脚本
├── public/                 # 静态资源
├── dev-docs/               # 内部文档（真源）
└── AGENTS.md               # 项目宪法
```

## 文档

- [项目宪法](AGENTS.md)
- [立项章程](dev-docs/charter.md)
- [数据模型](dev-docs/data-model.md)
- [分阶段计划](dev-docs/stages.md)
- [内部文档索引](dev-docs/README.md)

## 开发规范

本项目遵循 `AGENTS.md` 中定义的开发规范。核心原则：真源优先、owner 唯一、严格验收、禁止补丁式开发。

## 许可证

公司内部项目，未开源。
