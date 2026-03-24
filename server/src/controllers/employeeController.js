import pool from "../config/db.js";

const resolveRoleFromProfile = ({ designation, position }) => {
  const normalizedDesignation = String(designation || "")
    .trim()
    .toLowerCase();
  const normalizedPosition = String(position || "")
    .trim()
    .toLowerCase();

  if (
    normalizedDesignation === "operations" &&
    normalizedPosition === "admin & human resources partner"
  ) {
    return "HR";
  }

  if (normalizedPosition.startsWith("supervisor(")) {
    return "Supervisor";
  }

  return "RankAndFile";
};

const WORKWEEK_DEFAULTS = {
  "5-day": { hoursPerDay: 8, absenceUnit: 1 },
  "4-day": { hoursPerDay: 10, absenceUnit: 1.25 },
};

const normalizeWorkweekType = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  if (normalized === "5-day" || normalized === "5day") return "5-day";
  if (normalized === "4-day" || normalized === "4day") return "4-day";
  return null;
};

const ensureWorkweekConfigsTable = async (connection = pool) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS workweek_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workweek_type ENUM('5-day', '4-day') NOT NULL,
      effective_from DATE NOT NULL,
      effective_to DATE NULL,
      hours_per_day DECIMAL(4,2) NOT NULL,
      absence_unit DECIMAL(4,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_effective_from (effective_from)
    )
  `);
};

const ensureOffsetTables = async (connection = pool) => {
  const [empIdMetaRows] = await connection.query(
    `
      SELECT
        COLUMN_TYPE,
        CHARACTER_SET_NAME,
        COLLATION_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'employees'
        AND COLUMN_NAME = 'emp_id'
      LIMIT 1
    `,
  );

  const empIdMeta = empIdMetaRows[0];
  const empIdColumn = empIdMeta
    ? `${empIdMeta.COLUMN_TYPE}${empIdMeta.CHARACTER_SET_NAME ? ` CHARACTER SET ${empIdMeta.CHARACTER_SET_NAME}` : ""}${empIdMeta.COLLATION_NAME ? ` COLLATE ${empIdMeta.COLLATION_NAME}` : ""}`
    : "VARCHAR(50)";

  await connection.query(`
    CREATE TABLE IF NOT EXISTS offset_ledger (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id ${empIdColumn} NOT NULL,
      period_year INT NOT NULL,
      period_month INT NOT NULL,
      working_days_completed INT,
      baseline_days INT DEFAULT 22,
      offset_earned DECIMAL(5,2) DEFAULT 0,
      offset_used DECIMAL(5,2) DEFAULT 0,
      carried_over DECIMAL(5,2) DEFAULT 0,
      final_balance DECIMAL(5,2) DEFAULT 0,
      status ENUM('Draft', 'Pending', 'Approved', 'Rejected') DEFAULT 'Draft',
      supervisor_emp_id ${empIdColumn},
      supervisor_remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL,
      INDEX idx_emp_period (emp_id, period_year, period_month),
      INDEX idx_status (status),
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE,
      FOREIGN KEY (supervisor_emp_id) REFERENCES employees(emp_id) ON DELETE SET NULL
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS offset_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id ${empIdColumn} NOT NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      days_applied DECIMAL(5,2) NOT NULL,
      status ENUM('Pending', 'Approved', 'Denied', 'Partially Approved') DEFAULT 'Pending',
      approved_days DECIMAL(5,2),
      supervisor_emp_id ${empIdColumn},
      supervisor_remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      approved_at TIMESTAMP NULL,
      INDEX idx_emp_status (emp_id, status),
      INDEX idx_date_range (date_from, date_to),
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE,
      FOREIGN KEY (supervisor_emp_id) REFERENCES employees(emp_id) ON DELETE SET NULL
    )
  `);
};

const parsePeriodRange = (period) => {
  const isValidPeriod = /^\d{4}-\d{2}$/.test(String(period || ""));
  const base = isValidPeriod
    ? new Date(`${period}-01T00:00:00`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const year = base.getFullYear();
  const month = base.getMonth();

  const periodStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return {
    periodStart,
    periodEnd,
  };
};

const getConvertedAbsenceSummary = async (periodStart, periodEnd) => {
  await ensureWorkweekConfigsTable();

  const [rows] = await pool.query(
    `
      SELECT
        a.emp_id,
        COUNT(*) AS raw_absences,
        SUM(
          COALESCE(
            (
              SELECT wc.absence_unit
              FROM workweek_configs wc
              WHERE wc.effective_from <= a.date
                AND (wc.effective_to IS NULL OR wc.effective_to >= a.date)
              ORDER BY wc.effective_from DESC
              LIMIT 1
            ),
            1
          )
        ) AS converted_absences
      FROM attendance a
      WHERE a.status = 'Absent'
        AND a.date BETWEEN ? AND ?
      GROUP BY a.emp_id
    `,
    [periodStart, periodEnd],
  );

  return rows.reduce((acc, row) => {
    acc[row.emp_id] = {
      rawAbsences: Number(row.raw_absences || 0),
      convertedAbsences: Number(row.converted_absences || 0),
    };
    return acc;
  }, {});
};

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
    password,
  } = req.body;

  const generatedAutoPassword = `${emp_id || ""}${(first_name || "").replace(/\s+/g, "")}`;
  const employeePassword = password || generatedAutoPassword;
  const employeeRole = resolveRoleFromProfile({ designation, position });

  try {
    await pool.query(
      // 2. Add middle_initial to the INSERT statement and add an extra '?'
      `INSERT INTO employees (emp_id, first_name, last_name, middle_initial, designation, position, status, email, dob, hired_date, password, role) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        employeePassword,
        employeeRole,
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

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
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

  const employeeRole = resolveRoleFromProfile({ designation, position });

  try {
    const [result] = await pool.query(
      `UPDATE employees
       SET first_name = ?,
           last_name = ?,
           middle_initial = ?,
           designation = ?,
           position = ?,
           status = ?,
           email = ?,
           dob = ?,
             hired_date = ?,
           role = ?
       WHERE emp_id = ?`,
      [
        first_name,
        last_name,
        middle_initial || null,
        designation,
        position,
        status,
        email,
        dob || null,
        hired_date || null,
        employeeRole,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("DB Error in updateEmployee:", error);
    res.status(500).json({ message: "Error updating employee" });
  }
};

export const resetEmployeePassword = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT emp_id, first_name FROM employees WHERE emp_id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = rows[0];
    const autoPassword = `${employee.emp_id}${(employee.first_name || "").replace(/\s+/g, "")}`;

    await pool.query("UPDATE employees SET password = ? WHERE emp_id = ?", [
      autoPassword,
      id,
    ]);

    res.json({
      message: "Password reset successfully",
      autoPassword,
    });
  } catch (error) {
    console.error("DB Error in resetEmployeePassword:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    // Because of 'ON DELETE CASCADE' in schema.sql, this safely removes their leaves, attendance, and payroll too
    await pool.query("DELETE FROM employees WHERE emp_id = ?", [id]);
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
      WHERE COALESCE(e.role, '') <> 'Admin'
    `);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAttendance:", error);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

// --- Get Monthly Attendance Summary for the Calendar ---
// --- Get Monthly Attendance Summary for the Calendar ---
export const getAttendanceCalendarSummary = async (req, res) => {
  const { month, year } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT date, 
             SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
             SUM(CASE WHEN status = 'Undertime' THEN 1 ELSE 0 END) as undertime_count,
             SUM(CASE WHEN status = 'Half-Day' THEN 1 ELSE 0 END) as halfday_count,
             SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as leave_count
      FROM attendance 
      WHERE MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY date
    `,
      [month, year],
    );
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAttendanceCalendarSummary:", error);
    res.status(500).json({ message: "Error fetching calendar summary" });
  }
};

