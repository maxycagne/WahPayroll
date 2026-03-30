import pool from "../config/db.js";
import { hashPassword } from "../helper/hashPass.js";

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

const getEmpIdColumnDefinition = async (connection = pool) => {
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
  return empIdMeta
    ? `${empIdMeta.COLUMN_TYPE}${empIdMeta.CHARACTER_SET_NAME ? ` CHARACTER SET ${empIdMeta.CHARACTER_SET_NAME}` : ""}${empIdMeta.COLLATION_NAME ? ` COLLATE ${empIdMeta.COLLATION_NAME}` : ""}`
    : "VARCHAR(50)";
};

const ensureOffsetTables = async (connection = pool) => {
  const empIdColumn = await getEmpIdColumnDefinition(connection);

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

const ensureLeaveApprovalColumns = async (connection = pool) => {
  // Align status options for existing databases.
  await connection.query(`
    ALTER TABLE leave_requests
    MODIFY COLUMN status ENUM('Pending', 'Approved', 'Denied', 'Partially Approved') DEFAULT 'Pending'
  `);

  const [approvedDaysColumn] = await connection.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'leave_requests'
        AND COLUMN_NAME = 'approved_days'
      LIMIT 1
    `,
  );

  if (approvedDaysColumn.length === 0) {
    await connection.query(
      "ALTER TABLE leave_requests ADD COLUMN approved_days DECIMAL(5,2) NULL AFTER status",
    );
  }

  const [approvedDatesColumn] = await connection.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'leave_requests'
        AND COLUMN_NAME = 'approved_dates'
      LIMIT 1
    `,
  );

  if (approvedDatesColumn.length === 0) {
    await connection.query(
      "ALTER TABLE leave_requests ADD COLUMN approved_dates JSON NULL AFTER approved_days",
    );
  }
};

const ensureResignationsTable = async (connection = pool) => {
  const empIdColumn = await getEmpIdColumnDefinition(connection);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS resignations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id ${empIdColumn} NOT NULL,
      resignation_type VARCHAR(100) NOT NULL,
      effective_date DATE NOT NULL,
      reason TEXT,
      status ENUM('Pending Approval', 'Approved', 'Rejected') DEFAULT 'Pending Approval',
      reviewed_by ${empIdColumn} NULL,
      review_remarks TEXT,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_resignation_emp_status (emp_id, status),
      INDEX idx_resignation_effective_date (effective_date),
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES employees(emp_id) ON DELETE SET NULL
    )
  `);
};

const ensureNotificationsTable = async (connection = pool) => {
  const empIdColumn = await getEmpIdColumnDefinition(connection);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      emp_id ${empIdColumn} NOT NULL,
      notification_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      reference_type VARCHAR(50),
      reference_id INT,
      status ENUM('Unread', 'Read') DEFAULT 'Unread',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      INDEX idx_notification_emp_status (emp_id, status),
      INDEX idx_notification_created (created_at),
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE
    )
  `);
};

