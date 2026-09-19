<?php
session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/register.php");
    exit;
}

$name            = trim($_POST['name'] ?? '');
$email           = trim($_POST['email'] ?? '');
$phone           = trim($_POST['phone'] ?? $_POST['mobile'] ?? '');
$password        = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? $password;

if ($name === '' || $email === '' || $phone === '' || $password === '') {
    echo "<script>alert('Please fill all fields.'); window.location.href='../pages/register.php';</script>";
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "<script>alert('Please enter a valid email address.'); window.location.href='../pages/register.php';</script>";
    exit;
}

if (!preg_match('/^[0-9]{10}$/', $phone)) {
    echo "<script>alert('Please enter a valid 10-digit mobile number.'); window.location.href='../pages/register.php';</script>";
    exit;
}

if (strlen($password) < 6) {
    echo "<script>alert('Password must contain at least 6 characters.'); window.location.href='../pages/register.php';</script>";
    exit;
}

// Check if already registered
$checkStmt = mysqli_prepare($conn, "SELECT id FROM users WHERE email = ? LIMIT 1");
if ($checkStmt) {
    mysqli_stmt_bind_param($checkStmt, "s", $email);
    mysqli_stmt_execute($checkStmt);
    mysqli_stmt_store_result($checkStmt);

    if (mysqli_stmt_num_rows($checkStmt) > 0) {
        mysqli_stmt_close($checkStmt);
        echo "<script>alert('Email already registered. Please login.'); window.location.href='../pages/login.php';</script>";
        exit;
    }
    mysqli_stmt_close($checkStmt);
}

// Generate OTP
$otp = (string)random_int(100000, 999999);
$otpHashed = password_hash($otp, PASSWORD_DEFAULT);
$passwordHashed = password_hash($password, PASSWORD_DEFAULT);
$expiresAt = date('Y-m-d H:i:s', time() + OTP_EXPIRY_SECONDS);

$payload = json_encode([
    'name'          => $name,
    'phone'         => $phone,
    'password_hash' => $passwordHashed
]);

// Invalidate older unverified registration OTPs
$invStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 2 WHERE email = ? AND purpose = 'registration' AND is_verified = 0");
if ($invStmt) {
    mysqli_stmt_bind_param($invStmt, "s", $email);
    mysqli_stmt_execute($invStmt);
    mysqli_stmt_close($invStmt);
}

// Insert into email_otps
$insertStmt = mysqli_prepare(
    $conn,
    "INSERT INTO email_otps (email, otp_hash, purpose, payload, attempts, is_verified, expires_at, created_at) VALUES (?, ?, 'registration', ?, 0, 0, ?, NOW())"
);

if (!$insertStmt) {
    echo "<script>alert('Registration setup error. Please try again.'); window.location.href='../pages/register.php';</script>";
    exit;
}

mysqli_stmt_bind_param($insertStmt, "ssss", $email, $otpHashed, $payload, $expiresAt);
mysqli_stmt_execute($insertStmt);
mysqli_stmt_close($insertStmt);

// Send Email
$mailResult = sendSmartDineOtp($email, $name, $otp, 'registration');

if ($mailResult['success']) {
    $_SESSION['otp_email']       = $email;
    $_SESSION['otp_name']        = $name;
    $_SESSION['otp_purpose']     = 'registration';
    $_SESSION['otp_sent_at']     = time();
    $_SESSION['otp_expires_at']  = time() + OTP_EXPIRY_SECONDS;
    $_SESSION['otp_success_msg'] = "OTP has been sent to your registered email address.";

    header("Location: ../pages/verify_otp.php");
    exit;
} else {
    echo "<script>alert('Failed to send verification email. " . addslashes($mailResult['error']) . "'); window.location.href='../pages/register.php';</script>";
    exit;
}
