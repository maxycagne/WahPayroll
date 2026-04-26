import "dotenv/config";
import express from "express";
import cors from "cors";
import "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoute.js";
import attendanceRoutes from "./routes/attendanceRoute.js";
import fileRoutes from "./routes/fileRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import path from "path";
import hrReportsRoutes from "./routes/hrReportRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import { createSocket } from "dgram";
import { createServer } from "http";
import { socket } from "./config/socket.js";
import helmet from "helmet";

const PORT = process.env.PORT || 8001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://wah-payroll-seven.vercel.app",
  "https://admin.socket.io",
];
const app = express();
const httpServer = createServer(app);
socket(httpServer);
app.use(
  cors({
    origin: allowedOrigins,
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
app.use(helmet());
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

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
