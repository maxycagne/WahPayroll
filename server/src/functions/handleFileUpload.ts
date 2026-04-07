import {
  S3,
  S3ServiceException,
  waitUntilObjectExists,
} from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { s3Client } from "../config/s3";

// type S3File = Express.Multer.File & {
//   // Key is from multer-3. KEY IS THE NAME OF THE FILE ITSELF!!!!
//   key: string;
// };

export const fileUpload = async (
  req: Request & {
    file: Express.Multer.File & { key: string };
  },
  res: Response,
) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No file uploaded",
    });
  }

  try {
    // Ensure files exist

    // Upload all or FAIL

    // Middleware automatically handles file upload
    res.status(200).json({
      message: "Files uploaded successfully!!!!!!!!!!!!",
      files: {
        fileName: req.file.originalname,
        size: req.file.size,
        key: req.file.key,
      },
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
