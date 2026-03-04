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

-- ---------------------------------------------------------------
-- Admin Audit Log tablosu
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_audit_log` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_id` INT DEFAULT NULL,
    `details` TEXT DEFAULT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_user` (`user_id`),
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- IP Kara Liste tablosu
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ip_blacklist` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `ip` VARCHAR(45) NOT NULL,
    `reason` VARCHAR(255) NOT NULL DEFAULT 'brute_force',
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_blacklist_ip` (`ip`),
    INDEX `idx_blacklist_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
