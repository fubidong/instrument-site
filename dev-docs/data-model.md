# 数据模型设计

> 本文件是数据库结构的设计真源。实际实现以 `prisma/schema.prisma` 为准，本文件记录设计意图和字段说明。
> 设计参考：鼎阳科技 siglent.com 资料组织方式。

## 1. 核心实体关系

```
Brand（品牌/厂商）
  └── Category（产品类别）── 多对多（一个品牌有多个类别，一个类别有多个品牌）
       ├── ParamGroup（参数分组，类别内定义）
       │    └── ParamDefinition（参数定义/模板，归属分组+类别）
       │         └── ParamDefinitionTranslation（参数名/单位/分组名的多语言）
       └── ProductLine（产品系列）── 归属品牌+类别
            └── Product（产品型号）── 归属系列
                 ├── ProductTranslation（多语言翻译）
                 ├── ProductParamValue（产品参数值，关联 ParamDefinition）
                 ├── ProductImage（产品图片）
                 └── Document（资料文档，PDF）── 可关联产品/系列/品牌

Inquiry（询价线索）── 可关联产品（可选）
Post（新闻/文章）── 多语言翻译
AdminUser（运营管理员）── 单账号
```

> **参数系统设计要点**：参数不是产品的自由字段，而是按「产品类别」定义的模板。每个类别有一套参数分组和参数定义，产品按模板填写参数值。这样同类产品参数结构一致，支持动态筛选和对比。

## 2. 表设计

### 2.1 Brand（品牌/厂商）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | string | 品牌代码（如 SIGLENT、FLUKE），唯一，用于 URL |
| logo | string | logo 图片路径 |
| website | string? | 厂商官网 |
| sortOrder | int | 排序 |
| isActive | boolean | 是否启用 |
| createdAt / updatedAt | datetime | 时间戳 |

**BrandTranslation（品牌翻译）**：brandId + locale → name、description、fullDescription

### 2.2 Category（产品类别）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | string | 类别代码（如 oscilloscope、signal-generator），唯一 |
| icon | string? | 类别图标 |
| sortOrder | int | 排序 |
| parentId | uuid? | 父类别（支持二级分类，如 示波器→手持示波器） |

**CategoryTranslation**：categoryId + locale → name、description

**BrandCategory（品牌-类别关联）**：brandId + categoryId（多对多，记录该品牌在该类别下有产品）

### 2.3 ProductLine（产品系列）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| brandId | uuid | 归属品牌 |
| categoryId | uuid | 归属类别 |
| code | string | 系列代码（如 SDS5000X-HD） |
| sortOrder | int | 排序 |
| isActive | boolean | 是否启用 |

**ProductLineTranslation**：productLineId + locale → name、description、features（卖点列表，JSON 数组）

### 2.4 Product（产品型号）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| productLineId | uuid | 归属系列 |
| model | string | 型号（如 SDS5054X HD），唯一 |
| sku | string? | 内部 SKU |
| coverImage | string | 封面图路径 |
| sortOrder | int | 排序 |
| isActive | boolean | 是否启用 |
| isFeatured | boolean | 是否首页推荐 |
| createdAt / updatedAt | datetime | 时间戳 |

**ProductTranslation**：productId + locale → name、summary、description、specsOverview

### 2.4 动态参数系统（核心）

参数系统是本项目的核心设计。思路：**按产品类别定义参数模板，产品按模板填写参数值**，而不是每个产品自由填 key-value。这样同类产品参数结构一致，支持动态筛选和对比。

#### 2.4.1 ParamGroup（参数分组）

每个类别下的参数按分组展示（如"基本参数""输入特性""触发系统"）。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| categoryId | uuid | 归属产品类别 |
| code | string | 分组代码（如 basic、input、trigger），类别内唯一 |
| sortOrder | int | 排序 |

**ParamGroupTranslation**：paramGroupId + locale → name（分组名，如"基本参数"/"Basic Specifications"）

#### 2.4.2 ParamDefinition（参数定义/模板）

定义一个参数的元信息：叫什么、什么类型、什么单位、能不能用来筛选/对比。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| categoryId | uuid | 归属产品类别 |
| paramGroupId | uuid | 归属参数分组 |
| key | string | 参数唯一标识（如 bandwidth、sample_rate、channels），类别内唯一 |
| type | enum | **number**（数值）/ **range**（数值范围，如频率 10Hz-100MHz）/ **enum**（枚举，如通道数）/ **boolean**（是/否）/ **string**（文本） |
| unit | string? | 单位（如 MHz、GSa/s、V、A），多语言翻译 |
| isFilterable | boolean | 是否用于前台产品筛选（如带宽、通道数） |
| isComparable | boolean | 是否用于产品对比 |
| isRequired | boolean | 产品填写时是否必填 |
| isHighlight | boolean | 是否在产品列表卡片上显示（卖点参数） |
| sortOrder | int | 排序（分组内） |
| options | json? | 枚举选项（仅 enum 类型）：`[{value: "4", label_zh: "4通道", label_en: "4 Channels"}]` |
| minValue | number? | 数值最小值（校验用，仅 number/range） |
| maxValue | number? | 数值最大值（校验用） |
| step | number? | 数值步长 |
| precision | int? | 小数位数（展示用） |
| createdAt / updatedAt | datetime | 时间戳 |

