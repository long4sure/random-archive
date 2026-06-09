<?php
session_start();
require 'db.php';
require 'auth_check.php';        // Fix 2: session security, token validation, idle timeout
require 'audit_helper.php';      // Fix 1: makes log_action() available

// Fix 2: use auth_require_role for clean role enforcement
auth_require_role('system_admin');

$success = '';
$error   = '';

// ── ADD USER ────────────────────────────────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'add') {
    // Fix 9: CSRF check
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== ($_SESSION['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
    $newFirst     = trim($_POST['first_name']  ?? '');
    $newLast      = trim($_POST['last_name']   ?? '');
    $newUsername  = trim($_POST['new_username'] ?? '');
    $newPassword  = $_POST['new_password']      ?? '';
    $newRole      = $_POST['new_role']           ?? '';
    $newTeam      = $_POST['new_team']           ?? null;
    $newLine      = $_POST['new_line']           ?? null;

    $allowedRoles = ['system_admin', 'admin', 'data_entry', 'viewer']; // Fix 7a: admin added

    if (empty($newFirst) || empty($newLast) || empty($newUsername) || empty($newPassword) || empty($newRole)) {
        $error = 'All required fields must be filled.';
    } elseif (!in_array($newRole, $allowedRoles, true)) {
        $error = 'Invalid role selected.';
    } elseif (strlen($newPassword) < 6) {
        $error = 'Password must be at least 6 characters.';
    } else {
        // Fix 7b: admin has no team/line restrictions (same as system_admin/viewer)
        // Only data_entry requires team + line
        if ($newRole === 'data_entry') {
            if (empty($newTeam) || !in_array($newTeam, ['A','B','C'], true)) {
                $error = 'A valid team (A, B, or C) is required for Data Entry users.';
            } elseif (empty($newLine)) {
                $error = 'Line is required for Data Entry users.';
            }
        } else {
            // system_admin, admin, viewer — no team or line
            $newTeam = null;
            $newLine = null;
        }

        if (!$error) {
            $chk = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $chk->bind_param('s', $newUsername);
            $chk->execute(); $chk->store_result();
            if ($chk->num_rows > 0) {
                $error = "Username \"" . htmlspecialchars($newUsername) . "\" already exists.";
            } else {
                $hash = password_hash($newPassword, PASSWORD_DEFAULT);
                $ins  = $conn->prepare("INSERT INTO users (first_name, last_name, username, password, role, team, line, approval_status, approved_by, approved_date)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())");
                $ins->bind_param('ssssssss', $newFirst, $newLast, $newUsername, $hash, $newRole, $newTeam, $newLine, $_SESSION['user']);
                if ($ins->execute()) {
                    $success = "User \"" . htmlspecialchars($newUsername) . "\" created successfully.";
                    log_action('add_user', 'users', (int)$conn->insert_id, "Created user $newUsername ($newRole)");
                } else {
                    $error = 'Failed to create user.';
                }
            }
        }
    }
    } // end CSRF check
}

// ── DELETE USER ─────────────────────────────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'delete') {
    // Fix 9: CSRF check
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== ($_SESSION['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $delId   = (int)($_POST['user_id'] ?? 0);
        $selfQ   = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $selfQ->bind_param('s', $_SESSION['user']); $selfQ->execute();
        $selfRow = $selfQ->get_result()->fetch_assoc();
        if ($delId === (int)($selfRow['id'] ?? -1)) {
            $error = 'You cannot delete your own account.';
        } elseif ($delId > 0) {
            $del = $conn->prepare("DELETE FROM users WHERE id = ?");
            $del->bind_param('i', $delId);
            if ($del->execute()) {
                $success = 'User deleted successfully.';
                log_action('delete_user', 'users', $delId, "Deleted user ID $delId");
            } else {
                $error = 'Failed to delete user.';
            }
        }
    }
}

// ── EDIT USER ────────────────────────────────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'edit') {
    // Fix 9: CSRF check
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== ($_SESSION['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $editId   = (int)($_POST['edit_id']       ?? 0);
        $editRole = $_POST['edit_role']             ?? '';
        $editPw   = $_POST['edit_password']         ?? '';
        $editTeam = $_POST['edit_team']             ?? null;
        $editLine = $_POST['edit_line']             ?? null;

        $allowedEditRoles = ['system_admin', 'admin', 'data_entry', 'viewer'];

        if ($editId <= 0 || !in_array($editRole, $allowedEditRoles, true)) {
            $error = 'Invalid edit request.';
        } elseif (!empty($editPw) && strlen($editPw) < 6) {
            $error = 'New password must be at least 6 characters.';
        } else {
            // Fix 6 + Fix 7b: enforce team/line rules per role
            if ($editRole === 'data_entry') {
                if (empty($editTeam) || !in_array($editTeam, ['A','B','C'], true)) {
                    $error = 'A valid team (A, B, or C) is required for Data Entry users.';
                } elseif (empty($editLine)) {
                    $error = 'Line is required for Data Entry users.';
                }
            } else {
                // system_admin, admin, viewer — clear team/line
                $editTeam = null;
                $editLine = null;
            }

            if (!$error) {
                if (!empty($editPw)) {
                    $hash = password_hash($editPw, PASSWORD_DEFAULT);
                    $upd  = $conn->prepare("UPDATE users SET role = ?, password = ?, team = ?, line = ? WHERE id = ?");
                    $upd->bind_param('ssssi', $editRole, $hash, $editTeam, $editLine, $editId);
                } else {
                    $upd = $conn->prepare("UPDATE users SET role = ?, team = ?, line = ? WHERE id = ?");
                    $upd->bind_param('sssi', $editRole, $editTeam, $editLine, $editId);
                }
                if ($upd->execute()) {
                    $success = 'User updated successfully.';
                    log_action('edit_user', 'users', $editId, "Edited user ID $editId — role: $editRole");
                } else {
                    $error = 'Update failed.';
                }
            }
        }
    }
}

// ── FETCH USERS ──────────────────────────────────────────────────
$users = [];
$res   = $conn->query("SELECT id, first_name, last_name, username, role, team, line, approval_status, approved_by, approved_date, created_at FROM users ORDER BY created_at DESC");
if ($res) while ($r = $res->fetch_assoc()) $users[] = $r;

// Count by role and approval status
$roleCount   = ['system_admin' => 0, 'data_entry' => 0, 'viewer' => 0, 'admin' => 0];
$statusCount = ['pending' => 0, 'approved' => 0, 'rejected' => 0];
foreach ($users as $u) {
    if (isset($roleCount[$u['role']])) $roleCount[$u['role']]++;
    if (isset($statusCount[$u['approval_status']])) $statusCount[$u['approval_status']]++;
}
$pendingUsersCount = $statusCount['pending'];

// ── Lines from sku_master for the new user form ─────────────────
$linesByTeam = ['A' => [], 'B' => [], 'C' => []];
$lineRes = $conn->query("SELECT DISTINCT TEAM, LINE FROM sku_master WHERE LINE IS NOT NULL AND LINE != '' ORDER BY LINE");
if ($lineRes) {
    while ($lr = $lineRes->fetch_assoc()) {
        $t = $lr['TEAM'];
        if (in_array($t, ['A','B','C'], true)) {
            $linesByTeam[$t][] = $lr['LINE'];
        }
    }
}
$linesJSON = json_encode($linesByTeam);

// ── CSRF token ──────────────────────────────────────────────────
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

// ── Load template ───────────────────────────────────────────────
require __DIR__ . '/view/manage_users.tpl.php';