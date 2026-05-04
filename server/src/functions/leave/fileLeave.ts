import pool from "../../config/db";
import { Request, RequestHandler, Response } from "express";
import {
  getEmployeeProfile,
  ensureLeaveApprovalColumns,
  notifyApproversForRequest,
} from "../../controllers/employeeController";
import { s3Client } from "../../config/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  getLeavePolicy,
  getRequiredDocuments,
  isMandatedLeave,
} from "../../constants/leavePolicy";
import {
  calculateMandatedLeaveEndDate,
  countMandatedLeaveDays,
  countWorkingDaysExcludingWeekends,
  validateMandatedLeaveEligibility,
} from "./mandatedLeaveUtils";

type WithUser = Request & {
  user: {
    emp_id: number | string;
    role: string;
  };
};

export const fileLeave: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const reqType = req as WithUser;

  const {
    emp_id,
    leave_type,
    date_from,
    date_to,
    priority,
    supervisor_remarks,
  } = req.body;

  console.log(req.body);
  let resolvedDateTo = date_to || date_from;
  const trimmedReason = String(supervisor_remarks || "").trim();

  const requesterEmpId =
    reqType.user?.role === "Admin" && emp_id
      ? emp_id
      : reqType.user?.emp_id || emp_id;

  // ============ BASIC VALIDATION ============
  if (!requesterEmpId || !leave_type || !date_from || !resolvedDateTo) {
    return res.status(400).json({
      message: "emp_id, leave_type, date_from, and date_to are required",
    });
  }

  if (!trimmedReason) {
    return res.status(400).json({
      message: "Reason is required for leave applications",
    });
  }

  // ============ LEAVE POLICY VALIDATION ============
  const policy = getLeavePolicy(leave_type);
  if (!policy) {
    return res.status(400).json({
      message: `Invalid leave type: ${leave_type}`,
    });
  }

  // ============ MANDATED LEAVE AUTO-COMPUTATION ============
  const isMandated = isMandatedLeave(leave_type);
  let effectiveDaysExcludingWeekends = 0;

  if (isMandated) {
    // For mandated leaves, if date_to is not provided or same as date_from,
    // auto-compute end date based on entitlement and weekend handling rule
    if (!date_to || date_to === date_from) {
      const maxDaysEntitlement = policy.maxDays;
      // Get the excludeWeekendsInDuration flag from policy (default to true for backward compatibility)
      const excludeWeekends = policy.excludeWeekendsInDuration !== false;
      
      resolvedDateTo = calculateMandatedLeaveEndDate(
        date_from,
        maxDaysEntitlement,
        excludeWeekends
      );
    }

    // Calculate effective days (working days or calendar days based on the flag)
    const excludeWeekends = policy.excludeWeekendsInDuration !== false;
    effectiveDaysExcludingWeekends = countMandatedLeaveDays(
      date_from,
      resolvedDateTo,
      excludeWeekends
    );
  }

  const normalizeDocumentKey = (fieldName: string) => {
    const normalized = String(fieldName || "").trim();

    if (normalized === "OCP") return "ocp";
    if (normalized === "doctorCert") return "doctor_cert";
    if (normalized === "deathCert") return "death_cert";
    if (normalized === "lwopApproval") return "lwop_approval";
    if (normalized === "maternityCert") return "maternity_cert";
    if (normalized === "medicalCert") return "medical_cert";
    if (normalized === "birthCert") return "birth_cert";
    if (normalized === "soloParentCert") return "solo_parent_cert";
    if (normalized === "vawcCert") return "vawc_cert";

    return normalized;
  };

  const connection = await pool.getConnection();
  try {
    await ensureLeaveApprovalColumns(connection);
    await connection.beginTransaction();

    const requester = await getEmployeeProfile(connection, requesterEmpId);
    if (!requester) {
      await connection.rollback();
      return res.status(404).json({ message: "Requester not found" });
    }

    const normalizedStatus = String(requester.status || "")
      .trim()
      .toLowerCase();
    const normalizedLeaveType = String(leave_type || "")
      .trim()
      .toLowerCase();

    // ============ MANDATED LEAVE ELIGIBILITY CHECK ============
    let mandatedEligibilityStatus = "Eligible";
    let eligibilityRemarks = "";

    if (isMandated) {
      const eligibility = validateMandatedLeaveEligibility(leave_type, requester);
      if (!eligibility.isEligible) {
        mandatedEligibilityStatus = "Ineligible";
        eligibilityRemarks = eligibility.remarks;
        // For ineligible leaves, we can still accept the filing but mark it accordingly
        // HR/ED can review and make the final decision
      } else {
        mandatedEligibilityStatus = "Eligible";
        eligibilityRemarks = eligibility.remarks;
      }
    }

    // ============ STATUS-SPECIFIC RESTRICTIONS ============
    if (
      normalizedStatus === "job order" &&
      normalizedLeaveType === "pgt leave"
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: "Job Order employees cannot file PGT Leave",
      });
    }

    // ============ CALCULATE LEAVE DURATION ============
    const fromDate = new Date(date_from);
    const toDate = new Date(resolvedDateTo);
    const daysDifference = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    );

    // Enforce one approved Birthday Leave per calendar year.
    if (normalizedLeaveType === "birthday leave") {
      const targetYear = fromDate.getFullYear();
      const [existingBirthdayLeave] = await connection.query(
        `
        SELECT id, date_from
        FROM leave_requests
        WHERE emp_id = ?
          AND LOWER(TRIM(leave_type)) = 'birthday leave'
          AND status = 'Approved'
          AND YEAR(date_from) = ?
        LIMIT 1
        `,
        [requesterEmpId, targetYear],
      );

      if ((existingBirthdayLeave as any[]).length > 0) {
        await connection.rollback();
        return res.status(409).json({
          message: `Birthday Leave can only be approved once per year. An approved Birthday Leave already exists for ${targetYear}.`,
        });
      }
    }

    // Validate days against policy max
    // For mandated leaves, use effective days (excluding weekends)
    const daysToValidate = isMandated ? effectiveDaysExcludingWeekends : daysDifference;
    if (daysToValidate > policy.maxDays) {
      await connection.rollback();
      return res.status(400).json({
        message: `${leave_type} cannot exceed ${policy.maxDays} days (requested: ${daysToValidate})`,
      });
    }

    // ============ NOTICE WINDOW VALIDATION ============
    if (policy.minNoticeHours > 0) {
      const now = new Date();
      const hoursUntilLeave = Math.ceil(
        (fromDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      if (hoursUntilLeave < policy.minNoticeHours) {
        await connection.rollback();
        return res.status(400).json({
          message: `${leave_type} requires ${Math.ceil(policy.minNoticeHours / 24)} days advance notice`,
        });
      }
    }

    // ============ DOCUMENT HANDLING ============
    const documents: Record<
      string,
      { key: string; filename: string; uploadedAt: string }
    > = {};

    const uploadedFiles = Array.isArray((req as any).files)
      ? ((req as any).files as Express.Multer.File[])
      : (req as any).file
        ? [((req as any).file as Express.Multer.File)]
        : [];

    for (const uploadedFile of uploadedFiles) {
      const normalizedFieldName = normalizeDocumentKey(uploadedFile.fieldname);
      const keyItem = `documents/${requesterEmpId}/${leave_type.replace(/\s+/g, "_")}/${normalizedFieldName}-${Date.now()}-${uploadedFile.originalname}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: keyItem,
          Body: uploadedFile.buffer,
          ContentType: uploadedFile.mimetype,
        }),
      );

      documents[normalizedFieldName] = {
        key: keyItem,
        filename: uploadedFile.originalname,
        uploadedAt: new Date().toISOString(),
      };
    }

    // ============ REQUIRE DOCUMENTS VALIDATION ============
    const requiredDocs = getRequiredDocuments(leave_type);

    if (
      leave_type === "Unscheduled - Sick Leave" &&
      daysDifference >= 3 &&
      !documents.doctor_cert
    ) {
      await connection.rollback();
      return res.status(400).json({
        message:
          "Medical Certificate is required for sick leave of 3 or more days.",
      });
    }

    for (const docType of requiredDocs) {
      // Special handling for OCP (only required for 5+ days)
      if (docType === "ocp" && daysDifference < 5) {
        continue;
      }

      if (!documents[docType]) {
        await connection.rollback();
        return res.status(400).json({
          message: `${leave_type} requires document: ${docType.replace(/_/g, " ")}`,
        });
      }
    }

    // ============ OVERLAP CHECK ============
    const [existingApproved] = await connection.query(
      `
      SELECT id, status, date_from, date_to 
      FROM leave_requests 
      WHERE emp_id = ? 
        AND status IN ('Approved', 'Pending')
        AND leave_type != 'Offset'
        AND (
          (date_from <= ? AND date_to >= ?)
        )
      LIMIT 1
      `,
      [requesterEmpId, resolvedDateTo, date_from]
    );

    if ((existingApproved as any[]).length > 0) {
      await connection.rollback();
      const match = (existingApproved as any[])[0];
      return res.status(409).json({
        message: `Overlap detected: You already have a ${match.status} leave request for this period (${match.date_from} to ${match.date_to}).`,
      });
    }

    // ============ INSERT LEAVE REQUEST ============
    const [result]: any = await connection.query(
      `
        INSERT INTO leave_requests (
          emp_id,
          leave_type,
          date_from,
          date_to,
          priority,
          status,
          reason,
          documents,
          is_mandated_leave,
          mandated_leave_type,
          effective_days_excluding_weekends,
          eligibility_status,
          eligibility_remarks
        ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requesterEmpId,
        leave_type,
        date_from,
        resolvedDateTo,
        priority || "Medium",
        trimmedReason,
        Object.keys(documents).length > 0 ? JSON.stringify(documents) : null,
        isMandated ? 1 : 0,
        isMandated ? leave_type : null,
        isMandated ? effectiveDaysExcludingWeekends : null,
        isMandated ? mandatedEligibilityStatus : null,
        isMandated ? eligibilityRemarks : null,
      ],
    );

    // ============ NOTIFY APPROVERS ============
    await notifyApproversForRequest(connection, {
      requester,
      moduleType: "Leave",
      requestId: result.insertId,
    });

    await connection.commit();

    res.status(201).json({
      message: "Leave application submitted successfully",
      isMandatedLeave: isMandated,
      effectiveDaysExcludingWeekends: isMandated ? effectiveDaysExcludingWeekends : null,
      computedEndDate: isMandated && !date_to ? resolvedDateTo : null,
      eligibilityStatus: isMandated ? mandatedEligibilityStatus : null,
    });
  } catch (error) {
    await connection.rollback();
    console.error("DB Error in fileLeave:", error);
    res.status(500).json({ message: "Error submitting leave application" });
  } finally {
    connection.release();
  }
};
