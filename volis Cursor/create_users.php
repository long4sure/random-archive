<?php
session_start();
require 'db.php';

$error   = '';
$success = '';

// If already logged in, redirect
if (isset($_SESSION['user'])) {
    header("Location: mainpage.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username         = trim($_POST['username']         ?? '');
    $password         = $_POST['password']              ?? '';
    $confirm_password = $_POST['confirm_password']      ?? '';
    $role             = $_POST['role']                  ?? '';

    $allowedRoles = ['viewer', 'data_entry'];

    // Validation
    if (empty($username) || empty($password) || empty($confirm_password) || empty($role)) {
        $error = 'All fields are required.';
    } elseif (strlen($username) < 3) {
        $error = 'Username must be at least 3 characters.';
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $error = 'Username may only contain letters, numbers, and underscores.';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters.';
    } elseif ($password !== $confirm_password) {
        $error = 'Passwords do not match.';
    } elseif (!in_array($role, $allowedRoles, true)) {
        $error = 'Invalid role selected.';
    } else {
        // Check if username already exists
        $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $check->bind_param('s', $username);
        $check->execute();
        $check->store_result();

        if ($check->num_rows > 0) {
            $error = 'Username already taken. Please choose another.';
        } else {
            $hashed = password_hash($password, PASSWORD_DEFAULT);

            // Insert with 'pending' approval status
            $stmt = $conn->prepare("INSERT INTO users (username, password, role, approval_status) VALUES (?, ?, ?, 'pending')");
            $stmt->bind_param('sss', $username, $hashed, $role);

            if ($stmt->execute()) {
                $roleLabel = $role === 'data_entry' ? 'Data Entry' : 'Viewer';
                $success = 'Account created successfully as <strong>' . $roleLabel . '</strong>!<br>
                           <strong style="color: #f59e0b;">Your account is pending admin approval.</strong><br>
                           You will be able to log in once an administrator approves your account.';
            } else {
                $error = 'Something went wrong. Please try again.';
            }
            $stmt->close();
        }
        $check->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Account – Production Monitoring System</title>
    <link rel="stylesheet" href="css/create_users.css">
</head>
<body>
    <div class="login-card">
        <h2 class="login-heading">
            <img src="images/login3.png" alt="Login icon" class="login-icon">
            Create Account
        </h2>

        <?php if (!empty($error)): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <?php if (!empty($success)): ?>
            <div class="success"><?php echo $success; ?></div>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-top: 16px; font-size: 14px; line-height: 1.6;">
                <strong style="color: #92400e; display: block; margin-bottom: 8px;">⏳ What's Next?</strong>
                <p style="color: #78350f; margin: 0;">
                    An administrator will review your account request. You'll be notified once approved and can then 
                    <a href="login.php" style="color: #b45309; text-decoration: underline;">sign in here</a>.
                </p>
            </div>
            <p class="note" style="margin-top: 16px;"><a href="login.php">← Back to Sign In</a></p>
        <?php else: ?>
            <form method="post" action="create_users.php">

                <label for="username">Username</label>
                <input type="text" name="username" id="username"
                    placeholder="Choose a username"
                    value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
                    required autocomplete="off">

                <label for="password">Password</label>
                <div class="pw-field">
                    <input type="password" name="password" id="password"
                        placeholder="Min. 6 characters" required autocomplete="new-password">
                    <button type="button" class="pw-eye" onclick="togglePw('password', this)"
                        title="Show/hide password">&#x1F441;</button>
                </div>

                <label for="confirm_password">Confirm Password</label>
                <div class="pw-field">
                    <input type="password" name="confirm_password" id="confirm_password"
                        placeholder="Re-enter password" required autocomplete="new-password">
                    <button type="button" class="pw-eye" onclick="togglePw('confirm_password', this)"
                        title="Show/hide password">&#x1F441;</button>
                </div>

                <label for="role">Role</label>
                <div class="role-group">
                    <label class="role-option <?php echo (($_POST['role'] ?? '') === 'viewer') ? 'selected' : ''; ?>">
                        <input type="radio" name="role" value="viewer"
                            <?php echo (($_POST['role'] ?? '') === 'viewer' || ($_POST['role'] ?? '') === '') ? 'checked' : ''; ?>>
                        <span class="role-icon">&#x1F441;</span>
                        <span class="role-label">Viewer</span>
                        <span class="role-desc">Read-only access to reports</span>
                    </label>
                    <label class="role-option <?php echo (($_POST['role'] ?? '') === 'data_entry') ? 'selected' : ''; ?>">
                        <input type="radio" name="role" value="data_entry"
                            <?php echo (($_POST['role'] ?? '') === 'data_entry') ? 'checked' : ''; ?>>
                        <span class="role-icon">&#x270F;</span>
                        <span class="role-label">Data Entry</span>
                        <span class="role-desc">Can submit and edit records</span>
                    </label>
                </div>

                <button type="submit" class="submit-btn">Create Account</button>
            </form>

            <p class="note">Already have an account? <a href="login.php">Sign in</a></p>
            
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-top: 20px; border-radius: 4px; font-size: 13px; color: #475569;">
                <strong style="color: #1e40af;">📋 Note:</strong> After registration, your account will be pending approval. An administrator must approve your account before you can log in.
            </div>
        <?php endif; ?>
    </div>

    <script>
    function togglePw(id, btn) {
        var inp = document.getElementById(id);
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.style.opacity = inp.type === 'text' ? '0.5' : '1';
    }

    // Highlight selected role card
    document.querySelectorAll('.role-option input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.role-option').forEach(function(el) {
                el.classList.remove('selected');
            });
            if (this.checked) this.closest('.role-option').classList.add('selected');
        });
    });
    </script>
</body>
</html>
