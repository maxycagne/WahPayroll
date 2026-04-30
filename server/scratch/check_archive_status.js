import pool from "../src/config/db.js";

async function check() {
  try {
    const [resignations] = await pool.query("SELECT id, is_archived FROM resignations");
    console.log("Resignations:", resignations);
    
    const [leaves] = await pool.query("SELECT id, is_archived FROM leave_requests WHERE documents IS NOT NULL");
    console.log("Leaves:", leaves);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

check();
