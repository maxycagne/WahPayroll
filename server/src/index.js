import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import reportRoutes from "./routes/hrReportsRoutes.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Updated CORS configuration to allow React and your custom headers
app.use(
  cors({
    origin: "http://localhost:5173", // Allow your React frontend
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

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/reports", reportRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
