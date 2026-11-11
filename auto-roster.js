// ==========================================
// CAREROSTER - SMART ROSTER GENERATOR
// ==========================================

const STAFF_KEY = "careroster_staff";
const DEPARTMENT_KEY = "careroster_departments";
const SHIFT_KEY = "careroster_shifts";
const ROSTER_KEY = "careroster_roster";
const LEAVE_KEY = "careroster_availability";

let proposedRoster = [];

const form = document.getElementById("autoRosterForm");
const departmentSelect = document.getElementById("departmentSelect");
const generatedBody = document.getElementById("generatedRosterBody");

const generateBtn = document.getElementById("generateRosterBtn");
const saveBtn = document.getElementById("saveGeneratedRosterBtn");
const clearBtn = document.getElementById("clearProposalBtn");

const proposalCount = document.getElementById("proposedAssignments");
const assignedCount = document.getElementById("assignedStaff");
const unfilledCount = document.getElementById("unfilledShifts");
const conflictCount = document.getElementById("generationConflicts");
const rosterCount = document.getElementById("generatedRosterCount");


// ==========================================
// LOAD SAVED DATA
// ==========================================

function loadData(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function normalize(value) {
    return String(value || "").trim().toLowerCase();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// ==========================================
// LOAD DEPARTMENTS
// ==========================================

function loadDepartments() {
    const departments = loadData(DEPARTMENT_KEY);

    departmentSelect.innerHTML =
        '<option value="">Select department</option>';

    departments.forEach(department => {
        if (department.status &&
            normalize(department.status) !== "active") return;

        const option = document.createElement("option");

        option.value = department.name;
        option.textContent = department.name;

        departmentSelect.appendChild(option);
    });
}


// ==========================================
// DATE HELPERS
// ==========================================

function addDays(dateString, days) {
    const date = new Date(dateString + "T12:00:00");
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateRange(start, end) {
    const dates = [];

    for (
        let date = start;
        date <= end && dates.length < 366;
        date = addDays(date, 1)
    ) {
        dates.push(date);
    }

    return dates;
}


// ==========================================
// SHIFT INFORMATION
// ==========================================

function getShiftInformation() {
    const savedShifts = loadData(SHIFT_KEY);

    const shifts = savedShifts.length
        ? savedShifts
        : [
            { name: "Morning", startTime: "07:00", endTime: "15:00" },
            { name: "Afternoon", startTime: "15:00", endTime: "23:00" },
            { name: "Night", startTime: "23:00", endTime: "07:00" }
        ];

    return shifts
        .filter(shift =>
            !shift.status || normalize(shift.status) === "active"
        )
        .map(shift => ({
            name: shift.name || shift.shiftName || shift.title,
            startTime: shift.startTime || shift.start || "07:00",
            endTime: shift.endTime || shift.end || "15:00"
        }))
        .filter(shift => shift.name);
}

function getSelectedShifts() {
    const pattern = document.getElementById("shiftPattern").value;
    const shifts = getShiftInformation();

    if (pattern === "all") return shifts;

    return shifts.filter(shift =>
        normalize(shift.name).includes(pattern)
    );
}


// ==========================================
// STAFF INFORMATION
// ==========================================

function getActiveStaff(department) {
    return loadData(STAFF_KEY).filter(staff => {
        const staffDepartment = normalize(
            staff.department || staff.staffDepartment
        );

        const status = normalize(staff.status || "active");

        return (
            staffDepartment === normalize(department) &&
            status === "active" &&
            staff.name &&
            staff.id
        );
    });
}


// ==========================================
// TIME CONVERSION
// ==========================================

function getMinutes(time) {
    const parts = String(time).split(":");

    if (parts.length !== 2) return NaN;

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 || hours > 23 ||
        minutes < 0 || minutes > 59
    ) return NaN;

    return hours * 60 + minutes;
}

function getInterval(date, start, end) {
    const startMinutes = getMinutes(start);
    const endMinutes = getMinutes(end);

    if (
        !Number.isFinite(startMinutes) ||
        !Number.isFinite(endMinutes) ||
        startMinutes === endMinutes
    ) return null;

    const startDate = new Date(date + "T00:00:00");
    startDate.setMinutes(startMinutes);

    const endDate = new Date(date + "T00:00:00");
    endDate.setMinutes(endMinutes);

    if (endMinutes < startMinutes) {
        endDate.setDate(endDate.getDate() + 1);
    }

    return {
        start: startDate.getTime(),
        end: endDate.getTime()
    };
}

function intervalsOverlap(first, second) {
    return first.start < second.end &&
           second.start < first.end;
}


// ==========================================
// EXISTING ASSIGNMENT CONFLICT CHECK
// ==========================================

function hasExistingConflict(staffId, date, start, end) {
    const existing = loadData(ROSTER_KEY);

    const newInterval = getInterval(date, start, end);

    if (!newInterval) return true;

    return existing.some(assignment => {
        if (normalize(assignment.staffId) !== normalize(staffId)) {
            return false;
        }

        const existingInterval = getInterval(
            assignment.date,
            assignment.startTime || "07:00",
            assignment.endTime || "15:00"
        );

        return existingInterval &&
               intervalsOverlap(newInterval, existingInterval);
    });
}


// ==========================================
// APPROVED LEAVE CHECK
// ==========================================

function isOnApprovedLeave(staffId, date) {
    const leaves = loadData(LEAVE_KEY);

    return leaves.some(leave => {
        const status = normalize(leave.status);

        if (
            normalize(leave.staffId) !== normalize(staffId) ||
            status !== "approved"
        ) return false;

        return date >= leave.startDate &&
               date <= leave.endDate;
    });
}


// ==========================================
// CHECK PROPOSED CONFLICTS
// ==========================================

function hasProposalConflict(staffId, date, start, end) {
    const newInterval = getInterval(date, start, end);

    if (!newInterval) return true;

    return proposedRoster.some(assignment => {
        if (
            normalize(assignment.staffId) !== normalize(staffId)
        ) return false;

        const existingInterval = getInterval(
            assignment.date,
            assignment.startTime,
            assignment.endTime
        );

        return existingInterval &&
               intervalsOverlap(newInterval, existingInterval);
    });
}


// ==========================================
// GENERATE ROSTER
// ==========================================

function generateRoster(event) {
    event.preventDefault();

    proposedRoster = [];

    const department = departmentSelect.value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    const requiredStaff = Number(
        document.getElementById("staffPerShift").value
    );

    const method = document.getElementById("rotationMethod").value;

    if (!department || !startDate || !endDate) {
        alert("Please complete all required fields.");
        return;
    }

    if (endDate < startDate) {
        alert("End date cannot be earlier than start date.");
        return;
    }

    if (
        !Number.isInteger(requiredStaff) ||
        requiredStaff < 1
    ) {
        alert("Enter a valid number of staff required per shift.");
        return;
    }

    const staff = getActiveStaff(department);
    const shifts = getSelectedShifts();

    if (staff.length === 0) {
        alert("No active staff members were found in this department.");
        return;
    }

    if (shifts.length === 0) {
        alert("No matching active shifts were found.");
        return;
    }

    const dates = getDateRange(startDate, endDate);

    if (dates.length === 366 && dates[365] < endDate) {
        alert("Please select a date range of 365 days or less.");
        return;
    }

    let unfilled = 0;
    let conflicts = 0;

    let rotationIndex = 0;

    dates.forEach(date => {

        shifts.forEach(shift => {

            let assignedForShift = 0;

            const candidates = method === "balanced"
                ? [...staff].sort((a, b) =>
                    getAssignmentCount(a.id) -
                    getAssignmentCount(b.id)
                )
                : staff;

            let attempts = 0;

            while (
                assignedForShift < requiredStaff &&
                attempts < candidates.length
            ) {

                const staffIndex = method === "sequential"
                    ? rotationIndex % candidates.length
                    : attempts;

                const member = candidates[staffIndex];

                attempts++;

                if (isOnApprovedLeave(member.id, date)) {
                    continue;
                }

                if (
                    hasExistingConflict(
                        member.id,
                        date,
                        shift.startTime,
                        shift.endTime
                    ) ||
                    hasProposalConflict(
                        member.id,
                        date,
                        shift.startTime,
                        shift.endTime
                    )
                ) {
                    conflicts++;
                    continue;
                }

                proposedRoster.push({
                    id: "AUTO-" + Date.now() + "-" +
                        Math.random().toString(36).slice(2, 8),

                    staffName: member.name,
                    staffId: member.id,
                    department: department,
                    date: date,
                    shift: shift.name,
                    startTime: shift.startTime,
                    endTime: shift.endTime
                });

                assignedForShift++;

                rotationIndex++;
            }

            if (assignedForShift < requiredStaff) {
                unfilled += requiredStaff - assignedForShift;
            }

        });

    });

    renderProposal(unfilled, conflicts);
}


// ==========================================
// COUNT STAFF ASSIGNMENTS
// ==========================================

function getAssignmentCount(staffId) {
    return proposedRoster.filter(assignment =>
        normalize(assignment.staffId) === normalize(staffId)
    ).length;
}


// ==========================================
// DISPLAY PROPOSED ROSTER
// ==========================================

function renderProposal(unfilled = 0, conflicts = 0) {

    generatedBody.innerHTML = "";

    if (proposedRoster.length === 0) {
        generatedBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <h3>No assignments generated</h3>
                        <p>There were no eligible staff members for the selected shifts.</p>
                    </div>
                </td>
            </tr>
        `;
    } else {

        const sorted = [...proposedRoster].sort((a, b) =>
            a.date.localeCompare(b.date) ||
            a.startTime.localeCompare(b.startTime)
        );

        sorted.forEach(assignment => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(assignment.date)}</td>
                <td>${escapeHTML(assignment.staffName)}</td>
                <td>${escapeHTML(assignment.staffId)}</td>
                <td>${escapeHTML(assignment.department)}</td>
                <td>${escapeHTML(assignment.shift)}</td>
                <td>${escapeHTML(assignment.startTime)} - ${escapeHTML(assignment.endTime)}</td>
            `;

            generatedBody.appendChild(row);
        });
    }

    const uniqueStaff = new Set(
        proposedRoster.map(item => normalize(item.staffId))
    );

    proposalCount.textContent = proposedRoster.length;
    assignedCount.textContent = uniqueStaff.size;
    unfilledCount.textContent = unfilled;
    conflictCount.textContent = conflicts;

    rosterCount.textContent =
        `${proposedRoster.length} assignments`;

    saveBtn.disabled = proposedRoster.length === 0;
}


