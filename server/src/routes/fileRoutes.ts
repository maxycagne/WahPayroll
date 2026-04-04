import express from "express";
import multer, { memoryStorage } from "multer";
import multerS3 from "multer-s3";
import { fileUpload } from "../functions/handleFileUpload";
import { s3Client } from "../config/s3";

import { retrieveFile } from "../functions/retrieveFile";
import { sanitizeFile } from "../middleware/sanitizeFile";
import { authenticateToken } from "../middleware/authMiddleware";
import { deleteFile } from "../functions/deleteFile";
import { checkFileExist } from "../middleware/checkFileExist";

// middleware for file upload
const upload = multer({
  storage: multerS3({
    // Cloudflare r2 Endpoint
    s3: s3Client,
    // Storage name
    bucket: "payroll",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldname: file.fieldname });
    },

    // Will handle upload
    key: (req, file, cb) => {
      // File convention
      const fileName =
        Date.now() + "_" + file.fieldname + "_" + file.originalname;

      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
});

const router = express.Router();
router.use(authenticateToken);

router.post(
  "/upload",
  upload.array("requiredFiles", 10),
  sanitizeFile,
  fileUpload,
);
router.get("/get", retrieveFile);
router.delete("/delete", checkFileExist, deleteFile);
export default router;
