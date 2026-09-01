"use client";

import { useEffect, useRef, useState } from "react";
import "aieditor/dist/style.css";

/**
 * AIEditor 富文本编辑器（开源版，基于 Web Component，兼容 React/Next.js）
 * - 通过 hidden input 向 Server Action 表单提交 HTML
 * - SSR 安全：编辑器仅在客户端 mount 后初始化（动态 import）
 */
export default function RichTextEditor({
  name,
  defaultValue = "",
  minHeight = 240,
}: {
  name: string;
  defaultValue?: string;
  minHeight?: number;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const [html, setHtml] = useState(defaultValue);

  useEffect(() => {
    if (!divRef.current) return;
    let cancelled = false;

    (async () => {
      const { AiEditor } = await import("aieditor");
      if (cancelled || !divRef.current) return;
      const editor = new AiEditor({
        element: divRef.current,
        content: defaultValue || "",
        placeholder: "请输入内容...",
        lang: "zh-CN",
        theme: "light",
        onChange: () => {
          setHtml(editor.getHtml());
        },
      });
      editorRef.current = editor;
    })();

    return () => {
      cancelled = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-sky-500">
      <input type="hidden" name={name} value={html} />
      <div ref={divRef} style={{ minHeight }} />
    </div>
  );
}