// --- Get Daily Attendance List for a Specific Date ---
export const getDailyAttendance = async (req, res) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT e.emp_id, e.first_name, e.last_name, e.status as emp_status, a.status as attendance_status
      FROM employees e
      LEFT JOIN attendance a ON e.emp_id = a.emp_id AND a.date = ?
      WHERE COALESCE(e.role, '') <> 'Admin'
    `,
      [date],
    );
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getDailyAttendance:", error);
    res.status(500).json({ message: "Error fetching daily attendance" });
  }
};

// --- Save Bulk Attendance ---
export const saveBulkAttendance = async (req, res) => {
  const { date, records } = req.body;
  try {
    for (const record of records) {
      const [eligibleRows] = await pool.query(
        "SELECT emp_id FROM employees WHERE emp_id = ? AND COALESCE(role, '') <> 'Admin' LIMIT 1",
        [record.emp_id],
      );

      if (eligibleRows.length === 0) {
        continue;
      }

      await pool.query(
        `
        INSERT INTO attendance (emp_id, date, status) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `,
        [record.emp_id, date, record.status],
      );
    }
    res.json({ message: "Attendance saved successfully" });
  } catch (error) {
    console.error("DB Error in saveBulkAttendance:", error);
    res.status(500).json({ message: "Error saving attendance" });
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
    const userRole = req.user?.role;
    const empId = req.user?.emp_id;

    let query = `
      SELECT l.*, e.first_name, e.last_name 
      FROM leave_requests l 
      JOIN employees e ON l.emp_id = e.emp_id
    `;
    const queryParams = [];

    // PRIVACY FIX: If regular employee, only show their own leaves
    if (userRole === "RankAndFile") {
      query += " WHERE l.emp_id = ?";
      queryParams.push(empId);
    }

    query += " ORDER BY l.id DESC";

    const [rows] = await pool.query(query, queryParams);
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
    const { period } = req.query;
    const { periodStart, periodEnd } = parsePeriodRange(period);

    const absenceSummaryByEmployee = await getConvertedAbsenceSummary(
      periodStart,
      periodEnd,
    );

    // FIX: Added the WHERE clause to only fetch payrolls for the selected month!
    const [rows] = await pool.query(
      `SELECT p.*, e.first_name, e.last_name, e.designation, e.position 
       FROM payroll p 
       JOIN employees e ON p.emp_id = e.emp_id
       WHERE p.period_start = ?`,
      [periodStart],
    );

    const enrichedRows = rows.map((row) => {
      const absenceSummary = absenceSummaryByEmployee[row.emp_id] || {
        rawAbsences: 0,
        convertedAbsences: 0,
      };

      const basicPay = Number(row.basic_pay || 0);
      const incentives = Number(row.incentives || 0);
      const absenceDeductions = Number(
        ((basicPay / 22) * absenceSummary.convertedAbsences).toFixed(2),
      );
      const netPay = Number(
        (basicPay + incentives - absenceDeductions).toFixed(2),
      );

      return {
        ...row,
        absences_count: absenceSummary.rawAbsences,
        converted_absences: Number(absenceSummary.convertedAbsences.toFixed(2)),
        absence_deductions: absenceDeductions,
        net_pay: netPay,
      };
    });

    res.json(enrichedRows);
  } catch (error) {
    console.error("DB Error in getAllPayroll:", error);
    res.status(500).json({ message: "Error fetching payroll" });
  }
};

export const getWorkweekConfigs = async (req, res) => {
  try {
    await ensureWorkweekConfigsTable();

    const [rows] = await pool.query(
      `
        SELECT
          id,
          workweek_type,
          effective_from,
          effective_to,
          hours_per_day,
          absence_unit,
          created_at,
          updated_at
        FROM workweek_configs
        ORDER BY effective_from DESC
      `,
    );

    res.json(rows);
  } catch (error) {
    console.error("DB Error in getWorkweekConfigs:", error);
    res.status(500).json({ message: "Error fetching workweek configs" });
  }
};

export const upsertWorkweekConfig = async (req, res) => {
  const { workweek_type, effective_from, effective_to } = req.body;

  const normalizedType = normalizeWorkweekType(workweek_type);

  if (!normalizedType || !effective_from) {
    return res.status(400).json({
      message: "workweek_type and effective_from are required",
    });
  }

  const newFrom = new Date(effective_from);
  const newTo = effective_to ? new Date(effective_to) : null;

  if (Number.isNaN(newFrom.getTime())) {
    return res.status(400).json({ message: "Invalid effective_from date" });
  }

  if (newTo && Number.isNaN(newTo.getTime())) {
    return res.status(400).json({ message: "Invalid effective_to date" });
  }

  if (newTo && newTo < newFrom) {
    return res
      .status(400)
      .json({ message: "effective_to must be on or after effective_from" });
  }

  const { hoursPerDay, absenceUnit } = WORKWEEK_DEFAULTS[normalizedType];
  const normalizedTo = effective_to || null;
  const overlapEndDate = normalizedTo || "9999-12-31";

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureWorkweekConfigsTable(connection);

    const [overlaps] = await connection.query(
      `
        SELECT id
        FROM workweek_configs
        WHERE effective_from <> ?
          AND effective_from <= ?
          AND COALESCE(effective_to, '9999-12-31') >= ?
        LIMIT 1
      `,
      [effective_from, overlapEndDate, effective_from],
    );

    if (overlaps.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Workweek date range overlaps with an existing configuration",
      });
    }

    await connection.query(
      `
        INSERT INTO workweek_configs (
          workweek_type,
          effective_from,
          effective_to,
          hours_per_day,
          absence_unit
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          workweek_type = VALUES(workweek_type),
          effective_to = VALUES(effective_to),
          hours_per_day = VALUES(hours_per_day),
          absence_unit = VALUES(absence_unit)
      `,
      [normalizedType, effective_from, normalizedTo, hoursPerDay, absenceUnit],
    );

    await connection.commit();
    res.json({ message: "Workweek configuration saved successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in upsertWorkweekConfig:", error);
    res.status(500).json({ message: "Error saving workweek config" });
  } finally {
    connection.release();
  }
};

export const updateWorkweekConfigById = async (req, res) => {
  const { id } = req.params;
  const { workweek_type, effective_from, effective_to } = req.body;

  const normalizedType = normalizeWorkweekType(workweek_type);

  if (!normalizedType || !effective_from) {
    return res.status(400).json({
      message: "workweek_type and effective_from are required",
    });
  }

  const newFrom = new Date(effective_from);
  const newTo = effective_to ? new Date(effective_to) : null;

  if (Number.isNaN(newFrom.getTime())) {
    return res.status(400).json({ message: "Invalid effective_from date" });
  }

  if (newTo && Number.isNaN(newTo.getTime())) {
    return res.status(400).json({ message: "Invalid effective_to date" });
  }

  if (newTo && newTo < newFrom) {
    return res
      .status(400)
      .json({ message: "effective_to must be on or after effective_from" });
  }

  const { hoursPerDay, absenceUnit } = WORKWEEK_DEFAULTS[normalizedType];
  const normalizedTo = effective_to || null;
  const overlapEndDate = normalizedTo || "9999-12-31";

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureWorkweekConfigsTable(connection);

    const [existing] = await connection.query(
      "SELECT id FROM workweek_configs WHERE id = ? LIMIT 1",
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Workweek config not found" });
    }

    const [overlaps] = await connection.query(
      `
        SELECT id
        FROM workweek_configs
        WHERE id <> ?
          AND effective_from <= ?
          AND COALESCE(effective_to, '9999-12-31') >= ?
        LIMIT 1
      `,
      [id, overlapEndDate, effective_from],
    );

    if (overlaps.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Workweek date range overlaps with an existing configuration",
      });
    }

    await connection.query(
      `
        UPDATE workweek_configs
        SET workweek_type = ?,
            effective_from = ?,
            effective_to = ?,
            hours_per_day = ?,
            absence_unit = ?
        WHERE id = ?
      `,
      [
        normalizedType,
        effective_from,
        normalizedTo,
        hoursPerDay,
        absenceUnit,
        id,
      ],
    );

    await connection.commit();
    res.json({ message: "Workweek configuration updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in updateWorkweekConfigById:", error);
    res.status(500).json({ message: "Error updating workweek config" });
  } finally {
    connection.release();
  }
};

export const deleteWorkweekConfigById = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureWorkweekConfigsTable();

    const [result] = await pool.query(
      "DELETE FROM workweek_configs WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workweek config not found" });
    }

    res.json({ message: "Workweek configuration deleted successfully" });
  } catch (error) {
    console.error("DB Error in deleteWorkweekConfigById:", error);
    res.status(500).json({ message: "Error deleting workweek config" });
  }
};

// --- OFFSET ENGINE ---
const calculateMonthlyOffsetBalance = async (empId, year, month) => {
  await ensureOffsetTables();

  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [attendanceRows] = await pool.query(
    `
      SELECT COUNT(*) as working_days
      FROM attendance a
      WHERE a.emp_id = ?
        AND a.date BETWEEN ? AND ?
        AND a.status IN ('Present', 'Late', 'Undertime', 'Field', 'Half-Day')
    `,
    [empId, periodStart, periodEnd],
  );

  const workingDaysCompleted = Number(attendanceRows[0]?.working_days || 0);
  const baselineDays = 22;

  const [prevBalanceRows] = await pool.query(
    `
      SELECT final_balance
      FROM offset_ledger
      WHERE emp_id = ?
      ORDER BY period_year DESC, period_month DESC
      LIMIT 1
    `,
    [empId],
  );

  const carriedOver = Number(prevBalanceRows[0]?.final_balance || 0);

  let offsetEarned = 0;
  let offsetUsed = 0;
  let finalBalance = carriedOver;

  if (workingDaysCompleted >= baselineDays) {
    offsetEarned = workingDaysCompleted - baselineDays;
    finalBalance = carriedOver + offsetEarned;
  } else {
    const deficit = baselineDays - workingDaysCompleted;
    const availableOffsets = carriedOver;
    offsetUsed = Math.min(deficit, availableOffsets);
    finalBalance = carriedOver - offsetUsed;

    if (offsetUsed < deficit) {
      finalBalance = Math.max(0, finalBalance - (deficit - offsetUsed));
    }
  }

  return {
    workingDaysCompleted,
    baselineDays,
    offsetEarned: Number(offsetEarned.toFixed(2)),
    offsetUsed: Number(offsetUsed.toFixed(2)),
    carriedOver: Number(carriedOver.toFixed(2)),
    finalBalance: Number(finalBalance.toFixed(2)),
  };
};

export const getOffsetBalance = async (req, res) => {
  const { emp_id } = req.params;
  const { year, month } = req.query;

  const queryYear = year ? Number(year) : new Date().getFullYear();
  const queryMonth = month ? Number(month) : new Date().getMonth() + 1;

  try {
    const balance = await calculateMonthlyOffsetBalance(
      emp_id,
      queryYear,
      queryMonth,
    );
    res.json(balance);
  } catch (error) {
    console.error("DB Error in getOffsetBalance:", error);
    res.status(500).json({ message: "Error calculating offset balance" });
  }
};

export const fileOffsetApplication = async (req, res) => {
  const { emp_id, date_from, date_to, days_applied } = req.body;

  if (!emp_id || !date_from || !date_to || days_applied === undefined) {
    return res.status(400).json({
      message: "emp_id, date_from, date_to, and days_applied are required",
    });
  }

  try {
    await ensureOffsetTables();

    await pool.query(
      `
        INSERT INTO offset_applications (
          emp_id,
          date_from,
          date_to,
          days_applied,
          status
        ) VALUES (?, ?, ?, ?, 'Pending')
      `,
      [emp_id, date_from, date_to, days_applied],
    );

    res
      .status(201)
      .json({ message: "Offset application submitted successfully" });
  } catch (error) {
    console.error("DB Error in fileOffsetApplication:", error);
    res.status(500).json({ message: "Error filing offset application" });
  }
};

export const getOffsetApplications = async (req, res) => {
  try {
    await ensureOffsetTables();

    const userRole = req.user?.role;
    const empId = req.user?.emp_id;

    let query = `
      SELECT
        oa.*,
        e.first_name,
        e.last_name,
        sup.first_name as supervisor_first_name,
        sup.last_name as supervisor_last_name
      FROM offset_applications oa
      JOIN employees e ON oa.emp_id = e.emp_id
      LEFT JOIN employees sup ON oa.supervisor_emp_id = sup.emp_id
    `;
    const queryParams = [];

    // PRIVACY FIX: If regular employee, only show their own offsets
    if (userRole === "RankAndFile") {
      query += " WHERE oa.emp_id = ?";
      queryParams.push(empId);
    }

    query += " ORDER BY oa.created_at DESC";

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getOffsetApplications:", error);
    res.status(500).json({ message: "Error fetching offset applications" });
  }
};

export const updateOffsetApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, approved_days, supervisor_remarks } = req.body;
  const supervisorId = req.user?.emp_id;

  if (!supervisorId) {
    return res.status(401).json({ message: "Supervisor ID required" });
  }

  if (
    !["Pending", "Approved", "Denied", "Partially Approved"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureOffsetTables(connection);

    const [existing] = await connection.query(
      "SELECT * FROM offset_applications WHERE id = ? LIMIT 1",
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Offset application not found" });
    }

    const application = existing[0];

    if (status === "Partially Approved" && !approved_days) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "approved_days required for partial approval" });
    }

    await connection.query(
      `
        UPDATE offset_applications
        SET status = ?,
            approved_days = ?,
            supervisor_emp_id = ?,
            supervisor_remarks = ?,
            approved_at = ?
        WHERE id = ?
      `,
      [
        status,
        status === "Partially Approved" ? approved_days : null,
        supervisorId,
        supervisor_remarks || null,
        status === "Approved" || status === "Partially Approved"
          ? new Date()
          : null,
        id,
      ],
    );

    await connection.commit();
    res.json({
      message: `Offset application ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in updateOffsetApplicationStatus:", error);
    res.status(500).json({ message: "Error updating offset application" });
  } finally {
    connection.release();
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

export const generatePayroll = async (req, res) => {
  const { period } = req.body;
  if (!period) return res.status(400).json({ message: "Period is required" });

  try {
    // 1. Get the exact start and end dates for the selected month
    const { periodStart, periodEnd } = parsePeriodRange(period);

    // 2. Fetch the calculated absences (incorporates the 1 vs 1.25 workweek logic)
    const absenceSummaryByEmployee = await getConvertedAbsenceSummary(
      periodStart,
      periodEnd,
    );

    // 3. Get all active rank-and-file, HR, and supervisor employees (Ignore Admin)
    const [employees] = await pool.query(
      "SELECT emp_id, basic_pay FROM employees WHERE COALESCE(role, '') != 'Admin'",
    );

    // 4. Calculate and save the snapshot for each employee
    for (const emp of employees) {
      const basicPay = Number(emp.basic_pay || 0);

      const absenceSummary = absenceSummaryByEmployee[emp.emp_id] || {
        rawAbsences: 0,
        convertedAbsences: 0,
      };

      // Formula: (Monthly Pay / 22 days) * converted absences
      const absenceDeductions = Number(
        ((basicPay / 22) * absenceSummary.convertedAbsences).toFixed(2),
      );

      // Calculate total incentives (Bonus/Increases) given this month
      const [incentiveRows] = await pool.query(
        "SELECT SUM(amount) as total_incentives FROM salary_history WHERE emp_id = ? AND type IN ('Bonus', 'Increase') AND DATE_FORMAT(effective_date, '%Y-%m') = ?",
        [emp.emp_id, period],
      );
      const incentives = Number(incentiveRows[0]?.total_incentives || 0);

      // Calculate Gross and Net Pay
      const grossPay = Number((basicPay + incentives).toFixed(2));
      const netPay = Number((grossPay - absenceDeductions).toFixed(2));

      // 5. Save the official snapshot to the payroll table
      // EXACTLY matching your database columns from the screenshot
      await pool.query(
        `INSERT INTO payroll (emp_id, period_start, basic_pay, absences_count, absence_deductions, incentives, gross_pay, net_pay)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           basic_pay = VALUES(basic_pay),
           absences_count = VALUES(absences_count),
           absence_deductions = VALUES(absence_deductions),
           incentives = VALUES(incentives),
           gross_pay = VALUES(gross_pay),
           net_pay = VALUES(net_pay)`,
        [
          emp.emp_id,
          periodStart,
          basicPay,
          absenceSummary.rawAbsences,
          absenceDeductions,
          incentives,
          grossPay,
          netPay,
        ],
      );
    }

    res.json({ message: "Payroll generated successfully" });
  } catch (error) {
    console.error("DB Error in generatePayroll:", error);
    res.status(500).json({ message: "Error generating payroll" });
  }
};
export const updateBaseSalaryByPosition = async (req, res) => {
  const { position, amount } = req.body;

  if (!position || amount === undefined || amount === null) {
    return res
      .status(400)
      .json({ message: "Position and amount are required" });
  }

  try {
    // 1. Fixed: Changed 'base_salary' to 'basic_pay' for the employees table
    await pool.query("UPDATE employees SET basic_pay = ? WHERE position = ?", [
      amount,
      position,
    ]);

    // 2. Update the payroll table as well
    await pool.query(
      `UPDATE payroll p
       JOIN employees e ON p.emp_id = e.emp_id
       SET p.basic_pay = ?
       WHERE e.position = ?`,
      [amount, position],
    );

    res.json({ message: "Base salary updated successfully" });
  } catch (error) {
    console.error("DB Error in updateBaseSalaryByPosition:", error);
    res.status(500).json({ message: "Error updating base salary" });
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
