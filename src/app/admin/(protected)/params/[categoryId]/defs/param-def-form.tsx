"use client";

import { useActionState, useState } from "react";
import { saveParamDefAction, type ParamDefState } from "./actions";

const initialState: ParamDefState = {};

type GroupOption = { id: string; code: string; zhName: string; enName: string };
type ParamDef = {
  id: string;
  key: string;
  type: string;
  unit: string | null;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  isHighlight: boolean;
  sortOrder: number;
  options: string | null;
  minValue: number | null;
  maxValue: number | null;
  step: number | null;
  precision: number | null;
  paramGroupId: string;
  translations: { locale: string; name: string; unit: string | null; description: string | null }[];
};

const TYPE_LABELS: Record<string, string> = {
  number: "数值",
  range: "数值范围",
  enum: "枚举选项",
  boolean: "是/否",
  string: "文本",
};

export default function ParamDefForm({
  categoryId,
  groups,
  def,
  onDone,
}: {
  categoryId: string;
  groups: GroupOption[];
  def: ParamDef | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveParamDefAction, initialState);
  const [type, setType] = useState(def?.type ?? "number");
  const [optionsText, setOptionsText] = useState(def?.options ?? "");

  const t = Object.fromEntries(
    (def?.translations ?? []).map((tr) => [tr.locale, tr])
  );

  function toggleEnumOption(value: string) {
    let parsed: any[] = [];
    try {
      parsed = optionsText ? JSON.parse(optionsText) : [];
    } catch {}
    if (!Array.isArray(parsed)) parsed = [];
    if (parsed.some((o) => o.value === value)) {
      setOptionsText(JSON.stringify(parsed.filter((o) => o.value !== value)));
    } else {
      setOptionsText(JSON.stringify([...parsed, { value, label_zh: value, label_en: value }]));
    }
  }

  function currentEnumValues(): string[] {
    try {
      const parsed = optionsText ? JSON.parse(optionsText) : [];
      return Array.isArray(parsed) ? parsed.map((o: any) => o.value) : [];
    } catch {
      return [];
    }
  }

  const checkbox =
    "h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={def?.id ?? ""} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="options" value={optionsText} />
      {def && <input type="hidden" name="key" value={def.key} />}

      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state.success && <div className="text-sm text-green-600">{state.success}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            参数代码 <span className="text-red-500">*</span>
          </label>
          <input
            name="key"
            defaultValue={def?.key ?? ""}
            required
            disabled={!!def}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:bg-slate-50"
            placeholder="如 bandwidth"
          />
          <p className="mt-1 text-xs text-slate-400">同类目下唯一，用于筛选 URL 参数</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            所属分组 <span className="text-red-500">*</span>
          </label>
          <select
            name="paramGroupId"
            defaultValue={def?.paramGroupId ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          >
            <option value="">选择分组</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.zhName} ({g.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            参数类型 <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          >
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l} ({v})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">排序</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={def?.sortOrder ?? 0}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            中文名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name_zh"
            defaultValue={t["zh"]?.name ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="如 带宽"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            English Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name_en"
            defaultValue={t["en"]?.name ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="e.g. Bandwidth"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">单位（中文）</label>
          <input
            name="unit_zh"
            defaultValue={t["zh"]?.unit ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="如 MHz"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Unit (EN)</label>
          <input
            name="unit_en"
            defaultValue={t["en"]?.unit ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            placeholder="e.g. MHz"
          />
        </div>
      </div>

      {/* 按类型的附加字段 */}
      {(type === "number" || type === "range") && (
        <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">最小值</label>
            <input
              name="minValue"
              type="number"
              step="any"
              defaultValue={def?.minValue ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">最大值</label>
            <input
              name="maxValue"
              type="number"
              step="any"
              defaultValue={def?.maxValue ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">步进</label>
            <input
              name="step"
              type="number"
              step="any"
              defaultValue={def?.step ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">精度（小数位）</label>
            <input
              name="precision"
              type="number"
              defaultValue={def?.precision ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {type === "enum" && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            枚举选项
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {currentEnumValues().map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleEnumOption(v)}
                className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700 hover:bg-sky-200"
                title="点击移除"
              >
                {v} ✕
              </button>
            ))}
          </div>
          <EnumQuickAdd onAdd={toggleEnumOption} />
          <p className="mt-2 text-xs text-slate-400">
            选项存为 JSON：{"[{\"value\":\"1\",\"label_zh\":\"1通道\",\"label_en\":\"1ch\"}]"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isFilterable" defaultChecked={def?.isFilterable} className={checkbox} />
          可筛选（前台选型筛选用）
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isComparable" defaultChecked={def?.isComparable} className={checkbox} />
          可对比（产品对比显示）
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isRequired" defaultChecked={def?.isRequired} className={checkbox} />
          必填（录入产品时必须填）
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isHighlight" defaultChecked={def?.isHighlight} className={checkbox} />
          卖点高亮（详情页突出显示）
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {pending ? "保存中..." : def ? "保存修改" : "创建参数"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function EnumQuickAdd({ onAdd }: { onAdd: (v: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
        placeholder="输入选项值，如 4"
      />
      <button
        type="button"
        onClick={() => {
          if (val.trim()) {
            onAdd(val.trim());
            setVal("");
          }
        }}
        className="rounded bg-slate-700 px-3 py-1.5 text-xs text-white hover:bg-slate-600"
      >
        添加
      </button>
    </div>
  );
}
