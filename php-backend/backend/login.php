<?php

session_start();

include "db.php";

/* =========================================
   DATABASE CHECK
========================================= */

if (!isset($conn) || !($conn instanceof mysqli)) {
    die("Database connection error.");
}

/* =========================================
   ONLY POST
========================================= */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: ../pages/login.php");
    exit;
}

/* =========================================
   FORM DATA
========================================= */

$role     = trim($_POST['role'] ?? '');
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

/* =========================================
   VALIDATION
========================================= */

if ($role === '' || $email === '' || $password === '') {

    echo "<script>
        alert('Please fill all fields.');
        window.location.replace('../pages/login.php');
    </script>";

    exit;
}

$allowedRoles = ['customer', 'admin', 'kitchen'];

if (!in_array($role, $allowedRoles, true)) {

    echo "<script>
        alert('Invalid role selected.');
        window.location.replace('../pages/login.php');
    </script>";

    exit;
}

/* =========================================
   FIND USER
========================================= */

$stmt = mysqli_prepare(
    $conn,
    "SELECT id, name, email, phone, password, role, status
     FROM users
     WHERE email = ?
     AND role = ?
     LIMIT 1"
);

if (!$stmt) {
    die("Login query error: " . mysqli_error($conn));
}

mysqli_stmt_bind_param(
    $stmt,
    "ss",
    $email,
    $role
);

if (!mysqli_stmt_execute($stmt)) {
    die("Login execute error: " . mysqli_stmt_error($stmt));
}

$result = mysqli_stmt_get_result($stmt);

$user = mysqli_fetch_assoc($result);

/* =========================================
   USER NOT FOUND
========================================= */

if (!$user) {

    echo "<script>
        alert('Invalid email, password or role.');
        window.location.replace('../pages/login.php');
    </script>";

    exit;
}

/* =========================================
   STATUS
========================================= */

if (
    isset($user['status']) &&
    $user['status'] !== 'active'
) {

    echo "<script>
        alert('Your account is inactive.');
        window.location.replace('../pages/login.php');
    </script>";

    exit;
}

/* =========================================
   PASSWORD
========================================= */

$passwordCorrect = false;

/* Plain password support */
if ($password === $user['password']) {
    $passwordCorrect = true;
}

/* Hashed password support */
if (
    !$passwordCorrect &&
    !empty($user['password']) &&
    password_verify(
        $password,
        $user['password']
    )
) {
    $passwordCorrect = true;
}

/* =========================================
   WRONG PASSWORD
========================================= */

if (!$passwordCorrect) {

    echo "<script>
        alert('Invalid email or password.');
        window.location.replace('../pages/login.php');
    </script>";

    exit;
}

/* =========================================
   LOGIN SUCCESS
========================================= */

session_regenerate_id(true);

/* Clear old authentication values */
unset(
    $_SESSION['role'],
    $_SESSION['user_role'],
    $_SESSION['user_id'],
    $_SESSION['user_name'],
    $_SESSION['user_email'],
    $_SESSION['user_phone']
);

/* Create fresh session */

$_SESSION['user_id'] =
    (int)$user['id'];

$_SESSION['user_name'] =
    $user['name'];

$_SESSION['user_email'] =
    $user['email'];

$_SESSION['user_phone'] =
    $user['phone'] ?? '';

$_SESSION['role'] =
    $user['role'];

$_SESSION['user_role'] =
    $user['role'];

/* =========================================
   REDIRECT
========================================= */

switch ($user['role']) {

    case 'customer':

        unset($_SESSION['table_no']);

        header(
            "Location: ../pages/customer_home.php"
        );

        exit;

    case 'admin':

        header(
            "Location: ../pages/admin.php"
        );

        exit;

    case 'kitchen':

        header(
            "Location: ../pages/kitchen.php"
        );

        exit;

    default:

        session_unset();
        session_destroy();

        header(
            "Location: ../pages/login.php"
        );

        exit;
}