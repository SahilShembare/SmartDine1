<?php

session_start();

/*
 * Login page par kisi role ko automatically redirect
 * nahi karna hai.
 *
 * Isse ERR_TOO_MANY_REDIRECTS avoid hoga.
 */


/* =========================================
   SUCCESS MESSAGE FLAGS
========================================= */

$registrationSuccess = false;
$passwordResetSuccess = false;


/* =========================================
   REGISTRATION SUCCESS
========================================= */

if (
    isset($_GET['registered']) &&
    $_GET['registered'] === '1'
) {

    $registrationSuccess = true;

}


/* =========================================
   PASSWORD RESET SUCCESS
========================================= */

if (
    isset($_GET['password_reset']) &&
    $_GET['password_reset'] === '1'
) {

    $passwordResetSuccess = true;

}

?>

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>SmartDine Login</title>


    <!-- Bootstrap -->

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
    >


    <!-- Bootstrap Icons -->

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
        rel="stylesheet"
    >


    <!-- Google Font -->

    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
    >


    <style>

        * {

            margin: 0;
            padding: 0;
            box-sizing: border-box;

            font-family: 'Poppins', sans-serif;

        }


        /* =========================================
           BODY
        ========================================== */

        body {

            min-height: 100vh;

            display: flex;

            justify-content: center;

            align-items: center;

            padding: 20px;

            background:

                linear-gradient(
                    rgba(0, 0, 0, .60),
                    rgba(0, 0, 0, .60)
                ),

                url("../images/login-bg.jpg");

            background-size: cover;

            background-position: center;

            background-repeat: no-repeat;

        }


        /* =========================================
           SUCCESS MESSAGE
        ========================================== */

        .success-message {

            position: fixed;

            top: 20px;

            left: 50%;

            transform:
                translateX(-50%);

            width: min(
                500px,
                calc(100% - 30px)
            );

            padding:
                14px 45px 14px 18px;

            background:
                rgba(
                    25,
                    135,
                    84,
                    .97
                );

            color: white;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .40
                );

            border-radius: 12px;

            box-shadow:
                0 10px 30px
                rgba(
                    0,
                    0,
                    0,
                    .35
                );

            z-index: 99999;

            display: flex;

            align-items: center;

            gap: 10px;

            font-size: 14px;

            font-weight: 600;

            animation:
                successDrop .35s ease;

        }


        .success-message i {

            font-size: 19px;

            flex-shrink: 0;

        }


        .success-message button {

            position: absolute;

            right: 10px;

            top: 50%;

            transform:
                translateY(-50%);

            width: auto;

            padding: 0 5px;

            margin: 0;

            background: transparent;

            color: white;

            border: none;

            font-size: 24px;

            line-height: 1;

            cursor: pointer;

        }


        @keyframes successDrop {

            from {

                opacity: 0;

                transform:
                    translate(
                        -50%,
                        -15px
                    );

            }

            to {

                opacity: 1;

                transform:
                    translate(
                        -50%,
                        0
                    );

            }

        }


        /* =========================================
           LOGIN BOX
        ========================================== */

        .login-box {

            width: 430px;

            max-width: 100%;

            padding: 35px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .15
                );

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);

            border-radius: 20px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .25
                );

            box-shadow:
                0 15px 35px
                rgba(
                    0,
                    0,
                    0,
                    .40
                );

        }


        /* =========================================
           LOGO
        ========================================== */

        .logo {

            font-size: 70px;

            text-align: center;

            margin-bottom: 10px;

        }


        /* =========================================
           TITLE
        ========================================== */

        h2 {

            color: #fff;

            text-align: center;

            font-weight: 700;

        }


        .subtitle {

            color: #eee;

            text-align: center;

            font-size: 15px;

            margin-bottom: 25px;

        }


        /* =========================================
           INPUTS
        ========================================== */

        select,
        input {

            width: 100%;

            padding: 13px;

            margin-bottom: 15px;

            border: none;

            border-radius: 10px;

            font-size: 15px;

            outline: none;

        }


        select:focus,
        input:focus {

            box-shadow:
                0 0 0 3px
                rgba(
                    40,
                    167,
                    69,
                    .25
                );

        }


        /* =========================================
           LOGIN BUTTON
        ========================================== */

        .login-btn {

            width: 100%;

            padding: 14px;

            background: #28a745;

            color: #fff;

            border: none;

            border-radius: 10px;

            font-size: 18px;

            font-weight: 600;

            transition: .3s;

            cursor: pointer;

        }


        .login-btn:hover {

            background: #1f8b39;

            transform:
                scale(1.02);

        }


        /* =========================================
           CREATE ACCOUNT
        ========================================== */

        .create-account {

            display: block;

            width: 100%;

            padding: 13px;

            margin-top: 18px;

            text-align: center;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .15
                );

            color: #fff;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .45
                );

            border-radius: 10px;

            font-size: 16px;

            font-weight: 600;

            text-decoration: none;

            transition: .3s;

        }


        .create-account:hover {

            background: #fff;

            color: #198754;

            transform:
                scale(1.02);

        }


        /* =========================================
           FORGOT PASSWORD
        ========================================== */

        .forgot-password {

            display: block;

            margin-top: 17px;

            text-align: center;

            color: #fff;

            font-weight: 500;

            font-size: 14px;

            text-decoration: none;

            transition: .3s;

        }


        .forgot-password:hover {

            color: #8ff0b5;

            text-decoration: underline;

        }


        /* =========================================
           FOOTER
        ========================================== */

        .footer {

            margin-top: 20px;

            text-align: center;

            color: #ddd;

            font-size: 13px;

        }


        /* =========================================
           MOBILE
        ========================================== */

        @media (max-width: 500px) {

            .login-box {

                padding:
                    25px 20px;

            }


            .logo {

                font-size: 55px;

            }

        }

    </style>

