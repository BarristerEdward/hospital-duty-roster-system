// ======================================================
// CAREROSTER - HOSPITAL DUTY ROSTER MANAGEMENT
// ======================================================

"use strict";

const ROSTER_KEY = "careroster_roster";
const LEAVE_KEY = "careroster_availability";

let assignments = [];
let editingAssignmentId = null;


// ======================================================
// SAFE LOCAL STORAGE LOADING
// ======================================================

function loadAssignments() {
    try {
        const saved = localStorage.getItem(ROSTER_KEY);

        if (!saved) return [];

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {
        console.error("Could not load roster:", error);
        return [];
    }
}

assignments = loadAssignments();


// ======================================================
// HTML ELEMENTS
// ======================================================

const tableBody = document.getElementById("rosterTableBody");

const totalAssignments = document.getElementById("totalAssignments");
const morningAssignments = document.getElementById("morningAssignments");
const afternoonAssignments = document.getElementById("afternoonAssignments");
const nightAssignments = document.getElementById("nightAssignments");

const rosterCount = document.getElementById("rosterCount");

const rosterDate = document.getElementById("rosterDate");
const rosterSearch = document.getElementById("rosterSearch");
const rosterShiftFilter = document.getElementById("rosterShiftFilter");

const addAssignmentBtn = document.getElementById("addAssignmentBtn");
const printRosterBtn = document.getElementById("printRosterBtn");


// ======================================================
// SAVE ASSIGNMENTS
// ======================================================

function saveAssignments() {
    try {
        localStorage.setItem(
            ROSTER_KEY,
            JSON.stringify(assignments)
        );

        return true;

    } catch (error) {
        console.error("Could not save assignments:", error);

        alert("Unable to save assignment. Please check browser storage.");

        return false;
    }
}


// ======================================================
// HTML ESCAPING
// ======================================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


// ======================================================
// DATE FORMATTING
// ======================================================

function formatDate(date) {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// ======================================================
// SHIFT TIMES
// ======================================================

function setShiftTime(shift) {

    const shiftTimes = {
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

    return shiftTimes[shift] || {
        start: "07:00",
        end: "15:00"
    };
}


// ======================================================
// CONVERT ASSIGNMENT TIMES
// ======================================================

function getAssignmentTimes(date, start, end) {

    const startTime = new Date(`${date}T${start}:00`);
    const endTime = new Date(`${date}T${end}:00`);

    if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
    }

    return {
        start: startTime,
        end: endTime
    };
}


// ======================================================
// CHECK DUPLICATE ASSIGNMENTS
// ======================================================

function checkDuplicate(staffId, date, editId = null) {

    return assignments.some(item => {

        if (String(item.id) === String(editId)) {
            return false;
        }

        return (
            String(item.staffId).trim().toLowerCase() ===
                String(staffId).trim().toLowerCase() &&
            item.date === date
        );

    });
}


// ======================================================
// CHECK OVERLAPPING SHIFTS
// ======================================================

function checkShiftConflict(staffId, date, start, end, editId = null) {

    const newShift = getAssignmentTimes(date, start, end);

    return assignments.some(item => {

        if (String(item.id) === String(editId)) {
            return false;
        }

        if (
            String(item.staffId).trim().toLowerCase() !==
            String(staffId).trim().toLowerCase()
        ) {
            return false;
        }

        const existingShift = getAssignmentTimes(
            item.date,
            item.start,
            item.end
        );

        return (
            newShift.start < existingShift.end &&
            newShift.end > existingShift.start
        );

    });
}


// ======================================================
// CHECK APPROVED LEAVE
// ======================================================

function checkApprovedLeave(staffId, date, start, end) {

    let leaveRecords = [];

    try {
        const savedLeave = localStorage.getItem(LEAVE_KEY);

        leaveRecords = savedLeave ? JSON.parse(savedLeave) : [];

        if (!Array.isArray(leaveRecords)) {
            leaveRecords = [];
        }

    } catch (error) {
        console.error("Could not load leave records:", error);
        leaveRecords = [];
    }

    const staffID = String(staffId).trim().toLowerCase();

    const assignmentTime = getAssignmentTimes(date, start, end);

    return leaveRecords.some(leave => {

        if (
            String(leave.staffId).trim().toLowerCase() !== staffID ||
            leave.status !== "Approved"
        ) {
            return false;
        }

        if (!leave.startDate || !leave.endDate) {
            return false;
        }

        const leaveStart = new Date(`${leave.startDate}T00:00:00`);
        const leaveEnd = new Date(`${leave.endDate}T23:59:59`);

        return (
            assignmentTime.start <= leaveEnd &&
            assignmentTime.end > leaveStart
        );

    });
}


// ======================================================
// ADD MODAL STYLES
// ======================================================

function addModalStyles() {

    if (document.getElementById("rosterModalStyles")) return;

    const style = document.createElement("style");

    style.id = "rosterModalStyles";

    style.textContent = `

        #assignmentModal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(20, 24, 40, 0.65);
            overflow-y: auto;
        }

        .assignment-modal-content {
            background: #ffffff;
            color: #20243a;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 28px;
            border-radius: 14px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2);
        }

        .assignment-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 25px;
        }

        .assignment-modal-header h2 {
            margin: 0 0 7px;
            font-size: 22px;
            color: #20243a;
        }

        .assignment-modal-header p {
            margin: 0;
            color: #777b8e;
            font-size: 13px;
        }

        #closeAssignmentModal {
            border: none;
            background: #f0f1f7;
            color: #333;
            font-size: 25px;
            width: 35px;
            height: 35px;
            border-radius: 8px;
            cursor: pointer;
        }

        .assignment-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .assignment-form-grid label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 7px;
            color: #33384d;
        }

        .assignment-form-grid input,
        .assignment-form-grid select {
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            border: 1px solid #dfe1eb;
            border-radius: 8px;
            background: #fff;
            color: #20243a;
            font: inherit;
            outline: none;
        }

        .assignment-form-grid input:focus,
        .assignment-form-grid select:focus {
            border-color: #6558e8;
            box-shadow: 0 0 0 3px rgba(101, 88, 232, 0.1);
        }

        .assignment-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 25px;
        }

        .assignment-form-actions button {
            border: none;
            padding: 12px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }

        #cancelAssignment {
            background: #f0f1f7;
            color: #33384d;
        }

        #saveAssignment {
            background: #6558e8;
            color: white;
        }

        .empty-roster {
            text-align: center;
            padding: 35px 15px;
        }

        .empty-roster h3 {
            margin: 10px 0;
            color: #33384d;
        }

        .empty-roster p {
            color: #777b8e;
            font-size: 13px;
        }

        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            background: #e8f8ef;
            color: #23834c;
            font-size: 12px;
        }

        .edit-btn,
        .delete-btn {
            border: none;
            padding: 7px 10px;
            border-radius: 6px;
            cursor: pointer;
            margin: 2px;
        }

        .edit-btn {
            background: #eeecff;
            color: #6558e8;
        }

        .delete-btn {
            background: #fff0f0;
            color: #d64545;
        }

        @media (max-width: 550px) {

            .assignment-form-grid {
                grid-template-columns: 1fr;
            }

            .assignment-modal-content {
                padding: 20px;
            }

            .assignment-form-actions {
                flex-direction: column-reverse;
            }

            .assignment-form-actions button {
                width: 100%;
            }

        }

    `;

    document.head.appendChild(style);
}


// ======================================================
// CREATE ASSIGNMENT FORM
// ======================================================

function createAssignmentForm(editId = null) {

    if (document.getElementById("assignmentModal")) return;

    editingAssignmentId = editId;

    const existing = assignments.find(
        item => String(item.id) === String(editId)
    );

    addModalStyles();

    const modal = document.createElement("div");

    modal.id = "assignmentModal";

    modal.innerHTML = `

        <div class="assignment-modal-content">

            <div class="assignment-modal-header">

                <div>

                    <h2 id="assignmentTitle">
                        ${existing ? "Edit Duty Assignment" : "Create Duty Assignment"}
                    </h2>

                    <p>Enter the staff member's duty information.</p>

                </div>

                <button type="button" id="closeAssignmentModal">
                    &times;
                </button>

            </div>


            <form id="assignmentForm">

                <div class="assignment-form-grid">

                    <div>
                        <label for="assignmentStaffName">Staff Name *</label>

                        <input
                            type="text"
                            id="assignmentStaffName"
                            placeholder="Enter staff name"
                            value="${escapeHTML(existing?.staffName || "")}"
                            required
                        >
                    </div>


                    <div>
                        <label for="assignmentStaffId">Staff ID *</label>

                        <input
                            type="text"
                            id="assignmentStaffId"
                            placeholder="Enter staff ID"
                            value="${escapeHTML(existing?.staffId || "")}"
                            required
                        >
                    </div>


                    <div>
                        <label for="assignmentDepartment">Department *</label>

                        <input
                            type="text"
                            id="assignmentDepartment"
                            placeholder="Enter department"
                            value="${escapeHTML(existing?.department || "")}"
                            required
                        >
                    </div>


                    <div>
                        <label for="assignmentDate">Duty Date *</label>

                        <input
                            type="date"
                            id="assignmentDate"
                            value="${escapeHTML(existing?.date || rosterDate.value || "")}"
                            required
                        >
                    </div>


                    <div>
                        <label for="assignmentShift">Shift *</label>

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
                        <label for="assignmentStart">Start Time *</label>

                        <input
                            type="time"
                            id="assignmentStart"
                            value="${escapeHTML(existing?.start || "07:00")}"
                            required
                        >
                    </div>


                    <div>
                        <label for="assignmentEnd">End Time *</label>

                        <input
                            type="time"
                            id="assignmentEnd"
                            value="${escapeHTML(existing?.end || "15:00")}"
                            required
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

    function closeAssignmentForm() {

        modal.remove();

        editingAssignmentId = null;

    }


    document.getElementById("closeAssignmentModal")
        .addEventListener("click", closeAssignmentForm);


    document.getElementById("cancelAssignment")
        .addEventListener("click", closeAssignmentForm);


    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeAssignmentForm();
        }

    });


    // AUTOMATIC SHIFT TIMES

    document.getElementById("assignmentShift")
        .addEventListener("change", event => {

            const times = setShiftTime(event.target.value);

            document.getElementById("assignmentStart").value = times.start;

            document.getElementById("assignmentEnd").value = times.end;

        });


    // FORM SUBMISSION

    document.getElementById("assignmentForm")
        .addEventListener("submit", event => {

            event.preventDefault();

            saveAssignment(closeAssignmentForm);

        });

}


// ======================================================
// SAVE ASSIGNMENT
// ======================================================

function saveAssignment(closeForm) {

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


    if (checkDuplicate(staffId, date, editId)) {

        alert("This staff member already has an assignment on this date.");

        return;
    }


    if (checkShiftConflict(staffId, date, start, end, editId)) {

        alert("This staff member already has an overlapping duty assignment.");

        return;
    }


    if (checkApprovedLeave(staffId, date, start, end)) {

        alert("This staff member has approved leave during this period.");

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
            String(item.id) === String(editId) ? assignment : item
        );

    } else {

        assignments.push(assignment);

    }


    if (!saveAssignments()) return;


    renderRoster();

    updateStatistics();

    closeForm();

    alert(editId
        ? "Assignment updated successfully."
        : "Assignment created successfully."
    );

}


// ======================================================
// RENDER ROSTER
// ======================================================

function renderRoster() {

    if (!tableBody) return;

    const search = rosterSearch.value.trim().toLowerCase();

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


    if (rosterCount) {

        rosterCount.textContent =
            `${filteredAssignments.length} assignment${filteredAssignments.length !== 1 ? "s" : ""}`;

    }


    if (filteredAssignments.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-roster">

                        <div class="empty-icon">▤</div>

                        <h3>No duty assignments found</h3>

                        <p>
                            Create an assignment to start building your hospital duty roster.
                        </p>

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

            <td>
                ${escapeHTML(item.start)} - ${escapeHTML(item.end)}
            </td>

            <td>
                <span class="status-badge">
                    ${escapeHTML(item.status || "Assigned")}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(item.id)}">
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(item.id)}">
                    Delete
                </button>

            </td>

        </tr>

    `).join("");

}


// ======================================================
// UPDATE STATISTICS
// ======================================================

function updateStatistics() {

    if (totalAssignments) {
        totalAssignments.textContent = assignments.length;
    }

    if (morningAssignments) {

        morningAssignments.textContent =
            assignments.filter(item => item.shift === "Morning").length;

    }

    if (afternoonAssignments) {

        afternoonAssignments.textContent =
            assignments.filter(item => item.shift === "Afternoon").length;

    }

    if (nightAssignments) {

        nightAssignments.textContent =
            assignments.filter(item => item.shift === "Night").length;

    }

}


// ======================================================
// EDIT AND DELETE ASSIGNMENTS
// ======================================================

if (tableBody) {

    tableBody.addEventListener("click", event => {

        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const id = button.dataset.id;

        const action = button.dataset.action;

        const assignment = assignments.find(
            item => String(item.id) === String(id)
        );

        if (!assignment) return;


        if (action === "edit") {

            createAssignmentForm(id);

        }


        if (action === "delete") {

            const confirmed = confirm(
                `Are you sure you want to delete the assignment for ${assignment.staffName}?`
            );

            if (!confirmed) return;


            assignments = assignments.filter(
                item => String(item.id) !== String(id)
            );


            if (!saveAssignments()) return;


            renderRoster();

            updateStatistics();

        }

    });

}


// ======================================================
// SEARCH AND FILTER EVENTS
// ======================================================

if (rosterSearch) {

    rosterSearch.addEventListener("input", renderRoster);

}


if (rosterDate) {

    rosterDate.addEventListener("change", renderRoster);

}


if (rosterShiftFilter) {

    rosterShiftFilter.addEventListener("change", renderRoster);

}


// ======================================================
// CREATE ASSIGNMENT BUTTON
// ======================================================

if (addAssignmentBtn) {

    addAssignmentBtn.addEventListener("click", event => {

        event.preventDefault();

        createAssignmentForm();

    });

} else {

    console.error("Create Assignment button not found. Check addAssignmentBtn in roster.html.");

}


// ======================================================
// PRINT ROSTER
// ======================================================

if (printRosterBtn) {

    printRosterBtn.addEventListener("click", () => {

        window.print();

    });

}


// ======================================================
// INITIALIZE DUTY ROSTER
// ======================================================

if (rosterDate && !rosterDate.value) {

    const today = new Date();

    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    rosterDate.value = localDate;

}


updateStatistics();

renderRoster();


console.log("CareRoster Duty Roster initialized successfully.");
