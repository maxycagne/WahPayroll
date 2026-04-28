import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const pool = isProd
  ? mysql.createPool(process.env.MYSQL_PUBLIC_URL)
  : mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "wahpayroll",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

// optional: test connection
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(
      isProd
        ? "✅ MySQL connected (production)"
        : "✅ MySQL connected (development)",
    );
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);

    // fail fast in production
    if (isProd) process.exit(1);
  }
})();

export default pool;
