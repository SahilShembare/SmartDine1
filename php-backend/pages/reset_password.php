<?php
session_start();

if (empty($_SESSION['reset_authorized']) || empty($_SESSION['reset_email'])) {
    header("Location: forgot_password.php");
    exit;
}

$email = $_SESSION['reset_email'];
$error = $_SESSION['reset_error'] ?? '';
unset($_SESSION['reset_error']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartDine - Set New Password</title>

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

        .reset-card {
            width: 440px;
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

        .card-subtitle {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.5;
        }

        .alert-error {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fecaca;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 13.5px;
            margin-bottom: 20px;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .form-group {
            margin-bottom: 20px;
            text-align: left;
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

        .btn-submit {
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

        .btn-submit:hover {
            background: linear-gradient(135deg, #157347 0%, #0f5132 100%);
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(25, 135, 84, 0.35);
        }
    </style>
</head>
<body>

<div class="reset-card">
    <div class="logo">
        <i class="bi bi-cup-hot-fill logo-icon"></i>
        Smart<span>Dine</span>
    </div>

    <h2 class="card-heading">Set New Password</h2>
    <p class="card-subtitle">
        Your OTP has been verified for <strong><?php echo htmlspecialchars($email); ?></strong>. Please enter your new password below.
    </p>

    <?php if (!empty($error)): ?>
        <div class="alert-error">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span><?php echo htmlspecialchars($error); ?></span>
        </div>
    <?php endif; ?>

    <form method="POST" action="../backend/reset_password.php" id="resetForm">
        <div class="form-group">
            <label class="form-label" for="password">New Password</label>
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
                    autofocus
                >
                <button type="button" class="toggle-password" onclick="togglePassword('password', this)" tabindex="-1">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label" for="confirm_password">Confirm New Password</label>
            <div class="input-wrapper">
                <i class="bi bi-shield-lock prefix-icon"></i>
                <input 
                    type="password" 
                    name="confirm_password" 
                    id="confirm_password" 
                    class="form-control-custom" 
                    placeholder="Re-enter new password" 
                    minlength="6" 
                    required 
                    autocomplete="new-password"
                >
                <button type="button" class="toggle-password" onclick="togglePassword('confirm_password', this)" tabindex="-1">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        </div>

        <button type="submit" class="btn-submit" id="submitBtn">
            <span>Update Password</span>
            <i class="bi bi-check-circle"></i>
        </button>
    </form>
</div>

<script>
    function togglePassword(inputId, btn) {
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

    document.getElementById('resetForm').addEventListener('submit', function(e) {
        const p1 = document.getElementById('password').value;
        const p2 = document.getElementById('confirm_password').value;

        if (p1 !== p2) {
            e.preventDefault();
            alert('Passwords do not match. Please re-enter.');
            return;
        }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Updating...';
    });
</script>

</body>
</html>
