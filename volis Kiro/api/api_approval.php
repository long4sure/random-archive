<?php
session_start();
require '../db.php';
require '../audit_helper.php';   // Fix 3: log_action() was called without this include

// Auth — system_admin only
if (!isset($_SESSION['user']) || $_SESSION['role'] !== 'system_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

// ═══════════════════════════════════════════════════════════════════════════
// FETCH USERS BY APPROVAL STATUS
// ═══════════════════════════════════════════════════════════════════════════
if ($action === 'fetch_users') {
    $status = $_POST['status'] ?? 'all';
    
    if ($status === 'all') {
        $query = "SELECT id, username, role, approval_status, approved_by, approved_date, created_at 
                  FROM users ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
    } else {
        $query = "SELECT id, username, role, approval_status, approved_by, approved_date, created_at 
                  FROM users WHERE approval_status = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('s', $status);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    echo json_encode(['success' => true, 'users' => $users]);
    $stmt->close();
    exit();
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROVE USER
// ═══════════════════════════════════════════════════════════════════════════
if ($action === 'approve_user') {
    $userId = (int)($_POST['user_id'] ?? 0);
    
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
        exit();
    }
    
    $approvedBy = $_SESSION['user'];
    $approvedDate = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("UPDATE users SET approval_status = 'approved', approved_by = ?, approved_date = ? WHERE id = ?");
    $stmt->bind_param('ssi', $approvedBy, $approvedDate, $userId);
    
    if ($stmt->execute()) {
        // Get updated user info
        $userStmt = $conn->prepare("SELECT username, role FROM users WHERE id = ?");
        $userStmt->bind_param('i', $userId);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $userInfo = $userResult->fetch_assoc();
        
        log_action('approve_user', 'users', $userId, "Approved user " . ($userInfo['username'] ?? ''));
        echo json_encode([
            'success' => true, 
            'message' => 'User "' . $userInfo['username'] . '" approved successfully',
            'user' => $userInfo
        ]);
        $userStmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to approve user']);
    }
    
    $stmt->close();
    exit();
}

// ═══════════════════════════════════════════════════════════════════════════
// REJECT USER
// ═══════════════════════════════════════════════════════════════════════════
if ($action === 'reject_user') {
    $userId = (int)($_POST['user_id'] ?? 0);
    
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid user ID']);
        exit();
    }
    
    $approvedBy = $_SESSION['user'];
    $approvedDate = date('Y-m-d H:i:s');
    
    $stmt = $conn->prepare("UPDATE users SET approval_status = 'rejected', approved_by = ?, approved_date = ? WHERE id = ?");
    $stmt->bind_param('ssi', $approvedBy, $approvedDate, $userId);
    
    if ($stmt->execute()) {
        // Get updated user info
        $userStmt = $conn->prepare("SELECT username FROM users WHERE id = ?");
        $userStmt->bind_param('i', $userId);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $userInfo = $userResult->fetch_assoc();
        
        log_action('reject_user', 'users', $userId, "Rejected user " . ($userInfo['username'] ?? ''));

        echo json_encode([
            'success' => true, 
            'message' => 'User "' . $userInfo['username'] . '" rejected',
            'user' => $userInfo
        ]);
        $userStmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to reject user']);
    }
    
    $stmt->close();
    exit();
}

// Invalid action
echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>