document.addEventListener("DOMContentLoaded", () => {
    const pwToggle = document.getElementById("pwToggle");
    const password = document.getElementById("password");
    const form = document.getElementById("loginForm");
    const error = document.getElementById("loginError");

    if (pwToggle && password) {
        pwToggle.addEventListener("click", () => {
            const isPassword = password.type === "password";
            password.type = isPassword ? "text" : "password";
            pwToggle.style.opacity = isPassword ? "0.5" : "1";
        });
    }

    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const username = document.getElementById("username").value.trim();
            const pass = password.value.trim();
            if (!username || !pass) {
                error.classList.remove("hidden");
                return;
            }
            error.classList.add("hidden");
            window.location.href = "dashboard.html";
        });
    }
});
