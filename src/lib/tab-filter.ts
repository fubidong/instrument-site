// 按系列/型号过滤品类选项卡内容（探头/升级与配件/智能解谱/测试案例等按系列或型号分区的富文本）
// content 中每个分区形如 <h4 ... data-series="MSO5000">MSO5000</h4>...表格...
// 只保留与当前产品系列（或型号）匹配的分区（+前导说明文字），其余丢弃。
// 优先匹配型号（data-series=model），其次匹配系列 code。
export function filterTabContentBySeries(html: string, seriesCode: string, model?: string): string {
  if (!html) return "";
  const first = html.search(/<h4[^>]*data-series=/);
  if (first < 0) return html; // 无系列分区，原样返回（普通自定义选项卡）
  const lead = first > 0 ? html.slice(0, first) : "";
  const re = /<h4([^>]*)data-series="([^"]*)"([^>]*)>([\s\S]*?)<\/h4>([\s\S]*?)(?=<h4[^>]*data-series=|$)/g;
  let m: RegExpExecArray | null;
  let hit: string | null = null;
  while ((m = re.exec(html))) {
    if (m[2] === seriesCode || (model && m[2] === model)) hit = m[0];
  }
  if (!hit) return ""; // 无匹配分区 → 空内容，触发前端空态提示
  return (lead || "") + hit;
}
