"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // 防止点击工具栏时编辑器失焦丢失选区
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs font-medium transition ${
        active
          ? "bg-sky-100 text-sky-700"
          : "text-slate-600 hover:bg-slate-200/70"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-slate-300" />;
}

/**
 * TipTap 富文本编辑器（v3）
 * - 通过 hidden input 向 Server Action 表单提交 HTML
 * - 工具栏：加粗/斜体/删除线、H2/H3、列表/引用、链接/图片、清除格式
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
  const [mounted, setMounted] = useState(false);
  const [html, setHtml] = useState(defaultValue);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
    ],
    content: defaultValue || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rich-text px-4 py-3 text-sm focus:outline-none",
      },
    },
  });

  if (!mounted) {
    return (
      <div
        className="animate-pulse rounded-md border border-slate-200 bg-slate-50"
        style={{ minHeight }}
      />
    );
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImage() {
    if (!editor) return;
    const url = window.prompt("图片地址（URL，可从素材库复制）");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white focus-within:border-sky-500">
      <input type="hidden" name={name} value={html} />
      {editor && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="加粗"
          >
            <b>B</b>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="斜体"
          >
            <i>I</i>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="删除线"
          >
            <s>S</s>
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="二级标题"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="三级标题"
          >
            H3
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="无序列表"
          >
            •≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="有序列表"
          >
            1≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="引用"
          >
            ❝
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={setLink}
            active={editor.isActive("link")}
            title="插入链接"
          >
            🔗
          </ToolbarButton>
          <ToolbarButton
            onClick={addImage}
            active={editor.isActive("image")}
            title="插入图片（URL）"
          >
            🖼
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="清除格式"
          >
            ✕
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} className="rich-text-editor-body" />
      <style jsx global>{`
        .rich-text-editor-body .ProseMirror {
          min-height: ${minHeight}px;
          outline: none;
        }
        .rich-text-editor-body .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgb(148 163 184);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
