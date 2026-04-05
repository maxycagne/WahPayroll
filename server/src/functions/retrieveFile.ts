import { Request, Response } from "express";
import { s3Client } from "../config/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const retrieveFile = async (req: Request, res: Response) => {
  const { filename }: { filename: string } = req.body;
  if (!filename) {
    return res.status(400).json({
      message: "No filename",
    });
  }
  try {
    const response = new GetObjectCommand({
      Bucket: "payroll",
      Key: filename,
      // send response as file
      ResponseContentType: "application/octet-stream",
    });

    // make signed url that will only be for a certain amount of time
    const url = await getSignedUrl(s3Client, response, { expiresIn: 3600 });
    return res.status(200).json({
      url: url,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
