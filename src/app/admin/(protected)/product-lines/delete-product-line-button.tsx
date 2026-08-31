"use client";

import { useTransition } from "react";
import { deleteProductLineAction } from "./actions";

export default function DeleteProductLineButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("确定删除该系列？有产品/资料关联将无法删除。")) {
          startTransition(async () => {
            const fd = new FormData();
            fd.append("id", id);
            try {
              await deleteProductLineAction(fd);
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
