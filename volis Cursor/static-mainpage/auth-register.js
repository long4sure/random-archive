document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const error = document.getElementById("registerError");
    const success = document.getElementById("registerSuccess");

    document.querySelectorAll(".pw-eye").forEach((button) => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            button.style.opacity = isPassword ? "0.5" : "1";
        });
    });

    document.querySelectorAll('.role-option input[type="radio"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            document.querySelectorAll(".role-option").forEach((el) => el.classList.remove("selected"));
            if (this.checked) this.closest(".role-option").classList.add("selected");
        });
    });

    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (!username || !password || !confirmPassword) {
                error.textContent = "All fields are required.";
                error.classList.remove("hidden");
                success.classList.add("hidden");
                return;
            }
            if (password.length < 6) {
                error.textContent = "Password must be at least 6 characters.";
                error.classList.remove("hidden");
                success.classList.add("hidden");
                return;
            }
            if (password !== confirmPassword) {
                error.textContent = "Passwords do not match.";
                error.classList.remove("hidden");
                success.classList.add("hidden");
                return;
            }

            error.classList.add("hidden");
            success.classList.remove("hidden");
            setTimeout(() => { window.location.href = "auth-login.html"; }, 1000);
        });
    }
});
