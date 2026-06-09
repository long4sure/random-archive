<?php
session_start();
require 'db.php';

if (isset($_SESSION['id'])) {
    $logoutStmt = $conn->prepare("UPDATE users SET session_token = NULL, last_active = NULL WHERE id = ?");
    $logoutStmt->bind_param('i', $_SESSION['id']);
    $logoutStmt->execute();
    $logoutStmt->close();

    require_once 'audit_helper.php';   // in case not already loaded (though it's in db.php which is included)
    log_action('logout', null, null, "User {$_SESSION['user']} logged out");
}
session_unset();
session_destroy();
header("Location: login.php");
exit();