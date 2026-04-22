import "dotenv/config";
import express from "express";
import cors from "cors";
import "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoute.ts";
import attendanceRoutes from "./routes/attendanceRoute.ts";
import fileRoutes from "./routes/fileRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import path from "path";
import hrReportsRoutes from "./routes/hrReportRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.ts";
import profileRoutes from "./routes/profileRoutes.ts";
import registerRoutes from "./routes/registerRoutes.js";

const app = express();
const PORT = process.env.PORT || 8001;
const allowedOrigins = [
  "http://localhost:5173",
  "https://wah-payroll-seven.vercel.app",
];
//mavsy the great
// Updated CORS configuration to allow React and your custom headers
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "bypass-tunnel-reminder",
      "ngrok-skip-browser-warning",
    ],
  }),
);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/employees", dashboardRoutes);
app.use("/api/employees", attendanceRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/hr-reports", hrReportsRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/me", profileRoutes);
app.use("/api/register", registerRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
