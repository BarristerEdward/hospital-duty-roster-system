```javascript
// CareRoster - Shift Management
const STORAGE_KEY = "careroster_shifts";

let shifts = [];

try {
    const savedShifts = localStorage.getItem(STORAGE_KEY);
    shifts = savedShifts ? JSON.parse(savedShifts) : [];

    if (!Array.isArray(shifts)) shifts = [];
} catch {
    shifts = [];
}

const tableBody = document.getElementById("shiftTableBody");
const totalShifts = document.getElementById("totalShifts");
const activeShifts = document.getElementById("activeShifts");
const shiftTypes = document.getElementById("shiftTypes");
const shiftCount = document.getElementById("shiftCount");
const searchInput = document.getElementById("shiftSearch");
const statusFilter = document.getElementById("shiftStatusFilter");
const addShiftBtn = document.getElementById("addShiftBtn");

// Save shifts in this browser
function saveShifts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
        return true;
    } catch (error) {
        alert("Could not save shifts in this browser. Please check browser storage.");
        return false;
    }
}

// Calculate shift duration, including overnight shifts
function getDuration(start, end) {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    let minutes = (endHour * 60 + endMinute) -
                  (startHour * 60 + startMinute);

    if (minutes <= 0) minutes += 24 * 60;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
}

// Create the add/edit form
const modal = document.createElement("div");
modal.id = "shiftModal";
modal.className = "modal-overlay";
modal.hidden = true;

modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true"
         aria-labelledby="shiftModalTitle">
        <div class="modal-header">
            <h2 id="shiftModalTitle">Add Shift</h2>
            <button type="button" id="closeShiftModal"
                    aria-label="Close form">&times;</button>
        </div>

        <form id="shiftForm">
            <div class="form-group">
                <label for="shiftName">Shift Name</label>
                <input id="shiftName" name="shiftName"
                       type="text" maxlength="60"
                       placeholder="e.g. Morning Shift" required>
            </div>

            <div class="form-group">
                <label for="shiftCode">Shift Code</label>
                <input id="shiftCode" name="shiftCode"
                       type="text" maxlength="15"
                       placeholder="e.g. MOR" required>
            </div>

            <div class="form-group">
                <label for="shiftStart">Start Time</label>
                <input id="shiftStart" name="shiftStart"
                       type="time" required>
            </div>

            <div class="form-group">
                <label for="shiftEnd">End Time</label>
                <input id="shiftEnd" name="shiftEnd"
                       type="time" required>
            </div>

            <div class="form-group">
                <label for="shiftStatus">Status</label>
                <select id="shiftStatus" name="shiftStatus">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            <div class="modal-actions">
                <button type="button" id="cancelShiftBtn">Cancel</button>
                <button type="submit" class="primary-btn"
                        id="saveShiftBtn">Save Shift</button>
            </div>
        </form>
    </div>
`;

document.body.appendChild(modal);

const shiftForm = document.getElementById("shiftForm");
const shiftModalTitle = document.getElementById("shiftModalTitle");
const shiftNameInput = document.getElementById("shiftName");
const shiftCodeInput = document.getElementById("shiftCode");
const shiftStartInput = document.getElementById("shiftStart");
const shiftEndInput = document.getElementById("shiftEnd");
const shiftStatusInput = document.getElementById("shiftStatus");

let editingShiftId = null;

// Basic modal styling
const shiftStyles = document.createElement("style");

shiftStyles.textContent = `
    #shiftModal[hidden] {
        display: none !important;
    }

    #shiftModal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(25, 20, 45, 0.55);
        overflow-y: auto;
    }

    #shiftModal .modal-card {
        background: #fff;
        color: #302c43;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 25px;
        border-radius: 14px;
        box-sizing: border-box;
    }

    #shiftModal .modal-header,
    #shiftModal .modal-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
    }

    #shiftModal .modal-header h2 {
        margin: 0;
        font-size: 21px;
    }

    #shiftModal #closeShiftModal {
        border: 0;
        background: transparent;
        font-size: 28px;
        cursor: pointer;
        color: #302c43;
    }

    #shiftModal .form-group {
        display: flex;
        flex-direction: column;
        gap: 7px;
        margin-bottom: 15px;
    }

    #shiftModal .form-group label {
        font-weight: 600;
        font-size: 14px;
    }

    #shiftModal .form-group input,
    #shiftModal .form-group select {
        width: 100%;
        min-height: 42px;
        padding: 10px 12px;
        border: 1px solid #ddd8ed;
        border-radius: 7px;
        background: #fff;
        color: #302c43;
        -webkit-text-fill-color: #302c43;
        box-sizing: border-box;
        font: inherit;
    }

    #shiftModal .modal-actions {
        justify-content: flex-end;
        margin-top: 22px;
        margin-bottom: 0;
    }

    #shiftModal .modal-actions button {
        padding: 10px 16px;
        border-radius: 7px;
        cursor: pointer;
        border: 1px solid #ddd8ed;
    }

    #shiftModal .modal-actions .primary-btn {
        background: #7357e8;
        color: white;
        border-color: #7357e8;
    }

    .shift-action-btn {
        padding: 6px 10px;
        margin: 2px;
        border: 1px solid #ddd8ed;
        border-radius: 6px;
        background: white;
        cursor: pointer;
    }

    .shift-delete-btn {
        color: #c0392b;
    }

    .shift-status-active {
        color: #18864b;
        font-weight: 600;
    }

    .shift-status-inactive {
        color: #777;
        font-weight: 600;
    }
`;

