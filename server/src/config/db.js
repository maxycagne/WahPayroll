import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const connectionString = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;

const pool = connectionString 
  ? mysql.createPool(connectionString)
  : mysql.createPool({
      host: process.env.MYSQLHOST || "localhost",
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "",
      database: process.env.MYSQLDATABASE || "wahpayroll",
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
