const mockData = {
    cumulativeChartData: { labels: ["L1", "L2", "L3", "L4"], datasets: [{ label: "VOLPAS Actual", backgroundColor: "#3b82f6", data: [24500, 31000, 28600, 39400] }, { label: "VOLPAS Planned", backgroundColor: "#94a3b8", data: [26000, 32000, 30000, 42000] }] },
    dailyShiftChartData: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], datasets: [{ label: "1st Shift", backgroundColor: "#2563eb", data: [4200, 4600, 4400, 4800, 4700, 3900] }, { label: "2nd Shift", backgroundColor: "#7c3aed", data: [3800, 4100, 4300, 4200, 4000, 3400] }, { label: "3rd Shift", backgroundColor: "#0d9488", data: [3000, 3100, 3200, 3150, 2980, 2500] }] },
    monthlyShiftChartData: { labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], datasets: [{ label: "1st Shift", backgroundColor: "#2563eb", data: [65000, 71000, 69000, 72000, 42000] }, { label: "2nd Shift", backgroundColor: "#7c3aed", data: [58000, 63000, 61000, 64000, 38000] }, { label: "3rd Shift", backgroundColor: "#0d9488", data: [47000, 51000, 49500, 52000, 31000] }] },
    monthlyCumChartData: { labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], datasets: [{ label: "Actual", backgroundColor: "#8b5cf6", data: [170000, 185000, 179000, 188000, 114000] }, { label: "Planned", backgroundColor: "#c4b5fd", data: [176000, 190000, 185000, 194000, 118000] }] },
    yearlyShiftChartData: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ label: "Cumulative Output", backgroundColor: "#14b8a6", data: [820000, 790000, 910000, 880000, 940000, 870000] }] },
    yearlyCumChartData: { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ label: "Actual", backgroundColor: "#0f766e", data: [810000, 780000, 905000, 875000, 935000, 865000] }, { label: "Planned", backgroundColor: "#5eead4", data: [830000, 800000, 920000, 890000, 950000, 880000] }] },
    lvLipasChartData: { labels: ["Line 1", "Line 2", "Line 3", "Line 4"], datasets: [{ label: "Plan", backgroundColor: "#2563eb", data: [62000, 59000, 61000, 63000] }, { label: "Actual", backgroundColor: "#60a5fa", data: [60000, 57500, 59800, 60900] }] },
    lvVolpasChartData: { labels: ["Line 1", "Line 2", "Line 3", "Line 4"], datasets: [{ label: "Plan", backgroundColor: "#7c3aed", data: [64000, 62000, 63000, 63000] }, { label: "Actual", backgroundColor: "#c084fc", data: [63200, 60500, 61700, 63600] }] }
};

function getReportFromQuery() {
    const report = new URLSearchParams(window.location.search).get("report");
    const valid = ["weekly", "monthly", "yearly", "lipas_volpas"];
    return valid.includes(report) ? report : "weekly";
}

function showReportSection(report) {
    ["weekly", "monthly", "yearly", "lipas_volpas"].forEach((name) => {
        const el = document.getElementById(`${name}-section`);
        if (el) el.classList.toggle("hidden", name !== report);
    });
}

function createBarChart(id, data, stacked = false) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    new Chart(canvas, { type: "bar", data, options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { x: { stacked }, y: { stacked, beginAtZero: true } } } });
}

document.addEventListener("DOMContentLoaded", () => {
    showReportSection(getReportFromQuery());
    createBarChart("cumulativeChart", mockData.cumulativeChartData);
    createBarChart("dailyShiftChart_0", mockData.dailyShiftChartData, true);
    createBarChart("monthlyShiftChart", mockData.monthlyShiftChartData, true);
    createBarChart("monthlyCumChart", mockData.monthlyCumChartData);
    createBarChart("yearlyShiftChart", mockData.yearlyShiftChartData);
    createBarChart("yearlyCumChart", mockData.yearlyCumChartData);
    createBarChart("lvLipasChart", mockData.lvLipasChartData);
    createBarChart("lvVolpasChart", mockData.lvVolpasChartData);

});
