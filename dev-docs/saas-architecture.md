# SaaS 多品牌架构改造设计（阶段 6）

## 背景
用户代理多品牌（鼎阳/普源/泰克/Chroma），要求：
1. **一个品牌一个站点**：`/siglent`、`/rigol` 路径子站
2. **品牌分类**：每个品牌自己的分类树（品牌站导航）
3. **全站品类**：综合站导航，跨品牌聚合（如示波器=多品牌都有）
4. **参数模板按品牌归类**：各品牌参数不同
5. **产品层级**：品类 → 子品类 → 系列 → 型号（4 层）
6. **呈现**：系列呈现页（类似 RIGOL 参考页）+ 系列下展示具体型号单品
7. 中英双语：`/siglent`（中文）、`/siglent/en`（英文）

## 数据模型（migration: add_brand_site_category）
- `Category` 增加：
  - `brandId String?`：null=全站品类；非空=品牌分类
  - `siteCategoryId String?`：品牌分类关联的全站品类（综合站聚合用）
- 品牌分类树：`Category.brandId=品牌, parentId=品牌内父分类, siteCategoryId=对应全站品类`

## 路由设计
- 综合站：`/[locale]`（zh/en）——现有，浏览全站品类
- 品牌站：`/[brand]/[locale?]`（/siglent、/siglent/en、/rigol）
  - `/siglent` = 鼎阳品牌站（中文默认）
  - `/siglent/en` = 英文
  - 品牌站内：品类 → 系列 → 型号
- 后台：`/admin`（现有，加品牌分类管理）

## 数据流
- 综合站（全站品类）：查 `Category.brandId=null` → 找挂该品类的所有品牌分类（siteCategoryId）→ 聚合产品
- 品牌站（品牌分类）：查 `Category.brandId=品牌` → 系列 → 型号
- 参数模板：挂品牌分类（ParamGroup/ParamDefinition.categoryId → 品牌分类 Category）

## 数据源
- 官网 `siglent-products.json`（75 系列 + 291 型号列表 + 系列参数 + 系列图）
- store.siglent.com（型号级参数 + 型号主图，跳过广告图用第 2 张）
- store API（1011 产品，型号/分类/价格）

## 图片规则
- 型号主图：store 详情页 gallery 第 2 张大图（跳过第 1 张广告）
- 系列宣传图：`{系列}-2.jpg` 或官网 CDN 图（无促销）
- 排除：`-1.jpg`、featured（多带促销文字）

## 实施步骤
1. ✅ migration：Category.brandId + siteCategoryId
2. 建鼎阳品牌分类树（SIGLENT 品牌分类挂全站品类）
3. 建品牌参数模板
4. 采集型号级数据（store API + 详情页参数/图片）
5. 重建 ProductLine（系列）→ Product（型号）分层
6. 路由重构（综合站 + 品牌站）
7. 前台页面（品牌站分类/系列呈现/型号详情）
8. 后台适配（品牌分类管理）
9. 验证 + 提交