</head>


<body>


<!-- =========================================
     REGISTRATION SUCCESS
========================================== -->

<?php if ($registrationSuccess): ?>

    <div
        id="registrationSuccess"
        class="success-message"
    >

        <i class="bi bi-check-circle-fill"></i>

        <span>
            Registration Successful! Please login.
        </span>

        <button
            type="button"
            onclick="closeSuccessMessage('registrationSuccess')"
            aria-label="Close"
        >

            &times;

        </button>

    </div>

<?php endif; ?>


<!-- =========================================
     PASSWORD RESET SUCCESS
========================================== -->

<?php if ($passwordResetSuccess): ?>

    <div
        id="passwordResetSuccess"
        class="success-message"
    >

        <i class="bi bi-check-circle-fill"></i>

        <span>
            Password Reset Successful! Please login.
        </span>

        <button
            type="button"
            onclick="closeSuccessMessage('passwordResetSuccess')"
            aria-label="Close"
        >

            &times;

        </button>

    </div>

<?php endif; ?>


<!-- =========================================
     LOGIN BOX
========================================== -->

<div class="login-box">


    <!-- LOGO -->

    <div class="logo">

        ðŸ½ï¸

    </div>


    <!-- TITLE -->

    <h2>

        SmartDine

    </h2>


    <p class="subtitle">

        QR Based Smart Restaurant Ordering System

    </p>


    <!-- =========================================
         LOGIN FORM
    ========================================== -->

    <form
        action="../backend/login.php"
        method="POST"
    >


        <!-- ROLE -->

        <select
            name="role"
            required
        >

            <option value="">

                Select Role

            </option>


            <option value="customer">

                Customer

            </option>


            <option value="admin">

                Admin

            </option>


            <option value="kitchen">

                Kitchen

            </option>

        </select>


        <!-- EMAIL -->

        <input
            type="email"
            name="email"
            placeholder="ðŸ“§ Enter Email Address"
            autocomplete="email"
            required
        >


        <!-- PASSWORD -->

        <input
            type="password"
            name="password"
            placeholder="ðŸ”’ Enter Password"
            autocomplete="current-password"
            required
        >


        <!-- LOGIN -->

        <button
            type="submit"
            class="login-btn"
        >

            <i
                class="bi bi-box-arrow-in-right"
            ></i>

            Login

        </button>


    </form>


    <!-- =========================================
         CREATE ACCOUNT
    ========================================== -->

    <a
        href="register.php"
        class="create-account"
    >

        <i
            class="bi bi-person-plus-fill"
        ></i>

        Create New Account

    </a>


    <!-- =========================================
         FORGOT PASSWORD
    ========================================== -->

    <a
        href="forgot_password.php"
        class="forgot-password"
    >

        <i
            class="bi bi-key-fill"
        ></i>

        Forgot Password?

    </a>


    <!-- =========================================
         FOOTER
    ========================================== -->

    <div class="footer">

        Â© 2026 SmartDine | All Rights Reserved

    </div>


</div>


<script>

/* =========================================
   CLOSE SUCCESS MESSAGE
========================================= */

function closeSuccessMessage(messageId) {

    const message =
        document.getElementById(messageId);


    if (message) {

        message.style.transition =
            "opacity .4s ease";

        message.style.opacity = "0";


        setTimeout(
            function () {

                if (message) {

                    message.remove();

                }

            },
            400
        );

    }

}


/* =========================================
   AUTO HIDE SUCCESS MESSAGES
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const registrationMessage =
            document.getElementById(
                "registrationSuccess"
            );


        const passwordResetMessage =
            document.getElementById(
                "passwordResetSuccess"
            );


        /* Registration message */

        if (registrationMessage) {

            setTimeout(
                function () {

                    closeSuccessMessage(
                        "registrationSuccess"
                    );

                },
                5000
            );

        }


        /* Password reset message */

        if (passwordResetMessage) {

            setTimeout(
                function () {

                    closeSuccessMessage(
                        "passwordResetSuccess"
                    );

                },
                5000
            );

        }


        /* =====================================
           REMOVE SUCCESS QUERY FROM URL
        ===================================== */

        if (
            window.history &&
            window.history.replaceState
        ) {

            const url =
                new URL(
                    window.location.href
                );


            let changed = false;


            if (
                url.searchParams.has(
                    "registered"
                )
            ) {

                url.searchParams.delete(
                    "registered"
                );

                changed = true;

            }


            if (
                url.searchParams.has(
                    "password_reset"
                )
            ) {

                url.searchParams.delete(
                    "password_reset"
                );

                changed = true;

            }


            if (changed) {

                window.history.replaceState(
                    {},
                    document.title,
                    url.pathname +
                    (
                        url.search
                        ? url.search
                        : ""
                    )
                );

            }

        }

    }
);

</script>


</body>

</html>