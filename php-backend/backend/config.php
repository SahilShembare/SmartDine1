<?php
/**
 * SmartDine - Central Configuration File
 * 
 * Handles Database credentials, Gmail SMTP settings, and OTP verification parameters.
 * Automatically loads .env file if present, with secure fallback defaults.
 */

// Function to load .env file if it exists
if (!function_exists('smartdine_load_env')) {
    function smartdine_load_env($filePath) {
        if (!file_exists($filePath)) {
            return;
        }
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                // Strip surrounding quotes if present
                if (preg_match('/^"(.*)"$/', $value, $m) || preg_match("/^'(.*)'$/", $value, $m)) {
                    $value = $m[1];
                }
                if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                    putenv(sprintf('%s=%s', $name, $value));
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }
}

// Attempt to load .env from project root or backend folder
smartdine_load_env(__DIR__ . '/../.env');
smartdine_load_env(__DIR__ . '/.env');

// Database Configuration
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'root');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'smartdine');

// Gmail SMTP Configuration
if (!defined('SMTP_HOST')) define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.gmail.com');
if (!defined('SMTP_PORT')) define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
if (!defined('SMTP_SECURE')) define('SMTP_SECURE', getenv('SMTP_SECURE') ?: 'tls'); // 'tls' (STARTTLS) or 'ssl'
if (!defined('SMTP_AUTH')) define('SMTP_AUTH', true);

// Configure your Gmail and Google App Password here or via .env
if (!defined('SMTP_USER')) define('SMTP_USER', getenv('SMTP_USER') ?: 'smartdine82@gmail.com');
if (!defined('SMTP_PASS')) define('SMTP_PASS', getenv('SMTP_PASS') ?: 'qsefkvyvicukxuqi');
if (!defined('SMTP_FROM_EMAIL')) define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL') ?: SMTP_USER);
if (!defined('SMTP_FROM_NAME')) define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: 'SmartDine');

// OTP Security Configuration
if (!defined('OTP_EXPIRY_SECONDS')) define('OTP_EXPIRY_SECONDS', (int)(getenv('OTP_EXPIRY_SECONDS') ?: 300)); // 5 minutes
if (!defined('OTP_RESEND_COOLDOWN')) define('OTP_RESEND_COOLDOWN', (int)(getenv('OTP_RESEND_COOLDOWN') ?: 60)); // 60 seconds
if (!defined('OTP_MAX_ATTEMPTS')) define('OTP_MAX_ATTEMPTS', (int)(getenv('OTP_MAX_ATTEMPTS') ?: 5)); // 5 failed attempts allowed
