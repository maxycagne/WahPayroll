import { Request, Response } from "express";
import pool from "../config/db";
import {
  ensureWorkweekConfigsTable,
  normalizeWorkweekType,
  WORKWEEK_DEFAULTS,
} from "./employeeController";

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.emp_id, 
        e.first_name, 
        e.last_name, 
        e.status AS emp_status, 
        (SELECT COUNT(*) FROM attendance WHERE emp_id = e.emp_id AND status = 'Absent') as total_absences,
        a.status,
        a.status2,
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

export const getAttendanceStats = async (req: Request, res: Response) => {
  const { mode = "month", month, year, start, end } = req.query as any;

  const buildMonthBounds = (monthValue: string) => {
    if (!/^\d{4}-\d{2}$/.test(String(monthValue || ""))) return null;

    const [yearValue, monthIndex] = String(monthValue).split("-").map(Number);
    const firstDay = `${yearValue}-${String(monthIndex).padStart(2, "0")}-01`;
    const lastDayDate = new Date(yearValue, monthIndex, 0);
    const lastDay = `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;
    return { startDate: firstDay, endDate: lastDay };
  };

  const buildYearBounds = (yearValue: string) => {
    if (!/^\d{4}$/.test(String(yearValue || ""))) return null;
    return {
      startDate: `${yearValue}-01-01`,
      endDate: `${yearValue}-12-31`,
    };
  };

  const buildRangeBounds = (startValue: string, endValue: string) => {
    const startBounds = buildMonthBounds(startValue);
    const endBounds = buildMonthBounds(endValue);
    if (!startBounds || !endBounds) return null;

    return startBounds.startDate <= endBounds.endDate
      ? { startDate: startBounds.startDate, endDate: endBounds.endDate }
      : { startDate: endBounds.startDate, endDate: startBounds.endDate };
  };

  const normalizedMode = String(mode || "month").toLowerCase();
  const resolvedBounds =
    normalizedMode === "year"
      ? buildYearBounds(year)
      : normalizedMode === "range"
        ? buildRangeBounds(start, end)
        : buildMonthBounds(month);

  if (!resolvedBounds) {
    return res.status(400).json({ message: "Invalid attendance stats range" });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        e.emp_id,
        e.first_name,
        e.last_name,
        e.designation,
        e.status AS emp_status,
        COALESCE(att.total_absences, 0) AS total_absences,
        COALESCE(lv.approved_leave_count, 0) AS approved_leave_count,
        COALESCE(lv.approved_leave_days, 0) AS approved_leave_days,
        COALESCE(lb.leave_balance, 0) AS leave_balance
      FROM employees e
      LEFT JOIN leave_balances lb ON e.emp_id = lb.emp_id
      LEFT JOIN (
        SELECT
          emp_id,
          COUNT(*) AS total_absences
        FROM attendance
        WHERE date BETWEEN ? AND ?
          AND (status = 'Absent' OR status2 = 'Absent')
        GROUP BY emp_id
      ) att ON e.emp_id = att.emp_id
      LEFT JOIN (
        SELECT
          emp_id,
          COUNT(*) AS approved_leave_count,
          SUM(
            COALESCE(
              approved_days,
              DATEDIFF(date_to, date_from) + 1,
              0
            )
          ) AS approved_leave_days
        FROM leave_requests
        WHERE date_to >= ?
          AND date_from <= ?
          AND status IN ('Approved', 'Partially Approved')
        GROUP BY emp_id
      ) lv ON e.emp_id = lv.emp_id
      WHERE COALESCE(e.role, '') <> 'Admin'
        AND e.status != 'Inactive'
      ORDER BY
        COALESCE(att.total_absences, 0) DESC,
        COALESCE(lv.approved_leave_days, 0) DESC,
        e.last_name ASC,
        e.first_name ASC
    `,
      [
        resolvedBounds.startDate,
        resolvedBounds.endDate,
        resolvedBounds.startDate,
        resolvedBounds.endDate,
      ],
    );

    res.json(rows);
  } catch (error) {
    console.error("DB Error in getAttendanceStats:", error);
    res.status(500).json({ message: "Error fetching attendance stats" });
  }
};

export const getDailyAttendance = async (req: Request, res: Response) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT e.emp_id, e.first_name, e.last_name, e.status as emp_status, a.status as attendance_status, a.status2
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

export const saveBulkAttendance = async (req: Request, res: Response) => {
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

    // 2. Insert the fresh records including status2
    if (records && records.length > 0) {
      for (const record of records) {
        await connection.query(
          `INSERT INTO attendance (emp_id, date, status, status2) VALUES (?, DATE(?), ?, ?)`,
          [record.emp_id, date, record.status, record.status2 || null],
        );
      }
    }

    await connection.commit();
    res.json({ message: "Attendance saved successfully" });
  } catch (error: any) {
    await connection.rollback();
    console.error("DB Error in saveBulkAttendance:", error);
    res.status(500).json({ message: "Error saving attendance" });
  } finally {
    connection.release();
  }
};

// New function for Admins to manually adjust leave balances
export const adjustLeaveBalance = async (req: Request, res: Response) => {
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

export const getWorkweekConfigs = async (req: Request, res: Response) => {
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

export const upsertWorkweekConfig = async (req: Request, res: Response) => {
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

  const { hoursPerDay, absenceUnit } = (WORKWEEK_DEFAULTS as any)[normalizedType];
  const normalizedTo = effective_to || null;
  const overlapEndDate = normalizedTo || "9999-12-31";

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureWorkweekConfigsTable(connection);

    const [overlaps]: any = await connection.query(
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

export const updateWorkweekConfigById = async (req: Request, res: Response) => {
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

  const { hoursPerDay, absenceUnit } = (WORKWEEK_DEFAULTS as any)[normalizedType];
  const normalizedTo = effective_to || null;
  const overlapEndDate = normalizedTo || "9999-12-31";

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await ensureWorkweekConfigsTable(connection);

    const [existing]: any = await connection.query(
      "SELECT id FROM workweek_configs WHERE id = ? LIMIT 1",
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Workweek config not found" });
    }

    const [overlaps]: any = await connection.query(
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

export const deleteWorkweekConfigById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await ensureWorkweekConfigsTable();

    const [result]: any = await pool.query(
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
