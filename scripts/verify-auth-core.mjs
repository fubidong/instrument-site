/**
 * 阶段1 认证核心逻辑验证：
 * 1. 数据库中的 admin 密码哈希可用 bcryptjs 验证
 * 2. iron-session 封存/解封 正常
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 1. 密码验证
const r = await pool.query(
  'SELECT "passwordHash" FROM "AdminUser" WHERE username = $1',
  [process.env.ADMIN_USERNAME || "admin"]
);
if (r.rows.length === 0) {
  console.error("FAIL: admin user not found");
  process.exit(1);
}
const ok = await bcrypt.compare(process.env.ADMIN_PASSWORD, r.rows[0].passwordHash);
console.log("[1] bcrypt 密码匹配:", ok ? "PASS" : "FAIL");
if (!ok) process.exit(1);

// 2. iron-session 封存/解封
import { sealData, unsealData } from "iron-session";
const password = process.env.SESSION_SECRET;
const sealed = await sealData(
  { userId: "test", username: "admin", isLoggedIn: true },
  { password }
);
const unsealed = await unsealData(sealed, { password });
console.log(
  "[2] iron-session 封存/解封:",
  unsealed.isLoggedIn === true ? "PASS" : "FAIL"
);

await pool.end();
console.log("\n核心逻辑验证完成");
