import { Request, Response } from "express";
import pool from "../config/db";
import { s3Client, s3BucketName } from "../config/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import {
  ensureResignationsTable,
  ensureEmployeeMissingDocsTable,
  getEmployeeProfile,
  recalculateLeaveBalanceForEmployee,
  ensureOffsetTables,
  ensureEmployeeGovernmentColumns,
  parsePeriodRange,
  calculateLeaveCreditsInternal,
  canApproverReviewRequester,
  notifyRequesterForCancellationDecision,
  notifyRequesterForDecision,
  ensureLeaveApprovalColumns,
} from "./employeeController";

// Helper to delete leave documents from S3
const deleteLeaveDocuments = async (documentsJson: any) => {
  if (!documentsJson) return;
  try {
    const docs = typeof documentsJson === "string" ? JSON.parse(documentsJson) : documentsJson;
    const deletePromises = Object.values(docs).map((doc: any) => {
      if (doc && doc.key) {
        return s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3BucketName,
            Key: doc.key,
          })
        ).catch(err => {
          if (err?.name !== "NoSuchKey") {
            console.error(`Error deleting file ${doc.key}:`, err);
          }
        });
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error parsing/deleting documents:", error);
  }
};

// --- DASHBOARD ---
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    await ensureResignationsTable();
    await ensureEmployeeMissingDocsTable();

    const currentUser: any = await getEmployeeProfile(pool, (req as any).user?.emp_id);
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await recalculateLeaveBalanceForEmployee(pool, currentUser.emp_id);

    const isAdmin = currentUser.role === "Admin";
    const isHR = currentUser.role === "HR";
    const isSupervisor = currentUser.role === "Supervisor";
    const isRankAndFile = currentUser.role === "RankAndFile";

    const pendingLeaveStatuses = ["Pending", "Pending Approval", "Pending Review"];

    let pending = [];
    if (isAdmin || isHR) {
      const [rows]: any = await pool.query(
        `
          SELECT l.*, e.first_name, e.last_name
          FROM leave_requests l
          JOIN employees e ON l.emp_id = e.emp_id
          WHERE l.status IN (?, ?, ?)
            AND e.emp_id <> ?
        `,
        [...pendingLeaveStatuses, currentUser.emp_id],
      );
      pending = rows;
    } else if (isSupervisor) {
      const [rows]: any = await pool.query(
        `
          SELECT l.*, e.first_name, e.last_name
          FROM leave_requests l
          JOIN employees e ON l.emp_id = e.emp_id
          WHERE l.status IN (?, ?, ?)
            AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
            AND e.designation = ?
            AND e.emp_id <> ?
        `,
        [...pendingLeaveStatuses, currentUser.designation || "", currentUser.emp_id],
      );
      pending = rows;
    }

    let onLeave = [];
    if (isAdmin || isHR) {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation, l.leave_type
         FROM employees e
         JOIN leave_requests l ON e.emp_id = l.emp_id
         WHERE CURDATE() BETWEEN l.date_from AND l.date_to
           AND l.status = 'Approved'`,
      );
      onLeave = rows;
    } else if (isSupervisor) {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation, l.leave_type
         FROM employees e
         JOIN leave_requests l ON e.emp_id = l.emp_id
         WHERE CURDATE() BETWEEN l.date_from AND l.date_to
           AND l.status = 'Approved'
           AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND e.designation = ?
           AND e.emp_id <> ?`,
        [currentUser.designation || "", currentUser.emp_id],
      );
      onLeave = rows;
    } else {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation, l.leave_type
         FROM employees e
         JOIN leave_requests l ON e.emp_id = l.emp_id
         WHERE e.emp_id = ?
           AND CURDATE() BETWEEN l.date_from AND l.date_to
           AND l.status = 'Approved'`,
        [currentUser.emp_id],
      );
      onLeave = rows;
    }

    let absents = [];
    if (isAdmin || isHR) {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation
         FROM employees e
         LEFT JOIN attendance a ON e.emp_id = a.emp_id AND a.date = CURDATE()
         WHERE e.status != 'Inactive'
           AND COALESCE(e.role, '') <> 'Admin'
           AND (a.emp_id IS NULL OR a.status = 'Absent' OR a.status2 = 'Absent')
           AND e.emp_id NOT IN (
             SELECT l.emp_id 
             FROM leave_requests l 
             WHERE CURDATE() BETWEEN l.date_from AND l.date_to 
               AND l.status = 'Approved'
           )`,
      );
      absents = rows;
    } else if (isSupervisor) {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation
         FROM employees e
         LEFT JOIN attendance a ON e.emp_id = a.emp_id AND a.date = CURDATE()
         WHERE e.status != 'Inactive'
           AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND e.designation = ?
           AND e.emp_id <> ?
           AND (a.emp_id IS NULL OR a.status = 'Absent' OR a.status2 = 'Absent')
           AND e.emp_id NOT IN (
             SELECT l.emp_id 
             FROM leave_requests l 
             WHERE CURDATE() BETWEEN l.date_from AND l.date_to 
               AND l.status = 'Approved'
           )`,
        [currentUser.designation || "", currentUser.emp_id],
      );
      absents = rows;
    } else {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation
         FROM employees e
         LEFT JOIN attendance a ON e.emp_id = a.emp_id AND a.date = CURDATE()
         WHERE e.emp_id = ?
           AND (a.emp_id IS NULL OR a.status = 'Absent' OR a.status2 = 'Absent')
           AND e.emp_id NOT IN (
             SELECT l.emp_id 
             FROM leave_requests l 
             WHERE CURDATE() BETWEEN l.date_from AND l.date_to 
               AND l.status = 'Approved'
           )`,
        [currentUser.emp_id],
      );
      absents = rows;
    }

    let balances = [];
    if (isAdmin || isHR) {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation, lb.leave_balance, lb.offset_credits
         FROM employees e
         JOIN leave_balances lb ON e.emp_id = lb.emp_id`,
      );
      balances = rows;
    } else {
      const [rows]: any = await pool.query(
        `SELECT e.emp_id, e.first_name, e.last_name, e.designation, lb.leave_balance, lb.offset_credits
         FROM employees e
         JOIN leave_balances lb ON e.emp_id = lb.emp_id
         WHERE e.emp_id = ?`,
        [currentUser.emp_id],
      );
      balances = rows;
    }

    let resignations = [];
    if (isAdmin || isHR) {
      const [rows]: any = await pool.query(
        `
          SELECT r.*, e.first_name, e.last_name
          FROM resignations r
          JOIN employees e ON r.emp_id = e.emp_id
          WHERE r.status IN ('Pending Approval', 'Clearance Uploaded')
            AND e.emp_id <> ?
        `,
        [currentUser.emp_id],
      );
      resignations = rows;
    } else if (isSupervisor) {
      const [rows]: any = await pool.query(
        `
          SELECT r.*, e.first_name, e.last_name
          FROM resignations r
          JOIN employees e ON r.emp_id = e.emp_id
          WHERE r.status IN ('Pending Approval', 'Clearance Uploaded')
            AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
            AND e.designation = ?
            AND e.emp_id <> ?
        `,
        [currentUser.designation || "", currentUser.emp_id],
      );
      resignations = rows;
    }

    let missingDocs = [];
    if (isAdmin || isHR) {
      const [rows]: any = await pool.query(
        `SELECT m.*, e.first_name, e.last_name, e.designation, e.hired_date
         FROM employee_missing_docs m
         JOIN employees e ON m.emp_id = e.emp_id`,
      );
      missingDocs = rows;
    } else if (isSupervisor) {
      const [rows]: any = await pool.query(
        `SELECT m.*, e.first_name, e.last_name, e.designation, e.hired_date
         FROM employee_missing_docs m
         JOIN employees e ON m.emp_id = e.emp_id
         WHERE COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND e.designation = ?
           AND e.emp_id <> ?`,
        [currentUser.designation || "", currentUser.emp_id],
      );
      missingDocs = rows;
    } else {
      const [rows]: any = await pool.query(
        `SELECT m.*, e.first_name, e.last_name, e.designation, e.hired_date
         FROM employee_missing_docs m
         JOIN employees e ON m.emp_id = e.emp_id
         WHERE m.emp_id = ?`,
        [currentUser.emp_id],
      );
      missingDocs = rows;
    }

    const [todayAttendanceRows]: any = await pool.query(
      `SELECT status
       FROM attendance
       WHERE emp_id = ?
         AND date = CURDATE()
       LIMIT 1`,
      [currentUser.emp_id],
    );

    const [myPendingLeaves]: any = await pool.query(
      `SELECT COUNT(*) as total
       FROM leave_requests
       WHERE emp_id = ?
         AND status IN (?, ?, ?)`,
      [currentUser.emp_id, ...pendingLeaveStatuses],
    );

    const [myPendingOffsets]: any = await pool.query(
      `SELECT COUNT(*) as total
       FROM offset_applications
       WHERE emp_id = ?
         AND status IN ('Pending', 'Pending Approval')`,
      [currentUser.emp_id],
    );

    const [myPendingResignations]: any = await pool.query(
      `SELECT COUNT(*) as total
       FROM resignations
       WHERE emp_id = ?
         AND status = 'Pending Approval'`,
      [currentUser.emp_id],
    );

    const personalSummary = {
      employeeStatus: currentUser.status || "N/A",
      todayAttendanceStatus:
        todayAttendanceRows.length > 0
          ? String(todayAttendanceRows[0].status || "Pending")
          : "Absent",
      pendingRequestCount:
        Number(myPendingLeaves[0]?.total || 0) +
        Number(myPendingOffsets[0]?.total || 0) +
        Number(myPendingResignations[0]?.total || 0),
      leaveBalance: Number(balances[0]?.leave_balance || 0),
      offsetCredits: Number(balances[0]?.offset_credits || 0),
      hasMissingDocs: missingDocs.length > 0,
    };

    let teamSummary = null;
    let teamAttendanceStatus = [];
    let teamPendingRequests = [];

    if (isSupervisor) {
      const [teamMembers]: any = await pool.query(
        `SELECT emp_id, first_name, last_name
         FROM employees
         WHERE COALESCE(role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND designation = ?
           AND emp_id <> ?
           AND status != 'Inactive'`,
        [currentUser.designation || "", currentUser.emp_id],
      );

      const [teamAttendanceRows]: any = await pool.query(
        `SELECT a.emp_id, a.status
         FROM attendance a
         JOIN employees e ON e.emp_id = a.emp_id
         WHERE a.date = CURDATE()
           AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND e.designation = ?
           AND e.emp_id <> ?`,
        [currentUser.designation || "", currentUser.emp_id],
      );

      const attendanceByEmp = teamAttendanceRows.reduce((acc: any, row: any) => {
        acc[row.emp_id] = String(row.status || "Present");
        return acc;
      }, {});

      teamAttendanceStatus = teamMembers.map((member: any) => {
        const onLeaveMatch = onLeave.find(
          (item: any) => String(item.emp_id) === String(member.emp_id),
        );

        if (onLeaveMatch) {
          return {
            ...member,
            status: "On Leave",
          };
        }

        return {
          ...member,
          status: attendanceByEmp[member.emp_id] || "No status / No time-in recorded",
        };
      });

      const presentCount = teamAttendanceStatus.filter((row: any) =>
        String(row.status || "")
          .toLowerCase()
          .includes("present"),
      ).length;
      const lateCount = teamAttendanceStatus.filter((row: any) =>
        String(row.status || "")
          .toLowerCase()
          .includes("late"),
      ).length;
      const onLeaveCount = teamAttendanceStatus.filter(
        (row: any) => String(row.status || "").toLowerCase() === "on leave",
      ).length;
      const absentCount = teamAttendanceStatus.filter(
        (row: any) => String(row.status || "").toLowerCase() === "absent",
      ).length;

      const [pendingOffsetRows]: any = await pool.query(
        `SELECT oa.id, oa.emp_id, oa.days_applied, oa.created_at, e.first_name, e.last_name
         FROM offset_applications oa
         JOIN employees e ON e.emp_id = oa.emp_id
         WHERE oa.status IN ('Pending', 'Pending Approval')
           AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND e.designation = ?
           AND e.emp_id <> ?
         ORDER BY oa.created_at DESC
         LIMIT 20`,
        [currentUser.designation || "", currentUser.emp_id],
      );

      const [pendingResignationRows]: any = await pool.query(
        `SELECT r.id, r.emp_id, r.resignation_type, r.created_at, e.first_name, e.last_name
         FROM resignations r
         JOIN employees e ON e.emp_id = r.emp_id
         WHERE r.status IN ('Pending Approval', 'Clearance Uploaded')
           AND COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
           AND e.designation = ?
           AND e.emp_id <> ?
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [currentUser.designation || "", currentUser.emp_id],
      );

      teamPendingRequests = [
        ...pending.map((row: any) => ({
          id: `leave-${row.id}`,
          type: "Leave",
          emp_id: row.emp_id,
          first_name: row.first_name,
          last_name: row.last_name,
          detail: row.leave_type,
          created_at: row.created_at || row.date_from,
        })),
        ...pendingOffsetRows.map((row: any) => ({
          id: `offset-${row.id}`,
          type: "Offset",
          emp_id: row.emp_id,
          first_name: row.first_name,
          last_name: row.last_name,
          detail: `${Number(row.days_applied || 0)} day(s)`,
          created_at: row.created_at,
        })),
        ...pendingResignationRows.map((row: any) => ({
          id: `resignation-${row.id}`,
          type: "Resignation",
          emp_id: row.emp_id,
          first_name: row.first_name,
          last_name: row.last_name,
          detail: row.resignation_type,
          created_at: row.created_at,
        })),
      ]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      teamSummary = {
        teamSize: teamMembers.length,
        presentCount,
        lateCount,
        absentCount,
        onLeaveCount,
        pendingApprovals: teamPendingRequests.length,
      };
    }

    if (isRankAndFile) {
      pending = [];
      resignations = [];
      teamAttendanceStatus = [];
      teamPendingRequests = [];
    }

    res.json({
      pendingLeaves: pending,
      onLeave,
      absents,
      balances,
      resignations,
      missingDocs,
      personalSummary,
      teamSummary,
      teamAttendanceStatus,
      teamPendingRequests,
      recentActivities: [],
    });
  } catch (error) {
    console.error("DB Error in getDashboardSummary:", error);
    res.status(500).json({ message: "Error loading dashboard" });
  }
};

