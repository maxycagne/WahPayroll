import { Request, Response } from "express";
import { s3BucketName, s3Client } from "../config/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const retrieveFile = async (req: Request, res: Response) => {
  const filenameFromBody = req.body?.filename;
  const filenameFromQuery =
    typeof req.query?.filename === "string" ? req.query.filename : "";
  const filename: string = String(filenameFromBody || filenameFromQuery || "");
  if (!filename) {
    return res.status(400).json({
      message: "No filename",
    });
  }

  try {
    const response = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: filename,
    });

    // make signed url that will only be for a certain amount of time
    const url = await getSignedUrl(s3Client, response, { expiresIn: 3600 });
    return res.status(200).json({
      url: url,
    });
  } catch (e) {
    return res.status(500).json({
      message: e instanceof Error ? e.message : "Internal server error",
    });
  }
};
