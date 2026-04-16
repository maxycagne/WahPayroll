import pool from "../../config/db";
import { Request, RequestHandler, Response } from "express";
import {
  getEmployeeProfile,
  notifyApproversForRequest,
} from "../../controllers/employeeController";
import { s3Client } from "../../config/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

type WithUser = Request & {
  user: {
    emp_id: number | string;
    role: string;
  };
};

export const fileLeave: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const reqType = req as WithUser;

  if (req.file) {
    console.log(req.file.originalname);
  }

  const {
    emp_id,
    leave_type,
    date_from,
    date_to,
    priority,
    supervisor_remarks,
  } = req.body;

  console.log(req.body);
  const resolvedDateTo = date_to || date_from;
  const trimmedReason = String(supervisor_remarks || "").trim();

  const requesterEmpId =
    reqType.user?.role === "Admin" && emp_id
      ? emp_id
      : reqType.user?.emp_id || emp_id;

  if (!requesterEmpId || !leave_type || !date_from || !resolvedDateTo) {
    return res.status(400).json({
      message: "emp_id, leave_type, and date_from are required",
    });
  }

  if (!trimmedReason) {
    return res.status(400).json({
      message: "Reason is required for leave applications",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const requester = await getEmployeeProfile(connection, requesterEmpId);
    if (!requester) {
      await connection.rollback();
      return res.status(404).json({ message: "Requester not found" });
    }

    const normalizedStatus = String(requester.status || "")
      .trim()
      .toLowerCase();
    const normalizedLeaveType = String(leave_type || "")
      .trim()
      .toLowerCase();

    if (
      normalizedStatus === "job order" &&
      normalizedLeaveType === "pgt leave"
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: "Job Order employees cannot file PGT Leave",
      });
    }
    let keyItem = null;
    if (req.file) {
      keyItem = `OCP/${requesterEmpId}/${Date.now()}-${reqType.file?.originalname}`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: keyItem,
          Body: reqType.file?.buffer,
          ContentType: reqType.file?.mimetype,
        }),
      );
    }

    // --- OVERLAP CHECK ---
    const [existingApproved] = await connection.query(
      `
      SELECT id, status, date_from, date_to 
      FROM leave_requests 
      WHERE emp_id = ? 
        AND status IN ('Approved', 'Pending')
        AND (
          (date_from <= ? AND date_to >= ?)
        )
      LIMIT 1
      `,
      [requesterEmpId, resolvedDateTo, date_from]
    );

    if ((existingApproved as any[]).length > 0) {
      await connection.rollback();
      const match = (existingApproved as any[])[0];
      return res.status(409).json({
        message: `Overlap detected: You already have a ${match.status} leave request for this period (${match.date_from} to ${match.date_to}).`,
      });
    }

    await connection.query(
      `
        INSERT INTO leave_requests (
          emp_id,
          leave_type,
          date_from,
          date_to,
          priority,
          status,
          reason,
          ocp
        ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)
      `,
      [
        requesterEmpId,
        leave_type,
        date_from,
        resolvedDateTo,
        priority,
        trimmedReason,
        keyItem,
      ],
    );

    await notifyApproversForRequest(connection, {
      requester,
      moduleType: "Leave",
      requestId: requesterEmpId,
    });

    await connection.commit();

    res
      .status(201)
      .json({ message: "Leave application submitted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in fileLeave:", error);
    res.status(500).json({ message: "Error submitting leave application" });
  } finally {
    connection.release();
  }
};
