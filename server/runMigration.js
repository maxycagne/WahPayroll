import pool from "./src/config/db.js";

async function runMigration() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log("🔄 Running migration: Adding mandated leave columns...");

    // Check which columns exist and add only missing ones
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'leave_requests' AND TABLE_SCHEMA = DATABASE()
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add is_mandated_leave column
    if (!existingColumns.includes('is_mandated_leave')) {
      await connection.query(`
        ALTER TABLE leave_requests 
        ADD COLUMN is_mandated_leave BOOLEAN DEFAULT FALSE COMMENT 'Flag for legally mandated leaves'
      `);
      console.log("✅ Added is_mandated_leave column");
    } else {
      console.log("ℹ️  is_mandated_leave column already exists");
    }

    // Add mandated_leave_type column
    if (!existingColumns.includes('mandated_leave_type')) {
      await connection.query(`
        ALTER TABLE leave_requests 
        ADD COLUMN mandated_leave_type VARCHAR(100) COMMENT 'Type of mandated leave'
      `);
      console.log("✅ Added mandated_leave_type column");
    } else {
      console.log("ℹ️  mandated_leave_type column already exists");
    }

    // Add effective_days_excluding_weekends column
    if (!existingColumns.includes('effective_days_excluding_weekends')) {
      await connection.query(`
        ALTER TABLE leave_requests 
        ADD COLUMN effective_days_excluding_weekends DECIMAL(5,2) COMMENT 'Auto-calculated working days'
      `);
      console.log("✅ Added effective_days_excluding_weekends column");
    } else {
      console.log("ℹ️  effective_days_excluding_weekends column already exists");
    }

    // Add eligibility_status column
    if (!existingColumns.includes('eligibility_status')) {
      await connection.query(`
        ALTER TABLE leave_requests 
        ADD COLUMN eligibility_status ENUM('Eligible', 'Ineligible', 'Pending Review') COMMENT 'Eligibility status for mandated leave'
      `);
      console.log("✅ Added eligibility_status column");
    } else {
      console.log("ℹ️  eligibility_status column already exists");
    }

    // Add eligibility_remarks column
    if (!existingColumns.includes('eligibility_remarks')) {
      await connection.query(`
        ALTER TABLE leave_requests 
        ADD COLUMN eligibility_remarks TEXT COMMENT 'Reason for ineligibility or remarks'
      `);
      console.log("✅ Added eligibility_remarks column");
    } else {
      console.log("ℹ️  eligibility_remarks column already exists");
    }

    // Add index if it doesn't exist (check from INFORMATION_SCHEMA)
    const [indexes] = await connection.query(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_NAME = 'leave_requests' AND TABLE_SCHEMA = DATABASE() 
      AND INDEX_NAME = 'idx_mandated_leaves'
    `);

    if (indexes.length === 0) {
      await connection.query(`
        ALTER TABLE leave_requests 
        ADD INDEX idx_mandated_leaves (emp_id, is_mandated_leave)
      `);
      console.log("✅ Added idx_mandated_leaves index");
    } else {
      console.log("ℹ️  idx_mandated_leaves index already exists");
    }

    console.log("\n✨ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    if (error.sql) console.error("SQL:", error.sql);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
}

runMigration();
