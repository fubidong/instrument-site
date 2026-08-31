"use client";

import { useTransition } from "react";
import { deleteCategoryAction } from "./actions";

export default function DeleteCategoryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("确定删除该类别？有子类别/产品/系列/参数关联将无法删除。")) {
          startTransition(async () => {
            const fd = new FormData();
            fd.append("id", id);
            try {
              await deleteCategoryAction(fd);
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
