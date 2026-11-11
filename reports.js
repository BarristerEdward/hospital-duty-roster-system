// ==========================================
// CAREROSTER - REPORTS MANAGEMENT
// ==========================================

const ROSTER_KEY = "careroster_roster";

let assignments = JSON.parse(localStorage.getItem(ROSTER_KEY)) || [];


// ==========================================
// PAGE ELEMENTS
// ==========================================

const reportTotalAssignments = document.getElementById("reportTotalAssignments");
const reportMorningShifts = document.getElementById("reportMorningShifts");
const reportAfternoonShifts = document.getElementById("reportAfternoonShifts");
const reportNightShifts = document.getElementById("reportNightShifts");

const reportStartDate = document.getElementById("reportStartDate");
const reportEndDate = document.getElementById("reportEndDate");
const reportDepartment = document.getElementById("reportDepartment");

const generateReportBtn = document.getElementById("generateReportBtn");
const printReportBtn = document.getElementById("printReportBtn");

const reportsTableBody = document.getElementById("reportsTableBody");
const reportRecordCount = document.getElementById("reportRecordCount");


// ==========================================
// LOAD DEPARTMENTS
// ==========================================

function loadReportDepartments() {

    const departments = [
        ...new Set(assignments.map(item => item.department).filter(Boolean))
    ];

    departments.sort();

    reportDepartment.innerHTML =
        '<option value="">All Departments</option>';

    departments.forEach(department => {

        const option = document.createElement("option");

        option.value = department;
        option.textContent = department;

        reportDepartment.appendChild(option);

    });

}


// ==========================================
// FILTER REPORT DATA
// ==========================================

function getFilteredAssignments() {

    const startDate = reportStartDate.value;
    const endDate = reportEndDate.value;
    const department = reportDepartment.value;

    return assignments.filter(item => {

        const matchesStart =
            !startDate || item.date >= startDate;

        const matchesEnd =
            !endDate || item.date <= endDate;

        const matchesDepartment =
            !department || item.department === department;

        return matchesStart && matchesEnd && matchesDepartment;

    });

}


// ==========================================
// UPDATE REPORT STATISTICS
// ==========================================

function updateReportStatistics(data) {

    reportTotalAssignments.textContent = data.length;

    reportMorningShifts.textContent =
        data.filter(item => item.shift === "Morning").length;

    reportAfternoonShifts.textContent =
        data.filter(item => item.shift === "Afternoon").length;

    reportNightShifts.textContent =
        data.filter(item => item.shift === "Night").length;

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatReportDate(date) {

    if (!date) return "";

    return new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// ==========================================
// PREVENT HTML INJECTION
// ==========================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);

}


// ==========================================
// DISPLAY REPORT TABLE
// ==========================================

function renderReportTable(data) {

    reportsTableBody.innerHTML = "";

    if (data.length === 0) {

        reportsTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No report records found.
                </td>
            </tr>
        `;

    } else {

        data.forEach(item => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(item.staffName)}</td>
                <td>${escapeHTML(item.staffId)}</td>
                <td>${escapeHTML(item.department)}</td>
                <td>${formatReportDate(item.date)}</td>
                <td>${escapeHTML(item.shift)}</td>
                <td>${escapeHTML(item.start)} - ${escapeHTML(item.end)}</td>
                <td>${escapeHTML(item.status)}</td>
            `;

            reportsTableBody.appendChild(row);

        });

    }

    reportRecordCount.textContent =
        `${data.length} ${data.length === 1 ? "Record" : "Records"}`;

}


// ==========================================
// GENERATE REPORT
// ==========================================

function generateReport() {

    if (
        reportStartDate.value &&
        reportEndDate.value &&
        reportStartDate.value > reportEndDate.value
    ) {

        alert("Start date cannot be later than end date.");
        return;

    }

    const filteredData = getFilteredAssignments();

    updateReportStatistics(filteredData);

    renderReportTable(filteredData);

}


// ==========================================
// PRINT REPORT
// ==========================================

printReportBtn.addEventListener("click", function() {

    generateReport();

    window.print();

});


// ==========================================
// EVENT LISTENERS
// ==========================================

generateReportBtn.addEventListener("click", generateReport);

reportDepartment.addEventListener("change", generateReport);


// ==========================================
// INITIALISE REPORT PAGE
// ==========================================

loadReportDepartments();

generateReport();
