import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { db } from "../src/lib/db";

const BASE = "https://www.fotric.cn";

const LINKS: { id: number; name: string; url: string }[] = [
  { id: 147, name: "FOTRIC MT35", url: "https://www.fotric.cn/products/147" },
  { id: 55, name: "FOTRIC 340+系列", url: "https://www.fotric.cn/products/55" },
  { id: 84, name: "FOTRIC 360+系列", url: "https://www.fotric.cn/products/84" },
  { id: 44, name: "FOTRIC 320Q系列", url: "https://www.fotric.cn/products/44" },
  { id: 54, name: "FOTRIC 320+系列", url: "https://www.fotric.cn/products/54" },
  { id: 92, name: "FOTRIC 340L系列", url: "https://www.fotric.cn/products/92" },
  { id: 93, name: "FOTRIC 320L系列", url: "https://www.fotric.cn/products/93" },
  { id: 143, name: "FOTRIC MT46", url: "https://www.fotric.cn/products/143" },
  { id: 45, name: "FOTRIC 310系列", url: "https://www.fotric.cn/products/45" },
  { id: 135, name: "FOTRIC MT60", url: "https://www.fotric.cn/products/135" },
  { id: 4, name: "FOTRIC 360系列", url: "https://www.fotric.cn/products/4" },
  { id: 96, name: "FOTRIC 323Pro+", url: "https://www.fotric.cn/products/96" },
  { id: 103, name: "FOTRIC 348", url: "https://www.fotric.cn/products/103" },
  { id: 133, name: "FOTRIC 326WIR", url: "https://www.fotric.cn/products/133" },
  { id: 58, name: "FOTRIC 599", url: "https://www.fotric.cn/products/58" },
  { id: 59, name: "FOTRIC 345GT", url: "https://www.fotric.cn/products/59" },
  { id: 60, name: "FOTRIC 556", url: "https://www.fotric.cn/products/60" },
  { id: 67, name: "FOTRIC 521", url: "https://www.fotric.cn/products/67" },
  { id: 78, name: "FOTRIC 326C+", url: "https://www.fotric.cn/products/78" },
  { id: 38, name: "FOTRIC 600C系列", url: "https://www.fotric.cn/products/38" },
  { id: 100, name: "FOTRIC 130D系列", url: "https://www.fotric.cn/products/100" },
  { id: 102, name: "FOTRIC 600DQ系列", url: "https://www.fotric.cn/products/102" },
  { id: 109, name: "FOTRIC 600EXS系列", url: "https://www.fotric.cn/products/109" },
  { id: 123, name: "FOTRIC 130S-Ex系列", url: "https://www.fotric.cn/products/123" },
  { id: 124, name: "FOTRIC 130D-Ex系列", url: "https://www.fotric.cn/products/124" },
  { id: 77, name: "FOTRIC EXC8防爆单仓热成像", url: "https://www.fotric.cn/products/77" },
  { id: 70, name: "FOTRIC 600W系列", url: "https://www.fotric.cn/products/70" },
  { id: 76, name: "FOTRIC 427防爆双仓热成像", url: "https://www.fotric.cn/products/76" },
  { id: 99, name: "FOTRIC 130S系列", url: "https://www.fotric.cn/products/99" },
  { id: 80, name: "FOTRIC 600DE系列", url: "https://www.fotric.cn/products/80" },
  { id: 79, name: "FOTRIC 600D系列", url: "https://www.fotric.cn/products/79" },
  { id: 82, name: "FOTRIC 600SE系列", url: "https://www.fotric.cn/products/82" },
  { id: 81, name: "FOTRIC 600S系列", url: "https://www.fotric.cn/products/81" },
  { id: 145, name: "FOTRIC AC53声像仪", url: "https://www.fotric.cn/products/145" },
  { id: 136, name: "FOTRIC AC68、AC67+", url: "https://www.fotric.cn/products/136" },
  { id: 138, name: "FOTRIC AC62 Sense", url: "https://www.fotric.cn/products/138" },
  { id: 114, name: "FOTRIC AC60系列", url: "https://www.fotric.cn/products/114" },
  { id: 125, name: "FOTRIC AC67Flex", url: "https://www.fotric.cn/products/125" },
  { id: 129, name: "FOTRIC AC65Mini", url: "https://www.fotric.cn/products/129" },
  { id: 119, name: "FOTRIC AC80-Ex 系列", url: "https://www.fotric.cn/products/119" },
  { id: 98, name: "FOTRIC AC80-Ex系列", url: "https://www.fotric.cn/products/98" },
  { id: 90, name: "FOTRIC AC60系列", url: "https://www.fotric.cn/products/90" },
  { id: 106, name: "FOTRIC 360MiX系列", url: "https://www.fotric.cn/products/106" },
  { id: 111, name: "FOTRIC 340MiX系列", url: "https://www.fotric.cn/products/111" },
  { id: 47, name: "FOTRIC 460系列", url: "https://www.fotric.cn/products/47" },
  { id: 42, name: "FOTRIC 455", url: "https://www.fotric.cn/products/42" },
  { id: 139, name: "FOTRIC 455X+", url: "https://www.fotric.cn/products/139" },
  { id: 46, name: "FOTRIC 476机器人", url: "https://www.fotric.cn/products/46" },
  { id: 146, name: "FOTRIC 1537", url: "https://www.fotric.cn/products/146" },
  { id: 148, name: "FOTRIC 113", url: "https://www.fotric.cn/products/148" },
  { id: 83, name: "FOTRIC 280+系列", url: "https://www.fotric.cn/products/83" },
  { id: 21, name: "FOTRIC 280系列", url: "https://www.fotric.cn/products/21" },
  { id: 75, name: "FOTRIC 240M", url: "https://www.fotric.cn/products/75" },
  { id: 23, name: "FOTRIC 220S系列", url: "https://www.fotric.cn/products/23" },
  { id: 108, name: "FOTRIC 280MiX系列", url: "https://www.fotric.cn/products/108" },
  { id: 122, name: "FOTRIC 860-Ex系列", url: "https://www.fotric.cn/products/122" },
  { id: 72, name: "FOTRIC 850-Ex系列", url: "https://www.fotric.cn/products/72" },
  { id: 69, name: "FOTRIC 840-Ex系列", url: "https://www.fotric.cn/products/69" },
  { id: 121, name: "FOTRIC 860MiX-Ex系列", url: "https://www.fotric.cn/products/121" },
  { id: 120, name: "FOTRIC 850MiX-Ex系列", url: "https://www.fotric.cn/products/120" },
  { id: 118, name: "FOTRIC YRH1450系列", url: "https://www.fotric.cn/products/118" },
  { id: 117, name: "FOTRIC YRH700系列", url: "https://www.fotric.cn/products/117" },
  { id: 49, name: "FOTRIC 330+系列", url: "https://www.fotric.cn/products/49" },
  { id: 88, name: "FOTRIC 350+系列", url: "https://www.fotric.cn/products/88" },
  { id: 94, name: "FOTRIC 330L系列", url: "https://www.fotric.cn/products/94" },
  { id: 52, name: "FOTRIC 330Q系列", url: "https://www.fotric.cn/products/52" },
  { id: 53, name: "FOTRIC 330QA系列", url: "https://www.fotric.cn/products/53" },
  { id: 50, name: "FOTRIC 330M+系列", url: "https://www.fotric.cn/products/50" },
  { id: 15, name: "FOTRIC 350系列", url: "https://www.fotric.cn/products/15" },
  { id: 105, name: "FOTRIC 350MiX系列", url: "https://www.fotric.cn/products/105" },
  { id: 110, name: "FOTRIC 330MiX系列", url: "https://www.fotric.cn/products/110" },
  { id: 127, name: "FOTRIC 458Flex", url: "https://www.fotric.cn/products/127" },
  { id: 131, name: "FOTRIC 456Mini", url: "https://www.fotric.cn/products/131" },
  { id: 91, name: "FOTRIC 456声像仪", url: "https://www.fotric.cn/products/91" },
  { id: 113, name: "FOTRIC 450Pro系列", url: "https://www.fotric.cn/products/113" },
  { id: 140, name: "FOTRIC 487", url: "https://www.fotric.cn/products/140" },
  { id: 107, name: "FOTRIC 860MiX系列", url: "https://www.fotric.cn/products/107" },
  { id: 112, name: "FOTRIC 850MiX系列", url: "https://www.fotric.cn/products/112" },
  { id: 141, name: "FOTRIC Unic78MiX系列", url: "https://www.fotric.cn/products/141" },
  { id: 63, name: "FOTRIC 850系列", url: "https://www.fotric.cn/products/63" },
  { id: 86, name: "FOTRIC 860系列", url: "https://www.fotric.cn/products/86" },
  { id: 95, name: "FOTRIC 850L系列", url: "https://www.fotric.cn/products/95" },
  { id: 64, name: "FOTRIC 840系列", url: "https://www.fotric.cn/products/64" },
  { id: 126, name: "FOTRIC AC87Flex", url: "https://www.fotric.cn/products/126" },
  { id: 130, name: "FOTRIC AC85Mini", url: "https://www.fotric.cn/products/130" },
  { id: 115, name: "FOTRIC AC80系列", url: "https://www.fotric.cn/products/115" },
];

