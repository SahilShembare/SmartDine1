<?php
session_start();

require_once __DIR__ . '/../backend/config.php';
require_once __DIR__ . '/../backend/db.php';
require_once __DIR__ . '/../backend/mailer.php';

$error = '';
$name = '';
$email = '';
$phone = '';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name            = trim($_POST["name"] ?? "");
    $email           = trim($_POST["email"] ?? "");
    $phone           = trim($_POST["phone"] ?? "");
    $password        = $_POST["password"] ?? "";
    $confirmPassword = $_POST["confirm_password"] ?? "";

    // Validation
    if ($name === "" || $email === "" || $phone === "" || $password === "" || $confirmPassword === "") {
        $error = "Please fill in all required fields.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Please enter a valid email address.";
    } elseif (!preg_match("/^[0-9]{10}$/", $phone)) {
        $error = "Mobile number must be exactly 10 digits.";
    } elseif (strlen($password) < 6) {
        $error = "Password must be at least 6 characters long.";
    } elseif ($password !== $confirmPassword) {
        $error = "Passwords do not match. Please re-enter.";
    } else {
        // Check if email already exists in users table
        $checkStmt = mysqli_prepare($conn, "SELECT id FROM users WHERE email = ? LIMIT 1");
        if (!$checkStmt) {
            $error = "Database error: " . mysqli_error($conn);
        } else {
            mysqli_stmt_bind_param($checkStmt, "s", $email);
            mysqli_stmt_execute($checkStmt);
            mysqli_stmt_store_result($checkStmt);

            if (mysqli_stmt_num_rows($checkStmt) > 0) {
                $error = "This email is already registered. Please log in instead.";
                mysqli_stmt_close($checkStmt);
            } else {
                mysqli_stmt_close($checkStmt);

                // Check rate limiting / resend cooldown
                $rateStmt = mysqli_prepare($conn, "SELECT created_at FROM email_otps WHERE email = ? AND purpose = 'registration' ORDER BY id DESC LIMIT 1");
                $canSend = true;
                if ($rateStmt) {
                    mysqli_stmt_bind_param($rateStmt, "s", $email);
                    mysqli_stmt_execute($rateStmt);
                    $rateRes = mysqli_stmt_get_result($rateStmt);
                    if ($rateRow = mysqli_fetch_assoc($rateRes)) {
                        $secondsSinceLast = time() - strtotime($rateRow['created_at']);
                        if ($secondsSinceLast < OTP_RESEND_COOLDOWN) {
                            $wait = OTP_RESEND_COOLDOWN - $secondsSinceLast;
                            $error = "An OTP was recently sent. Please wait {$wait} seconds before requesting again.";
                            $canSend = false;
                        }
                    }
                    mysqli_stmt_close($rateStmt);
                }

                if ($canSend) {
                    // Generate 6-Digit random OTP
                    $otp = (string)random_int(100000, 999999);
                    $otpHashed = password_hash($otp, PASSWORD_DEFAULT);
                    $passwordHashed = password_hash($password, PASSWORD_DEFAULT);
                    $expiresAt = date('Y-m-d H:i:s', time() + OTP_EXPIRY_SECONDS);

                    $payload = json_encode([
                        'name'          => $name,
                        'phone'         => $phone,
                        'password_hash' => $passwordHashed
                    ]);

                    // Invalidate old unverified OTPs for this email and purpose
                    $invalidateStmt = mysqli_prepare($conn, "UPDATE email_otps SET is_verified = 2 WHERE email = ? AND purpose = 'registration' AND is_verified = 0");
                    if ($invalidateStmt) {
                        mysqli_stmt_bind_param($invalidateStmt, "s", $email);
                        mysqli_stmt_execute($invalidateStmt);
                        mysqli_stmt_close($invalidateStmt);
                    }

                    // Insert new OTP record
                    $insertStmt = mysqli_prepare(
                        $conn,
                        "INSERT INTO email_otps (email, otp_hash, purpose, payload, attempts, is_verified, expires_at, created_at) VALUES (?, ?, 'registration', ?, 0, 0, ?, NOW())"
                    );

                    if (!$insertStmt) {
                        $error = "Failed to create verification session: " . mysqli_error($conn);
                    } else {
                        mysqli_stmt_bind_param($insertStmt, "ssss", $email, $otpHashed, $payload, $expiresAt);
                        if (!mysqli_stmt_execute($insertStmt)) {
                            $error = "Database insert failed: " . mysqli_stmt_error($insertStmt);
                            mysqli_stmt_close($insertStmt);
                        } else {
                            mysqli_stmt_close($insertStmt);

                            // Send OTP via PHPMailer with Gmail SMTP
                            $mailResult = sendSmartDineOtp($email, $name, $otp, 'registration');

                            if ($mailResult['success']) {
                                $_SESSION['otp_email']       = $email;
                                $_SESSION['otp_name']        = $name;
                                $_SESSION['otp_purpose']     = 'registration';
                                $_SESSION['otp_sent_at']     = time();
                                $_SESSION['otp_expires_at']  = time() + OTP_EXPIRY_SECONDS;
                                $_SESSION['otp_success_msg'] = "OTP has been sent to your registered email address.";

                                header("Location: verify_otp.php");
                                exit;
                            } else {
                                $error = "Could not send verification email. " . htmlspecialchars($mailResult['error']);
                            }
                        }
                    }
                }
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartDine - Create Account</title>

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

        .register-card {
            width: 480px;
            max-width: 100%;
            padding: 40px 35px;
            background: rgba(255, 255, 255, 0.98);
            border-radius: 24px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(10px);
        }

        .logo {
            text-align: center;
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

        .subtitle {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 25px;
        }

        .alert-custom {
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alert-error {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }

        .form-group {
            margin-bottom: 18px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 6px;
        }

        .input-wrapper {
            position: relative;
        }

        .input-wrapper i.prefix-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #198754;
            font-size: 17px;
            pointer-events: none;
        }

        .form-control-custom {
            width: 100%;
            padding: 13px 16px 13px 44px;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            color: #1e293b;
            background-color: #f8fafc;
            transition: all 0.25s ease;
        }

        .form-control-custom:focus {
            outline: none;
            border-color: #198754;
            background-color: #ffffff;
            box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.15);
        }

        .toggle-password {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
            display: flex;
            align-items: center;
        }

        .toggle-password:hover {
            color: #475569;
        }

        .btn-register {
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
            margin-top: 10px;
        }

        .btn-register:hover {
            background: linear-gradient(135deg, #157347 0%, #0f5132 100%);
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(25, 135, 84, 0.35);
        }

        .btn-register:active {
            transform: translateY(0);
        }

        .card-footer-custom {
            margin-top: 25px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
        }

        .login-link {
            color: #198754;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
        }

        .login-link:hover {
            color: #0f5132;
            text-decoration: underline;
        }

        .info-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: #f0fdf4;
            border: 1px solid #dcfce7;
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 12px;
            color: #166534;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>

<div class="register-card">
    <div class="logo">
        <i class="bi bi-cup-hot-fill logo-icon"></i>
        Smart<span>Dine</span>
    </div>
    <p class="subtitle">Create an account & order seamlessly</p>

    <div class="info-pill">
        <i class="bi bi-shield-check" style="font-size: 16px;"></i>
        <span>A 6-digit OTP will be sent to your email to verify your account.</span>
    </div>

    <?php if ($error !== ''): ?>
        <div class="alert-custom alert-error">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span><?php echo htmlspecialchars($error); ?></span>
        </div>
    <?php endif; ?>

    <form method="POST" action="" id="registerForm">
        <!-- Full Name -->
        <div class="form-group">
            <label class="form-label" for="name">Full Name</label>
            <div class="input-wrapper">
                <i class="bi bi-person prefix-icon"></i>
                <input 
                    type="text" 
                    name="name" 
                    id="name" 
                    class="form-control-custom" 
                    placeholder="Enter your full name" 
                    value="<?php echo htmlspecialchars($name); ?>" 
                    required 
                    autocomplete="name"
                >
            </div>
        </div>

        <!-- Email Address -->
        <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <div class="input-wrapper">
                <i class="bi bi-envelope prefix-icon"></i>
                <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    class="form-control-custom" 
                    placeholder="you@example.com" 
                    value="<?php echo htmlspecialchars($email); ?>" 
                    required 
                    autocomplete="email"
                >
            </div>
        </div>

        <!-- Mobile Number -->
        <div class="form-group">
            <label class="form-label" for="phone">Mobile Number (10 Digits)</label>
            <div class="input-wrapper">
                <i class="bi bi-telephone prefix-icon"></i>
                <input 
                    type="tel" 
                    name="phone" 
                    id="phone" 
                    class="form-control-custom" 
                    placeholder="10-digit mobile number" 
                    pattern="[0-9]{10}" 
                    maxlength="10" 
                    value="<?php echo htmlspecialchars($phone); ?>" 
                    required 
                    autocomplete="tel"
                >
            </div>
        </div>

        <!-- Password -->
        <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="input-wrapper">
                <i class="bi bi-lock prefix-icon"></i>
                <input 
                    type="password" 
                    name="password" 
                    id="password" 
                    class="form-control-custom" 
                    placeholder="At least 6 characters" 
                    minlength="6" 
                    required 
                    autocomplete="new-password"
                >
                <button type="button" class="toggle-password" onclick="togglePasswordVisibility('password', this)" tabindex="-1">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
            <label class="form-label" for="confirm_password">Confirm Password</label>
            <div class="input-wrapper">
                <i class="bi bi-shield-lock prefix-icon"></i>
                <input 
                    type="password" 
                    name="confirm_password" 
                    id="confirm_password" 
                    class="form-control-custom" 
                    placeholder="Re-enter password" 
                    minlength="6" 
                    required 
                    autocomplete="new-password"
                >
                <button type="button" class="toggle-password" onclick="togglePasswordVisibility('confirm_password', this)" tabindex="-1">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn-register" id="submitBtn">
            <span>Continue & Send OTP</span>
            <i class="bi bi-arrow-right"></i>
        </button>
    </form>

    <div class="card-footer-custom">
        <span style="color: #64748b; font-size: 14px;">Already have an account?</span>
        <a href="login.php" class="login-link ms-1">Log In</a>
    </div>
</div>

<script>
    function togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    }

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        const pass = document.getElementById('password').value;
        const confirmPass = document.getElementById('confirm_password').value;
        const phone = document.getElementById('phone').value;

        if (!/^[0-9]{10}$/.test(phone)) {
            e.preventDefault();
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }

        if (pass !== confirmPass) {
            e.preventDefault();
            alert('Passwords do not match. Please re-enter.');
            return;
        }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Sending OTP...';
    });
</script>

</body>
</html>
