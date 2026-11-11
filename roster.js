// ==========================================
// CAREROSTER - DUTY ROSTER MANAGEMENT
// ==========================================

const ROSTER_KEY = "careroster_roster";
const LEAVE_KEY = "careroster_availability";

let assignments = [];
let editingAssignmentId = null;


// ==========================================
// LOAD SAVED ASSIGNMENTS SAFELY
// ==========================================

try {
    const savedAssignments = localStorage.getItem(ROSTER_KEY);

    assignments = savedAssignments
        ? JSON.parse(savedAssignments)
        : [];

    if (!Array.isArray(assignments)) {
        assignments = [];
    }

} catch (error) {
    console.error("Error loading roster data:", error);
    assignments = [];
}


// ==========================================
// HTML ELEMENTS
// ==========================================

const tableBody = document.getElementById("rosterTableBody");

const totalAssignments = document.getElementById("totalAssignments");
const morningAssignments = document.getElementById("morningAssignments");
const afternoonAssignments = document.getElementById("afternoonAssignments");
const nightAssignments = document.getElementById("nightAssignments");

const rosterDate = document.getElementById("rosterDate");
const rosterSearch = document.getElementById("rosterSearch");
const rosterShiftFilter = document.getElementById("rosterShiftFilter");

const rosterCount = document.getElementById("rosterCount");

const addAssignmentBtn = document.getElementById("addAssignmentBtn");
const printRosterBtn = document.getElementById("printRosterBtn");


// ==========================================
// SAVE ASSIGNMENTS
// ==========================================