function cleanAttrs($: cheerio.CheerioAPI) {
  // 移除 Vue 的 data-v-xxx 属性和其他无用属性
  $("*").each((_, el) => {
    const attribs = $(el).attr() || {};
    for (const key of Object.keys(attribs)) {
      if (key.startsWith("data-v-") || key === "data-v") {
        $(el).removeAttr(key);
      }
    }
  });
}

function fixImgPaths($: cheerio.CheerioAPI) {
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("http") && !src.startsWith("/uploads")) {
      $(el).attr("src", BASE + src);
    }
  });
}

function extractProduct(html: string) {
  const $ = cheerio.load(html);

  // 1. 主图
  let mainImg = "";
  const firstImg = $(".showpicture img, .slide_container img").first();
  if (firstImg.length) mainImg = firstImg.attr("src") || "";

  // 2. 产品简介（summary）：从 .shareContent 提取
  let summary = $(".info_container .shareContent").first().text().trim();

  // 3. 产品介绍（description）：只取 .slots 里的富文本内容
  let detailHtml = "";
  const $slots = $(".slots .w100.content");
  if ($slots.length > 0) {
    // 合并所有 content 块
    const htmls: string[] = [];
    $slots.each((_, el) => {
      htmls.push($.html(el) || "");
    });
    detailHtml = htmls.join("\n");
  }

  // 清理产品介绍
  const $d = cheerio.load("<div id='root'>" + detailHtml + "</div>");
  $d("#root .el-button, #root .el-divider, #root .dialog, #root .el-dialog__wrapper, #root .swiper-notification, #root .swiper-button-prev, #root .swiper-button-next, #root .swiper-pagination").remove();
  $d("#root [style*='display:none']").remove();
  cleanAttrs($d);
  fixImgPaths($d);
  detailHtml = $d("#root").html() || "";

  // 4. 技术参数（specsOverview）：只取 .params_part .params-table
  let paramsHtml = "";
  const $paramsTable = $(".params_part .params-table");
  if ($paramsTable.length) {
    const $p = cheerio.load("<div id='proot'>" + ($.html($paramsTable) || "") + "</div>");
    // 不删除 display:none 的行，只移除 inline style，让所有参数都显示
    $p("#proot [style*='display']").removeAttr("style");
    $p("#proot .params-row, #proot .params-group").removeAttr("style");
    cleanAttrs($p);
    paramsHtml = $p("#proot").html() || "";
  }

  return { mainImg, summary, detailHtml, paramsHtml };
}

