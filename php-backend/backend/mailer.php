<?php
/**
 * SmartDine - PHPMailer Service for Email OTP Verification
 */

require_once __DIR__ . '/config.php';

// Load PHPMailer from Composer vendor autoload
$vendorAutoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($vendorAutoload)) {
    // If running in a nested or alternative path
    $vendorAutoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
}

if (file_exists($vendorAutoload)) {
    require_once $vendorAutoload;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

/**
 * Send 6-Digit OTP via PHPMailer using Gmail SMTP
 *
 * @param string $toEmail
 * @param string $toName
 * @param string $otp
 * @param string $purpose ('registration' or 'forgot_password')
 * @return array ['success' => bool, 'error' => string|null]
 */
function sendSmartDineOtp($toEmail, $toName, $otp, $purpose = 'registration') {
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        return [
            'success' => false,
            'error' => 'PHPMailer is not installed. Please run "composer install" in the SmartDine project directory.'
        ];
    }

    $mail = new PHPMailer(true);

    try {
        // SMTP Server Settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        if (strtolower(SMTP_SECURE) === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }

        // Sender & Recipient
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $displayName = !empty($toName) ? $toName : 'SmartDine Customer';
        $mail->addAddress($toEmail, $displayName);

        // Content
        $mail->isHTML(true);

        if ($purpose === 'registration') {
            $subject = "SmartDine - Verify Your Email Address";
            $headline = "Welcome to SmartDine!";
            $subHeadline = "Complete your registration";
            $messageBody = "Thank you for choosing <strong>SmartDine</strong>. Use the 6-digit verification code below to verify your email address and activate your account.";
        } else {
            $subject = "SmartDine - Password Reset Verification Code";
            $headline = "Password Reset Request";
            $subHeadline = "Security Verification";
            $messageBody = "We received a request to reset your SmartDine password. Enter the 6-digit verification code below to proceed with setting a new password.";
        }

        $mail->Subject = $subject;

        $htmlContent = '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>' . htmlspecialchars($subject) . '</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 30px 15px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                            <!-- Header Banner -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #198754 0%, #157347 100%); padding: 32px 25px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                                        Smart<span style="color: #d1e7dd;">Dine</span>
                                    </h1>
                                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">
                                        ' . htmlspecialchars($subHeadline) . '
                                    </p>
                                </td>
                            </tr>

                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 35px 30px 25px 30px;">
                                    <h2 style="color: #1e293b; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">
                                        ' . htmlspecialchars($headline) . '
                                    </h2>
                                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                        Hello <strong>' . htmlspecialchars($displayName) . '</strong>,
                                    </p>
                                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                        ' . $messageBody . '
                                    </p>

                                    <!-- OTP Box -->
                                    <div style="background-color: #f0fdf4; border: 2px dashed #198754; border-radius: 14px; padding: 22px; text-align: center; margin: 28px 0;">
                                        <div style="font-size: 12px; color: #166534; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 8px;">
                                            Your 6-Digit Verification Code
                                        </div>
                                        <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #198754; font-family: monospace; margin: 4px 0;">
                                            ' . htmlspecialchars($otp) . '
                                        </div>
                                        <div style="font-size: 13px; color: #15803d; margin-top: 8px;">
                                            ⏱️ Valid for <strong>5 minutes</strong> only
                                        </div>
                                    </div>

                                    <!-- Security Notice -->
                                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                            <strong>Security Notice:</strong> Never share this OTP with anyone. SmartDine will never call or email asking for your verification code.
                                        </p>
                                    </div>

                                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                                        If you did not request this verification code, you can safely ignore this email. No changes have been made to your account.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                        &copy; ' . date('Y') . ' SmartDine - Smart Restaurant Ordering System. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>';

        $mail->Body = $htmlContent;
        $mail->AltBody = "Hello " . $displayName . ",\n\n" .
            "Your SmartDine verification code is: " . $otp . "\n" .
            "This code is valid for 5 minutes only.\n\n" .
            "If you did not request this, please disregard this email.";

        $mail->send();
        return ['success' => true, 'error' => null];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $mail->ErrorInfo ?: $e->getMessage()
        ];
    }
}