**ParamDefinitionTranslation**：paramDefinitionId + locale → name（参数名，如"带宽"/"Bandwidth"）、unit（单位翻译）、description（参数说明/提示）

> **设计要点**：
> - 参数定义归属于类别，不是产品。新增示波器类别时，定义"带宽、采样率、通道数、存储深度…"一套模板，所有示波器产品按这套模板填。
> - `isFilterable` 标记的参数会自动出现在前台产品列表的筛选器中。
> - `isComparable` 标记的参数会出现在产品对比表中。
> - `type=range` 支持"频率范围 10Hz~100MHz"这类区间参数，筛选时支持"包含某值"。
> - 后台支持"从其他类别复制参数模板"，类似类别（如示波器和手持示波器）可快速复用。

#### 2.4.3 ProductParamValue（产品参数值）

产品实际填写的参数值，关联到 ParamDefinition。用多字段存储不同类型的值，支持数值筛选和排序。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| productId | uuid | 归属产品 |
| paramDefinitionId | uuid | 关联参数定义 |
| valueNumber | float? | 数值型值（type=number） |
| valueMin | float? | 范围最小值（type=range） |
| valueMax | float? | 范围最大值（type=range） |
| valueString | string? | 字符串/枚举值（type=string/enum） |
| valueBoolean | boolean? | 布尔值（type=boolean） |
| isHighlight | boolean? | 该产品此参数是否为卖点（覆盖 ParamDefinition 的默认设置） |
| createdAt / updatedAt | datetime | 时间戳 |

> **为什么用多字段而不是一个 value string**：数值型参数需要支持范围筛选（带宽 ≥ 100MHz）和排序，存在 string 里无法高效查询。多字段存储让数据库可以直接对 valueNumber 建索引和做范围查询。
>
> **唯一性约束**：(productId, paramDefinitionId) 联合唯一，一个产品对一个参数只有一条值。

#### 2.4.4 参数系统工作流

```
后台：创建类别"示波器"
  → 创建参数分组（基本参数 / 输入特性 / 触发系统）
  → 创建参数定义（带宽 number 单位 MHz 可筛选、通道数 enum 可筛选…）
  → 创建产品系列和型号
  → 编辑产品参数时，自动按类别模板渲染表单（数值输入框/下拉/范围输入）
  → 填写参数值，必填校验

前台：进入"示波器"类别
  → 左侧自动显示 isFilterable 的参数作为筛选条件
  → 用户选"带宽 ≥ 100MHz，通道数 = 4"
  → 后端 join ProductParamValue 做范围查询，返回匹配产品
  → 产品详情页按分组展示参数表
  → 勾选多个产品 → 对比页展示 isComparable 的参数横向对比
```

**ProductImage（产品图片）**：
| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| productId | uuid | 归属产品 |
| imagePath | string | 图片路径 |
| altText | string? | 替代文本 |
| sortOrder | int | 排序 |

### 2.5 Document（资料文档）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| title | string | 文档标题（如 SDS5000X HD 数据手册） |
| docType | enum | datasheet / user-manual / programming-manual / quick-guide / service-manual / application-note / other |
| language | enum | zh / en / ru / other |
| version | string? | 版本号（如 CN05A） |
| filePath | string | PDF 文件路径 |
| fileSize | int? | 文件大小（字节） |
| publishDate | date? | 发布日期 |
| downloadCount | int | 下载次数（默认 0） |
| brandId | uuid? | 关联品牌（可选） |
| productLineId | uuid? | 关联系列（可选） |
| productId | uuid? | 关联产品（可选） |
| isActive | boolean | 是否启用 |
| createdAt / updatedAt | datetime | 时间戳 |

> 一个 Document 可同时关联品牌、系列、产品中的一个或多个。产品详情页展示该产品及其所属系列、品牌的所有资料。

### 2.6 Inquiry（询价线索）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| name | string | 联系人姓名 |
| company | string? | 公司名称 |
| contact | string | 联系方式（电话/微信/其他，必填） |
| email | string? | 邮箱（选填） |
| country | string? | 国家/地区 |
| productId | uuid? | 关联产品（可选，从产品详情页询价时带入） |
| productLineId | uuid? | 关联系列（可选） |
| message | text | 需求描述 |
| status | enum | pending / quoted / closed-won / closed-lost |
| notifyType | enum | in-site（站内线索，默认）/ email（邮件通知）/ both |
| adminNote | text? | 运营备注 |
| sourceIp | string? | 来源 IP（防滥用） |
| createdAt / updatedAt | datetime | 时间戳 |

