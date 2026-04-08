import express from "express";
import { getHRReports } from "../controllers/HrReportsController.js";

const router = express.Router();

router.get("/", getHRReports);

export default router;
