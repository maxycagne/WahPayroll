import { S3ServiceException, waitUntilObjectExists } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { s3Client } from "../config/s3";

type S3File = Express.Multer.File & {
  // Key is from multer-3. KEY IS THE NAME OF THE FILE ITSELF!!!!
  key: string;
};

export const fileUpload = async (req: Request, res: Response) => {
  if (req.files?.length === 0) {
    return res.status(400).json({
      message: "No files uploaded",
    });
  }

  try {
    // Ensure files exist
    const promises = (req.files as S3File[]).map((file) => {
      return waitUntilObjectExists(
        {
          client: s3Client,
          // 60 seconds to finish before failing
          maxWaitTime: 60,
        },
        {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: file.key,
        },
      );
    });
    // Upload all or FAIL
    await Promise.all(promises);
    // Middleware automatically handles file upload
    res.status(200).json({
      message: "Files uploaded successfully!",
      files: (req.files as S3File[]).map((file) => {
        return {
          fileName: file.originalname,
          size: file.size,
          key: file.key,
        };
      }),
    });
  } catch (e) {
    if (e instanceof S3ServiceException && e.name === "EntityTooLarge") {
      return res.status(500).json({
        message: `Error from S3 while uploading object to ${process.env.S3_BUCKET_NAME}. The file was too large. Upload directly to the console `,
      });
    }
    if (e instanceof S3ServiceException) {
      return res.status(500).json({
        message: `Error form S3 uploading to ${process.env.S3_BUCKET_NAME}. ${e.name}: ${e.message}`,
      });
    }
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
