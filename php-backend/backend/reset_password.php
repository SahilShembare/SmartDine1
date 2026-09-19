<?php
session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

if (empty($_SESSION['reset_authorized']) || empty($_SESSION['reset_email'])) {
    header("Location: ../pages/forgot_password.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/reset_password.php");
    exit;
}

$email           = $_SESSION['reset_email'];
$password        = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

if (strlen($password) < 6) {
    $_SESSION['reset_error'] = "Password must be at least 6 characters long.";
    header("Location: ../pages/reset_password.php");
    exit;
}

if ($password !== $confirmPassword) {
    $_SESSION['reset_error'] = "Passwords do not match.";
    header("Location: ../pages/reset_password.php");
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = mysqli_prepare($conn, "UPDATE users SET password = ? WHERE email = ?");
if (!$stmt) {
    $_SESSION['reset_error'] = "Database error: " . mysqli_error($conn);
    header("Location: ../pages/reset_password.php");
    exit;
}

mysqli_stmt_bind_param($stmt, "ss", $hashedPassword, $email);
$updated = mysqli_stmt_execute($stmt);
mysqli_stmt_close($stmt);

if (!$updated) {
    $_SESSION['reset_error'] = "Failed to update password. Please try again.";
    header("Location: ../pages/reset_password.php");
    exit;
}

// Invalidate all OTPs for this email and forgot_password
$cleanStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 1 WHERE email = ? AND purpose = 'forgot_password'");
if ($cleanStmt) {
    mysqli_stmt_bind_param($cleanStmt, "s", $email);
    mysqli_stmt_execute($cleanStmt);
    mysqli_stmt_close($cleanStmt);
}

// Destroy reset session
unset($_SESSION['reset_authorized'], $_SESSION['reset_email'], $_SESSION['reset_user_id']);

header("Location: ../pages/login.php?password_reset=1");
exit;
