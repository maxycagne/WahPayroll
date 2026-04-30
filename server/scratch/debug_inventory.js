import { getFileManagementInventory } from "../src/controllers/employeeController.js";
import pool from "../src/config/db.js";

async function debug() {
  const req = {
    user: { emp_id: "admin" } // Mocking an admin user. I might need a real emp_id from the DB.
  };

  // Find a real admin/HR emp_id first
  const [admins] = await pool.query("SELECT emp_id FROM employees WHERE role IN ('Admin', 'HR') LIMIT 1");
  if (admins.length > 0) {
    req.user.emp_id = admins[0].emp_id;
  }

  const res = {
    status: function(s) {
      this.statusCode = s;
      return this;
    },
    json: function(j) {
      console.log("Status:", this.statusCode || 200);
      console.log("Response:", JSON.stringify(j, null, 2));
    }
  };

  try {
    await getFileManagementInventory(req, res);
  } catch (error) {
    console.error("Fatal Error:", error);
  } finally {
    process.exit();
  }
}

debug();
