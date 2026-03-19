import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_wah_key";

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();

  if (value === "admin") return "Admin";
  if (value === "supervisor") return "Supervisor";
  if (value === "hr") return "HR";
  if (value === "rankandfile" || value === "rank & file") return "RankAndFile";

  return "RankAndFile";
};

const checkPassword = async (inputPassword, user) => {
  const stored = user?.password;
  const generatedFallback = `${user.emp_id || ""}${(user.first_name || "").replace(/\s+/g, "")}`;

  if (!stored) {
    return inputPassword === generatedFallback;
  }

  if (stored.startsWith("$2b$") || stored.startsWith("$2a$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(inputPassword, stored);
  }

  return inputPassword === stored || inputPassword === generatedFallback;
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM employees WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await checkPassword(password, user);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const role = normalizeRole(user.role);

    const token = jwt.sign({ emp_id: user.emp_id, role }, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.json({
      token,
      user: {
        emp_id: user.emp_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT emp_id, first_name, last_name, email, role FROM employees WHERE emp_id = ?",
      [req.user.emp_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    res.json({
      user: {
        emp_id: user.emp_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: normalizeRole(user.role),
      },
    });
  } catch (error) {
    console.error("Me Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
