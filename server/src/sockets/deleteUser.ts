import { Server, Socket } from "socket.io";
import pool from "../config/db";

const deleteUser = (io: Server, socket: Socket) => {
  socket.on("delete-user", async (emp_id: string) => {
    console.log("hello");
    try {
      const role = socket.data.user?.role;
      const id = socket.data.user?.emp_id;

      if (role !== "Admin" && role !== "HR") {
        console.warn("Unauthorized action by:", id);
      }
      await pool.query("DELETE FROM employees WHERE emp_id = ?", [emp_id]);

      io.in(`room:${emp_id}`).emit("force-logout", {
        message: "Your account has been deleted.",
      });
      io.in(`room:${emp_id}`).disconnectSockets(true);
    } catch (error) {
      console.log("Error suspending user:", error);

      socket.emit("error", { message: "Server error during deletion" });
    }
  });
};

export default deleteUser;