> **询价通知方式**：第一版默认站内线索通知（后台可见）。邮箱 SMTP 在后台系统设置中可配置，配置后可选择邮件通知或站内+邮件双通知。验证码第一版不做，后期通过速率限制+IP 限流防垃圾提交。

### 2.7 Post（新闻/文章）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| code | string | 文章代码，用于 URL |
| coverImage | string? | 封面图 |
| category | enum | news / tech-article / case / announcement |
| isPublished | boolean | 是否发布 |
| publishedAt | datetime? | 发布时间 |
| sortOrder | int | 排序 |
| createdAt / updatedAt | datetime | 时间戳 |

**PostTranslation**：postId + locale → title、summary、content（富文本/Markdown）

### 2.8 AdminUser（运营管理员）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| username | string | 登录用户名，唯一 |
| passwordHash | string | 密码哈希（bcrypt/argon2） |
| displayName | string | 显示名称 |
| lastLoginAt | datetime? | 最后登录时间 |
| createdAt / updatedAt | datetime | 时间戳 |

> 第一版只有一个管理员账号，初始化时通过 seed 脚本创建。


### 2.9 LoginLog（管理员登录日志）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| adminId | uuid? | 关联管理员（失败登录可为空） |
| username | string | 尝试登录的用户名 |
| ip | string? | 登录 IP |
| userAgent | string? | 浏览器 UA |
| success | boolean | 是否成功 |
| message | string? | 结果说明（如密码错误/成功） |
| createdAt | datetime | 时间 |

> 记录管理员每次登录尝试，用于安全审计。

### 2.10 SiteSetting（站点设置）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | uuid | 主键 |
| key | string | 设置项 key（如 site_name、seo_title、contact_email、contact_phone） |
| value | text | 设置值 |
| locale | string? | 语言（多语言设置项） |

## 3. 索引设计

- `Product.model` 唯一索引
- `Brand.code`、`Category.code`、`ProductLine.code`、`Post.code` 唯一索引
- `Document` 按 brandId / productLineId / productId / docType / language 建复合索引
- `Inquiry.status` + `createdAt` 索引
- `Product.isActive` + `productLineId` + `sortOrder` 索引
- **参数系统索引**：
  - `ParamDefinition`：(categoryId, paramGroupId, sortOrder) —— 后台编辑和前台渲染参数模板
  - `ParamDefinition.key` + `categoryId` 联合唯一
  - `ProductParamValue`：(productId, paramDefinitionId) 联合唯一 —— 一个产品对一个参数只有一条值
  - `ProductParamValue`：(paramDefinitionId, valueNumber) —— **数值筛选核心索引**，支持"带宽 ≥ 100MHz"类查询
  - `ProductParamValue`：(paramDefinitionId, valueMin, valueMax) —— 范围参数筛选
  - `ParamGroup`：(categoryId, sortOrder)
- 所有翻译表按 `(主表Id, locale)` 联合唯一索引

## 4. 批量导入设计

导入文件格式：Excel（.xlsx）或 CSV，模板列：

| 列名 | 说明 | 必填 |
|---|---|---|
| brand_code | 品牌代码 | 是 |
| category_code | 类别代码 | 是 |
| product_line_code | 系列代码 | 是 |
| model | 产品型号 | 是 |
| name_zh / name_en | 产品名称（中/英） | 是 |
| summary_zh / summary_en | 简介（中/英） | 否 |
| param:{key} | 参数值列，列名格式为 `param:带宽` 或 `param:bandwidth`，按类别参数模板中的 key 对应；数值型直接填数字，范围型填 `10-100`，枚举型填选项值 | 否 |
| cover_image | 封面图文件名（需提前放入导入目录） | 否 |
| pdf_files | PDF 文件名列表（逗号分隔，需提前放入导入目录） | 否 |

> **参数导入说明**：Excel 中每一列对应一个参数定义的 key。导入时校验该类别下是否存在此参数定义，不存在则跳过并在报告中提示。数值型参数自动转为 valueNumber，范围型（含 `-` 或 `~`）自动拆为 valueMin/valueMax，枚举型匹配 options 中的 value。这样运营人员可以直接用 Excel 批量填参数，不需要在后台逐个产品编辑。

导入逻辑：
1. 校验品牌/类别/系列是否存在，不存在则自动创建（需提供名称）
2. 校验类别参数模板：导入文件中的 param: 列必须能在该类别的 ParamDefinition 中找到
3. 按 model upsert 产品（已存在则更新）
4. 写入 ProductParamValue（按 paramDefinitionId 关联）
5. 处理图片和 PDF 文件关联
6. 输出导入报告（成功/失败/跳过数量及原因，含参数未匹配的明细）

## 5. 后期扩展预留

- **俄语支持**：所有翻译表和 Document.language 枚举已预留 ru
- **OSS 存储**：filePath 设计为相对路径，后期可切换为 OSS URL 而不改表结构
- **采集工具**：Document 表的 sourceUrl 字段（后期添加）可记录采集来源
- **线索导出**：Inquiry 表结构完整，可直接导出 Excel
