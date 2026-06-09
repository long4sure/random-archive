<?php
/**
 * audit_helper.php
 * Centralised logging function for the audit trail.
 */

function log_action(string $action, ?string $table = null, ?int $record_id = null, string $description = ''): void {
    global $conn;

    $user_id  = $_SESSION['id']   ?? 0;
    $username = $_SESSION['user'] ?? 'unknown';
    $role     = $_SESSION['role'] ?? '';

    $stmt = $conn->prepare(
        "INSERT INTO audit_log (user_id, username, role, action, table_name, record_id, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('issssis', $user_id, $username, $role, $action, $table, $record_id, $description);
    $stmt->execute();
}