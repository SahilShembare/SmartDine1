<?php
session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/forgot_password.php");
    exit;
}

$email = trim($_POST['email'] ?? '');

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['forgot_error'] = "Please enter a valid email address.";
    header("Location: ../pages/forgot_password.php");
    exit;
}

// Find user in database
$stmt = mysqli_prepare($conn, "SELECT id, name, email FROM users WHERE email = ? LIMIT 1");
if (!$stmt) {
    $_SESSION['forgot_error'] = "Database query error: " . mysqli_error($conn);
    header("Location: ../pages/forgot_password.php");
    exit;
}

mysqli_stmt_bind_param($stmt, "s", $email);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$user = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$user) {
    $_SESSION['forgot_error'] = "No account found with this email address.";
    header("Location: ../pages/forgot_password.php");
    exit;
}

// Check cooldown (60 seconds)
$rateStmt = mysqli_prepare($conn, "SELECT created_at FROM email_otps WHERE email = ? AND purpose = 'forgot_password' ORDER BY id DESC LIMIT 1");
if ($rateStmt) {
    mysqli_stmt_bind_param($rateStmt, "s", $email);
    mysqli_stmt_execute($rateStmt);
    $rateRes = mysqli_stmt_get_result($rateStmt);
    if ($rateRow = mysqli_fetch_assoc($rateRes)) {
        $secondsSinceLast = time() - strtotime($rateRow['created_at']);
        if ($secondsSinceLast < OTP_RESEND_COOLDOWN) {
            $wait = OTP_RESEND_COOLDOWN - $secondsSinceLast;
            $_SESSION['forgot_error'] = "An OTP was recently sent. Please wait {$wait} seconds before requesting again.";
            mysqli_stmt_close($rateStmt);
            header("Location: ../pages/forgot_password.php");
            exit;
        }
    }
    mysqli_stmt_close($rateStmt);
}

// Generate 6-digit OTP
$otp = (string)random_int(100000, 999999);
$otpHashed = password_hash($otp, PASSWORD_DEFAULT);
$expiresAt = date('Y-m-d H:i:s', time() + OTP_EXPIRY_SECONDS);

// Invalidate older unverified OTPs
$invStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 2 WHERE email = ? AND purpose = 'forgot_password' AND is_verified = 0");
if ($invStmt) {
    mysqli_stmt_bind_param($invStmt, "s", $email);
    mysqli_stmt_execute($invStmt);
    mysqli_stmt_close($invStmt);
}

// Insert new OTP record
$insertStmt = mysqli_prepare(
    $conn,
    "INSERT INTO email_otps (user_id, email, otp_hash, purpose, payload, attempts, is_verified, expires_at, created_at) VALUES (?, ?, ?, 'forgot_password', NULL, 0, 0, ?, NOW())"
);

if (!$insertStmt) {
    $_SESSION['forgot_error'] = "Failed to setup reset session. Please try again.";
    header("Location: ../pages/forgot_password.php");
    exit;
}

mysqli_stmt_bind_param($insertStmt, "isss", $user['id'], $email, $otpHashed, $expiresAt);
mysqli_stmt_execute($insertStmt);
mysqli_stmt_close($insertStmt);

// Send Email via PHPMailer with Gmail SMTP
$mailResult = sendSmartDineOtp($email, $user['name'], $otp, 'forgot_password');

if ($mailResult['success']) {
    $_SESSION['otp_email']       = $email;
    $_SESSION['otp_name']        = $user['name'];
    $_SESSION['otp_purpose']     = 'forgot_password';
    $_SESSION['otp_sent_at']     = time();
    $_SESSION['otp_expires_at']  = time() + OTP_EXPIRY_SECONDS;
    $_SESSION['otp_success_msg'] = "OTP has been sent to your registered email address.";

    header("Location: ../pages/verify_otp.php");
    exit;
} else {
    $_SESSION['forgot_error'] = "Unable to send verification email. " . htmlspecialchars($mailResult['error']);
    header("Location: ../pages/forgot_password.php");
    exit;
}
