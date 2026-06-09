<?php
session_start();
require 'db.php';

// Redirect if already logged in
if (isset($_SESSION['user'])) {
    header("Location: mainpage.php");
    exit();
}

$error = '';

if (isset($_POST['login'])) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password']      ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password.';
    } else {
        // Phase 2: fetch first_name, last_name, team, line alongside existing columns
        $stmt = $conn->prepare(
            "SELECT id, username, password, role, approval_status,
                    first_name, last_name, team, line
             FROM users WHERE username = ? LIMIT 1"
        );
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows === 1) {
            $row = $result->fetch_assoc();

            if (password_verify($password, $row['password'])) {

                if ($row['approval_status'] === 'pending') {
                    $error = 'Your account is pending approval. '
                           . 'Please wait for an administrator to approve your account.';

                } elseif ($row['approval_status'] === 'rejected') {
                    $error = 'Your account registration was rejected. '
                           . 'Please contact an administrator for more information.';

                } elseif ($row['approval_status'] === 'approved') {

                    // ── Successful login ──────────────────────────────────────
                    session_regenerate_id(true);

                    // Generate a unique session token
                    $token = bin2hex(random_bytes(32));

                    // Store the token in the DB and update last_active
                    $tokenStmt = $conn->prepare(
                        "UPDATE users
                         SET session_token = ?, last_active = NOW()
                         WHERE id = ?"
                    );
                    $tokenStmt->bind_param('si', $token, $row['id']);
                    $tokenStmt->execute();
                    $tokenStmt->close();

                    // ── Core session variables (existing) ────────────────────
                    $_SESSION['user']    = $row['username'];
                    $_SESSION['id']      = (int)$row['id'];
                    $_SESSION['role']    = $row['role'];
                    $_SESSION['token']   = $token;
                    $_SESSION['ua_hash'] = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? '');

                    // ── Phase 2: identity + team/line scope ──────────────────
                    // Store first and last name for display across all pages
                    $_SESSION['first_name'] = $row['first_name'] ?? '';
                    $_SESSION['last_name']  = $row['last_name']  ?? '';

                    // Store team and line for data_entry scope enforcement.
                    // system_admin, admin, viewer: both will be NULL in the DB
                    // data_entry: both will be set (e.g. 'A', 'LINE_06')
                    $_SESSION['team'] = $row['team'] ?? null;
                    $_SESSION['line'] = $row['line'] ?? null;

                    // ── Audit log ─────────────────────────────────────────────
                    require_once 'audit_helper.php';
                    log_action('login', null, null, "User {$row['username']} logged in");

                    header("Location: mainpage.php");
                    exit();

                } else {
                    $error = 'Invalid account status. Please contact an administrator.';
                }
            } else {
                $error = 'Invalid username or password.';
            }
        } else {
            $error = 'Invalid username or password.';
        }
        $stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login – PIONEER Production Monitoring System</title>
    <link rel="icon" href="images/p_icon.png" type="image/png">
    <link rel="stylesheet" href="css/login.css">
</head>
<body>
    <div class="login-card">
        <h2 class="login-heading">
            <img src="images/login3.png" alt="Login icon" class="login-icon">
            Sign In
        </h2>

        <?php if (!empty($error)): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form method="post" action="login.php">
            <label for="username">Username</label>
            <input type="text" name="username" id="username"
                placeholder="Enter your username"
                value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
                required autocomplete="username">

            <label for="password">Password</label>
            <div class="pw-field">
                <input type="password" name="password" id="password"
                    placeholder="Enter your password"
                    required autocomplete="current-password">
                <button type="button" class="pw-eye"
                        onclick="togglePw('password', this)"
                        title="Show/hide password">&#x1F441;</button>
            </div>

            <input type="submit" name="login" value="Sign In">
        </form>

        <p class="note">Enter your credentials to access the system.</p>
        </p>
    </div>

    <script>
    function togglePw(id, btn) {
        var inp = document.getElementById(id);
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.style.opacity = inp.type === 'text' ? '0.5' : '1';
    }
    </script>
</body>
</html>