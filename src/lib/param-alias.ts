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
