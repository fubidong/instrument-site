import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getAdminOrNull } from "@/lib/auth";

const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
const ALLOWED_DOC_EXT = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  // 需要管理员登录
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = (formData.get("kind") as string) || "image"; // image | doc

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "未找到文件" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const allowedExts =
    kind === "doc" ? ALLOWED_DOC_EXT : ALLOWED_IMAGE_EXT;
  const maxSize = kind === "doc" ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;

  if (!allowedExts.includes(ext)) {
    return NextResponse.json(
      {
        error: `不支持的文件类型 ${ext}，允许：${allowedExts.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `文件过大，最大 ${maxSize / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  // 保存路径：public/uploads/{kind}/{yyyyMM}/{random}{ext}
  const now = new Date();
  const monthDir = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dir = path.join(process.cwd(), "public", "uploads", kind, monthDir);
  await mkdir(dir, { recursive: true });

  const randomName = crypto.randomBytes(16).toString("hex");
  const filename = `${randomName}${ext}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const publicPath = `/uploads/${kind}/${monthDir}/${filename}`;

  return NextResponse.json({
    url: publicPath,
    name: file.name,
    size: file.size,
  });
}
