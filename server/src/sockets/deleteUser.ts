import { Server, Socket } from "socket.io";
import pool from "../config/db";
import { purgeEmployeeRelatedRecords } from "../services/employeeDeletion.js";

const deleteUser = (io: Server, socket: Socket) => {
  socket.on("delete-user", async (emp_id: string) => {
    const connection = await pool.getConnection();
    let transactionStarted = false;

    try {
      const role = socket.data.user?.role;
      const id = socket.data.user?.emp_id;

      if (role !== "Admin" && role !== "HR") {
        console.warn("Unauthorized action by:", id);
        socket.emit("error", { message: "Unauthorized deletion attempt" });
        return;
      }

      await connection.beginTransaction();
      transactionStarted = true;
      await purgeEmployeeRelatedRecords(connection, emp_id);
      await connection.query("DELETE FROM employees WHERE emp_id = ?", [emp_id]);
      await connection.commit();
      transactionStarted = false;

      io.in(`room:${emp_id}`).emit("force-logout", {
        message: "Your account has been deleted.",
      });
      io.in(`room:${emp_id}`).disconnectSockets(true);
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
      }

      console.log("Error deleting user:", error);

      socket.emit("error", { message: "Server error during deletion" });
    } finally {
      connection.release();
    }
  });
};

export default deleteUser;
