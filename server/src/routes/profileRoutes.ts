import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { updateMyProfile } from "../functions/profile/updateMyProfile";
import multer, { memoryStorage } from "multer";
const route = Router();
route.use(authenticateToken);
const upload = multer({
  storage: memoryStorage(),
});
route.put("/profile", upload.single("profile_photo"), updateMyProfile);

export default route;
