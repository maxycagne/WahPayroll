import { Request, Response } from "express";
import pool from "../config/db.js";
import { hashPassword } from "../helper/hashPass.js";
import bcrypt from "bcrypt";

// Define a type that extends Request to include the user property added by auth middleware
interface AuthRequest extends Request {
  user?: {
    emp_id: string;
    role: string;
  };
}

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  const {
    email,
    philhealth_no,
    tin,
    sss_no,
    pag_ibig_mid_no,
    pag_ibig_rtn,
    gsis_no,
  } = req.body;
  
  try {
    if (!req.user || !req.user.emp_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await pool.query(
      `UPDATE employees SET 
        email = ?, 
        philhealth_no = ?, 
        tin = ?, 
        sss_no = ?, 
        pag_ibig_mid_no = ?, 
        pag_ibig_rtn = ?, 
        gsis_no = ? 
      WHERE emp_id = ?`,
      [
        email,
        philhealth_no,
        tin,
        sss_no,
        pag_ibig_mid_no,
        pag_ibig_rtn,
        gsis_no,
        req.user.emp_id,
      ]
    );
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

export const changeMyPassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    if (!req.user || !req.user.emp_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows]: any = await pool.query(
      "SELECT emp_id, first_name, role, password FROM employees WHERE emp_id = ?",
      [req.user.emp_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    const stored = user.password;
    const generatedFallback = `${user.emp_id || ""}${(user.first_name || "").replace(/\s+/g, "")}`;

    let isMatch = false;

    // 1. If we have a hash, use bcrypt
    if (stored && (stored.startsWith("$2b$") || stored.startsWith("$2a$") || stored.startsWith("$2y$"))) {
      isMatch = await bcrypt.compare(currentPassword, stored);
    } 
    
    // 2. Fallback check (needed for new accounts or migration cases)
    if (!isMatch) {
       isMatch = (currentPassword === generatedFallback);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash new password and save
    const hashedPassword = await hashPassword(newPassword);
    await pool.query("UPDATE employees SET password = ? WHERE emp_id = ?", [
      hashedPassword,
      req.user.emp_id,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password" });
  }
};
