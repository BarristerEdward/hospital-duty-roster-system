// ==========================================
// CAREROSTER - DUTY ROSTER MANAGEMENT
// ==========================================

const ROSTER_KEY = "careroster_roster";

let assignments = JSON.parse(localStorage.getItem(ROSTER_KEY)) || [];

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


// ==========================================
// SAVE DATA
// ==========================================

function saveAssignments() {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(assignments));
}


// ==========================================
// CREATE ASSIGNMENT FORM
// ==========================================

function createAssignmentForm() {

    if (document.getElementById("assignmentModal")) return;

    const modal = document.createElement("div");

    modal.id = "assignmentModal";

    modal.innerHTML = `
        <div class="assignment-modal-content">

            <div class="assignment-modal-header">
                <div>
                    <h2 id="assignmentTitle">Create Assignment</h2>
                    <p>Enter staff duty information below.</p>
                </div>

                <button type="button" id="closeAssignmentModal">&times;</button>
            </div>

            <form id="assignmentForm">

                <div class="assignment-form-grid">

                    <div>
                        <label>Staff Name</label>
                        <input type="text" id="assignmentStaffName"
                        placeholder="Enter staff name" required>
                    </div>

                    <div>
                        <label>Staff ID</label>
                        <input type="text" id="assignmentStaffId"
                        placeholder="Enter staff ID" required>
                    </div>

                    <div>
                        <label>Department</label>
                        <input type="text" id="assignmentDepartment"
                        placeholder="Enter department" required>
                    </div>

                    <div>
                        <label>Duty Date</label>
                        <input type="date" id="assignmentDate" required>
                    </div>

                    <div>
                        <label>Shift</label>
                        <select id="assignmentShift" required>
                            <option value="">Select shift</option>
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Night">Night</option>
                        </select>
                    </div>

                    <div>
                        <label>Start Time</label>
                        <input type="time" id="assignmentStart" required>
                    </div>

                    <div>
                        <label>End Time</label>
                        <input type="time" id="assignmentEnd" required>
                    </div>

                </div>

                <div class="assignment-form-actions">
                    <button type="button" id="cancelAssignment">Cancel</button>
                    <button type="submit" id="saveAssignment">Save Assignment</button>
                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeAssignmentModal")
        .addEventListener("click", closeAssignmentForm);

    document.getElementById("cancelAssignment")
        .addEventListener("click", closeAssignmentForm);

    document.getElementById("assignmentForm")
        .addEventListener("submit", saveAssignment);

    document.getElementById("assignmentShift")
        .addEventListener("change", setShiftTime);

    modal.addEventListener("click", function(event) {
        if (event.target === modal) {
            closeAssignmentForm();
        }
    });
}


// ==========================================
// MODAL STYLING
// ==========================================

function addModalStyles() {

    const style = document.createElement("style");

    style.textContent = `
        #assignmentModal {
            position: fixed;
            inset: 0;
            background: rgba(25, 25, 45, 0.55);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 9999;
        }

        .assignment-modal-content {
            background: white;
            width: 100%;
            max-width: 620px;
            padding: 28px;
            border-radius: 17px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,.15);
        }

        .assignment-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }

        .assignment-modal-header h2 {
            font-size: 20px;
            color: #20243a;
            margin-bottom: 5px;
        }

        .assignment-modal-header p {
            font-size: 12px;
            color: #9296a9;
        }

        #closeAssignmentModal {
            border: none;
            background: #f2f0ff;
            color: #6558e8;
            width: 32px;
            height: 32px;
            border-radius: 9px;
            font-size: 22px;
            cursor: pointer;
        }

        .assignment-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 17px;
        }

        .assignment-form-grid label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #555b70;
            margin-bottom: 7px;
        }

        .assignment-form-grid input,
        .assignment-form-grid select {
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            border: 1px solid #e7e8ef;
            border-radius: 9px;
            background: white;
            color: #30344a;
            font-family: inherit;
            font-size: 13px;
            outline: none;
        }

        .assignment-form-grid input:focus,
        .assignment-form-grid select:focus {
            border-color: #6558e8;
        }

        .assignment-form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 25px;
        }

        .assignment-form-actions button {
            border: none;
            padding: 12px 18px;
            border-radius: 9px;
            cursor: pointer;
            font-weight: 700;
            font-size: 12px;
        }

        #cancelAssignment {
            background: #f1f1f6;
            color: #555b70;
        }

        #saveAssignment {
            background: #6558e8;
            color: white;
        }

        @media(max-width: 550px) {
            .assignment-form-grid {
                grid-template-columns: 1fr;
            }

            .assignment-modal-content {
                padding: 20px;
            }
        }
    `;

    document.head.appendChild(style);
}


// ==========================================
// OPEN AND CLOSE FORM
// ==========================================

function openAssignmentForm(id = null) {

    createAssignmentForm();

    const modal = document.getElementById("assignmentModal");
    const form = document.getElementById("assignmentForm");

    form.reset();

    document.getElementById("assignmentTitle").textContent =
        id ? "Edit Assignment" : "Create Assignment";

    document.getElementById("assignmentDate").value =
        new Date().toISOString().split("T")[0];

    if (id) {

        const item = assignments.find(a => a.id === id);

        if (!item) return;

        document.getElementById("assignmentStaffName").value = item.staffName;
        document.getElementById("assignmentStaffId").value = item.staffId;
        document.getElementById("assignmentDepartment").value = item.department;
        document.getElementById("assignmentDate").value = item.date;
        document.getElementById("assignmentShift").value = item.shift;
        document.getElementById("assignmentStart").value = item.start;
        document.getElementById("assignmentEnd").value = item.end;

        form.dataset.editId = id;

    } else {
        delete form.dataset.editId;
    }

    modal.style.display = "flex";
}


function closeAssignmentForm() {

    const modal = document.getElementById("assignmentModal");

    if (modal) {
        modal.style.display = "none";
    }
}


// ==========================================
// AUTOMATIC SHIFT TIMES
// ==========================================

function setShiftTime() {

    const shift = document.getElementById("assignmentShift").value;

    const start = document.getElementById("assignmentStart");
    const end = document.getElementById("assignmentEnd");

    if (shift === "Morning") {
        start.value = "07:00";
        end.value = "15:00";
    }

    if (shift === "Afternoon") {
        start.value = "15:00";
        end.value = "23:00";
    }

    if (shift === "Night") {
        start.value = "23:00";
        end.value = "07:00";
    }
}


// ==========================================
// SAVE ASSIGNMENT
// ==========================================

function saveAssignment(event) {

    event.preventDefault();

    const form = event.target;
    const editId = form.dataset.editId;

    const staffName = document.getElementById("assignmentStaffName").value.trim();
    const staffId = document.getElementById("assignmentStaffId").value.trim();
    const department = document.getElementById("assignmentDepartment").value.trim();
    const date = document.getElementById("assignmentDate").value;
    const shift = document.getElementById("assignmentShift").value;
    const start = document.getElementById("assignmentStart").value;
    const end = document.getElementById("assignmentEnd").value;

    if (!staffName || !staffId || !department || !date || !shift || !start || !end) {
        alert("Please complete all fields.");
        return;
    }

    if (start === end) {
        alert("Start time and end time cannot be the same.");
        return;
    }

    const duplicate = assignments.some(item =>
        item.staffId.toLowerCase() === staffId.toLowerCase() &&
        item.date === date &&
        item.id !== editId
    );

    if (duplicate) {
        alert("This staff member already has an assignment on this date.");
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

        const index = assignments.findIndex(a => a.id === editId);

        if (index !== -1) {
            assignments[index] = assignment;
        }

    } else {
        assignments.push(assignment);
    }

    saveAssignments();
    renderRoster();
    closeAssignmentForm();

    alert(editId ? "Assignment updated successfully." : "Assignment created successfully.");
}


// ==========================================
// RENDER ROSTER TABLE
// ==========================================

function renderRoster() {

    const search = rosterSearch.value.toLowerCase();
    const selectedDate = rosterDate.value;
    const selectedShift = rosterShiftFilter.value;

    const filtered = assignments.filter(item => {

        const matchesSearch =
            item.staffName.toLowerCase().includes(search) ||
            item.staffId.toLowerCase().includes(search) ||
            item.department.toLowerCase().includes(search);

        const matchesDate = !selectedDate || item.date === selectedDate;
        const matchesShift = !selectedShift || item.shift === selectedShift;

        return matchesSearch && matchesDate && matchesShift;
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-roster">
                        <div class="empty-icon">▤</div>
                        <h3>No duty assignments found</h3>
                        <p>Try changing your search or create a new assignment.</p>
                    </div>
                </td>
            </tr>
        `;

    } else {

        filtered.forEach(item => {

            const initials = item.staffName
                .split(" ")
                .map(word => word[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="staff-cell">
                        <div class="staff-avatar">${initials}</div>
                        <div>
                            <div class="staff-name">${escapeHTML(item.staffName)}</div>
                            <div class="staff-role">Hospital Staff</div>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(item.staffId)}</td>
                <td>${escapeHTML(item.department)}</td>
                <td>${formatDate(item.date)}</td>

                <td>
                    <span class="shift-badge ${item.shift.toLowerCase()}">
                        ${escapeHTML(item.shift)}
                    </span>
                </td>

                <td>${escapeHTML(item.start)} - ${escapeHTML(item.end)}</td>

                <td>
                    <span class="status-badge">${escapeHTML(item.status)}</span>
                </td>

                <td>
                    <button type="button" data-action="edit" data-id="${item.id}">Edit</button>
                    <button type="button" data-action="delete" data-id="${item.id}">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    }

    updateStatistics();

    rosterCount.textContent =
        `${filtered.length} ${filtered.length === 1 ? "assignment" : "assignments"}`;
}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    totalAssignments.textContent = assignments.length;

    morningAssignments.textContent =
        assignments.filter(a => a.shift === "Morning").length;

    afternoonAssignments.textContent =
        assignments.filter(a => a.shift === "Afternoon").length;

    nightAssignments.textContent =
        assignments.filter(a => a.shift === "Night").length;
}


// ==========================================
// EDIT AND DELETE
// ==========================================

tableBody.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        openAssignmentForm(id);
    }

    if (action === "delete") {

        const confirmDelete = confirm("Are you sure you want to delete this assignment?");

        if (!confirmDelete) return;

        assignments = assignments.filter(item => item.id !== id);

        saveAssignments();
        renderRoster();
    }

});


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date) {

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
// PRINT ROSTER
// ==========================================

printRosterBtn.addEventListener("click", function() {

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups to print the roster.");
        return;
    }

    const rows = Array.from(tableBody.querySelectorAll("tr"))
        .filter(row => row.querySelector(".staff-name"))
        .map(row => `<tr>${Array.from(row.cells)
            .slice(0, 7)
            .map(cell => `<td>${escapeHTML(cell.innerText)}</td>`)
            .join("")}</tr>`)
        .join("");

    printWindow.document.write(`
        <html>
        <head>
            <title>CareRoster Duty Schedule</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; }
                h1 { color: #6558e8; }
                table { width: 100%; border-collapse: collapse; margin-top: 25px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #f0edff; }
            </style>
        </head>
        <body>
            <h1>CareRoster</h1>
            <h2>Hospital Staff Duty Schedule</h2>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Staff Member</th>
                        <th>Staff ID</th>
                        <th>Department</th>
                        <th>Duty Date</th>
                        <th>Shift</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();

});


// ==========================================
// EVENT LISTENERS
// ==========================================

addAssignmentBtn.addEventListener("click", () => openAssignmentForm());

rosterSearch.addEventListener("input", renderRoster);

rosterDate.addEventListener("change", renderRoster);

rosterShiftFilter.addEventListener("change", renderRoster);


// ==========================================
// INITIALISE PAGE
// ==========================================

createAssignmentForm();
addModalStyles();

rosterDate.value = new Date().toISOString().split("T")[0];

renderRoster();