// --- EMPLOYEES ---
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    await ensureEmployeeGovernmentColumns();

    const fetchAll = String(req.query.all || "").toLowerCase() === "true";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "All";
    const designation = (req.query.designation as string) || "All";

    const offset = (page - 1) * limit;

    let whereClause = "registration_status = 'Approved' AND emp_id NOT LIKE 'TEMP\\_%' AND COALESCE(role, '') <> 'Admin'";
    const queryParams: any[] = [];

    if (search) {
      whereClause += " AND (first_name LIKE ? OR last_name LIKE ? OR emp_id LIKE ?)";
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }

    if (status !== "All") {
      whereClause += " AND status = ?";
      queryParams.push(status);
    }

    if (designation !== "All") {
      whereClause += " AND designation = ?";
      queryParams.push(designation);
    }

    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM employees WHERE ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    const [rows] = await pool.query(
      fetchAll
        ? `SELECT *
           FROM employees
           WHERE ${whereClause}
           ORDER BY
             CAST(COALESCE(NULLIF(REGEXP_SUBSTR(emp_id, '[0-9]+$'), ''), '0') AS UNSIGNED) ASC,
             emp_id ASC`
        : `SELECT *
           FROM employees
           WHERE ${whereClause}
           ORDER BY
             CAST(COALESCE(NULLIF(REGEXP_SUBSTR(emp_id, '[0-9]+$'), ''), '0') AS UNSIGNED) ASC,
             emp_id ASC
           LIMIT ? OFFSET ?`,
      fetchAll ? queryParams : [...queryParams, limit, offset]
    );

    res.json({
      data: rows,
      total: totalCount,
      page: fetchAll ? 1 : page,
      totalPages: fetchAll ? 1 : Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("DB Error in getAllEmployees:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

// --- RESIGNATIONS ---
export const getResignations = async (req: Request, res: Response) => {
  try {
    await ensureResignationsTable();

    const viewer: any = await getEmployeeProfile(pool, (req as any).user?.emp_id);
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
             e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      params.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    }

    query += " ORDER BY r.created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getResignations:", error);
    res.status(500).json({ message: "Error fetching resignations" });
  }
};

// --- ATTENDANCE ---
export const getAttendanceCalendarSummary = async (req: Request, res: Response) => {
  const { month, year } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, 
             DATE_FORMAT(date, '%Y-%m-%d') as formatted_date,
             SUM(CASE WHEN status = 'Present' OR status2 = 'Present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN status = 'Absent' OR status2 = 'Absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN status = 'Late' OR status2 = 'Late' THEN 1 ELSE 0 END) as late_count,
             SUM(CASE WHEN status = 'Undertime' OR status2 = 'Undertime' THEN 1 ELSE 0 END) as undertime_count,
             SUM(CASE WHEN status = 'Half-Day' OR status2 = 'Half-Day' THEN 1 ELSE 0 END) as halfday_count,
             SUM(CASE WHEN status = 'On Leave' OR status2 = 'On Leave' THEN 1 ELSE 0 END) as leave_count,
             SUM(CASE WHEN status2 = 'No-notice-via-text' THEN 1 ELSE 0 END) as no_notice_text_count,
             SUM(CASE WHEN status2 = 'No-notice-email' THEN 1 ELSE 0 END) as no_notice_email_count
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

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const empId = (req as any).user?.emp_id;

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

// --- LEAVES ---
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    await ensureLeaveApprovalColumns();

    const viewer: any = await getEmployeeProfile(pool, (req as any).user?.emp_id);
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    let query = `
      SELECT 
        l.*, 
        DATE_FORMAT(l.date_from, '%Y-%m-%d') as date_from,
    DATE_FORMAT(l.date_to, '%Y-%m-%d') as date_to,
        e.first_name, 
        e.last_name, 
        e.email,          
        e.designation, 
        COALESCE(e.role, 'RankAndFile') as requester_role
      FROM leave_requests l
      JOIN employees e ON l.emp_id = e.emp_id
    `;
    const queryParams: any[] = [];

    if (viewer.role === "RankAndFile") {
      query += " WHERE l.emp_id = ?";
      queryParams.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      query += `
        WHERE l.emp_id = ?
           OR (
             e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    }

    query += " ORDER BY l.id DESC";

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAllLeaves:", error);
    res.status(500).json({ message: "Error fetching leaves" });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    status,
    supervisor_remarks,
    approved_days,
    approved_dates,
    decision_mode,
  } = req.body;
  const trimmedRemarks = String(supervisor_remarks || "").trim();

  if (
    !["Pending", "Approved", "Denied", "Partially Approved"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid leave status" });
  }

  const approverId = (req as any).user?.emp_id;
  if (!approverId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureLeaveApprovalColumns(connection as any);

    const approver: any = await getEmployeeProfile(connection as any, approverId);
    if (!approver) {
      await connection.rollback();
      return res.status(401).json({ message: "Approver not found" });
    }

    const [rows]: any = await connection.query(
      "SELECT id, emp_id, date_from, date_to, status, approved_days, documents, cancellation_requested_at FROM leave_requests WHERE id = ? LIMIT 1",
      [id],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leaveRequest = rows[0];
    const requester: any = await getEmployeeProfile(connection as any, leaveRequest.emp_id);

    const totalRequestDays = await calculateLeaveCreditsInternal(
      connection,
      leaveRequest.date_from,
      leaveRequest.date_to,
    );

    const getEffectiveApprovedDays = (statusValue: any, approvedDaysValue: any) => {
      if (
        !["Approved", "Partially Approved"].includes(String(statusValue || ""))
      ) {
        return 0;
      }

      const parsedValue = Number(approvedDaysValue);
      if (!Number.isNaN(parsedValue) && parsedValue > 0) {
        return parsedValue;
      }

      return String(statusValue || "") === "Approved" ? totalRequestDays : 0;
    };

    const previousEffectiveApprovedDays = getEffectiveApprovedDays(
      leaveRequest.status,
      leaveRequest.approved_days,
    );

    if (!canApproverReviewRequester(approver, requester)) {
      await connection.rollback();
      return res.status(403).json({
        message: "You are not allowed to approve this leave request",
      });
    }

    if (decision_mode === "cancellation") {
      if (!["Approved", "Denied"].includes(status)) {
        await connection.rollback();
        return res.status(400).json({
          message: "Invalid cancellation decision status",
        });
      }

      if (!leaveRequest.cancellation_requested_at) {
        await connection.rollback();
        return res.status(400).json({
          message: "No cancellation request is pending approval",
        });
      }

      if (status === "Denied" && !trimmedRemarks) {
        await connection.rollback();
        return res.status(400).json({
          message: "Reason is required for denial",
        });
      }

      if (!["Approved", "Partially Approved"].includes(leaveRequest.status)) {
        await connection.rollback();
        return res.status(400).json({
          message: "Only approved leave requests can be cancelled",
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(leaveRequest.date_from);
      startDate.setHours(0, 0, 0, 0);
      if (startDate <= today) {
        await connection.rollback();
        return res.status(400).json({
          message: "Cannot process cancellation on or after the start date",
        });
      }

      if (status === "Approved") {
        await deleteLeaveDocuments(leaveRequest.documents);
        await connection.query("DELETE FROM leave_requests WHERE id = ?", [id]);
      } else {
        await connection.query(
          `
            UPDATE leave_requests
            SET cancellation_requested_at = NULL,
                supervisor_remarks = ?
            WHERE id = ?
          `,
          [trimmedRemarks, id],
        );
      }

      await recalculateLeaveBalanceForEmployee(connection, leaveRequest.emp_id);

      await notifyRequesterForCancellationDecision(connection, {
        requesterEmpId: leaveRequest.emp_id,
        moduleType: "Leave",
        status,
        approverName: `${approver.first_name} ${approver.last_name}`.trim(),
        fromDate: leaveRequest.date_from,
        toDate: leaveRequest.date_to,
        descriptor: "leave request",
      });

      await connection.commit();
      return res.json({
        message: `Leave cancellation ${status.toLowerCase()} successfully`,
      });
    }

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

    if (status === "Denied") {
      await deleteLeaveDocuments(leaveRequest.documents);
    }

    const remarksValue = status === "Denied" ? trimmedRemarks : null;

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

    const nextEffectiveApprovedDays = getEffectiveApprovedDays(
      status,
      finalApprovedDays,
    );

    const leaveBalanceDelta =
      Number(nextEffectiveApprovedDays || 0) -
      Number(previousEffectiveApprovedDays || 0);

    await connection.query(
      `
        UPDATE leave_requests
        SET status = ?,
            approved_days = ?,
            approved_dates = ?,
            supervisor_remarks = ?,
            documents = CASE WHEN ? = 'Denied' THEN NULL ELSE documents END
        WHERE id = ?
      `,
      [status, finalApprovedDays, finalApprovedDates, remarksValue, status, id],
    );

    if (leaveBalanceDelta !== 0) {
      await recalculateLeaveBalanceForEmployee(connection, leaveRequest.emp_id);
    }

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
export const getAllPayroll = async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const { periodStart } = parsePeriodRange(period);
    const viewer: any = await getEmployeeProfile(pool, (req as any).user?.emp_id);

    if (!viewer) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let scopedWhereClause = "p.period_start = ?";
    const scopedParams: any[] = [periodStart];

    if (viewer.role === "RankAndFile") {
      scopedWhereClause += " AND p.emp_id = ?";
      scopedParams.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      scopedWhereClause += `
        AND (
          p.emp_id = ?
          OR (
            COALESCE(e.role, '') IN ('RankAndFile', 'HR', 'Admin')
            AND e.designation = ?
            AND e.emp_id <> ?
          )
        )
      `;
      scopedParams.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    }

    const fetchAll = String(req.query.all || "").toLowerCase() === "true";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const search = (req.query.search as string) || "";
    const designationFilter = (req.query.designationFilter as string) || "All";

    if (search) {
      scopedWhereClause += " AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.emp_id LIKE ?)";
      const searchParam = `%${search}%`;
      scopedParams.push(searchParam, searchParam, searchParam);
    }

    if (designationFilter !== "All") {
      scopedWhereClause += " AND e.designation = ?";
      scopedParams.push(designationFilter);
    }

    const offset = (page - 1) * limit;

    const [summaryResult]: any = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(p.gross_pay) as total_gross,
         SUM(COALESCE(adj.total_deductions, p.absence_deductions, 0)) as total_deductions,
         SUM(p.basic_pay + COALESCE(adj.total_incentives, p.incentives, 0) - COALESCE(adj.total_deductions, p.absence_deductions, 0)) as total_net
       FROM payroll p 
       JOIN employees e ON p.emp_id = e.emp_id 
       LEFT JOIN (
         SELECT emp_id,
                SUM(CASE WHEN type IN ('Bonus', 'Increase') THEN ABS(amount) ELSE 0 END) AS total_incentives,
                SUM(CASE WHEN type = 'Decrease' THEN ABS(amount) ELSE 0 END) AS total_deductions
         FROM salary_history
         WHERE DATE_FORMAT(effective_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
         GROUP BY emp_id
       ) adj ON adj.emp_id = p.emp_id
       WHERE ${scopedWhereClause}`,
      [periodStart, ...scopedParams]
    );
    const totalCount = summaryResult[0]?.total || 0;
    const summary = {
      gross: summaryResult[0]?.total_gross || 0,
      deductions: summaryResult[0]?.total_deductions || 0,
      net: summaryResult[0]?.total_net || 0,
    };

    const [rows]: any = await pool.query(
      `SELECT
         p.*,
         e.first_name,
         e.last_name,
         e.designation,
         e.profile_photo,
         e.position,
         COALESCE(adj.total_incentives, p.incentives, 0) AS recalculated_incentives,
         COALESCE(adj.total_deductions, p.absence_deductions, 0) AS recalculated_deductions,
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
               WHEN type IN ('Bonus', 'Increase') THEN CONCAT(
                 COALESCE(NULLIF(TRIM(description), ''), 'Unspecified incentive type'),
                 ' = ₱',
                 FORMAT(ABS(amount), 2)
               )
               ELSE NULL
             END
             ORDER BY effective_date DESC, id DESC
             SEPARATOR ' | '
           ) AS incentive_reasons,
           COALESCE(
             SUM(CASE WHEN type IN ('Bonus', 'Increase') THEN ABS(amount) ELSE 0 END),
             0
           ) AS total_incentives,
           GROUP_CONCAT(
             CASE
               WHEN type = 'Decrease' THEN CONCAT(
                 COALESCE(NULLIF(TRIM(description), ''), 'Unspecified deduction type'),
                 ' = ₱',
                 FORMAT(ABS(amount), 2)
               )
               ELSE NULL
             END
             ORDER BY effective_date DESC, id DESC
             SEPARATOR ' | '
           ) AS deduction_reasons,
           COALESCE(
             SUM(CASE WHEN type = 'Decrease' THEN ABS(amount) ELSE 0 END),
             0
           ) AS total_deductions,
           GROUP_CONCAT(
             CONCAT(
               type,
               ': ',
               COALESCE(NULLIF(TRIM(description), ''), 'Unspecified type'),
               ' = ₱',
               FORMAT(ABS(amount), 2)
             )
             ORDER BY effective_date DESC, id DESC
             SEPARATOR ' | '
           ) AS adjustment_reasons
         FROM salary_history
         WHERE DATE_FORMAT(effective_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
         GROUP BY emp_id
       ) adj ON adj.emp_id = p.emp_id
       WHERE ${scopedWhereClause}
       ORDER BY
         CAST(COALESCE(NULLIF(REGEXP_SUBSTR(p.emp_id, '[0-9]+$'), ''), '0') AS UNSIGNED) ASC,
         p.emp_id ASC
       ${fetchAll ? "" : "LIMIT ? OFFSET ?"}`,
      fetchAll
        ? [periodStart, ...scopedParams]
        : [periodStart, ...scopedParams, limit, offset],
    );

    const enrichedRows = rows.map((row: any) => {
      const basicPay = Number(row.basic_pay || 0);
      const incentives = Number(row.recalculated_incentives || 0);
      const totalDeductions = Number(row.recalculated_deductions || 0);
      const netPay = Number(
        (basicPay + incentives - totalDeductions).toFixed(2),
      );
      const grossPay = Number((basicPay + incentives).toFixed(2));

      return {
        ...row,
        absences_count: 0,
        converted_absences: 0,
        incentives,
        gross_pay: grossPay,
        absence_deductions: totalDeductions,
        baseline_absence_deductions: 0,
        adjustment_deductions: totalDeductions,
        net_pay: netPay,
      };
    });

    res.json({
      data: enrichedRows,
      total: totalCount,
      summary,
      page: fetchAll ? 1 : page,
      totalPages: fetchAll ? 1 : Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("DB Error in getAllPayroll:", error);
    res.status(500).json({ message: "Error fetching payroll" });
  }
};

// --- OFFSET APPLICATIONS ---
export const getOffsetApplications = async (req: Request, res: Response) => {
  try {
    await ensureOffsetTables();

    const viewer: any = await getEmployeeProfile(pool, (req as any).user?.emp_id);
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
    const queryParams: any[] = [];

    if (viewer.role === "RankAndFile") {
      query += " WHERE oa.emp_id = ?";
      queryParams.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      query += `
        WHERE oa.emp_id = ?
           OR (
             e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    }

    query += " ORDER BY oa.created_at DESC";

    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("DB Error in getOffsetApplications:", error);
    res.status(500).json({ message: "Error fetching offset applications" });
  }
};
