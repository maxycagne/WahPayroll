import pool from "../config/db.js";

// --- EMPLOYEES ---
export const getAllEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM employees");
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAllEmployees:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

export const createEmployee = async (req, res) => {
  // 1. Add middle_initial to the destructured body
  const {
    emp_id,
    first_name,
    last_name,
    middle_initial,
    designation,
    position,
    status,
    email,
    dob,
    hired_date,
  } = req.body;
  try {
    await pool.query(
      // 2. Add middle_initial to the INSERT statement and add an extra '?'
      `INSERT INTO employees (emp_id, first_name, last_name, middle_initial, designation, position, status, email, dob, hired_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      // 3. Add middle_initial to the array of values being saved
      [
        emp_id,
        first_name,
        last_name,
        middle_initial || null,
        designation,
        position,
        status,
        email,
        dob || null,
        hired_date || null,
      ],
    );

    // Automatically create leave balance based on status
    const defaultLeaves = status === "Job Order" ? 12 : 27;
    await pool.query(
      `INSERT INTO leave_balances (emp_id, leave_balance) VALUES (?, ?)`,
      [emp_id, defaultLeaves],
    );

    res.status(201).json({ message: "Employee added successfully" });
  } catch (error) {
    console.error("DB Error in createEmployee:", error);
    res.status(500).json({ message: "Error adding employee" });
  }
};
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    // This deletes the employee. If your DB has ON DELETE CASCADE set up,
    // it will automatically delete their attendance and leaves too.
    const [result] = await pool.query(
      "DELETE FROM employees WHERE emp_id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("DB Error in deleteEmployee:", error);
    res.status(500).json({ message: "Error deleting employee" });
  }
};

// --- DASHBOARD ---
export const getDashboardSummary = async (req, res) => {
  try {
    const [pending] = await pool.query(
      "SELECT l.*, e.first_name, e.last_name FROM leave_requests l JOIN employees e ON l.emp_id = e.emp_id WHERE l.status = 'Pending'",
    );
    const [onLeave] = await pool.query(
      "SELECT e.first_name, e.last_name, l.leave_type FROM employees e JOIN leave_requests l ON e.emp_id = l.emp_id WHERE CURDATE() BETWEEN l.date_from AND l.date_to AND l.status = 'Approved'",
    );
    const [absents] = await pool.query(
      "SELECT first_name, last_name FROM employees WHERE emp_id NOT IN (SELECT emp_id FROM attendance WHERE date = CURDATE())",
    );
    const [balances] = await pool.query(
      "SELECT e.first_name, e.last_name, lb.leave_balance, lb.offset_credits FROM employees e JOIN leave_balances lb ON e.emp_id = lb.emp_id",
    );

    res.json({
      pendingLeaves: pending,
      onLeave: onLeave,
      absents: absents,
      balances: balances,
      recentActivities: [],
    });
  } catch (error) {
    console.error("DB Error in getDashboardSummary:", error);
    res.status(500).json({ message: "Error loading dashboard" });
  }
};

// --- LEAVES & ATTENDANCE ---
export const getAttendance = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.emp_id, 
        e.first_name, 
        e.last_name, 
        e.status AS emp_status, 
        (SELECT COUNT(*) FROM attendance WHERE emp_id = e.emp_id AND status = 'Absent') as total_absences,
        a.status, 
        lb.leave_balance
      FROM employees e
      LEFT JOIN attendance a ON e.emp_id = a.emp_id AND a.date = CURDATE()
      LEFT JOIN leave_balances lb ON e.emp_id = lb.emp_id
    `);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAttendance:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

// --- Update Base Salary by Position ---
export const updateBaseSalary = async (req, res) => {
  const { position, amount } = req.body;

  if (!position || !amount) {
    return res
      .status(400)
      .json({ message: "Position and amount are required." });
  }

  try {
    // Update the basic pay for EVERY employee that has this specific position
    const [result] = await pool.query(
      "UPDATE employees SET basic_pay = ? WHERE position = ?",
      [amount, position],
    );

    res.json({
      message: "Base salaries updated successfully",
      employeesAffected: result.affectedRows,
    });
  } catch (error) {
    console.error("DB Error in updateBaseSalary:", error);
    res.status(500).json({ message: "Error updating base salaries" });
  }
};

// New function for Admins to manually adjust leave balances
export const adjustLeaveBalance = async (req, res) => {
  const { id } = req.params;
  const { adjustment } = req.body;
  try {
    await pool.query(
      "UPDATE leave_balances SET leave_balance = leave_balance + ? WHERE emp_id = ?",
      [adjustment, id],
    );
    res.json({ message: "Leave balance adjusted successfully" });
  } catch (error) {
    console.error("DB Error in adjustLeaveBalance:", error);
    res.status(500).json({ message: "Error adjusting leave balance" });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, e.first_name, e.last_name 
      FROM leave_requests l 
      JOIN employees e ON l.emp_id = e.emp_id
      ORDER BY l.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAllLeaves:", error);
    res.status(500).json({ message: "Error fetching leaves" });
  }
};

export const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE leave_requests SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ message: `Leave ${status}` });
  } catch (error) {
    console.error("DB Error in updateLeaveStatus:", error);
    res.status(500).json({ message: "Error updating leave" });
  }
};

// --- PAYROLL ---
// --- PAYROLL ---
export const getAllPayroll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, e.first_name, e.last_name, e.designation, e.position 
      FROM payroll p 
      JOIN employees e ON p.emp_id = e.emp_id
    `);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAllPayroll:", error);
    res.status(500).json({ message: "Error fetching payroll" });
  }
};

export const applySalaryAdjustment = async (req, res) => {
  const { emp_ids, type, amount, description, date } = req.body;
  try {
    // Loop through each selected employee ID and save the record
    for (const emp_id of emp_ids) {
      await pool.query(
        `INSERT INTO salary_history (emp_id, effective_date, type, amount, description, remarks) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          emp_id,
          date,
          type,
          amount,
          description,
          "Added via Payroll Bulk Adjustment",
        ],
      );
    }
    res.json({ message: "Adjustments applied successfully" });
  } catch (error) {
    console.error("DB Error in applySalaryAdjustment:", error);
    res.status(500).json({ message: "Error applying adjustment" });
  }
};
// --- SALARY HISTORY ---
export const getSalaryHistory = async (req, res) => {
  const { emp_id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM salary_history WHERE emp_id = ? ORDER BY effective_date DESC",
      [emp_id],
    );
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getSalaryHistory:", error);
    res.status(500).json({ message: "Error fetching salary history" });
  }
};

export const fileLeave = async (req, res) => {
  const {
    emp_id,
    leave_type,
    date_from,
    date_to,
    priority,
    supervisor_remarks,
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO leave_requests (emp_id, leave_type, date_from, date_to, priority, status, supervisor_remarks) 
       VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        emp_id,
        leave_type,
        date_from,
        date_to,
        priority,
        supervisor_remarks || null,
      ],
    );
    res
      .status(201)
      .json({ message: "Leave application submitted successfully" });
  } catch (error) {
    console.error("DB Error in fileLeave:", error);
    res.status(500).json({ message: "Error submitting leave application" });
  }
};
