import express from "express";
import {
  getAllEmployees,
  createEmployee,
  getAllLeaves,
  updateLeaveStatus,
  getAllPayroll,
  getAttendance,
  getDashboardSummary,
  getSalaryHistory,
  applySalaryAdjustment,
  deleteEmployee,
  fileLeave,
  adjustLeaveBalance,
  updateBaseSalary,
} from "../controllers/employeeController.js";

const router = express.Router();

// Dashboard
router.get("/dashboard-summary", getDashboardSummary);

// Employees
router.get("/", getAllEmployees);
router.post("/", createEmployee);
router.put("/base-salary/:id", updateBaseSalary);
// Attendance & Leave
router.get("/attendance", getAttendance);
router.get("/leaves", getAllLeaves);
router.post("/leaves", fileLeave);
router.put("/leaves/:id", updateLeaveStatus);
router.get("/salary-history/:emp_id", getSalaryHistory);
router.post("/salary-adjustment", applySalaryAdjustment);
router.put("/leave-balance/:id", adjustLeaveBalance);
// Payroll
router.get("/payroll", getAllPayroll);
router.delete("/employees/:id", deleteEmployee);
router.delete("/:id", deleteEmployee);
export default router;
