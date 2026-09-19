-- SmartDine Email OTP Verification Table
CREATE TABLE IF NOT EXISTS `email_otps` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `email` VARCHAR(150) NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `purpose` ENUM('registration', 'forgot_password') NOT NULL,
    `payload` LONGTEXT NULL COMMENT 'Stores pending registration info securely in JSON format',
    `attempts` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email_purpose` (`email`, `purpose`),
    INDEX `idx_expires` (`expires_at`),
    INDEX `idx_is_verified` (`is_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
