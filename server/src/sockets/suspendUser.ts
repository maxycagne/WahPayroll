import { Server, Socket } from "socket.io";
import pool from "../config/db";
const suspendUser = (io: Server, socket: Socket) => {
  socket.on("suspend-user", async (emp_id: string) => {
    console.log("suspending user " + emp_id);
    try {
      const role = socket.data.user?.role;
      const id = socket.data.user?.emp_id;
      if (role !== "Admin" && role !== "HR") {
        console.log(`Unauthorized action by: ${id}`);
        return;
      }
      await pool.query(
        "UPDATE employees SET is_active = '0' WHERE emp_id = ?",
        [emp_id],
      );
      io.in(`room:${emp_id}`).emit("force-logout", {
        message: "Your account has been suspended.",
      });
      io.in(`room:${emp_id}`).disconnectSockets(true);
    } catch (error) {
      console.error("Error suspending user:", error);
      socket.emit("error", { message: "Server error during suspension." });
    }
  });
};

export default suspendUser;
