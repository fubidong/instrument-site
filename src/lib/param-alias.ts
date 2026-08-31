/**
 * 参数别名归一化：不同品牌/来源对同一参数的叫法可能不同，
 * 通过别名映射合并，保证对比页/筛选页按统一名称对齐。
 */

// 别名表：key = 归一化后的规范名，value = 别名数组
export const PARAM_ALIAS_GROUPS: Record<string, string[]> = {
  模拟带宽: ["模拟带宽", "带宽", "带宽范围", "analog bandwidth", "bandwidth"],
  最高实时采样率: ["最高实时采样率", "实时采样率", "实时采样率高达", "采样率", "sample rate", "real-time sample rate"],
  最大存储深度: ["最大存储深度", "存储深度", "记录长度", "storage depth", "record length"],
  最高波形捕获率: ["最高波形捕获率", "波形捕获率", "波形刷新率", "捕获率", "waveform capture rate"],
  通道数: ["通道数", "channels", "输入通道数"],
  垂直分辨率: ["垂直分辨率", "分辨率", "vertical resolution"],
  输出频率范围: ["输出频率范围", "频率范围", "输出频率", "frequency range", "output frequency range"],
  动态范围: ["动态范围", "dynamic range"],
  频率分辨率: ["频率分辨率", "frequency resolution"],
  相位噪声: ["相位噪声", "相位噪声(典型值)", "phase noise"],
  端口数: ["端口数", "ports"],
};

// 反向映射：别名 → 规范名（含英文小写）
const ALIAS_TO_CANON: Map<string, string> = new Map();
for (const [canon, aliases] of Object.entries(PARAM_ALIAS_GROUPS)) {
  for (const a of aliases) {
    ALIAS_TO_CANON.set(a.toLowerCase().trim(), canon);
  }
}

/** 归一化参数名：返回规范名；若不在别名表中则原样返回 */
export function canonicalParamName(name: string | null | undefined): string {
  if (!name) return "";
  const key = name.toLowerCase().trim();
  return ALIAS_TO_CANON.get(key) ?? name.trim();
}

/** 解析频率字符串为 MHz 数值（用于滑块范围筛选），解析失败返回 null */
export function parseFreqMHz(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = s.trim().replace(/[；;]/g, "");
  const m = t.match(/([\d.]+)\s*(GHZ|MHZ|KHz|KHZ|HZ|G|M|K)/i);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.includes("ghz") || unit === "g") return num * 1000;
  if (unit.includes("mhz") || unit === "m") return num;
  if (unit.includes("khz") || unit === "k") return num / 1000;
  if (unit.includes("hz")) return num / 1e6;
  return null;
}

/** 归一化参数值用于精确匹配：去所有空白、去尾部标点、去尾部"通道/ch/channels"、统一小写
 * 例："100 MHz" / "100MHz" / "100MHz；" → "100mhz"
 * 例："4" / "4通道" / "4 channels" → "4"
 */
export function normParamValue(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/[\s\u00A0]+/g, "")
    .replace(/[；;，,。、\u00A0]+$/g, "")
    .replace(/(通道|channels?)$/i, "")
    .toLowerCase();
}

/** 把 MHz 数值规范化为可读频率文本：150→"150 MHz"，1000→"1 GHz" */
export function formatFreq(mhz: number): string {
  const fmt = (n: number) => {
    const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
    return s;
  };
  if (mhz >= 1000) return `${fmt(mhz / 1000)} GHz`;
  return `${fmt(mhz)} MHz`;
}
