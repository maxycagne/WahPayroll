import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { createAccessToken, createRefreshToken } from "../helper/jwt.js";
import { ensureEmployeeGovernmentColumns } from "./employeeController.js";
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_wah_key";
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "";

const normalizeRole = (role) => {
  const value = String(role || "")
    .trim()
    .toLowerCase();

  if (value === "admin") return "Admin";
  if (value === "supervisor") return "Supervisor";
  if (value === "hr") return "HR";
  if (value === "rankandfile" || value === "rank & file") return "RankAndFile";

  return "RankAndFile";
};

const checkPassword = async (inputPassword, user) => {
  const stored = user?.password;
  const role = normalizeRole(user?.role);
  const generatedFallback = `${user.emp_id || ""}${(user.first_name || "").replace(/\s+/g, "")}`;

  if (!stored) {
    if (role === "Admin" && ADMIN_DEFAULT_PASSWORD) {
      return (
        inputPassword === ADMIN_DEFAULT_PASSWORD ||
        inputPassword === generatedFallback
      );
    }
    return inputPassword === generatedFallback;
  }

  if (
    stored.startsWith("$2b$") ||
    stored.startsWith("$2a$") ||
    stored.startsWith("$2y$")
  ) {
    return bcrypt.compare(inputPassword, stored);
  }

  // Keep Admin accessible with existing credentials while non-admins use the strict auto-password rule.
  if (role === "Admin") {
    return (
      inputPassword === stored ||
      (ADMIN_DEFAULT_PASSWORD && inputPassword === ADMIN_DEFAULT_PASSWORD) ||
      inputPassword === generatedFallback
    );
  }

  // Reject legacy plain-text stored passwords for non-admin users.
  return inputPassword === generatedFallback;
};

const getAssignedSupervisorByDesignation = async ({ designation, emp_id }) => {
  if (!designation) return null;

  const [rows] = await pool.query(
    `SELECT emp_id, first_name, last_name, designation, position
     FROM employees
     WHERE role = 'Supervisor'
       AND designation = ?
       AND emp_id <> ?
     ORDER BY emp_id ASC
     LIMIT 1`,
    [designation, emp_id],
  );

  if (!rows.length) return null;
  const sup = rows[0];
  return {
    emp_id: sup.emp_id,
    name: `${sup.first_name || ""} ${sup.last_name || ""}`.trim(),
    designation: sup.designation || null,
    position: sup.position || null,
  };
};

const buildUserPayload = async (user) => {
  const role = normalizeRole(user.role);
  const assignedSupervisor = await getAssignedSupervisorByDesignation({
    designation: user.designation,
    emp_id: user.emp_id,
  });

  return {
    emp_id: user.emp_id,
    first_name: user.first_name,
    last_name: user.last_name,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role,
    profile_photo: user.profile_photo || null,
    designation: user.designation || null,
    position: user.position || null,
    department: user.designation || null,
    date_hired: user.hired_date || null,
    assigned_supervisor: assignedSupervisor,
  };
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM employees
       WHERE LOWER(REPLACE(first_name, ' ', '')) = LOWER(?)`,
      [username],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];
    const isMatch = await checkPassword(password, user);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const role = normalizeRole(user.role);

    const token = createAccessToken({ emp_id: user.emp_id, role });
    const refreshToken = createRefreshToken({ emp_id: user.emp_id, role });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const fullUser = await buildUserPayload(user);

    res.json({
      token,
      user: {
        ...fullUser,
        role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const logout = (req, res) => {
  console.log("hit logout!");
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/api/auth/refresh",
  });
  return res.status(200).json({
    message: "Logged out successfully",
  });
};

export const getMe = async (req, res) => {
  try {
    await ensureEmployeeGovernmentColumns();

    const [rows] = await pool.query(
      "SELECT emp_id, first_name, last_name, email, role, profile_photo, designation, position, hired_date FROM employees WHERE emp_id = ?",
      [req.user.emp_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const fullUser = await buildUserPayload(user);

    res.json({
      user: fullUser,
    });
  } catch (error) {
    console.error("Me Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
