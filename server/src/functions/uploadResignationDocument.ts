import { Response } from "express";
import { S3ServiceException, waitUntilObjectExists } from "@aws-sdk/client-s3";
import { s3Client, s3BucketName } from "../config/s3";
import pool from "../config/db";

type S3File = Express.Multer.File & {
  key: string;
};

/**
 * Upload resignation document (endorsement or clearance)
 * Links the uploaded S3 key to the resignation record
 */
export const uploadResignationDocument = async (
  req: any,
  res: Response,
) => {
  const { resignationId, documentType } = req.body;
  const empId = req.user?.emp_id;

  if (!resignationId || !documentType || !empId) {
    return res.status(400).json({
      message:
        "Resignation ID, document type, and authentication required",
    });
  }

  if (!["endorsement", "clearance"].includes(documentType)) {
    return res.status(400).json({
      message: "Document type must be 'endorsement' or 'clearance'",
    });
  }

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const file = req.file as S3File;

    // Verify resignation ownership
    const [resignation] = await pool.query(
      `SELECT emp_id FROM resignations WHERE id = ? LIMIT 1`,
      [resignationId],
    ) as any;

    if (!resignation || resignation.length === 0) {
      return res.status(404).json({
        message: "Resignation not found",
      });
    }

    if (resignation[0].emp_id !== empId) {
      return res.status(403).json({
        message: "You can only upload documents for your own resignation",
      });
    }

    // Ensure file exists in S3
    await waitUntilObjectExists(
      {
        client: s3Client,
        maxWaitTime: 60,
      },
      {
        Bucket: s3BucketName,
        Key: file.key,
      },
    );

    // Store the file key in the resignation record
    const fieldName =
      documentType === "endorsement" ? "endorsement_file_key" : "clearance_file_key";
    await pool.query(
      `UPDATE resignations SET ${fieldName} = ? WHERE id = ?`,
      [file.key, resignationId],
    );

    res.status(200).json({
      message: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} document uploaded successfully`,
      file: {
        fileName: file.originalname,
        size: file.size,
        key: file.key,
        documentType,
      },
    });
  } catch (e) {
    if (e instanceof S3ServiceException && e.name === "EntityTooLarge") {
      return res.status(500).json({
        message: `Error from S3 while uploading object. The file was too large.`,
      });
    }
    if (e instanceof S3ServiceException) {
      return res.status(500).json({
        message: `Error from S3 uploading document. ${e.name}: ${e.message}`,
      });
    }
    return res.status(500).json({
      message: e instanceof Error ? e.message : "Internal Server Error",
    });
  }
};
