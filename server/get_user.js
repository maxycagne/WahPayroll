import pool from "./src/config/db.js";
const [rows] = await pool.query("SELECT emp_id, first_name FROM employees WHERE registration_status = 'Approved' LIMIT 1");
console.log(JSON.stringify(rows[0]));
process.exit(0);
