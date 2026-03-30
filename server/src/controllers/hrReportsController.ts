import { Request, Response } from "express";
import pool from "../config/db";
import { RowDataPacket } from "mysql2";
interface AttendanceCount extends RowDataPacket {
  month: string;
  Absent: number;
  Present: number;
  Late: number;
  Undertime: number;
  Pending: number;
}
export const getAttendeesCount = async (req: Request, res: Response) => {
  try {
    const [results] = await pool.query<AttendanceCount[]>(`
        SELECT DATE_FORMAT(date, '%Y-%m') as month, 
                COUNT(CASE WHEN status ="Absent" THEN 1 END) as Absent,
                COUNT(CASE WHEN status ="Present" THEN 1 END) as Present,  
                COUNT(CASE WHEN status ="Late" THEN 1 END) as Late, 
                COUNT(CASE WHEN status ="Undertime" THEN 1 END) as Undertime,  
                COUNT(CASE WHEN status ="Pending" THEN 1 END) as Pending  
        FROM attendance GROUP BY month 
        ORDER BY month
    `);
    if (!results || results.length === 0) {
      return res
        .status(200)
        .json({ message: "No attendance records found", data: [] });
    }
    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({ message: e });
  }
};
