document.addEventListener("DOMContentLoaded", () => {
    const form    = document.getElementById("registerForm");
    const error   = document.getElementById("registerError");
    const success = document.getElementById("registerSuccess");

    // Password toggles
    document.querySelectorAll(".login-pwd-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            const input    = document.getElementById(targetId);
            if (!input) return;
            const isPass = input.type === "password";
            input.type   = isPass ? "text" : "password";
            btn.style.opacity = isPass ? "0.5" : "1";
        });
    });

    // Role option highlight
    document.querySelectorAll('.role-option input[type="radio"]').forEach(radio => {
        radio.addEventListener("change", function () {
            document.querySelectorAll(".role-option").forEach(el => el.classList.remove("selected"));
            if (this.checked) this.closest(".role-option").classList.add("selected");
        });
    });

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            const first    = document.getElementById("firstName").value.trim();
            const last     = document.getElementById("lastName").value.trim();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const confirm  = document.getElementById("confirmPassword").value;
            const errorMsg = document.getElementById("registerErrorMsg");

            const showError = msg => {
                errorMsg.textContent = msg;
                error.classList.add("show");
                success.classList.add("hidden");
            };

            if (!first || !last || !username || !password || !confirm) {
                showError("All fields are required."); return;
            }
            if (password.length < 6) {
                showError("Password must be at least 6 characters."); return;
            }
            if (password !== confirm) {
                showError("Passwords do not match."); return;
            }

            error.classList.remove("show");
            success.classList.remove("hidden");
            setTimeout(() => { window.location.href = "auth-login.html"; }, 1500);
        });
    }
});
