import { GetObjectCommand } from "@aws-sdk/client-s3";
import pool from "../../config/db";
import {
  ensureLeaveApprovalColumns,
  getEmployeeProfile,
} from "../../controllers/employeeController";
import { Request, Response } from "express";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../config/s3";

type WithUser = Request & {
  user: {
    emp_id: number | string;
    role: string;
  };
};

export const getAllLeaves = async (req: Request, res: Response) => {
  const reqType = req as WithUser;
  try {
    await ensureLeaveApprovalColumns();
    const viewer = await getEmployeeProfile(pool, reqType.user?.emp_id);
    if (!viewer) return res.status(401).json({ message: "Unauthorized" });

    let query = `
      SELECT 
        l.*, 
        DATE_FORMAT(l.date_from, '%Y-%m-%d') as date_from,
    DATE_FORMAT(l.date_to, '%Y-%m-%d') as date_to,
        e.first_name, 
        e.last_name, 
        e.email,          
        e.designation, 
        COALESCE(e.role, 'RankAndFile') as requester_role
      FROM leave_requests l
      JOIN employees e ON l.emp_id = e.emp_id
    `;
    const queryParams = [];

    if (viewer.role === "RankAndFile") {
      query += " WHERE l.emp_id = ?";
      queryParams.push(viewer.emp_id);
    } else if (viewer.role === "Supervisor") {
      query += `
        WHERE l.emp_id = ?
           OR (
             e.designation = ?
             AND e.emp_id <> ?
           )
      `;
      queryParams.push(viewer.emp_id, viewer.designation || "", viewer.emp_id);
    }

    query += " ORDER BY l.id DESC";

    const [rows] = await pool.query(query, queryParams);

    const withSignedUrl = await Promise.all(
      (rows as any[]).map(async (row: any) => {
        let signedUrlTemp = null;
        let signedDocuments: Record<string, any> = {};

        let parsedDocuments: Record<string, any> = {};
        if (row.documents) {
          try {
            parsedDocuments =
              typeof row.documents === "string"
                ? JSON.parse(row.documents)
                : row.documents;
          } catch {
            parsedDocuments = {};
          }
        }

        const legacyOcpKey = row.ocp || parsedDocuments?.ocp?.key || null;

        if (legacyOcpKey) {
          const res = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: legacyOcpKey,
            ResponseContentType: "application/octet-stream",
          });

          const toUrl = await getSignedUrl(s3Client, res, { expiresIn: 3600 });
          signedUrlTemp = toUrl;
        }

        if (parsedDocuments && Object.keys(parsedDocuments).length > 0) {
          for (const [docType, docMeta] of Object.entries(parsedDocuments)) {
            if (!docMeta?.key) continue;

            const docRes = new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: docMeta.key,
              ResponseContentType: "application/octet-stream",
            });

            signedDocuments[docType] = {
              ...docMeta,
              url: await getSignedUrl(s3Client, docRes, { expiresIn: 3600 }),
            };
          }
        }

        return {
          ...row,
          ocp: signedUrlTemp,
          documents: signedDocuments,
        };
      }),
    );

    res.json(withSignedUrl);
  } catch (error) {
    console.error("DB Error in getAllLeaves:", error);
    res.status(500).json({ message: "Error fetching leaves" });
  }
};
