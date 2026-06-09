<?php
/**
 * api/api_auth.php
 * ─────────────────────────────────────────────────────────────
 * Shared bootstrap for all API endpoints.
 * Handles session auth, token validation, role checks,
 * and JSON response helpers.
 *
 * Phase 2 changes:
 *   - SELECT now fetches team, line, first_name, last_name
 *   - $_SESSION['team'] and $_SESSION['line'] synced on every
 *     API call so endpoints can use them for scope enforcement
 *   - 'system_admin' added as a valid role (was previously just
 *     'admin', 'data_entry', 'viewer')
 *   - New helper api_is_scoped() mirrors auth_is_scoped() from
 *     auth_check.php for use within API endpoints
 * ─────────────────────────────────────────────────────────────
 */

session_start();
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../audit_helper.php';

header('Content-Type: application/json; charset=utf-8');

// ── JSON response helpers ─────────────────────────────────────
function api_response(string $status, $data = null, string $message = '', int $httpCode = 200): void {
    http_response_code($httpCode);
    $payload = ['status' => $status];
    if ($message !== '') $payload['message'] = $message;
    if ($data    !== null) {
        // Flatten single-key 'data' arrays into the root for convenience
        if (is_array($data)) {
            foreach ($data as $k => $v) $payload[$k] = $v;
        } else {
            $payload['data'] = $data;
        }
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function api_error(string $message, int $httpCode = 400): void {
    http_response_code($httpCode);
    echo json_encode(['status' => 'error', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// ── Auth guard ────────────────────────────────────────────────
// Validates session, token, approval status, and idle timeout.
// Phase 2: also fetches and syncs team/line into $_SESSION.
function require_auth(): void {
    global $conn;

    // 1. Session must exist
    if (!isset($_SESSION['user'], $_SESSION['id'], $_SESSION['token'])) {
        api_error('Unauthorized — no active session.', 401);
    }

    // 2. Validate against DB
    // Phase 2: fetch team, line, first_name, last_name alongside
    // existing columns so they are always available in endpoints.
    $stmt = $conn->prepare(
        "SELECT id, role, approval_status, session_token, last_active,
                team, line, first_name, last_name
         FROM users WHERE id = ? AND username = ? LIMIT 1"
    );
    $stmt->bind_param('is', $_SESSION['id'], $_SESSION['user']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        api_error('Unauthorized — user not found.', 401);
    }

    // 3. Session token must match (blocks displaced sessions)
    if ($row['session_token'] !== $_SESSION['token']) {
        api_error('Unauthorized — session ended by another login.', 401);
    }

    // 4. User must be approved
    if ($row['approval_status'] !== 'approved') {
        api_error('Unauthorized — account not approved.', 401);
    }

    // 5. Idle timeout (30 minutes)
    $lastActive = $row['last_active'] ? strtotime($row['last_active']) : 0;
    if ($lastActive > 0 && (time() - $lastActive) > 1800) {
        $exp = $conn->prepare("UPDATE users SET session_token = NULL, last_active = NULL WHERE id = ?");
        $exp->bind_param('i', $row['id']);
        $exp->execute();
        $exp->close();
        api_error('Session expired due to inactivity. Please sign in again.', 401);
    }

    // 6. Update last_active (at most once per minute)
    if (!$lastActive || (time() - $lastActive) > 60) {
        $upd = $conn->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
        $upd->bind_param('i', $row['id']);
        $upd->execute();
        $upd->close();
    }

    // 7. Phase 2: sync all user fields into session
    // Keeps API scope checks current if admin changes role/team/line
    // while the user is already authenticated.
    $_SESSION['role']       = $row['role'];
    $_SESSION['team']       = $row['team']        ?? null;
    $_SESSION['line']       = $row['line']        ?? null;
    $_SESSION['first_name'] = $row['first_name']  ?? '';
    $_SESSION['last_name']  = $row['last_name']   ?? '';
}

// ── Role guard ────────────────────────────────────────────────
// Usage: require_role('system_admin', 'admin', 'data_entry')
// Phase 2: 'system_admin' added as a valid role.
function require_role(string ...$roles): void {
    require_auth();
    $userRole = $_SESSION['role'] ?? '';
    if (!in_array($userRole, $roles, true)) {
        api_error('Forbidden — insufficient role.', 403);
    }
}

// ── Scope check helper ────────────────────────────────────────
// Returns true when the current user is data_entry AND has both
// team and line set in session. Use this in endpoints to decide
// whether to restrict queries to the user's own team/line.
//
// Usage:
//   if (api_is_scoped()) {
//       // add AND TEAM = ? AND LINE = ? to your query
//   }
function api_is_scoped(): bool {
    return ($_SESSION['role'] ?? '') === 'data_entry'
        && !empty($_SESSION['team'])
        && !empty($_SESSION['line']);
}

// ── Line IN clause builder ────────────────────────────────────
// Builds a safe parameterised IN clause for multi-line filters.
// Usage: [$clause, $params, $types] = buildLineIn(['LINE_06','LINE_12']);
function buildLineIn(array $lines): array {
    if (empty($lines)) return ['', [], ''];
    $placeholders = implode(',', array_fill(0, count($lines), '?'));
    return [
        " AND LINE IN ($placeholders)",
        array_values($lines),
        str_repeat('s', count($lines)),
    ];
}