const ensureEmployeeMissingDocsTable = async (connection = pool) => {
  const empIdColumn = await getEmpIdColumnDefinition(connection);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS employee_missing_docs (
      emp_id ${empIdColumn} PRIMARY KEY,
      missing_docs TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id) ON DELETE CASCADE
    )
  `);
};

const normalizeRole = (role) => {
  const value = String(role || "")
    .trim()
    .toLowerCase();
  if (value === "admin") return "Admin";
  if (value === "supervisor") return "Supervisor";
  if (value === "hr") return "HR";
  return "RankAndFile";
};

const getEmployeeProfile = async (connection, empId) => {
  const [rows] = await connection.query(
    `
      SELECT emp_id, first_name, last_name, designation, COALESCE(role, 'RankAndFile') as role
      FROM employees
      WHERE emp_id = ?
      LIMIT 1
    `,
    [empId],
  );

  if (rows.length === 0) return null;

  return {
    ...rows[0],
    role: normalizeRole(rows[0].role),
    designation: rows[0].designation || null,
  };
};

const getSupervisorApproversForRequester = async (connection, requester) => {
  if (!requester) return [];

  if (requester.role === "Supervisor") {
    const [rows] = await connection.query(
      `
        SELECT emp_id
        FROM employees
        WHERE COALESCE(role, '') = 'HR'
          AND emp_id <> ?
      `,
      [requester.emp_id],
    );
    return rows;
  }

  if (
    requester.role !== "RankAndFile" &&
    requester.role !== "HR" &&
    requester.role !== "Admin"
  ) {
    return [];
  }

  if (!requester.designation) return [];

  const [rows] = await connection.query(
    `
      SELECT emp_id
      FROM employees
      WHERE COALESCE(role, '') = 'Supervisor'
        AND designation = ?
        AND emp_id <> ?
    `,
    [requester.designation, requester.emp_id],
  );

  return rows;
};

const canApproverReviewRequester = (approver, requester) => {
  if (!approver || !requester) return false;
  if (approver.emp_id === requester.emp_id) return false;

  // Policy: supervisor requests are reviewed by HR only.
  if (requester.role === "Supervisor") {
    return approver.role === "HR";
  }

  // Policy: rank-and-file and HR/Admin requests are reviewed by supervisor of same designation.
  if (
    requester.role === "RankAndFile" ||
    requester.role === "HR" ||
    requester.role === "Admin"
  ) {
    if (approver.role !== "Supervisor") return false;
    return (
      !!requester.designation && approver.designation === requester.designation
    );
  }

  return false;
};

const createNotification = async (
  connection,
  {
    empId,
    notificationType,
    title,
    message,
    referenceType = null,
    referenceId = null,
  },
) => {
  await ensureNotificationsTable(connection);

  await connection.query(
    `
      INSERT INTO notifications (
        emp_id,
        notification_type,
        title,
        message,
        reference_type,
        reference_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Unread')
    `,
    [empId, notificationType, title, message, referenceType, referenceId],
  );
};

const notifyApproversForRequest = async (
  connection,
  { requester, moduleType, requestId },
) => {
  const approvers = await getSupervisorApproversForRequester(
    connection,
    requester,
  );

  if (approvers.length === 0) return;

  const requesterName = `${requester.first_name} ${requester.last_name}`.trim();

  for (const approver of approvers) {
    await createNotification(connection, {
      empId: approver.emp_id,
      notificationType: `${moduleType}_REQUEST`,
      title: `${moduleType} Request Pending`,
      message: `${requesterName} submitted a ${moduleType.toLowerCase()} request awaiting your review.`,
      referenceType: moduleType,
      referenceId: requestId,
    });
  }
};

const notifyRequesterForDecision = async (
  connection,
  { requesterEmpId, moduleType, status, approverName },
) => {
  await createNotification(connection, {
    empId: requesterEmpId,
    notificationType: `${moduleType}_STATUS`,
    title: `${moduleType} Request ${status}`,
    message: `Your ${moduleType.toLowerCase()} request was marked ${status.toLowerCase()} by ${approverName}.`,
    referenceType: moduleType,
  });
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

  const hashPass = await hashPassword(employeePassword);

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
        hashPass,
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

export const updateResignationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE resignations SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ message: "Resignation updated successfully" });
  } catch (error) {
    console.error("DB Error in updateResignationStatus:", error);
    res.status(500).json({ message: "Error updating resignation" });
  }
};

export const getAllResignations = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.id AS res_id, 
        r.emp_id, 
        r.resignation_type, 
        r.effective_date, 
        r.reason, 
        r.status, 
        r.created_at,
        e.first_name, 
        e.last_name
      FROM resignations r 
      JOIN employees e ON r.emp_id = e.emp_id 
      ORDER BY r.created_at DESC
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("DETAILED SQL ERROR:", error.message);
    // This will send the EXACT error to your browser console
    return res.status(500).json({ message: error.message });
  }
};

// --- DASHBOARD ---
export const getDashboardSummary = async (req, res) => {
  try {
    await ensureResignationsTable();
    await ensureEmployeeMissingDocsTable();

    const currentUser = await getEmployeeProfile(pool, req.user?.emp_id);
    const isSupervisor = currentUser?.role === "Supervisor";

    let pending = [];
    if (isSupervisor) {
      const [rows] = await pool.query(
        `
          SELECT l.*, e.first_name, e.last_name
          FROM leave_requests l
          JOIN employees e ON l.emp_id = e.emp_id
          WHERE l.status = 'Pending'
            AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
            AND e.designation = ?
            AND e.emp_id <> ?
        `,
        [currentUser.designation || "", currentUser.emp_id],
      );
      pending = rows;
    } else if (currentUser?.role === "HR") {
      const [rows] = await pool.query(
        `
          SELECT l.*, e.first_name, e.last_name
          FROM leave_requests l
          JOIN employees e ON l.emp_id = e.emp_id
          WHERE l.status = 'Pending'
            AND COALESCE(e.role, '') = 'Supervisor'
            AND e.emp_id <> ?
        `,
        [currentUser.emp_id],
      );
      pending = rows;
    } else {
      pending = [];
    }

    const [onLeave] = await pool.query(
      "SELECT e.first_name, e.last_name, l.leave_type FROM employees e JOIN leave_requests l ON e.emp_id = l.emp_id WHERE CURDATE() BETWEEN l.date_from AND l.date_to AND l.status = 'Approved'",
    );
    const [absents] = await pool.query(
      "SELECT first_name, last_name FROM employees WHERE emp_id NOT IN (SELECT emp_id FROM attendance WHERE date = CURDATE()) AND status != 'Inactive' AND COALESCE(role, '') <> 'Admin'",
    );
    const [balances] = await pool.query(
      "SELECT e.first_name, e.last_name, lb.leave_balance, lb.offset_credits FROM employees e JOIN leave_balances lb ON e.emp_id = lb.emp_id",
    );

    // Fetch REAL Resignations
    let resignations = [];
    try {
      if (isSupervisor) {
        const [resigRows] = await pool.query(
          `
            SELECT r.*, e.first_name, e.last_name
            FROM resignations r
            JOIN employees e ON r.emp_id = e.emp_id
            WHERE r.status = 'Pending Approval'
              AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
              AND e.designation = ?
              AND e.emp_id <> ?
          `,
          [currentUser.designation || "", currentUser.emp_id],
        );
        resignations = resigRows;
      } else if (currentUser?.role === "HR") {
        const [resigRows] = await pool.query(
          `
            SELECT r.*, e.first_name, e.last_name
            FROM resignations r
            JOIN employees e ON r.emp_id = e.emp_id
            WHERE r.status = 'Pending Approval'
              AND COALESCE(e.role, '') = 'Supervisor'
              AND e.emp_id <> ?
          `,
          [currentUser.emp_id],
        );
        resignations = resigRows;
      } else {
        resignations = [];
      }
    } catch (e) {
      console.error(e);
    }

    // Fetch Missing Documents for Dashboard
    let missingDocs = [];
    try {
      const [docsRows] = await pool.query(`
        SELECT m.*, e.first_name, e.last_name, e.designation, e.hired_date 
        FROM employee_missing_docs m 
        JOIN employees e ON m.emp_id = e.emp_id
      `);
      missingDocs = docsRows;
    } catch (e) {
      console.error(e);
    }

    res.json({
      pendingLeaves: pending,
      onLeave: onLeave,
      absents: absents,
      balances: balances,
      resignations: resignations,
      missingDocs: missingDocs,
      recentActivities: [],
    });
  } catch (error) {
    console.error("DB Error in getDashboardSummary:", error);
    res.status(500).json({ message: "Error loading dashboard" });
  }
};

// --- UPDATE MISSING DOCUMENTS ---
export const updateMissingDocs = async (req, res) => {
  const { emp_id, missing_docs } = req.body;

  if (!emp_id)
    return res.status(400).json({ message: "Employee ID is required" });

  try {
    await ensureEmployeeMissingDocsTable();

    if (!missing_docs || missing_docs.trim() === "") {
      // If the HR clears the text box, it means all docs are submitted! Delete the record.
      await pool.query("DELETE FROM employee_missing_docs WHERE emp_id = ?", [
        emp_id,
      ]);
    } else {
      // Insert or Update the missing documents
      await pool.query(
        "INSERT INTO employee_missing_docs (emp_id, missing_docs) VALUES (?, ?) ON DUPLICATE KEY UPDATE missing_docs = VALUES(missing_docs)",
        [emp_id, missing_docs],
      );
    }
    res.json({ message: "Employee documents updated successfully" });
  } catch (error) {
    console.error("DB Error in updateMissingDocs:", error);
    res.status(500).json({ message: "Error updating missing documents" });
  }
};

// --- RESIGNATIONS ---
export const getMyResignations = async (req, res) => {
  try {
    await ensureResignationsTable();

    const empId = req.user?.emp_id;
    if (!empId) return res.status(400).json({ message: "Employee ID missing" });

    const [rows] = await pool.query(
      "SELECT * FROM resignations WHERE emp_id = ? ORDER BY created_at DESC",
      [empId],
    );
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getMyResignations:", error);
    res.status(500).json({ message: "Error fetching resignations" });
  }
};

export const getResignations = async (req, res) => {
  try {
    await ensureResignationsTable();

    const viewer = await getEmployeeProfile(pool, req.user?.emp_id);
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    let query = `
      SELECT
        r.*,
        e.first_name,
        e.last_name,
        e.designation,
        COALESCE(e.role, 'RankAndFile') as requester_role,
        rv.first_name as reviewer_first_name,
        rv.last_name as reviewer_last_name
      FROM resignations r
      JOIN employees e ON r.emp_id = e.emp_id
      LEFT JOIN employees rv ON r.reviewed_by = rv.emp_id
    `;

    const params = [];

    if (viewer.role === "RankAndFile") {
      query += " WHERE r.emp_id = ?";
      params.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      query += `
        WHERE r.emp_id = ?
           OR (
             r.status = 'Pending Approval'
             AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
             AND e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      params.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    } else if (viewer.role === "HR") {
      query += `
        WHERE r.emp_id = ?
           OR (
             r.status = 'Pending Approval'
             AND COALESCE(e.role, '') = 'Supervisor'
             AND e.emp_id <> ?
           )
      `;
      params.push(viewer.emp_id, viewer.emp_id);
    }

    query += " ORDER BY r.created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getResignations:", error);
    res.status(500).json({ message: "Error fetching resignations" });
  }
};

