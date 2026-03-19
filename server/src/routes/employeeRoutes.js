import express from "express";
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllLeaves,
  updateLeaveStatus,
  fileLeave,
  getAllPayroll,
  getAttendance,
  adjustLeaveBalance,
  getDashboardSummary,
  getSalaryHistory,
  applySalaryAdjustment,
  getAttendanceCalendarSummary, // <-- New
  getDailyAttendance, // <-- New
  saveBulkAttendance, // <-- New
} from "../controllers/employeeController.js";

const router = express.Router();

// --- Dashboard ---
router.get("/dashboard-summary", getDashboardSummary);

// --- Attendance & Calendar ---
router.get("/attendance", getAttendance);
router.put("/leave-balance/:id", adjustLeaveBalance);
router.get("/attendance-summary", getAttendanceCalendarSummary); // Fixes the 404
router.get("/attendance-daily", getDailyAttendance); // Fixes the 404
router.post("/attendance-bulk", saveBulkAttendance); // Fixes the 404

// --- Leaves ---
router.get("/leaves", getAllLeaves);
router.post("/leaves", fileLeave);
router.put("/leaves/:id", updateLeaveStatus);

// --- Payroll & Salary ---
router.get("/payroll", getAllPayroll);
router.post("/salary-adjustment", applySalaryAdjustment);
router.get("/salary-history/:emp_id", getSalaryHistory);

// --- Employees ---
router.get("/", getAllEmployees);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