function saveRosterData() {
    try {
        localStorage.setItem(
            ROSTER_KEY,
            JSON.stringify(assignments)
        );

        return true;

    } catch (error) {
        console.error("Error saving roster:", error);
        alert("Unable to save assignment. Please check your browser storage.");
        return false;
    }
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date) {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// ==========================================
// SHIFT DEFAULT TIMES
// ==========================================

function getShiftTimes(shift) {

    const times = {
        Morning: {
            start: "07:00",
            end: "15:00"
        },

        Afternoon: {
            start: "15:00",
            end: "23:00"
        },

        Night: {
            start: "23:00",
            end: "07:00"
        }
    };

    return times[shift] || {
        start: "07:00",
        end: "15:00"
    };
}


// ==========================================
// HANDLE OVERNIGHT ASSIGNMENTS
// ==========================================

function getAssignmentTimes(date, start, end) {

    const startDate = new Date(`${date}T${start}:00`);
    const endDate = new Date(`${date}T${end}:00`);

    if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    return {
        start: startDate,
        end: endDate
    };
}


// ==========================================
// CHECK OVERLAPPING SHIFTS
// ==========================================

function checkShiftConflict(staffId, date, start, end, editId = null) {

    const newAssignment = getAssignmentTimes(date, start, end);

    return assignments.some(item => {

        if (item.id === editId) return false;

        if (
            String(item.staffId).trim().toLowerCase() !==
            String(staffId).trim().toLowerCase()
        ) {
            return false;
        }

        const existingAssignment = getAssignmentTimes(
            item.date,
            item.start,
            item.end
        );

        return (
            newAssignment.start < existingAssignment.end &&
            newAssignment.end > existingAssignment.start
        );
    });
}


// ==========================================
// CHECK APPROVED STAFF LEAVE
// ==========================================

function checkApprovedLeaveConflict(staffId, date, start, end) {

    let leaveRecords = [];

    try {
        leaveRecords = JSON.parse(
            localStorage.getItem(LEAVE_KEY)
        ) || [];

        if (!Array.isArray(leaveRecords)) {
            leaveRecords = [];
        }

    } catch (error) {
        console.error("Error loading leave records:", error);
        leaveRecords = [];
    }

    const assignment = getAssignmentTimes(date, start, end);

    const staffID = String(staffId).trim().toLowerCase();

    return leaveRecords.some(leave => {

        if (leave.status !== "Approved") return false;

        if (
            String(leave.staffId).trim().toLowerCase() !== staffID
        ) {
            return false;
        }

        const leaveStart = new Date(`${leave.startDate}T00:00:00`);
        const leaveEnd = new Date(`${leave.endDate}T23:59:59`);

        return (
            assignment.start <= leaveEnd &&
            assignment.end > leaveStart
        );
    });
}


// ==========================================
// CREATE ASSIGNMENT FORM
// ==========================================

function createAssignmentForm(editId = null) {

    if (document.getElementById("assignmentModal")) return;

    editingAssignmentId = editId;

    const existing = assignments.find(
        item => item.id === editId
    );

    const modal = document.createElement("div");

    modal.id = "assignmentModal";

    modal.innerHTML = `

        <div class="assignment-modal-content">

            <div class="assignment-modal-header">

                <div>
                    <h2>
                        ${existing ? "Edit Assignment" : "Create Duty Assignment"}
                    </h2>

                    <p>
                        Enter the staff member's duty information.
                    </p>
                </div>

                <button type="button" id="closeAssignmentModal">
                    &times;
                </button>

            </div>

            <form id="assignmentForm">

                <div class="assignment-form-grid">

                    <div>
                        <label>Staff Name *</label>

                        <input
                            type="text"
                            id="assignmentStaffName"
                            placeholder="Enter staff name"
                            required
                            value="${escapeHTML(existing?.staffName || "")}"
                        >
                    </div>

                    <div>
                        <label>Staff ID *</label>

                        <input
                            type="text"
                            id="assignmentStaffId"
                            placeholder="Enter staff ID"
                            required
                            value="${escapeHTML(existing?.staffId || "")}"
                        >
                    </div>

                    <div>
                        <label>Department *</label>

                        <input
                            type="text"
                            id="assignmentDepartment"
                            placeholder="Enter department"
                            required
                            value="${escapeHTML(existing?.department || "")}"
                        >
                    </div>

                    <div>
                        <label>Duty Date *</label>

                        <input
                            type="date"
                            id="assignmentDate"
                            required
                            value="${escapeHTML(existing?.date || "")}"
                        >
                    </div>

                    <div>
                        <label>Shift *</label>

                        <select id="assignmentShift" required>

                            <option value="">Select shift</option>

                            <option value="Morning"
                                ${existing?.shift === "Morning" ? "selected" : ""}>
                                Morning
                            </option>

                            <option value="Afternoon"
                                ${existing?.shift === "Afternoon" ? "selected" : ""}>
                                Afternoon
                            </option>

                            <option value="Night"
                                ${existing?.shift === "Night" ? "selected" : ""}>
                                Night
                            </option>

                        </select>
                    </div>

                    <div>
                        <label>Start Time *</label>

                        <input
                            type="time"
                            id="assignmentStart"
                            required
                            value="${escapeHTML(existing?.start || "07:00")}"
                        >
                    </div>

                    <div>
                        <label>End Time *</label>

                        <input
                            type="time"
                            id="assignmentEnd"
                            required
                            value="${escapeHTML(existing?.end || "15:00")}"
                        >
                    </div>

                </div>

                <div class="assignment-form-actions">

                    <button type="button" id="cancelAssignment">
                        Cancel
                    </button>

                    <button type="submit" id="saveAssignment">
                        ${existing ? "Update Assignment" : "Save Assignment"}
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);


    // CLOSE MODAL

    function closeModal() {
        modal.remove();
        editingAssignmentId = null;
    }

    document.getElementById("closeAssignmentModal")
        .addEventListener("click", closeModal);

    document.getElementById("cancelAssignment")
        .addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });


    // AUTOMATIC SHIFT TIMES

    const shiftInput = document.getElementById("assignmentShift");

    shiftInput.addEventListener("change", () => {

        const times = getShiftTimes(shiftInput.value);

        document.getElementById("assignmentStart").value = times.start;
        document.getElementById("assignmentEnd").value = times.end;

    });


    // SAVE FORM

    document.getElementById("assignmentForm")
        .addEventListener("submit", event => {

            event.preventDefault();

            saveAssignment(closeModal);

        });

}


// ==========================================
// SAVE ASSIGNMENT
// ==========================================

function saveAssignment(closeModal) {

    const staffName = document.getElementById("assignmentStaffName").value.trim();

    const staffId = document.getElementById("assignmentStaffId").value.trim();

    const department = document.getElementById("assignmentDepartment").value.trim();

    const date = document.getElementById("assignmentDate").value;

    const shift = document.getElementById("assignmentShift").value;

    const start = document.getElementById("assignmentStart").value;

    const end = document.getElementById("assignmentEnd").value;

    const editId = editingAssignmentId;


    if (!staffName || !staffId || !department || !date || !shift || !start || !end) {

        alert("Please complete all required fields.");

        return;
    }


    if (start === end) {

        alert("Start time and end time cannot be the same.");

        return;
    }


    // CHECK OVERLAPPING SHIFTS

    if (checkShiftConflict(staffId, date, start, end, editId)) {

        alert("This staff member already has an overlapping duty assignment.");

        return;
    }


    // CHECK APPROVED LEAVE

    if (checkApprovedLeaveConflict(staffId, date, start, end)) {

        alert(
            "Assignment blocked! This staff member has approved leave during this period."
        );

        return;
    }


    const assignment = {

        id: editId || Date.now().toString(),

        staffName,
        staffId,
        department,
        date,
        shift,
        start,
        end,

        status: "Assigned"

    };


    if (editId) {

        assignments = assignments.map(item =>
            item.id === editId ? assignment : item
        );

    } else {

        assignments.push(assignment);

    }


    if (!saveRosterData()) return;

    renderRoster();
    updateStatistics();

    closeModal();

    alert(editId ? "Assignment updated successfully." : "Assignment created successfully.");

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    totalAssignments.textContent = assignments.length;

    morningAssignments.textContent = assignments.filter(
        item => item.shift === "Morning"
    ).length;

    afternoonAssignments.textContent = assignments.filter(
        item => item.shift === "Afternoon"
    ).length;

    nightAssignments.textContent = assignments.filter(
        item => item.shift === "Night"
    ).length;

}


// ==========================================
// RENDER ROSTER TABLE
// ==========================================

function renderRoster() {

    const search = rosterSearch.value.toLowerCase();

    const selectedDate = rosterDate.value;

    const selectedShift = rosterShiftFilter.value;


    const filteredAssignments = assignments.filter(item => {

        const matchesSearch =

            String(item.staffName || "").toLowerCase().includes(search) ||

            String(item.staffId || "").toLowerCase().includes(search) ||

            String(item.department || "").toLowerCase().includes(search);


        const matchesDate =
            !selectedDate || item.date === selectedDate;


        const matchesShift =
            !selectedShift || item.shift === selectedShift;


        return matchesSearch && matchesDate && matchesShift;

    });


    rosterCount.textContent =
        `${filteredAssignments.length} assignment${filteredAssignments.length !== 1 ? "s" : ""}`;


    if (filteredAssignments.length === 0) {

        tableBody.innerHTML = `

            <tr>
                <td colspan="8">
                    <div class="empty-roster">
                        <div class="empty-icon">▤</div>
                        <h3>No duty assignments found</h3>
                        <p>Create an assignment to start building your hospital duty roster.</p>
                    </div>
                </td>
            </tr>

        `;

        return;
    }


    tableBody.innerHTML = filteredAssignments.map(item => `

        <tr>

            <td>
                <strong>${escapeHTML(item.staffName)}</strong>
            </td>

            <td>${escapeHTML(item.staffId)}</td>

            <td>${escapeHTML(item.department)}</td>

            <td>${formatDate(item.date)}</td>

            <td>${escapeHTML(item.shift)}</td>

            <td>${escapeHTML(item.start)} - ${escapeHTML(item.end)}</td>

            <td>
                <span class="status-badge">
                    ${escapeHTML(item.status || "Assigned")}
                </span>
            </td>

            <td>

                <button
                    class="edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(item.id)}">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(item.id)}">
                    Delete
                </button>

            </td>

        </tr>

    `).join("");

}


// ==========================================
// EDIT AND DELETE ASSIGNMENTS
// ==========================================

tableBody.addEventListener("click", event => {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    const action = button.dataset.action;

    const assignment = assignments.find(
        item => item.id === id
    );

    if (!assignment) return;


    if (action === "edit") {

        createAssignmentForm(id);

    }


    if (action === "delete") {

        if (confirm(`Delete the duty assignment for ${assignment.staffName}?`)) {

            assignments = assignments.filter(
                item => item.id !== id
            );

            if (!saveRosterData()) return;

            renderRoster();
            updateStatistics();

        }

    }

});


// ==========================================
// SEARCH AND FILTERS
// ==========================================

rosterSearch.addEventListener("input", renderRoster);

rosterDate.addEventListener("change", renderRoster);

rosterShiftFilter.addEventListener("change", renderRoster);


// ==========================================
// ADD ASSIGNMENT BUTTON
// ==========================================

addAssignmentBtn.addEventListener("click", () => {

    createAssignmentForm();

});


// ==========================================
// PRINT ROSTER
// ==========================================

printRosterBtn.addEventListener("click", () => {

    window.print();

});


// ==========================================
// INITIALIZE ROSTER
// ==========================================

updateStatistics();

renderRoster();

console.log("CareRoster Duty Roster loaded successfully.");
