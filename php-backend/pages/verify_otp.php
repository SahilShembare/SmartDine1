<?php
session_start();

require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/db.php';

$email   = $_SESSION['otp_email'] ?? '';
$purpose = $_SESSION['otp_purpose'] ?? '';
$name    = $_SESSION['otp_name'] ?? 'Customer';

// If no active OTP session exists, redirect to login
if (empty($email) || empty($purpose)) {
    header("Location: login.php");
    exit;
}

// Flash messages
$successMessage = $_SESSION['otp_success_msg'] ?? '';
unset($_SESSION['otp_success_msg']);

$errorMessage = $_SESSION['otp_error_msg'] ?? '';
unset($_SESSION['otp_error_msg']);

// Calculate remaining expiry seconds
$expiresAt = $_SESSION['otp_expires_at'] ?? (time() + OTP_EXPIRY_SECONDS);
$remainingExpirySeconds = max(0, $expiresAt - time());

// Calculate remaining resend cooldown seconds
$sentAt = $_SESSION['otp_sent_at'] ?? time();
$timePassed = time() - $sentAt;
$remainingCooldownSeconds = max(0, OTP_RESEND_COOLDOWN - $timePassed);

// Mask email for extra privacy (e.g., sa***@example.com)
function maskEmail($em) {
    $parts = explode('@', $em);
    if (count($parts) < 2) return $em;
    $user = $parts[0];
    $domain = $parts[1];
    $len = strlen($user);
    if ($len <= 2) {
        $maskedUser = $user . '***';
    } else {
        $maskedUser = substr($user, 0, 2) . str_repeat('*', max(3, $len - 2));
    }
    return $maskedUser . '@' . $domain;
}