document.head.appendChild(shiftStyles);

function openShiftModal(shift = null) {
    editingShiftId = shift ? shift.id : null;

    shiftModalTitle.textContent = shift ? "Edit Shift" : "Add Shift";

    shiftNameInput.value = shift ? shift.name : "";
    shiftCodeInput.value = shift ? shift.code : "";
    shiftStartInput.value = shift ? shift.start : "";
    shiftEndInput.value = shift ? shift.end : "";
    shiftStatusInput.value = shift ? shift.status : "Active";

    modal.hidden = false;
    shiftNameInput.focus();
}

function closeShiftModal() {
    modal.hidden = true;
    shiftForm.reset();
    editingShiftId = null;
}

addShiftBtn.addEventListener("click", () => openShiftModal());

document.getElementById("closeShiftModal")
    .addEventListener("click", closeShiftModal);

document.getElementById("cancelShiftBtn")
    .addEventListener("click", closeShiftModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeShiftModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
        closeShiftModal();
    }
});

// Add or update a shift
shiftForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = shiftNameInput.value.trim();
    const code = shiftCodeInput.value.trim().toUpperCase();
    const start = shiftStartInput.value;
    const end = shiftEndInput.value;
    const status = shiftStatusInput.value;

    if (!name || !code || !start || !end) {
        alert("Please complete all required fields.");
        return;
    }

    if (start === end) {
        alert("Start time and end time cannot be the same.");
        return;
    }

    const duplicateCode = shifts.some(shift =>
        shift.code.toLowerCase() === code.toLowerCase() &&
        shift.id !== editingShiftId
    );

    if (duplicateCode) {
        alert("This shift code already exists. Please use another code.");
        return;
    }

    const shiftData = {
        id: editingShiftId || (
            window.crypto && typeof window.crypto.randomUUID === "function"
                ? window.crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        ),
        name,
        code,
        start,
        end,
        status
    };

    if (editingShiftId) {
        shifts = shifts.map(shift =>
            shift.id === editingShiftId ? shiftData : shift
        );
    } else {
        shifts.push(shiftData);
    }

    if (saveShifts()) {
        closeShiftModal();
        renderShifts();
    }
});

// Safely create a table cell
function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

// Render the shift table and statistics
function renderShifts() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredShifts = shifts.filter(shift => {
        const matchesSearch = [
            shift.name,
            shift.code,
            shift.start,
            shift.end
        ].some(value => String(value).toLowerCase().includes(query));

        const matchesStatus =
            selectedStatus === "all" || shift.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    tableBody.replaceChildren();

    filteredShifts.forEach(shift => {
        const row = document.createElement("tr");

        row.appendChild(createCell(shift.name));
        row.appendChild(createCell(shift.code));
        row.appendChild(createCell(shift.start));
        row.appendChild(createCell(shift.end));
        row.appendChild(createCell(getDuration(shift.start, shift.end)));

        const statusCell = createCell(shift.status);
        statusCell.className = shift.status === "Active"
            ? "shift-status-active"
            : "shift-status-inactive";

        row.appendChild(statusCell);

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "shift-action-btn";
        editButton.addEventListener("click", () => openShiftModal(shift));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "shift-action-btn shift-delete-btn";

        deleteButton.addEventListener("click", () => {
            if (!confirm(`Delete the "${shift.name}" shift?`)) return;

            shifts = shifts.filter(item => item.id !== shift.id);

            if (saveShifts()) renderShifts();
        });

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
    });

    if (filteredShifts.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 7;
        cell.textContent = shifts.length
            ? "No shifts match your search."
            : "No shifts added yet. Click + Add Shift to get started.";

        cell.style.textAlign = "center";
        cell.style.padding = "24px";

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    totalShifts.textContent = shifts.length;

    activeShifts.textContent = shifts.filter(
        shift => shift.status === "Active"
    ).length;

    shiftTypes.textContent = new Set(
        shifts.map(shift => shift.name.trim().toLowerCase())
    ).size;

    shiftCount.textContent =
        `${filteredShifts.length} shift${filteredShifts.length === 1 ? "" : "s"} found`;
}

searchInput.addEventListener("input", renderShifts);
statusFilter.addEventListener("change", renderShifts);

// Initial display
renderShifts();
```
