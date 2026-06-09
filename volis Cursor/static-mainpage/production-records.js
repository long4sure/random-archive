function getViewFromQuery() {
    const view = new URLSearchParams(window.location.search).get("view");
    return view === "manage" ? "manage" : "add";
}

function showView(view) {
    const add = document.getElementById("add-section");
    const manage = document.getElementById("manage-section");
    if (add) add.classList.toggle("hidden", view !== "add");
    if (manage) manage.classList.toggle("hidden", view !== "manage");
}

function initRowSelection() {
    const table = document.getElementById("recordsTable");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    if (!table || !editBtn || !deleteBtn) return;

    let selected = null;
    table.querySelectorAll("tbody tr").forEach((row) => {
        row.addEventListener("click", () => {
            if (selected) selected.classList.remove("selected");
            selected = row;
            selected.classList.add("selected");
            editBtn.disabled = false;
            deleteBtn.disabled = false;
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    showView(getViewFromQuery());
    initRowSelection();
});