$maskedEmail = maskEmail($email);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartDine - Verify Your Email</title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Google Font: Poppins -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }

        body {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 25px 15px;
            background: linear-gradient(rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0.68)), url("../images/login-bg.jpg");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
        }

        .otp-card {
            width: 460px;
            max-width: 100%;
            padding: 40px 32px;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(10px);
            text-align: center;
        }

        .logo {
            font-size: 32px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .logo-icon {
            color: #198754;
            font-size: 30px;
        }

        .logo span {
            color: #198754;
        }

        .card-heading {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 15px;
            margin-bottom: 6px;
        }

        .email-info-box {
            background-color: #f1f8f4;
            border: 1px solid #d1e7dd;
            color: #14532d;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13.5px;
            margin: 18px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            word-break: break-all;
        }

        .email-info-box strong {
            color: #198754;
        }

        /* Alert notifications */
        .alert-custom {
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 500;
            margin-bottom: 20px;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .alert-success-custom {
            background-color: #d1e7dd;
            color: #0f5132;
            border: 1px solid #badbcc;
        }

        .alert-error-custom {
            background-color: #f8d7da;
            color: #842029;
            border: 1px solid #f5c2c7;
        }

        /* 6-Digit OTP Input Grid */
        .otp-input-container {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 25px 0 15px 0;
        }

        .otp-digit {
            width: 52px;
            height: 60px;
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            font-size: 26px;
            font-weight: 700;
            text-align: center;
            color: #0f172a;
            background-color: #f8fafc;
            transition: all 0.2s ease;
            outline: none;
        }

        .otp-digit:focus {
            border-color: #198754;
            background-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.18);
            transform: translateY(-2px);
        }

        .otp-digit.filled {
            border-color: #198754;
            background-color: #f0fdf4;
            color: #166534;
        }

        /* Timers section */
        .timer-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #475569;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 22px;
        }

        .timer-badge.warning {
            background-color: #fff1f2;
            border-color: #fecdd3;
            color: #e11d48;
        }

        .timer-badge span.countdown-number {
            font-weight: 700;
            color: #198754;
        }

        .timer-badge.warning span.countdown-number {
            color: #e11d48;
        }

        /* Buttons */
        .btn-verify {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #198754 0%, #157347 100%);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(25, 135, 84, 0.28);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-verify:hover:not(:disabled) {
            background: linear-gradient(135deg, #157347 0%, #0f5132 100%);
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(25, 135, 84, 0.35);
        }

        .btn-verify:disabled {
            background: #94a3b8;
            box-shadow: none;
            cursor: not-allowed;
        }

        .resend-section {
            margin-top: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 14px;
            color: #64748b;
        }

        .btn-resend {
            background: none;
            border: none;
            color: #198754;
            font-weight: 600;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .btn-resend:hover:not(:disabled) {
            color: #0f5132;
            text-decoration: underline;
        }

        .btn-resend:disabled {
            color: #94a3b8;
            cursor: not-allowed;
            text-decoration: none;
        }

        .footer-nav {
            margin-top: 24px;
            padding-top: 18px;
            border-top: 1px solid #f1f5f9;
        }

        .footer-nav a {
            color: #64748b;
            text-decoration: none;
            font-size: 13.5px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 0.2s;
        }

        .footer-nav a:hover {
            color: #198754;
        }

        @media (max-width: 480px) {
            .otp-card {
                padding: 30px 20px;
            }
            .otp-digit {
                width: 44px;
                height: 52px;
                font-size: 22px;
            }
            .otp-input-container {
                gap: 6px;
            }
        }
    </style>
</head>
<body>

<div class="otp-card">
    <!-- Brand Logo -->
    <div class="logo">
        <i class="bi bi-cup-hot-fill logo-icon"></i>
        Smart<span>Dine</span>
    </div>

    <!-- Heading -->
    <h2 class="card-heading">Verify Your Email</h2>
    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
        Enter the 6-digit verification code sent to:
    </p>

    <!-- Email Box -->
    <div class="email-info-box">
        <i class="bi bi-envelope-check-fill" style="font-size: 16px;"></i>
        <span><?php echo htmlspecialchars($email); ?></span>
    </div>

    <!-- Dynamic Alert Container -->
    <div id="alertContainer">
        <?php if (!empty($successMessage)): ?>
            <div class="alert-custom alert-success-custom">
                <i class="bi bi-check-circle-fill" style="font-size: 16px;"></i>
                <span><?php echo htmlspecialchars($successMessage); ?></span>
            </div>
        <?php endif; ?>

        <?php if (!empty($errorMessage)): ?>
            <div class="alert-custom alert-error-custom">
                <i class="bi bi-exclamation-triangle-fill" style="font-size: 16px;"></i>
                <span><?php echo htmlspecialchars($errorMessage); ?></span>
            </div>
        <?php endif; ?>
    </div>

    <!-- OTP Form -->
    <form method="POST" action="../backend/verify_otp.php" id="otpForm">
        <!-- Hidden full OTP field -->
        <input type="hidden" name="otp" id="fullOtpInput" value="">

        <!-- 6-digit input boxes -->
        <div class="otp-input-container">
            <input type="text" class="otp-digit" maxlength="1" inputmode="numeric" pattern="[0-9]" data-index="0" autofocus autocomplete="one-time-code">
            <input type="text" class="otp-digit" maxlength="1" inputmode="numeric" pattern="[0-9]" data-index="1">
            <input type="text" class="otp-digit" maxlength="1" inputmode="numeric" pattern="[0-9]" data-index="2">
            <input type="text" class="otp-digit" maxlength="1" inputmode="numeric" pattern="[0-9]" data-index="3">
            <input type="text" class="otp-digit" maxlength="1" inputmode="numeric" pattern="[0-9]" data-index="4">
            <input type="text" class="otp-digit" maxlength="1" inputmode="numeric" pattern="[0-9]" data-index="5">
        </div>

        <!-- Expiry Countdown Timer -->
        <div>
            <div class="timer-badge" id="expiryBadge">
                <i class="bi bi-clock-history"></i>
                <span>Code expires in <span class="countdown-number" id="expiryTimer">05:00</span></span>
            </div>
        </div>

        <!-- Verify Button -->
        <button type="submit" class="btn-verify" id="verifyBtn" disabled>
            <i class="bi bi-shield-check"></i>
            <span>Verify OTP</span>
        </button>
    </form>

    <!-- Resend Section with Cooldown -->
    <div class="resend-section">
        <span>Didn't receive code?</span>
        <button type="button" class="btn-resend" id="resendBtn" disabled onclick="handleResendOtp()">
            <span id="resendText">Resend OTP</span>
            <span id="cooldownText">(60s)</span>
        </button>
    </div>

    <!-- Navigation Back -->
    <div class="footer-nav">
        <?php if ($purpose === 'registration'): ?>
            <a href="register.php">
                <i class="bi bi-arrow-left"></i>
                <span>Change Email / Back to Register</span>
            </a>
        <?php else: ?>
            <a href="forgot_password.php">
                <i class="bi bi-arrow-left"></i>
                <span>Back to Forgot Password</span>
            </a>
        <?php endif; ?>
    </div>
</div>

<script>
    // State variables
    let remainingExpirySeconds = <?php echo (int)$remainingExpirySeconds; ?>;
    let remainingCooldownSeconds = <?php echo (int)$remainingCooldownSeconds; ?>;
    let expiryInterval = null;
    let cooldownInterval = null;

    const digits = document.querySelectorAll('.otp-digit');
    const fullOtpInput = document.getElementById('fullOtpInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const expiryTimerEl = document.getElementById('expiryTimer');
    const expiryBadgeEl = document.getElementById('expiryBadge');
    const resendBtn = document.getElementById('resendBtn');
    const resendTextEl = document.getElementById('resendText');
    const cooldownTextEl = document.getElementById('cooldownText');
    const alertContainer = document.getElementById('alertContainer');

    // Display Alert
    function showAlert(msg, type = 'error') {
        const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
        const alertClass = type === 'success' ? 'alert-success-custom' : 'alert-error-custom';
        alertContainer.innerHTML = `
            <div class="alert-custom ${alertClass}">
                <i class="bi ${iconClass}" style="font-size: 16px;"></i>
                <span>${escapeHtml(msg)}</span>
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }

    // Combine 6 digits into full string
    function updateOtpValue() {
        let code = '';
        digits.forEach(d => code += d.value.trim());
        fullOtpInput.value = code;

        digits.forEach(d => {
            if (d.value.trim() !== '') {
                d.classList.add('filled');
            } else {
                d.classList.remove('filled');
            }
        });

        // Enable or disable Verify button
        if (code.length === 6 && /^[0-9]{6}$/.test(code) && remainingExpirySeconds > 0) {
            verifyBtn.disabled = false;
        } else {
            verifyBtn.disabled = true;
        }
    }

    // Setup input listeners for digits
    digits.forEach((input, index) => {
        // Only accept numbers
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (!/^[0-9]$/.test(val)) {
                e.target.value = '';
                updateOtpValue();
                return;
            }

            updateOtpValue();

            // Auto-advance to next box
            if (val !== '' && index < digits.length - 1) {
                digits[index + 1].focus();
                digits[index + 1].select();
            }
        });

        // Handle Backspace navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (input.value === '' && index > 0) {
                    digits[index - 1].focus();
                    digits[index - 1].select();
                }
            } else if (e.key === 'ArrowLeft' && index > 0) {
                digits[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < digits.length - 1) {
                digits[index + 1].focus();
            }
        });

        // Handle paste event (e.g. user copies full 6 digits)
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (/^[0-9]{6}$/.test(pasteData)) {
                for (let i = 0; i < 6; i++) {
                    digits[i].value = pasteData[i];
                }
                updateOtpValue();
                digits[5].focus();
                verifyBtn.focus();
            }
        });
    });

    // Format seconds as MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    // Expiry Timer Countdown
    function startExpiryTimer() {
        if (expiryInterval) clearInterval(expiryInterval);

        function tick() {
            if (remainingExpirySeconds <= 0) {
                clearInterval(expiryInterval);
                expiryTimerEl.innerText = '00:00';
                expiryBadgeEl.classList.add('warning');
                verifyBtn.disabled = true;
                showAlert('OTP has expired. Please request a new OTP.', 'error');
                return;
            }

            expiryTimerEl.innerText = formatTime(remainingExpirySeconds);

            if (remainingExpirySeconds <= 60) {
                expiryBadgeEl.classList.add('warning');
            } else {
                expiryBadgeEl.classList.remove('warning');
            }

            remainingExpirySeconds--;
        }

        tick();
        expiryInterval = setInterval(tick, 1000);
    }

    // Resend Cooldown Countdown
    function startCooldownTimer() {
        if (cooldownInterval) clearInterval(cooldownInterval);

        function tick() {
            if (remainingCooldownSeconds <= 0) {
                clearInterval(cooldownInterval);
                resendBtn.disabled = false;
                resendTextEl.innerText = 'Resend OTP';
                cooldownTextEl.innerText = '';
                return;
            }

            resendBtn.disabled = true;
            resendTextEl.innerText = 'Resend in ';
            cooldownTextEl.innerText = remainingCooldownSeconds + 's';
            remainingCooldownSeconds--;
        }

        tick();
        cooldownInterval = setInterval(tick, 1000);
    }

    // Handle AJAX Resend OTP
    async function handleResendOtp() {
        resendBtn.disabled = true;
        resendTextEl.innerText = 'Sending OTP...';
        cooldownTextEl.innerText = '';

        try {
            const response = await fetch('../backend/resend_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                showAlert('OTP has been sent to your registered email address.', 'success');
                remainingExpirySeconds = data.expiry || 300;
                remainingCooldownSeconds = data.cooldown || 60;
                startExpiryTimer();
                startCooldownTimer();

                // Clear input boxes
                digits.forEach(d => d.value = '');
                updateOtpValue();
                digits[0].focus();
            } else {
                showAlert(data.message || 'Failed to resend OTP. Please try again.', 'error');
                remainingCooldownSeconds = data.cooldown || 10;
                startCooldownTimer();
            }
        } catch (err) {
            showAlert('Network error while resending OTP. Please try again.', 'error');
            resendBtn.disabled = false;
            resendTextEl.innerText = 'Resend OTP';
            cooldownTextEl.innerText = '';
        }
    }

    // Form submission animation
    document.getElementById('otpForm').addEventListener('submit', function(e) {
        if (fullOtpInput.value.length !== 6) {
            e.preventDefault();
            showAlert('Please enter the full 6-digit code.', 'error');
            return;
        }
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Verifying...';
    });

    // Start timers on page load
    startExpiryTimer();
    startCooldownTimer();
</script>

</body>
</html>
