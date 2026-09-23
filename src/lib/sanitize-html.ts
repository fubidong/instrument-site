/**
 * 富文本 HTML 的 CSS 隔离工具。
 *
 * 抽取自 src/components/product-detail-tabs.tsx 的 sanitizeEmbeddedCss / stripGlobalCssRules，
 * 供前台支持中心详情页等所有 dangerouslySetInnerHTML 渲染处复用。
 *
 * 目的：采集/粘贴进来的官网正文常带 style 块，其中裸标签全局规则
 * （html、body、root、通配符、a、ul、li、nav、div、p、h1-h6 等）会污染整站
 * （如把根字号放大、overflow 错乱）。这里剥离 style 里作用于全局的选择器块，
 * 仅保留依赖类/ID/属性选择器的官网区块样式。
 */

/** 剥离 html 字符串内嵌 <style> 中的全局裸标签规则，返回安全后的 HTML。 */
export function sanitizeEmbeddedCss(html: string): string {
  return html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    const cleaned = stripGlobalCssRules(css);
    return cleaned ? `<style>${cleaned}</style>` : "";
  });
}

/** 剥离一段 CSS 文本中的全局裸标签规则（保留 @media/@supports/@font-face 外壳并递归清洗其内部）。 */
export function stripGlobalCssRules(css: string): string {
  // 统一移除注释（CSS 注释不影响语义），避免注释并入选择器文本污染全局规则判断
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return stripInner(noComments).trim();
}

function stripInner(css: string): string {
  let out = "";
  let i = 0;
  const n = css.length;
  while (i < n) {
    const ob = css.indexOf("{", i);
    if (ob < 0) {
      out += css.slice(i);
      break;
    }
    const sel = css.slice(i, ob);
    // 找匹配的 }（CSS 扁平无嵌套，但安全起见计数）
    let depth = 1;
    let j = ob + 1;
    while (j < n && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const block = css.slice(ob, j);
    const s = sel.trim();
    // 媒体查询/容器查询/字体声明：递归剥离内部全局规则，保留外壳
    const isAtRule = /^@media/i.test(s) || /^@supports/i.test(s) || /^@font-face/i.test(s);
    if (isAtRule) {
      const inner = block.slice(1, -1);
      const cleanedInner = stripInner(inner);
      if (cleanedInner.trim()) out += sel + "{" + cleanedInner + "}";
      i = j;
      continue;
    }
    // 取最后一个 ; 或 } 之后的部分作为真正选择器（绕开 @charset/@import 等以;结尾的语句）
    const selTail = s.split(/[};]/).pop().trim();
    // 泄漏面：所有不含 . # [ 的选择器（裸标签/标签组/伪类）都会经 dangerouslySetInnerHTML
    // 污染整站（a/ul/li/header/nav/div/p/table/td/h1-h6/button 等），一律剥离；
    // 仅保留依赖类/ID/属性选择器的官网区块样式（.sect04/.sect05/.prod_det1 等）
    const isGlobal = !/[.#\[]/.test(selTail);
    if (!isGlobal) out += sel + block;
    i = j;
  }
  return out;
}