async function downloadImg(url: string, name: string): Promise<string> {
  if (!url) return "";
  const full = url.startsWith("http") ? url : BASE + url;
  const dir = path.join(process.cwd(), "public/uploads/products/fotric");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safe = name.replace(/[^a-zA-Z0-9]+/g, "_");
  const local = `/uploads/products/fotric/FOTRIC_${safe}.png`;
  const disk = path.join(process.cwd(), "public" + local);
  try {
    const r = await fetch(full);
    if (!r.ok) return "";
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(disk, buf);
    return local;
  } catch { return ""; }
}

async function main() {
  const brand = await db.brand.findUnique({ where: { code: "FOTRIC" } });
  if (!brand) throw new Error("no brand");
  console.log("total links:", LINKS.length);
  let ok = 0, fail = 0;
  for (const item of LINKS) {
    try {
      const r = await fetch(item.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await r.text();
      const p = extractProduct(html);
      const localImg = p.mainImg ? await downloadImg(p.mainImg, item.name) : "";
      let prod = await db.product.findFirst({ where: { brandId: brand.id, model: item.name } });
      if (!prod) {
        const cat = await db.category.findFirst({ where: { brandId: brand.id } });
        if (!cat) throw new Error("no category");
        const pl = await db.productLine.create({ data: { code: 'PL_' + item.id + '_' + Date.now(), brand: { connect: { id: brand.id } }, category: { connect: { id: cat.id } }, translations: { create: { locale: 'zh', name: item.name } } } });
        prod = await db.product.create({ data: { model: item.name, isActive: true, brand: { connect: { id: brand.id } }, productLine: { connect: { id: pl.id } }, category: { connect: { id: cat.id } } } });
      }
      if (localImg) await db.product.update({ where: { id: prod.id }, data: { coverImage: localImg } });
      let tr = await db.productTranslation.findFirst({ where: { productId: prod.id, locale: "zh" } });
      if (tr) {
        await db.productTranslation.update({
          where: { id: tr.id },
          data: {
            description: p.detailHtml,
            specsOverview: p.paramsHtml || tr.specsOverview,
            summary: p.summary || tr.summary,
          },
        });
      } else {
        await db.productTranslation.create({
          data: { productId: prod.id, locale: "zh", name: item.name, description: p.detailHtml, specsOverview: p.paramsHtml, summary: p.summary },
        });
      }
      ok++;
      console.log(`✓ ${item.name} img=${localImg ? "Y" : "N"} desc=${p.detailHtml.length} spec=${p.paramsHtml.length} sum="${p.summary.substring(0, 30)}"`);
    } catch (e) {
      fail++;
      console.log(`✗ ${item.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log(`done ok=${ok} fail=${fail}`);
  process.exit(0);
}
main();
