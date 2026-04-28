import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { instrument } from "@socket.io/admin-ui";
import suspendUser from "../sockets/suspendUser";
import deleteUser from "../sockets/deleteUser";
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://wah-payroll-seven.vercel.app",
  "https://admin.socket.io",
];

export const socket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  instrument(io, {
    auth: false,
    mode: "development",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
      socket.data.user = decoded;
      console.log(decoded);
      return next();
    } catch (error) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log("a user connected", socket.id);
    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
    });

    socket.join(`room:${user.emp_id}`);
    suspendUser(io, socket);
    deleteUser(io, socket);
  });
};
