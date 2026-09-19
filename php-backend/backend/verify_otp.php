<?php
session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

$email   = $_SESSION['otp_email'] ?? '';
$purpose = $_SESSION['otp_purpose'] ?? '';

if (empty($email) || empty($purpose)) {
    header("Location: ../pages/login.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/verify_otp.php");
    exit;
}

$otp = trim($_POST['otp'] ?? '');

// Handle 6 individual digits if submitted via array
if (empty($otp) && isset($_POST['otp_digit']) && is_array($_POST['otp_digit'])) {
    $otp = implode('', array_map('trim', $_POST['otp_digit']));
}

if (!preg_match('/^[0-9]{6}$/', $otp)) {
    $_SESSION['otp_error_msg'] = "Please enter a valid 6-digit verification code.";
    header("Location: ../pages/verify_otp.php");
    exit;
}

// Fetch latest unverified OTP
$stmt = mysqli_prepare(
    $conn,
    "SELECT id, user_id, email, otp_hash, purpose, payload, attempts, is_verified, expires_at, created_at 
     FROM email_otps 
     WHERE email = ? AND purpose = ? AND is_verified = 0 
     ORDER BY id DESC LIMIT 1"
);

if (!$stmt) {
    $_SESSION['otp_error_msg'] = "Database query error: " . mysqli_error($conn);
    header("Location: ../pages/verify_otp.php");
    exit;
}

mysqli_stmt_bind_param($stmt, "ss", $email, $purpose);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$otpRecord = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

if (!$otpRecord) {
    $_SESSION['otp_error_msg'] = "OTP has expired or is invalid. Please request a new OTP.";
    header("Location: ../pages/verify_otp.php");
    exit;
}

// Check if expired
if (strtotime($otpRecord['expires_at']) < time()) {
    $_SESSION['otp_error_msg'] = "OTP has expired. Please request a new OTP.";
    header("Location: ../pages/verify_otp.php");
    exit;
}

// Check maximum attempts
if ((int)$otpRecord['attempts'] >= OTP_MAX_ATTEMPTS) {
    $_SESSION['otp_error_msg'] = "Maximum attempts reached. This OTP is invalidated. Please request a new OTP.";
    header("Location: ../pages/verify_otp.php");
    exit;
}

// Verify OTP hash
if (!password_verify($otp, $otpRecord['otp_hash'])) {
    $newAttempts = (int)$otpRecord['attempts'] + 1;
    $upStmt = mysqli_prepare($conn, "UPDATE email_otps SET attempts = ? WHERE id = ?");
    if ($upStmt) {
        mysqli_stmt_bind_param($upStmt, "ii", $newAttempts, $otpRecord['id']);
        mysqli_stmt_execute($upStmt);
        mysqli_stmt_close($upStmt);
    }

    $remaining = OTP_MAX_ATTEMPTS - $newAttempts;
    if ($remaining > 0) {
        $_SESSION['otp_error_msg'] = "Invalid OTP. Please try again. ({$remaining} attempt" . ($remaining > 1 ? "s" : "") . " remaining)";
    } else {
        $_SESSION['otp_error_msg'] = "Invalid OTP. Maximum attempts reached. Please request a new OTP.";
    }

    header("Location: ../pages/verify_otp.php");
    exit;
}

// Correct OTP! Mark verified
$markStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 1 WHERE id = ?");
if ($markStmt) {
    mysqli_stmt_bind_param($markStmt, "i", $otpRecord['id']);
    mysqli_stmt_execute($markStmt);
    mysqli_stmt_close($markStmt);
}

// Invalidate any other pending OTPs for this email and purpose
$cleanStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 2 WHERE email = ? AND purpose = ? AND id != ? AND is_verified = 0");
if ($cleanStmt) {
    mysqli_stmt_bind_param($cleanStmt, "ssi", $email, $purpose, $otpRecord['id']);
    mysqli_stmt_execute($cleanStmt);
    mysqli_stmt_close($cleanStmt);
}

// Complete the requested flow
if ($purpose === 'registration') {
    $payload = json_decode($otpRecord['payload'], true);

    if (!$payload || empty($payload['password_hash'])) {
        $_SESSION['otp_error_msg'] = "Registration data was corrupted. Please register again.";
        header("Location: ../pages/register.php");
        exit;
    }

    $userStmt = mysqli_prepare(
        $conn,
        "INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, 'customer', 'active')"
    );

    if (!$userStmt) {
        $_SESSION['otp_error_msg'] = "Database error while activating account: " . mysqli_error($conn);
        header("Location: ../pages/verify_otp.php");
        exit;
    }

    mysqli_stmt_bind_param($userStmt, "ssss", $payload['name'], $email, $payload['phone'], $payload['password_hash']);
    $userCreated = mysqli_stmt_execute($userStmt);
    mysqli_stmt_close($userStmt);

    if (!$userCreated) {
        $_SESSION['otp_error_msg'] = "Account creation failed. Email may already be registered.";
        header("Location: ../pages/register.php");
        exit;
    }

    // Clear session
    unset(
        $_SESSION['otp_email'],
        $_SESSION['otp_name'],
        $_SESSION['otp_purpose'],
        $_SESSION['otp_sent_at'],
        $_SESSION['otp_expires_at'],
        $_SESSION['otp_success_msg'],
        $_SESSION['otp_error_msg']
    );

    header("Location: ../pages/login.php?registered=1");
    exit;

} elseif ($purpose === 'forgot_password') {
    // Authorize reset
    $_SESSION['reset_authorized'] = true;
    $_SESSION['reset_email']      = $email;
    $_SESSION['reset_user_id']    = $otpRecord['user_id'];

    // Clear OTP session
    unset(
        $_SESSION['otp_email'],
        $_SESSION['otp_name'],
        $_SESSION['otp_purpose'],
        $_SESSION['otp_sent_at'],
        $_SESSION['otp_expires_at'],
        $_SESSION['otp_success_msg'],
        $_SESSION['otp_error_msg']
    );

    header("Location: ../pages/reset_password.php");
    exit;
} else {
    header("Location: ../pages/login.php");
    exit;
}
