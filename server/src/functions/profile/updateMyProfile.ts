import { Request, Response } from "express";
import pool from "../../config/db";
import { s3Client } from "../../config/s3";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type withUser = Request & {
  user: {
    emp_id: number | string;
  };
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const typedReq = req as withUser;

  const { email } = typedReq.body;

  let keyItem = null;
  let signedUrl = null;
  console.log(email);
  try {
    if (req.file) {
      console.log("hasFile");
      keyItem = `Profile/${typedReq.user.emp_id}/picture`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: keyItem,
          Body: req.file.buffer,
          ContentType: typedReq.file?.mimetype,
        }),
      );

      const res = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: keyItem,
        ResponseContentType: "application/octet-stream",
      });
      signedUrl = await getSignedUrl(s3Client, res, { expiresIn: 3600 });
    }

    await pool.query(
      "UPDATE employees SET email = ?, profile_photo = ? WHERE emp_id = ?",
      [email, keyItem, typedReq.user.emp_id],
    );
    res.json({ message: "Profile updated successfully", photo: signedUrl });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};
