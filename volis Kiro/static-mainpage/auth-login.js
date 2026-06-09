document.addEventListener("DOMContentLoaded", () => {
    const pwToggle = document.getElementById("pwToggle");
    const password = document.getElementById("password");
    const form     = document.getElementById("loginForm");
    const error    = document.getElementById("loginError");

    if (pwToggle && password) {
        pwToggle.addEventListener("click", () => {
            const isPass = password.type === "password";
            password.type = isPass ? "text" : "password";
            pwToggle.style.opacity = isPass ? "0.5" : "1";
        });
    }

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const pass     = password.value.trim();
            if (!username || !pass) {
                document.getElementById("loginErrorMsg").textContent = "Please enter both username and password.";
                error.classList.add("show");
                return;
            }
            error.classList.remove("show");
            window.location.href = "dashboard.html";
        });
    }
});
