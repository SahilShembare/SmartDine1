<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

$email   = $_SESSION['otp_email'] ?? '';
$purpose = $_SESSION['otp_purpose'] ?? '';
$name    = $_SESSION['otp_name'] ?? 'SmartDine Customer';

if (empty($email) || empty($purpose)) {
    echo json_encode([
        'success' => false,
        'message' => 'No active OTP session. Please start registration or forgot password again.'
    ]);
    exit;
}

// Check cooldown (60 seconds)
$lastSent = $_SESSION['otp_sent_at'] ?? 0;
$timeSinceLast = time() - $lastSent;

if ($timeSinceLast < OTP_RESEND_COOLDOWN) {
    $remaining = OTP_RESEND_COOLDOWN - $timeSinceLast;
    echo json_encode([
        'success' => false,
        'message' => "Please wait {$remaining} seconds before requesting a new OTP.",
        'cooldown' => $remaining
    ]);
    exit;
}

// Hourly rate limit check (max 5 OTPs per hour per email)
$rateStmt = mysqli_prepare(
    $conn,
    "SELECT COUNT(*) as count_recent FROM email_otps WHERE email = ? AND created_at > (NOW() - INTERVAL 1 HOUR)"
);

if ($rateStmt) {
    mysqli_stmt_bind_param($rateStmt, "s", $email);
    mysqli_stmt_execute($rateStmt);
    $res = mysqli_stmt_get_result($rateStmt);
    $countRow = mysqli_fetch_assoc($res);
    mysqli_stmt_close($rateStmt);

    if ($countRow && (int)$countRow['count_recent'] >= 5) {
        echo json_encode([
            'success' => false,
            'message' => 'You have reached the maximum OTP request limit for this hour. Please try again later.'
        ]);
        exit;
    }
}

// Retrieve payload from previous OTP if registration
$payload = null;
$userId = null;

$prevStmt = mysqli_prepare(
    $conn,
    "SELECT payload, user_id FROM email_otps WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1"
);
if ($prevStmt) {
    mysqli_stmt_bind_param($prevStmt, "ss", $email, $purpose);
    mysqli_stmt_execute($prevStmt);
    $prevRes = mysqli_stmt_get_result($prevStmt);
    if ($prevRow = mysqli_fetch_assoc($prevRes)) {
        $payload = $prevRow['payload'];
        $userId  = $prevRow['user_id'];
    }
    mysqli_stmt_close($prevStmt);
}

// Invalidate older unverified OTPs
$invStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 2 WHERE email = ? AND purpose = ? AND is_verified = 0");
if ($invStmt) {
    mysqli_stmt_bind_param($invStmt, "ss", $email, $purpose);
    mysqli_stmt_execute($invStmt);
    mysqli_stmt_close($invStmt);
}

// Generate new 6-digit OTP
$newOtp = (string)random_int(100000, 999999);
$otpHashed = password_hash($newOtp, PASSWORD_DEFAULT);
$expiresAt = date('Y-m-d H:i:s', time() + OTP_EXPIRY_SECONDS);

$insertStmt = mysqli_prepare(
    $conn,
    "INSERT INTO email_otps (user_id, email, otp_hash, purpose, payload, attempts, is_verified, expires_at, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, ?, NOW())"
);

if (!$insertStmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error while generating new OTP: ' . mysqli_error($conn)
    ]);
    exit;
}

mysqli_stmt_bind_param($insertStmt, "isssss", $userId, $email, $otpHashed, $purpose, $payload, $expiresAt);
$executed = mysqli_stmt_execute($insertStmt);
mysqli_stmt_close($insertStmt);

if (!$executed) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to save new OTP in database.'
    ]);
    exit;
}

// Send OTP via PHPMailer
$mailResult = sendSmartDineOtp($email, $name, $newOtp, $purpose);

if ($mailResult['success']) {
    $_SESSION['otp_sent_at']     = time();
    $_SESSION['otp_expires_at']  = time() + OTP_EXPIRY_SECONDS;
    $_SESSION['otp_success_msg'] = "OTP has been sent to your registered email address.";

    echo json_encode([
        'success'  => true,
        'message'  => 'OTP has been sent to your registered email address.',
        'cooldown' => OTP_RESEND_COOLDOWN,
        'expiry'   => OTP_EXPIRY_SECONDS
    ]);
    exit;
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Unable to send email: ' . $mailResult['error']
    ]);
    exit;
}
