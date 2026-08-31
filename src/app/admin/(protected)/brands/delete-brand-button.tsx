"use client";

import { useTransition } from "react";
import { deleteBrandAction } from "./actions";

export default function DeleteBrandButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("确定删除该品牌？有关联数据（产品/系列/类别/资料）将无法删除。")) {
          startTransition(async () => {
            const fd = new FormData();
            fd.append("id", id);
            try {
              await deleteBrandAction(fd);
            } catch (e: any) {
              alert(e.message || "删除失败");
            }
          });
        }
      }}
      className="text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "删除中..." : "删除"}
    </button>
  );
}