// ==========================================
// SAVE GENERATED ROSTER
// ==========================================

function saveGeneratedRoster() {

    if (proposedRoster.length === 0) {
        alert("Generate a roster first.");
        return;
    }

    const existing = loadData(ROSTER_KEY);

    const hasConflict = proposedRoster.some(proposal => {
        return hasExistingConflict(
            proposal.staffId,
            proposal.date,
            proposal.startTime,
            proposal.endTime
        );
    });

    if (hasConflict) {
        alert(
            "Some proposed assignments now conflict with existing schedules. Generate the roster again."
        );
        return;
    }

    const confirmed = confirm(
        `Save ${proposedRoster.length} proposed assignments to the duty roster?`
    );

    if (!confirmed) return;

    const updatedRoster = [
        ...existing,
        ...proposedRoster
    ];

    saveData(ROSTER_KEY, updatedRoster);

    alert("Generated duty roster saved successfully.");

    proposedRoster = [];

    renderProposal();

}


// ==========================================
// CLEAR PROPOSAL
// ==========================================

function clearProposal() {

    if (
        proposedRoster.length > 0 &&
        !confirm("Clear the proposed roster?")
    ) return;

    proposedRoster = [];

    renderProposal();

}


// ==========================================
// EVENT LISTENERS
// ==========================================

form.addEventListener("submit", generateRoster);

saveBtn.addEventListener("click", saveGeneratedRoster);

clearBtn.addEventListener("click", clearProposal);

form.addEventListener("reset", () => {
    setTimeout(() => {
        proposedRoster = [];
        renderProposal();
    }, 0);
});


// ==========================================
// INITIALIZE
// ==========================================

loadDepartments();
renderProposal();