export const fileResignation = async (req, res) => {
  const { emp_id, resignation_type, effective_date, reason } = req.body;
  try {
    const requesterEmpId =
      req.user?.role === "Admin" && emp_id
        ? emp_id
        : req.user?.emp_id || emp_id;

    if (!requesterEmpId || !resignation_type || !effective_date) {
      return res.status(400).json({
        message: "emp_id, resignation_type, and effective_date are required",
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await ensureResignationsTable(connection);

      const requester = await getEmployeeProfile(connection, requesterEmpId);
      if (!requester) {
        await connection.rollback();
        return res.status(404).json({ message: "Requester not found" });
      }

      const [result] = await connection.query(
        "INSERT INTO resignations (emp_id, resignation_type, effective_date, reason, status) VALUES (?, ?, ?, ?, 'Pending Approval')",
        [requesterEmpId, resignation_type, effective_date, reason || null],
      );

      await notifyApproversForRequest(connection, {
        requester,
        moduleType: "Resignation",
        requestId: result.insertId,
      });

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    res.status(201).json({ message: "Resignation filed successfully" });
  } catch (error) {
    console.error("DB Error in fileResignation:", error);
    res.status(500).json({ message: "Error filing resignation" });
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    await ensureNotificationsTable();

    const empId = req.user?.emp_id;
    if (!empId) return res.status(401).json({ message: "Unauthorized" });

    const [rows] = await pool.query(
      `
        SELECT
          id,
          notification_type,
          title,
          message,
          reference_type,
          reference_id,
          status,
          created_at,
          read_at
        FROM notifications
        WHERE emp_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `,
      [empId],
    );

    res.json(rows);
  } catch (error) {
    console.error("DB Error in getMyNotifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    await ensureNotificationsTable();

    const empId = req.user?.emp_id;
    if (!empId) return res.status(401).json({ message: "Unauthorized" });

    const [result] = await pool.query(
      `
        UPDATE notifications
        SET status = 'Read',
            read_at = COALESCE(read_at, NOW())
        WHERE id = ?
          AND emp_id = ?
      `,
      [id, empId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("DB Error in markNotificationRead:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await ensureNotificationsTable();

    const empId = req.user?.emp_id;
    if (!empId) return res.status(401).json({ message: "Unauthorized" });

    await pool.query(
      `
        UPDATE notifications
        SET status = 'Read',
            read_at = COALESCE(read_at, NOW())
        WHERE emp_id = ?
          AND status = 'Unread'
      `,
      [empId],
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("DB Error in markAllNotificationsRead:", error);
    res.status(500).json({ message: "Error updating notifications" });
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

export const getAttendanceCalendarSummary = async (req, res) => {
  const { month, year } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, 
             DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
             SUM(CASE WHEN status LIKE '%Present%' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN status LIKE '%Absent%' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN status LIKE '%Late%' THEN 1 ELSE 0 END) as late_count,
             SUM(CASE WHEN status LIKE '%Undertime%' THEN 1 ELSE 0 END) as undertime_count,
             SUM(CASE WHEN status LIKE '%Half-Day%' THEN 1 ELSE 0 END) as halfday_count,
             SUM(CASE WHEN status LIKE '%On Leave%' THEN 1 ELSE 0 END) as leave_count
      FROM attendance 
      WHERE MONTH(date) = ? AND YEAR(date) = ?
      GROUP BY DATE_FORMAT(date, '%Y-%m-%d')
    `,
      [month, year],
    );
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAttendanceCalendarSummary:", error);
    res.status(500).json({ message: "Error fetching calendar summary" });
  }
};

export const getDailyAttendance = async (req, res) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT e.emp_id, e.first_name, e.last_name, e.status as emp_status, a.status as attendance_status
      FROM employees e
      LEFT JOIN attendance a ON e.emp_id = a.emp_id AND DATE_FORMAT(a.date, '%Y-%m-%d') = ?
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

export const saveBulkAttendance = async (req, res) => {
  const { date, records } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Wipe existing attendance matching the exact formatted date string
    await connection.query(
      `DELETE a FROM attendance a
       JOIN employees e ON a.emp_id = e.emp_id
       WHERE DATE_FORMAT(a.date, '%Y-%m-%d') = ? AND COALESCE(e.role, '') <> 'Admin'`,
      [date],
    );

    // 2. Insert the fresh records using strict DATE() parsing
    if (records && records.length > 0) {
      for (const record of records) {
        await connection.query(
          `INSERT INTO attendance (emp_id, date, status) VALUES (?, DATE(?), ?)`,
          [record.emp_id, date, record.status],
        );
      }
    }

    await connection.commit();
    res.json({ message: "Attendance saved successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in saveBulkAttendance:", error);
    res.status(500).json({ message: "Error saving attendance" });
  } finally {
    connection.release();
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
    await ensureLeaveApprovalColumns();

    const viewer = await getEmployeeProfile(pool, req.user?.emp_id);
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    let query = `
      SELECT l.*, e.first_name, e.last_name, e.designation, COALESCE(e.role, 'RankAndFile') as requester_role
      FROM leave_requests l
      JOIN employees e ON l.emp_id = e.emp_id
    `;
    const queryParams = [];

    if (viewer.role === "RankAndFile") {
      query += " WHERE l.emp_id = ?";
      queryParams.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      query += `
       WHERE l.emp_id = ?
           OR (
             l.status IN ('Pending', 'Approved', 'Partially Approved','Declined') -- UPDATED HERE
             AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
             AND e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    } else if (viewer.role === "HR") {
      query += `
        WHERE l.emp_id = ?
           OR (
             l.status = 'Pending'
             AND COALESCE(e.role, '') = 'Supervisor'
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.emp_id);
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
  const { status, supervisor_remarks, approved_days, approved_dates } =
    req.body;

  if (
    !["Pending", "Approved", "Denied", "Partially Approved"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid leave status" });
  }

  const approverId = req.user?.emp_id;
  if (!approverId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureLeaveApprovalColumns(connection);

    const approver = await getEmployeeProfile(connection, approverId);
    if (!approver) {
      await connection.rollback();
      return res.status(401).json({ message: "Approver not found" });
    }

    const [rows] = await connection.query(
      "SELECT id, emp_id, date_from, date_to FROM leave_requests WHERE id = ? LIMIT 1",
      [id],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leaveRequest = rows[0];
    const requester = await getEmployeeProfile(connection, leaveRequest.emp_id);

    if (!canApproverReviewRequester(approver, requester)) {
      await connection.rollback();
      return res.status(403).json({
        message: "You are not allowed to approve this leave request",
      });
    }

    const totalRequestDays =
      Math.floor(
        (new Date(leaveRequest.date_to).getTime() -
          new Date(leaveRequest.date_from).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    const parsedApprovedDays =
      approved_days !== undefined && approved_days !== null
        ? Number(approved_days)
        : null;

    const parsedApprovedDates = Array.isArray(approved_dates)
      ? approved_dates
          .map((d) => String(d || "").trim())
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      : [];

    if (status === "Partially Approved") {
      if (!parsedApprovedDays || parsedApprovedDays <= 0) {
        await connection.rollback();
        return res.status(400).json({
          message:
            "approved_days must be greater than zero for partial approval",
        });
      }

      if (parsedApprovedDays >= totalRequestDays) {
        await connection.rollback();
        return res.status(400).json({
          message: "approved_days must be less than the total requested days",
        });
      }
    }

    if (status === "Approved" && parsedApprovedDays !== null) {
      if (parsedApprovedDays <= 0 || parsedApprovedDays > totalRequestDays) {
        await connection.rollback();
        return res.status(400).json({
          message: "approved_days is out of range for this request",
        });
      }
    }

    if (parsedApprovedDates.length > 0) {
      const fromDate = new Date(leaveRequest.date_from).setHours(0, 0, 0, 0);
      const toDate = new Date(leaveRequest.date_to).setHours(0, 0, 0, 0);

      const hasOutOfRangeDate = parsedApprovedDates.some((dateString) => {
        const value = new Date(dateString).setHours(0, 0, 0, 0);
        return value < fromDate || value > toDate;
      });

      if (hasOutOfRangeDate) {
        await connection.rollback();
        return res.status(400).json({
          message: "approved_dates contains date(s) outside the request range",
        });
      }
    }

    const finalApprovedDays =
      status === "Denied"
        ? null
        : parsedApprovedDays !== null
          ? parsedApprovedDays
          : status === "Approved"
            ? totalRequestDays
            : null;

    const finalApprovedDates =
      status === "Denied"
        ? null
        : parsedApprovedDates.length > 0
          ? JSON.stringify(parsedApprovedDates)
          : null;

    await connection.query(
      `
        UPDATE leave_requests
        SET status = ?,
            approved_days = ?,
            approved_dates = ?,
            supervisor_remarks = COALESCE(?, supervisor_remarks)
        WHERE id = ?
      `,
      [
        status,
        finalApprovedDays,
        finalApprovedDates,
        supervisor_remarks || null,
        id,
      ],
    );

    await notifyRequesterForDecision(connection, {
      requesterEmpId: leaveRequest.emp_id,
      moduleType: "Leave",
      status,
      approverName: `${approver.first_name} ${approver.last_name}`.trim(),
    });

    await connection.commit();
    res.json({ message: `Leave ${status}` });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in updateLeaveStatus:", error);
    res.status(500).json({ message: "Error updating leave" });
  } finally {
    connection.release();
  }
};

// --- PAYROLL ---
// --- PAYROLL ---
export const getAllPayroll = async (req, res) => {
  try {
    const { period } = req.query;
    const { periodStart } = parsePeriodRange(period);

    // FIX: Added the WHERE clause to only fetch payrolls for the selected month!
    const [rows] = await pool.query(
      `SELECT
         p.*,
         e.first_name,
         e.last_name,
         e.designation,
         e.position,
         adj.adjustment_reasons,
         adj.incentive_reasons,
         adj.deduction_reasons
       FROM payroll p
       JOIN employees e ON p.emp_id = e.emp_id
       LEFT JOIN (
         SELECT
           emp_id,
           GROUP_CONCAT(
             CASE
               WHEN type IN ('Bonus', 'Increase') THEN CONCAT(type, ': ', COALESCE(description, 'No reason provided'))
               ELSE NULL
             END
             ORDER BY effective_date DESC, id DESC
             SEPARATOR ' | '
           ) AS incentive_reasons,
           GROUP_CONCAT(
             CASE
               WHEN type = 'Decrease' THEN CONCAT(
                 COALESCE(NULLIF(TRIM(description), ''), 'No reason provided'),
                 ' = ₱',
                 FORMAT(ABS(amount), 2)
               )
               ELSE NULL
             END
             ORDER BY effective_date DESC, id DESC
             SEPARATOR ' | '
           ) AS deduction_reasons,
           GROUP_CONCAT(
             CONCAT(type, ': ', COALESCE(description, 'No reason provided'))
             ORDER BY effective_date DESC, id DESC
             SEPARATOR ' | '
           ) AS adjustment_reasons
         FROM salary_history
         WHERE DATE_FORMAT(effective_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
         GROUP BY emp_id
       ) adj ON adj.emp_id = p.emp_id
       WHERE p.period_start = ?`,
      [periodStart, periodStart],
    );

    const enrichedRows = rows.map((row) => {
      const basicPay = Number(row.basic_pay || 0);
      const incentives = Number(row.incentives || 0);
      const totalDeductions = Number(row.absence_deductions || 0);
      const netPay = Number(
        (basicPay + incentives - totalDeductions).toFixed(2),
      );

      return {
        ...row,
        absences_count: 0,
        converted_absences: 0,
        absence_deductions: totalDeductions,
        baseline_absence_deductions: 0,
        adjustment_deductions: totalDeductions,
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

  const requesterEmpId =
    req.user?.role === "Admin" && emp_id ? emp_id : req.user?.emp_id || emp_id;

  if (!requesterEmpId || !date_from || !date_to || days_applied === undefined) {
    return res.status(400).json({
      message: "emp_id, date_from, date_to, and days_applied are required",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureOffsetTables(connection);

    const requester = await getEmployeeProfile(connection, requesterEmpId);
    if (!requester) {
      await connection.rollback();
      return res.status(404).json({ message: "Requester not found" });
    }

    const [result] = await connection.query(
      `
        INSERT INTO offset_applications (
          emp_id,
          date_from,
          date_to,
          days_applied,
          status
        ) VALUES (?, ?, ?, ?, 'Pending')
      `,
      [requesterEmpId, date_from, date_to, days_applied],
    );

    await notifyApproversForRequest(connection, {
      requester,
      moduleType: "Offset",
      requestId: result.insertId,
    });

    await connection.commit();

    res
      .status(201)
      .json({ message: "Offset application submitted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in fileOffsetApplication:", error);
    res.status(500).json({ message: "Error filing offset application" });
  } finally {
    connection.release();
  }
};

export const getOffsetApplications = async (req, res) => {
  try {
    await ensureOffsetTables();

    const viewer = await getEmployeeProfile(pool, req.user?.emp_id);
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    let query = `
      SELECT
        oa.*,
        e.first_name,
        e.last_name,
        e.designation,
        COALESCE(e.role, 'RankAndFile') as requester_role,
        sup.first_name as supervisor_first_name,
        sup.last_name as supervisor_last_name
      FROM offset_applications oa
      JOIN employees e ON oa.emp_id = e.emp_id
      LEFT JOIN employees sup ON oa.supervisor_emp_id = sup.emp_id
    `;
    const queryParams = [];

    if (viewer.role === "RankAndFile") {
      query += " WHERE oa.emp_id = ?";
      queryParams.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      query += `
        WHERE oa.emp_id = ?
           OR (
             oa.status = 'Pending'
             AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
             AND e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    } else if (viewer.role === "HR") {
      query += `
        WHERE oa.emp_id = ?
           OR (
             oa.status = 'Pending'
             AND COALESCE(e.role, '') = 'Supervisor'
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.emp_id);
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

    const approver = await getEmployeeProfile(connection, supervisorId);
    const requester = await getEmployeeProfile(connection, application.emp_id);

    if (!canApproverReviewRequester(approver, requester)) {
      await connection.rollback();
      return res.status(403).json({
        message: "You are not allowed to approve this offset request",
      });
    }

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

    await notifyRequesterForDecision(connection, {
      requesterEmpId: application.emp_id,
      moduleType: "Offset",
      status,
      approverName: `${approver.first_name} ${approver.last_name}`.trim(),
    });

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

const normalizeAdjustmentType = (rawType) => {
  const normalized = String(rawType || "")
    .trim()
    .toLowerCase();

  if (["decrease", "deduction", "deductions"].includes(normalized)) {
    return "Decrease";
  }

  if (["increase", "incentive", "incentives", "raise"].includes(normalized)) {
    return "Increase";
  }

  if (["bonus"].includes(normalized)) {
    return "Bonus";
  }

  return null;
};

const recomputePayrollForEmployeesPeriod = async (
  connection,
  empIds,
  period,
) => {
  if (!Array.isArray(empIds) || empIds.length === 0) return;

  const uniqueEmpIds = Array.from(new Set(empIds));
  const placeholders = uniqueEmpIds.map(() => "?").join(", ");
  const { periodStart } = parsePeriodRange(period);

  const [adjustmentTotals] = await connection.query(
    `SELECT
       emp_id,
       COALESCE(
         SUM(CASE WHEN type IN ('Bonus', 'Increase') THEN ABS(amount) ELSE 0 END),
         0
       ) AS total_incentives,
       COALESCE(
         SUM(CASE WHEN type = 'Decrease' THEN ABS(amount) ELSE 0 END),
         0
       ) AS total_deductions
     FROM salary_history
     WHERE DATE_FORMAT(effective_date, '%Y-%m') = ?
       AND emp_id IN (${placeholders})
     GROUP BY emp_id`,
    [period, ...uniqueEmpIds],
  );

  const totalsByEmp = new Map(
    adjustmentTotals.map((row) => [
      row.emp_id,
      {
        incentives: Number(row.total_incentives || 0),
        deductions: Number(row.total_deductions || 0),
      },
    ]),
  );

  const [payrollRows] = await connection.query(
    `SELECT emp_id
     FROM payroll
     WHERE period_start = ?
       AND emp_id IN (${placeholders})`,
    [periodStart, ...uniqueEmpIds],
  );

  for (const row of payrollRows) {
    const totals = totalsByEmp.get(row.emp_id) || {
      incentives: 0,
      deductions: 0,
    };

    await connection.query(
      `UPDATE payroll
       SET incentives = ?,
           absence_deductions = ?,
           gross_pay = ROUND(basic_pay + ?, 2),
           net_pay = ROUND((basic_pay + ?) - ?, 2)
       WHERE period_start = ?
         AND emp_id = ?`,
      [
        totals.incentives,
        totals.deductions,
        totals.incentives,
        totals.incentives,
        totals.deductions,
        periodStart,
        row.emp_id,
      ],
    );
  }
};

export const applySalaryAdjustment = async (req, res) => {
  const { emp_ids, type, amount, description, date } = req.body;

  if (!Array.isArray(emp_ids) || emp_ids.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one employee is required" });
  }

  if (!type || amount === undefined || amount === null || !date) {
    return res
      .status(400)
      .json({ message: "type, amount, and date are required" });
  }

  const normalizedType = normalizeAdjustmentType(type);
  if (!normalizedType) {
    return res.status(400).json({ message: "Invalid adjustment type" });
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const period = String(date).slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({ message: "Invalid adjustment date" });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Loop through each selected employee ID and save the record
    for (const emp_id of emp_ids) {
      await connection.query(
        `INSERT INTO salary_history (emp_id, effective_date, type, amount, description, remarks) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          emp_id,
          date,
          normalizedType,
          numericAmount,
          description || null,
          "Added via Payroll Bulk Adjustment",
        ],
      );
    }

    await recomputePayrollForEmployeesPeriod(connection, emp_ids, period);

    await connection.commit();
    res.json({ message: "Adjustments applied successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in applySalaryAdjustment:", error);
    res.status(500).json({ message: "Error applying adjustment" });
  } finally {
    connection.release();
  }
};

export const generatePayroll = async (req, res) => {
  const { period } = req.body;
  if (!period) return res.status(400).json({ message: "Period is required" });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get the exact start and end dates for the selected month
    const { periodStart } = parsePeriodRange(period);

    // Keep payroll generation idempotent by replacing the selected period snapshot.
    await connection.query("DELETE FROM payroll WHERE period_start = ?", [
      periodStart,
    ]);

    // 2. Get all active rank-and-file, HR, and supervisor employees (Ignore Admin)
    const [employees] = await connection.query(
      "SELECT emp_id, basic_pay FROM employees WHERE COALESCE(role, '') != 'Admin'",
    );

    // 3. Calculate and save the snapshot for each employee
    for (const emp of employees) {
      const basicPay = Number(emp.basic_pay || 0);

      const [adjustmentRows] = await connection.query(
        `SELECT
           COALESCE(
             SUM(CASE WHEN type IN ('Bonus', 'Increase') THEN ABS(amount) ELSE 0 END),
             0
           ) as total_incentives,
           COALESCE(
             SUM(CASE WHEN type = 'Decrease' THEN ABS(amount) ELSE 0 END),
             0
           ) as total_adjustment_deductions
         FROM salary_history
         WHERE emp_id = ?
           AND DATE_FORMAT(effective_date, '%Y-%m') = ?`,
        [emp.emp_id, period],
      );
      const incentives = Number(adjustmentRows[0]?.total_incentives || 0);
      const adjustmentDeductions = Number(
        adjustmentRows[0]?.total_adjustment_deductions || 0,
      );
      const totalDeductions = Number(adjustmentDeductions.toFixed(2));

      // Calculate Gross and Net Pay
      const grossPay = Number((basicPay + incentives).toFixed(2));
      const netPay = Number((grossPay - totalDeductions).toFixed(2));

      // 4. Save the official snapshot to the payroll table
      // EXACTLY matching your database columns from the screenshot
      await connection.query(
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
          0,
          totalDeductions,
          incentives,
          grossPay,
          netPay,
        ],
      );
    }

    await connection.commit();
    res.json({ message: "Payroll generated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in generatePayroll:", error);
    res.status(500).json({ message: "Error generating payroll" });
  } finally {
    connection.release();
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
  const { period } = req.query;
  try {
    let rows;

    if (period && /^\d{4}-\d{2}$/.test(String(period))) {
      [rows] = await pool.query(
        `SELECT *
         FROM salary_history
         WHERE emp_id = ?
           AND DATE_FORMAT(effective_date, '%Y-%m') = ?
         ORDER BY effective_date DESC, id DESC`,
        [emp_id, period],
      );
    } else {
      [rows] = await pool.query(
        `SELECT *
         FROM salary_history
         WHERE emp_id = ?
         ORDER BY effective_date DESC, id DESC`,
        [emp_id],
      );
    }

    res.json(rows);
  } catch (error) {
    console.error("DB Error in getSalaryHistory:", error);
    res.status(500).json({ message: "Error fetching salary history" });
  }
};

export const updateSalaryHistoryEntry = async (req, res) => {
  const { id } = req.params;
  const { type, amount, description } = req.body;

  const normalizedType = normalizeAdjustmentType(type);
  if (!normalizedType) {
    return res.status(400).json({ message: "Invalid adjustment type" });
  }

  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT
         id,
         emp_id,
         DATE_FORMAT(effective_date, '%Y-%m') AS period_key
       FROM salary_history
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Adjustment record not found" });
    }

    const existing = existingRows[0];
    const period = existing.period_key;

    if (!period) {
      await connection.rollback();
      return res.status(400).json({ message: "Invalid adjustment period" });
    }

    await connection.query(
      `UPDATE salary_history
       SET type = ?, amount = ?, description = ?
       WHERE id = ?`,
      [normalizedType, numericAmount, description || null, id],
    );

    await recomputePayrollForEmployeesPeriod(
      connection,
      [existing.emp_id],
      period,
    );

    await connection.commit();
    res.json({ message: "Adjustment updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in updateSalaryHistoryEntry:", error);
    res.status(500).json({ message: "Error updating adjustment" });
  } finally {
    connection.release();
  }
};

export const deleteSalaryHistoryEntry = async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT
         id,
         emp_id,
         DATE_FORMAT(effective_date, '%Y-%m') AS period_key
       FROM salary_history
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Adjustment record not found" });
    }

    const existing = existingRows[0];
    const period = existing.period_key;

    if (!period) {
      await connection.rollback();
      return res.status(400).json({ message: "Invalid adjustment period" });
    }

    await connection.query("DELETE FROM salary_history WHERE id = ?", [id]);

    await recomputePayrollForEmployeesPeriod(
      connection,
      [existing.emp_id],
      period,
    );

    await connection.commit();
    res.json({ message: "Adjustment removed successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in deleteSalaryHistoryEntry:", error);
    res.status(500).json({ message: "Error removing adjustment" });
  } finally {
    connection.release();
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

  const requesterEmpId =
    req.user?.role === "Admin" && emp_id ? emp_id : req.user?.emp_id || emp_id;

  if (!requesterEmpId || !leave_type || !date_from || !date_to) {
    return res.status(400).json({
      message: "emp_id, leave_type, date_from, and date_to are required",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const requester = await getEmployeeProfile(connection, requesterEmpId);
    if (!requester) {
      await connection.rollback();
      return res.status(404).json({ message: "Requester not found" });
    }

    const [result] = await connection.query(
      `
        INSERT INTO leave_requests (
          emp_id,
          leave_type,
          date_from,
          date_to,
          priority,
          status,
          supervisor_remarks
        ) VALUES (?, ?, ?, ?, ?, 'Pending', ?)
      `,
      [
        requesterEmpId,
        leave_type,
        date_from,
        date_to,
        priority,
        supervisor_remarks || null,
      ],
    );

    await notifyApproversForRequest(connection, {
      requester,
      moduleType: "Leave",
      requestId: result.insertId,
    });

    await connection.commit();

    res
      .status(201)
      .json({ message: "Leave application submitted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in fileLeave:", error);
    res.status(500).json({ message: "Error submitting leave application" });
  } finally {
    connection.release();
  }
};

// --- REPORTS ---
// --- REPORTS ---
export const getPayrollReports = async (req, res) => {
  try {
    // 1. Get total active employees (excluding Admin)
    const [activeEmpRows] = await pool.query(
      "SELECT COUNT(*) as active_count FROM employees WHERE status != 'Inactive' AND COALESCE(role, '') != 'Admin'",
    );
    const activeEmployees = activeEmpRows[0].active_count || 0;

    // 2. Get Monthly Payroll Data
    const [payrollRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(MIN(period_start), '%Y-%m') as sort_month,
        DATE_FORMAT(MIN(period_start), '%M %Y') as display_month,
        SUM(incentives) as total_incentives, 
        SUM(gross_pay) as total_gross,
        SUM(absence_deductions) as total_deductions,
        SUM(net_pay) as total_net
      FROM payroll
      GROUP BY YEAR(period_start), MONTH(period_start)
    `);

    // 3. Get Monthly Attendance Data
    const [attendanceRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(MIN(date), '%Y-%m') as sort_month,
        DATE_FORMAT(MIN(date), '%M %Y') as display_month,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as leave_count
      FROM attendance
      GROUP BY YEAR(date), MONTH(date)
    `);

    // 4. Merge Payroll and Attendance Data together by Month
    const summaryMap = {};

    payrollRows.forEach((row) => {
      summaryMap[row.sort_month] = {
        month: row.display_month,
        sortMonth: row.sort_month,
        totalIncentives: Number(row.total_incentives || 0),
        totalGross: Number(row.total_gross || 0),
        totalDeductions: Number(row.total_deductions || 0),
        totalNet: Number(row.total_net || 0),
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0, // Default attendance
      };
    });

    attendanceRows.forEach((row) => {
      if (!summaryMap[row.sort_month]) {
        summaryMap[row.sort_month] = {
          month: row.display_month,
          sortMonth: row.sort_month,
          totalIncentives: 0,
          totalGross: 0,
          totalDeductions: 0,
          totalNet: 0,
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
        };
      }
      summaryMap[row.sort_month].present = Number(row.present_count);
      summaryMap[row.sort_month].absent = Number(row.absent_count);
      summaryMap[row.sort_month].late = Number(row.late_count);
      summaryMap[row.sort_month].onLeave = Number(row.leave_count);
    });

    // Convert to Array and Sort Newest to Oldest
    const monthlySummary = Object.values(summaryMap)
      .sort((a, b) => b.sortMonth.localeCompare(a.sortMonth))
      .slice(0, 12); // Keep last 12 months

    // Get latest data for Top Cards
    const latestMonth = monthlySummary[0] || {
      totalNet: 0,
      totalDeductions: 0,
      absent: 0,
      month: "No Data",
    };

    res.json({
      activeEmployees,
      latestMonthName: latestMonth.month,
      latestNet: latestMonth.totalNet,
      latestDeductions: latestMonth.totalDeductions,
      latestAbsences: latestMonth.absent,
      monthlySummary,
    });
  } catch (error) {
    console.error("DB Error in getPayrollReports:", error);
    res.status(500).json({ message: "Error fetching payroll reports" });
  }
};

// --- MY ATTENDANCE (For Employee Calendar) ---
export const getMyAttendance = async (req, res) => {
  try {
    const empId = req.user?.emp_id;

    if (!empId) {
      return res
        .status(400)
        .json({ message: "Employee ID missing from token" });
    }

    const [rows] = await pool.query(
      "SELECT date, status FROM attendance WHERE emp_id = ? ORDER BY date DESC",
      [empId],
    );

    res.json(rows);
  } catch (error) {
    console.error("DB Error in getMyAttendance:", error);
    res.status(500).json({ message: "Error fetching personal attendance" });
  }
};

// --- RESET PAYROLL ---
export const resetPayrollData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Delete all payroll records
    await connection.query("DELETE FROM payroll");

    // Delete all salary history records (adjustments)
    await connection.query("DELETE FROM salary_history");

    await connection.commit();

    res.json({
      message: "All payroll data has been reset successfully",
      timestamp: new Date(),
    });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in resetPayrollData:", error);
    res
      .status(500)
      .json({ message: "Error resetting payroll data", error: error.message });
  } finally {
    connection.release();
  }
};
