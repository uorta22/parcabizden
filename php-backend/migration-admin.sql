-- ParcaBizden Admin Migration
-- Adds is_admin column to users table
-- Safe to re-run.
-- ---------------------------------------------------------------

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Add is_admin column if not exists
DROP PROCEDURE IF EXISTS _pb_add_admin_col;

DELIMITER $$
CREATE PROCEDURE _pb_add_admin_col()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'users'
          AND COLUMN_NAME  = 'is_admin'
    ) THEN
        ALTER TABLE `users` ADD COLUMN `is_admin` TINYINT(1) NOT NULL DEFAULT 0;
    END IF;
END$$
DELIMITER ;

CALL _pb_add_admin_col();
DROP PROCEDURE IF EXISTS _pb_add_admin_col;

-- Set your admin user (replace with your email)
-- UPDATE users SET is_admin = 1 WHERE email = 'admin@parcabizden.com';
