<?php
/**
 * SmartDine - Database Connection
 */

require_once __DIR__ . '/config.php';

// Disable default mysqli exceptions so we can catch and handle connection issues gracefully
mysqli_report(MYSQLI_REPORT_OFF);

// Establish MySQL connection
$conn = @mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conn) {
    $errorMsg = mysqli_connect_error();
    die("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 25px; border-left: 5px solid #dc3545; background-color: #fff5f5; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);'>" .
        "<h2 style='color: #dc3545; margin-top: 0;'>⚠️ Database Connection Failed</h2>" .
        "<p style='color: #333; font-size: 15px; line-height: 1.5;'>Unable to connect to the MySQL database (<strong>" . htmlspecialchars(DB_NAME) . "</strong> on <strong>" . htmlspecialchars(DB_HOST) . "</strong>).</p>" .
        "<p style='color: #666; font-size: 13px; background: #eee; padding: 8px 12px; border-radius: 4px; font-family: monospace;'>" . htmlspecialchars($errorMsg) . "</p>" .
        "<p style='color: #198754; font-size: 14px; margin-bottom: 0;'><strong>Tip:</strong> Please start the <strong>MySQL</strong> module in your <strong>XAMPP Control Panel</strong>.</p>" .
        "</div>");
}

mysqli_set_charset($conn, "utf8mb4");

/**
 * Auto-ensure that the email_otps table exists
 */
function ensureSmartDineOtpTable($connection) {
    static $checked = false;
    if ($checked || !$connection) return;
    
    $createTableQuery = "CREATE TABLE IF NOT EXISTS `email_otps` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    @mysqli_query($connection, $createTableQuery);
    $checked = true;
}

ensureSmartDineOtpTable($conn);
