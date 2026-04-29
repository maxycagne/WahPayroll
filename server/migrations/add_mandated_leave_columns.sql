-- Migration: Add Mandated Leave Columns to leave_requests table
-- Date: 2026-04-28
-- This script adds missing columns for mandated leave support

-- Add is_mandated_leave column if it doesn't exist
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS is_mandated_leave BOOLEAN DEFAULT FALSE COMMENT 'Flag for legally mandated leaves',
ADD COLUMN IF NOT EXISTS mandated_leave_type VARCHAR(100) COMMENT 'Type of mandated leave (e.g., Maternity, Paternity, etc.)',
ADD COLUMN IF NOT EXISTS effective_days_excluding_weekends DECIMAL(5,2) COMMENT 'Auto-calculated days excluding weekends (Sat/Sun)',
ADD COLUMN IF NOT EXISTS eligibility_status ENUM('Eligible', 'Ineligible', 'Pending Review') COMMENT 'Eligibility status for mandated leave',
ADD COLUMN IF NOT EXISTS eligibility_remarks TEXT COMMENT 'Reason for ineligibility or additional remarks';

-- Add index for mandated leaves if it doesn't exist
ALTER TABLE leave_requests 
ADD INDEX IF NOT EXISTS idx_mandated_leaves (emp_id, is_mandated_leave);

-- Confirmation
SELECT 'Migration completed: Mandated leave columns added to leave_requests table' AS status;
