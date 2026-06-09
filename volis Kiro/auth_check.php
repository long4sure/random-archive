<?php
/**
 * auth_check.php
 * ─────────────────────────────────────────────────────────────
 * Shared session security guard. Include at the top of every
 * protected page AFTER session_start() and require 'db.php'.
 *
 * Protections provided:
 *   1. Unauthenticated access redirect
 *   2. One active session per user (invalidates old sessions
 *      if the same account logs in from another browser/tab)
 *   3. Idle session timeout (30 minutes of inactivity)
 *   4. Pending user block (approval status check)
 *   5. User-Agent binding (basic hijacking detection)
 *   6. Cache-control headers (prevents back-button after logout)
 *
 * Phase 2 additions:
 *   - Fetches first_name, last_name, team, line from DB on every
 *     request and syncs them into $_SESSION so all pages always
 *     have current values (survives mid-session user edits by admin)
 *   - $_AUTH_USER now exposes all 10 user fields
 *   - auth_require_role() unchanged — still accepts variadic roles
 *   - New helper auth_is_scoped() for data_entry scope checks
 *
 * Usage on every protected page:
 *   session_start();
 *   require 'db.php';
 *   require 'auth_check.php';
 *
 * For role-restricted pages, add after the require:
 *   auth_require_role('system_admin');
 *   auth_require_role('system_admin', 'admin');
 *
 * For data_entry scope checks in page logic:
 *   if (auth_is_scoped()) {
 *       // use $_SESSION['team'] and $_SESSION['line']
 *   }
 * ─────────────────────────────────────────────────────────────
 */

// ── Cache-control: prevent browser caching of protected pages ──
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');

// ── Config ────────────────────────────────────────────────────
define('SESSION_TIMEOUT_SECONDS', 1800);    // 30 minutes idle
define('SESSION_LOGIN_PAGE',      'login.php');

// ── 1. Must be logged in ──────────────────────────────────────
if (!isset($_SESSION['user'], $_SESSION['id'], $_SESSION['token'])) {
    auth_force_logout('Session expired. Please sign in again.');
}

// ── 2. Validate session token + fetch full user row ───────────
// Phase 2: SELECT now includes first_name, last_name, team, line
// so any admin-made changes to a user's team/line assignment are
// immediately reflected without requiring a new login.
global $conn, $_AUTH_USER;

$authStmt = $conn->prepare(
    "SELECT id, username, role, approval_status, session_token,
            last_active, first_name, last_name, team, line
     FROM users WHERE id = ? AND username = ? LIMIT 1"
);
$authStmt->bind_param('is', $_SESSION['id'], $_SESSION['user']);
$authStmt->execute();
$authRow = $authStmt->get_result()->fetch_assoc();
$authStmt->close();

if (!$authRow) {
    // User no longer exists in DB
    auth_force_logout('Account not found. Please sign in again.');
}

// ── 3. One active session per user ───────────────────────────
// If the stored token doesn't match, someone else has logged in
// with this account — invalidate this session.
if ($authRow['session_token'] !== $_SESSION['token']) {
    auth_force_logout('Your session was ended because this account signed in elsewhere.');
}

// ── 4. Block pending / rejected users ────────────────────────
if ($authRow['approval_status'] !== 'approved') {
    auth_force_logout('Your account is not approved. Please contact an administrator.');
}

// ── 5. Idle timeout ───────────────────────────────────────────
$lastActive = $authRow['last_active'] ? strtotime($authRow['last_active']) : 0;
if ($lastActive > 0 && (time() - $lastActive) > SESSION_TIMEOUT_SECONDS) {
    $expStmt = $conn->prepare(
        "UPDATE users SET session_token = NULL, last_active = NULL WHERE id = ?"
    );
    $expStmt->bind_param('i', $authRow['id']);
    $expStmt->execute();
    $expStmt->close();
    auth_force_logout('Your session expired due to inactivity. Please sign in again.');
}

// ── 6. User-Agent binding ─────────────────────────────────────
if (isset($_SESSION['ua_hash'])) {
    $currentUA = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? '');
    if ($currentUA !== $_SESSION['ua_hash']) {
        auth_force_logout('Session invalid. Please sign in again.');
    }
}

// ── 7. Update last_active (at most once per minute) ──────────
if (!$lastActive || (time() - $lastActive) > 60) {
    $updStmt = $conn->prepare("UPDATE users SET last_active = NOW() WHERE id = ?");
    $updStmt->bind_param('i', $authRow['id']);
    $updStmt->execute();
    $updStmt->close();
}

// ── 8. Phase 2: sync session with current DB values ──────────
// Keeps session up-to-date if an admin changes role/team/line
// while the user is already logged in — takes effect on next request.
$_SESSION['role']       = $authRow['role'];
$_SESSION['first_name'] = $authRow['first_name'] ?? '';
$_SESSION['last_name']  = $authRow['last_name']  ?? '';
$_SESSION['team']       = $authRow['team']        ?? null;
$_SESSION['line']       = $authRow['line']        ?? null;

// ── 9. Store validated user row globally ─────────────────────
// Pages can access any field via $_AUTH_USER['field_name']
$_AUTH_USER = $authRow;

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Restrict a page to one or more roles.
 * Redirects to mainpage.php with ?access=denied if the current
 * user's role is not in the allowed list.
 *
 * Usage:
 *   auth_require_role('system_admin');
 *   auth_require_role('system_admin', 'admin');
 */
function auth_require_role(string ...$roles): void {
    global $_AUTH_USER;
    if (!in_array($_AUTH_USER['role'] ?? '', $roles, true)) {
        header('Location: mainpage.php?access=denied');
        exit();
    }
}

/**
 * Returns true when the current user is data_entry AND has a
 * team + line assignment. Use this to decide whether to scope
 * DB queries to their specific team/line.
 *
 * Usage:
 *   if (auth_is_scoped()) {
 *       // restrict query to $_SESSION['team'] and $_SESSION['line']
 *   }
 */
function auth_is_scoped(): bool {
    return $_SESSION['role'] === 'data_entry'
        && !empty($_SESSION['team'])
        && !empty($_SESSION['line']);
}

/**
 * Returns the display name for the current user.
 * Falls back to username if first/last name are not set.
 *
 * Usage:
 *   echo auth_display_name();   // "Jane Doe" or "jane.doe"
 */
function auth_display_name(): string {
    $first = trim($_SESSION['first_name'] ?? '');
    $last  = trim($_SESSION['last_name']  ?? '');
    if ($first || $last) {
        return trim("$first $last");
    }
    return $_SESSION['user'] ?? 'Unknown';
}

/**
 * Force logout with a message redirected to login.php.
 */
function auth_force_logout(string $message = ''): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();

    $url = SESSION_LOGIN_PAGE;
    if ($message) {
        $url .= '?msg=' . urlencode($message);
    }
    header('Location: ' . $url);
    exit();
}