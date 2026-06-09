function getViewFromQuery() {
    const view = new URLSearchParams(window.location.search).get("view");
    const valid = ["formulate", "manage-line", "manage-lv"];
    return valid.includes(view) ? view : "formulate";
}

function showSection(view) {
    const mapping = {
        formulate: "formulate-section",
        "manage-line": "manage-line-section",
        "manage-lv": "manage-lv-section"
    };
    Object.values(mapping).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
    const active = document.getElementById(mapping[view]);
    if (active) active.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    showSection(getViewFromQuery());
});
