/**
 * 初始化管理员账号（幂等，可重复执行）
 * 用法：node scripts/seed-admin.mjs
 * 账号信息来自 .env 的 ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_DISPLAY_NAME
 */
import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("缺少 DATABASE_URL，请检查 .env");
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "运营管理员";

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    // 查询是否已存在
    const existing = await client.query(
      "SELECT id FROM \"AdminUser\" WHERE username = $1",
      [username]
    );

    const passwordHash = await bcrypt.hash(password, 10);

    if (existing.rows.length > 0) {
      // 已存在则更新密码与显示名（便于重置）
      await client.query(
        "UPDATE \"AdminUser\" SET \"passwordHash\" = $1, \"displayName\" = $2, \"updatedAt\" = now() WHERE id = $3",
        [passwordHash, displayName, existing.rows[0].id]
      );
      console.log(`[seed-admin] 已更新管理员 ${username}`);
    } else {
      await client.query(
        "INSERT INTO \"AdminUser\" (id, username, \"passwordHash\", \"displayName\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), $1, $2, $3, now(), now())",
        [username, passwordHash, displayName]
      );
      console.log(`[seed-admin] 已创建管理员 ${username}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[seed-admin] 失败:", err.message);
  process.exit(1);
});
