import express, { RequestHandler } from "express";
import multer, { memoryStorage } from "multer";
import multerS3 from "multer-s3";
import { fileUpload } from "../functions/handleFileUpload";
import { s3Client } from "../config/s3";

import { retrieveFile } from "../functions/retrieveFile";
import { sanitizeFile } from "../middleware/sanitizeFile";
import { authenticateToken } from "../middleware/authMiddleware";
import { deleteFile } from "../functions/deleteFile";
import { checkFileExist } from "../middleware/checkFileExist";
import { upload } from "../middleware/upload";
// import { uploadProfile } from "../functions/uploadProfile";
import { FileHandle } from "fs/promises";

const router = express.Router();
// router.use(authenticateToken);

router.post(
  "/upload",
  upload.single("OCP"),
  // sanitizeFile,
  fileUpload as any,
);
router.get("/get", retrieveFile);
router.delete("/delete", checkFileExist, deleteFile);

// router.post(
//   "/uploadProfile",
//   upload.single("profile-picture"),
//   // checkFileExist,
//   uploadProfile,
// );

export default router;
