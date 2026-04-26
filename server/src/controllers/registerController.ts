import { Request, Response } from "express";
import pool from "../config/db.js";
import { hashPassword } from "../helper/hashPass.js";
import { ensureEmployeeGovernmentColumns } from "./employeeController.js";

const resolveRoleFromProfile = ({ designation, position }: { designation?: string; position?: string }): string => {
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

const normalizeDateInput = (value: any): string | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const directMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directMatch) return directMatch[1];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultLeaveAllocation = (status?: string): number => {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();

  return ["job order", "pgt employee", "pgt"].includes(normalizedStatus)
    ? 12
    : 27;
};

const recalculateLeaveBalanceForEmployee = async (connection: any, empId: string): Promise<number | null> => {
  const [employeeRows]: any = await connection.query(
    `SELECT status
     FROM employees
     WHERE emp_id = ?
     LIMIT 1`,
    [empId],
  );

  if (employeeRows.length === 0) return null;

  const defaultLeave = getDefaultLeaveAllocation(employeeRows[0].status);

  await connection.query(
    `INSERT INTO leave_balances (emp_id, leave_balance, offset_credits)
     VALUES (?, ?, 0)
     ON DUPLICATE KEY UPDATE leave_balance = VALUES(leave_balance)`,
    [empId, defaultLeave],
  );

  return defaultLeave;
};

export const register = async (req: Request, res: Response): Promise<any> => {
  const {
    first_name,
    last_name,
    middle_initial,
    designation,
    position,
    status,
    email,
    philhealth_no,
    tin,
    sss_no,
    pag_ibig_mid_no,
    gsis_no,
    hired_date,
    password,
  } = req.body;

  if (!first_name || !last_name || !email || !password || !tin || !sss_no || !pag_ibig_mid_no) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [existingEmailRows]: any = await pool.query(
      "SELECT email FROM employees WHERE email = ? LIMIT 1",
      [email],
    );

    if (existingEmailRows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashPass = await hashPassword(password);
    const employeeRole = resolveRoleFromProfile({ designation, position });
    const normalizedHiredDate = normalizeDateInput(hired_date);

    await ensureEmployeeGovernmentColumns();

    // Use a temporary ID for the registration request
    const tempId = `TEMP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    await pool.query(
      `INSERT INTO employees (
        emp_id, first_name, last_name, middle_initial, designation, 
        position, status, email, philhealth_no, tin, sss_no, 
        pag_ibig_mid_no, gsis_no, hired_date, 
        password, role, registration_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        tempId,
        first_name,
        last_name,
        middle_initial || null,
        designation || null,
        position || null,
        status || "Permanent",
        email,
        philhealth_no || null,
        tin || null,
        sss_no || null,
        pag_ibig_mid_no || null,
        gsis_no || null,
        normalizedHiredDate,
        hashPass,
        employeeRole,
      ],
    );

    res.status(201).json({ message: "Registration submitted for approval" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const getPendingRequests = async (req: Request, res: Response): Promise<any> => {
  try {
    await ensureEmployeeGovernmentColumns();

    const viewerRole = (req as any).user?.role;
    if (viewerRole !== 'Admin' && viewerRole !== 'HR') {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [rows]: any = await pool.query(
      `SELECT emp_id, first_name, last_name, middle_initial, email, role, position, designation, status, hired_date, philhealth_no, tin, sss_no, pag_ibig_mid_no, gsis_no 
       FROM employees 
       WHERE registration_status = 'Pending' 
       ORDER BY emp_id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("DB Error in getPendingRequests:", error);
    res.status(500).json({ message: "Error fetching pending requests" });
  }
};

export const approveRequest = async (req: Request, res: Response): Promise<any> => {
  const { id: tempId } = req.params;
  const { 
    emp_id,
    first_name,
    last_name,
    middle_initial,
    designation,
    position,
    status,
    email,
    philhealth_no,
    tin,
    sss_no,
    pag_ibig_mid_no,
    gsis_no,
    hired_date,
  } = req.body;
  
  const reviewerId = (req as any).user?.emp_id;
  const viewerRole = (req as any).user?.role;

  if (!emp_id) {
    return res.status(400).json({ message: "Employee ID is required for approval" });
  }

  try {
    await ensureEmployeeGovernmentColumns();

    // Check if new emp_id already exists
    const [existingIdRows]: any = await pool.query(
      "SELECT emp_id FROM employees WHERE emp_id = ? AND emp_id != ?",
      [emp_id, tempId]
    );

    if (existingIdRows.length > 0) {
      return res.status(400).json({ message: "Employee ID already in use" });
    }

    if (viewerRole !== 'Admin' && viewerRole !== 'HR') {
        return res.status(403).json({ message: "Forbidden" });
    }

    // Verify tempId exists
    const [tempUserRows]: any = await pool.query(
      "SELECT emp_id FROM employees WHERE emp_id = ?",
      [tempId]
    );

    if (tempUserRows.length === 0) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    const employeeRole = resolveRoleFromProfile({ designation, position });
    const normalizedHiredDate = normalizeDateInput(hired_date);

    // Update the record with the new ID and details
    // We use a specific order to avoid PK conflicts if possible, 
    // although mysql handles this in a single UPDATE usually.
    await pool.query(
      `UPDATE employees 
       SET emp_id = ?,
           first_name = ?,
           last_name = ?,
           middle_initial = ?,
           designation = ?,
           position = ?,
           status = ?,
           email = ?,
           philhealth_no = ?,
           tin = ?,
           sss_no = ?,
           pag_ibig_mid_no = ?,
           gsis_no = ?,
           hired_date = ?,
           role = ?,
           registration_status = 'Approved', 
           reviewed_by = ?, 
           reviewed_at = CURRENT_TIMESTAMP 
       WHERE emp_id = ?`,
      [
        emp_id,
        first_name,
        last_name,
        middle_initial || null,
        designation,
        position,
        status,
        email,
        philhealth_no || null,
        tin || null,
        sss_no || null,
        pag_ibig_mid_no || null,
        gsis_no || null,
        normalizedHiredDate,
        employeeRole,
        reviewerId,
        tempId
      ]
    );

    await recalculateLeaveBalanceForEmployee(pool, emp_id);

    res.json({ message: "User approved successfully" });
  } catch (error) {
    console.error("DB Error in approveRequest:", error);
    res.status(500).json({ message: "Error approving request" });
  }
};

export const rejectRequest = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { remarks } = req.body;
  const reviewerId = (req as any).user?.emp_id;

  try {
    await ensureEmployeeGovernmentColumns();

    // Delete the temporary record on rejection to keep employees table clean
    await pool.query("DELETE FROM employees WHERE emp_id = ? AND registration_status = 'Pending'", [id]);

    res.json({ message: "User registration rejected and removed" });
  } catch (error) {
    console.error("DB Error in rejectRequest:", error);
    res.status(500).json({ message: "Error rejecting request" });
  }
};
