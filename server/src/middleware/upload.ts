import multer from "multer";
import multerS3 from "multer-s3";
import { s3Client, s3BucketName } from "../config/s3";
import { Request } from "express";

// middleware for file upload
export const upload = multer({
  storage: multerS3({
    // Cloudflare r2 Endpoint
    s3: s3Client,
    // Storage name
    bucket: s3BucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldname: file.fieldname });
    },
    key: (req: Request, file, cb) => {
      const folder = req.body.folder || "misc";
      const user = req.body.user || "misc_2";
      // File convention
      const fileName = file.fieldname + "_" + file.originalname;
      cb(null, `${user}/${folder}/${fileName}`);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
});

// Resignation documents upload middleware
export const resignationDocumentUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: s3BucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldname: file.fieldname });
    },
    key: (req: Request, file, cb) => {
      const resignationId = req.body.resignationId || "unknown";
      const documentType = req.body.documentType || "document";
      // File convention: resignations/{resignationId}/{documentType}_{timestamp}_{originalname}
      const fileName = `${documentType}_${Date.now()}_${file.originalname}`;
      cb(null, `resignations/${resignationId}/${fileName}`);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
});

