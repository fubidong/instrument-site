"use client";

import { useState } from "react";

/** 飞础科专属：版本型号可选中按钮组 */
export default function FotricVariantsSelector({ variants }: { variants: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="mt-5">
      <div className="mb-2 text-sm font-semibold text-slate-800">版本型号</div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-md border px-4 py-1.5 text-sm transition ${
              active === i
                ? "border-primary bg-primary text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
