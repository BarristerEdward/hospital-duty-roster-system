// ==========================================
// CAREROSTER - STAFF AVAILABILITY & LEAVE
// ==========================================

const LEAVE_KEY = "careroster_availability";

let leaveRecords = JSON.parse(localStorage.getItem(LEAVE_KEY)) || [];

const tableBody = document.getElementById("leaveTableBody");

const totalRecords = document.getElementById("totalLeaveRecords");
const pendingRecords = document.getElementById("pendingLeaveRecords");
const approvedRecords = document.getElementById("approvedLeaveRecords");
const rejectedRecords = document.getElementById("rejectedLeaveRecords");

const searchInput = document.getElementById("leaveSearch");
const typeFilter = document.getElementById("leaveTypeFilter");
const statusFilter = document.getElementById("leaveStatusFilter");

const recordCount = document.getElementById("leaveRecordCount");
const addLeaveBtn = document.getElementById("addLeaveBtn");


// ==========================================
// SAVE DATA
// ==========================================

function saveLeaveData() {
    localStorage.setItem(LEAVE_KEY, JSON.stringify(leaveRecords));
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

function formatLeaveDate(date) {
    if (!date) return "-";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateLeaveStats() {
    totalRecords.textContent = leaveRecords.length;

    pendingRecords.textContent = leaveRecords.filter(
        item => item.status === "Pending"
    ).length;

    approvedRecords.textContent = leaveRecords.filter(
        item => item.status === "Approved"
    ).length;

    rejectedRecords.textContent = leaveRecords.filter(
        item => item.status === "Rejected"
    ).length;
}


// ==========================================
// STATUS BADGE
// ==========================================

function getStatusBadge(status) {
    const styles = {
        Pending: "leave-pending",
        Approved: "leave-approved",
        Rejected: "leave-rejected"
    };

    return `
        <span class="leave-status ${styles[status] || ""}">
            ${escapeHTML(status)}
        </span>
    `;
}


// ==========================================
// RENDER LEAVE RECORDS
// ==========================================

function renderLeaveRecords() {

    const search = searchInput.value.toLowerCase();
    const selectedType = typeFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredRecords = leaveRecords.filter(item => {

        const matchesSearch =
            item.staffName.toLowerCase().includes(search) ||
            item.staffId.toLowerCase().includes(search);

        const matchesType =
            !selectedType || item.leaveType === selectedType;

        const matchesStatus =
            !selectedStatus || item.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    recordCount.textContent =
        `${filteredRecords.length} record${filteredRecords.length !== 1 ? "s" : ""}`;

    if (filteredRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No matching leave records found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = filteredRecords.map(item => `

        <tr>
            <td>
                <strong>${escapeHTML(item.staffName)}</strong>
                <br>
                <small>${escapeHTML(item.staffId)}</small>
            </td>

            <td>${escapeHTML(item.leaveType)}</td>

            <td>${formatLeaveDate(item.startDate)}</td>

            <td>${formatLeaveDate(item.endDate)}</td>

            <td>${getStatusBadge(item.status)}</td>

            <td>
                <div class="leave-actions">

                    <button
                        class="leave-edit-btn"
                        data-action="edit"
                        data-id="${escapeHTML(item.id)}">
                        Edit
                    </button>

                    ${
                        item.status === "Pending"
                        ? `
                            <button
                                class="leave-approve-btn"
                                data-action="approve"
                                data-id="${escapeHTML(item.id)}">
                                Approve
                            </button>

                            <button
                                class="leave-reject-btn"
                                data-action="reject"
                                data-id="${escapeHTML(item.id)}">
                                Reject
                            </button>
                        `
                        : ""
                    }

                    <button
                        class="leave-delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(item.id)}">
                        Delete
                    </button>

                </div>
            </td>
        </tr>

    `).join("");
}


// ==========================================
// CREATE LEAVE FORM
// ==========================================

function createLeaveForm(editId = null) {

    const existingRecord = leaveRecords.find(
        item => item.id === editId
    );

    const modal = document.createElement("div");

    modal.className = "leave-modal-overlay";

    modal.innerHTML = `

        <div class="leave-modal">

            <div class="leave-modal-header">

                <div>
                    <h2>${existingRecord ? "Edit Leave Record" : "Add Leave Record"}</h2>
                    <p>Enter the staff member's leave information.</p>
                </div>

                <button type="button" class="leave-close-btn">
                    &times;
                </button>

            </div>

            <form id="leaveForm">

                <div class="leave-form-grid">

                    <div class="leave-form-group">
                        <label>Staff Name *</label>
                        <input
                            type="text"
                            id="leaveStaffName"
                            placeholder="Enter staff name"
                            required
                            value="${escapeHTML(existingRecord?.staffName || "")}">
                    </div>

                    <div class="leave-form-group">
                        <label>Staff ID *</label>
                        <input
                            type="text"
                            id="leaveStaffId"
                            placeholder="Enter staff ID"
                            required
                            value="${escapeHTML(existingRecord?.staffId || "")}">
                    </div>

                    <div class="leave-form-group">
                        <label>Leave Type *</label>
                        <select id="leaveType" required>

                            <option value="">Select leave type</option>

                            <option value="Annual Leave"
                                ${existingRecord?.leaveType === "Annual Leave" ? "selected" : ""}>
                                Annual Leave
                            </option>

                            <option value="Medical Leave"
                                ${existingRecord?.leaveType === "Medical Leave" ? "selected" : ""}>
                                Medical Leave
                            </option>

                            <option value="Personal Leave"
                                ${existingRecord?.leaveType === "Personal Leave" ? "selected" : ""}>
                                Personal Leave
                            </option>

                            <option value="Other"
                                ${existingRecord?.leaveType === "Other" ? "selected" : ""}>
                                Other
                            </option>

                        </select>
                    </div>

                    <div class="leave-form-group">
                        <label>Start Date *</label>
                        <input
                            type="date"
                            id="leaveStartDate"
                            required
                            value="${escapeHTML(existingRecord?.startDate || "")}">
                    </div>

                    <div class="leave-form-group">
                        <label>End Date *</label>
                        <input
                            type="date"
                            id="leaveEndDate"
                            required
                            value="${escapeHTML(existingRecord?.endDate || "")}">
                    </div>

                    <div class="leave-form-group">
                        <label>Status</label>
                        <select id="leaveStatus">

                            <option value="Pending"
                                ${!existingRecord || existingRecord.status === "Pending" ? "selected" : ""}>
                                Pending
                            </option>

                            <option value="Approved"
                                ${existingRecord?.status === "Approved" ? "selected" : ""}>
                                Approved
                            </option>

                            <option value="Rejected"
                                ${existingRecord?.status === "Rejected" ? "selected" : ""}>
                                Rejected
                            </option>

                        </select>
                    </div>

                    <div class="leave-form-group leave-full-width">
                        <label>Reason / Additional Information</label>

                        <textarea
                            id="leaveReason"
                            rows="3"
                            placeholder="Enter additional information...">${escapeHTML(existingRecord?.reason || "")}</textarea>
                    </div>

                </div>

                <div class="leave-form-actions">

                    <button type="button" class="leave-cancel-btn">
                        Cancel
                    </button>

                    <button type="submit" class="leave-save-btn">
                        ${existingRecord ? "Update Record" : "Save Record"}
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector(".leave-close-btn").addEventListener("click", closeModal);

    modal.querySelector(".leave-cancel-btn").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });


    // ======================================
    // SAVE FORM
    // ======================================

    modal.querySelector("#leaveForm").addEventListener("submit", event => {

        event.preventDefault();

        const staffName = modal.querySelector("#leaveStaffName").value.trim();

        const staffId = modal.querySelector("#leaveStaffId").value.trim();

        const leaveType = modal.querySelector("#leaveType").value;

        const startDate = modal.querySelector("#leaveStartDate").value;

        const endDate = modal.querySelector("#leaveEndDate").value;

        const status = modal.querySelector("#leaveStatus").value;

        const reason = modal.querySelector("#leaveReason").value.trim();


        if (!staffName || !staffId || !leaveType || !startDate || !endDate) {
            alert("Please complete all required fields.");
            return;
        }

        if (endDate < startDate) {
            alert("End date cannot be earlier than start date.");
            return;
        }


        const record = {
            id: editId || Date.now().toString(),
            staffName,
            staffId,
            leaveType,
            startDate,
            endDate,
            status,
            reason
        };


        if (existingRecord) {

            leaveRecords = leaveRecords.map(item =>
                item.id === editId ? record : item
            );

        } else {

            leaveRecords.push(record);

        }

        saveLeaveData();

        updateLeaveStats();

        renderLeaveRecords();

        closeModal();

    });

}


// ==========================================
// APPROVE / REJECT / EDIT / DELETE
// ==========================================

tableBody.addEventListener("click", event => {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    const id = button.dataset.id;

    const record = leaveRecords.find(item => item.id === id);

    if (!record) return;


    if (action === "edit") {
        createLeaveForm(id);
    }


    if (action === "approve") {

        if (confirm(`Approve leave for ${record.staffName}?`)) {

            record.status = "Approved";

            saveLeaveData();

            updateLeaveStats();

            renderLeaveRecords();
        }
    }


    if (action === "reject") {

        if (confirm(`Reject leave for ${record.staffName}?`)) {

            record.status = "Rejected";

            saveLeaveData();

            updateLeaveStats();

            renderLeaveRecords();
        }
    }


    if (action === "delete") {

        if (confirm(`Delete the leave record for ${record.staffName}?`)) {

            leaveRecords = leaveRecords.filter(
                item => item.id !== id
            );

            saveLeaveData();

            updateLeaveStats();

            renderLeaveRecords();
        }
    }

});


// ==========================================
// EVENT LISTENERS
// ==========================================

addLeaveBtn.addEventListener("click", () => {
    createLeaveForm();
});

searchInput.addEventListener("input", renderLeaveRecords);

typeFilter.addEventListener("change", renderLeaveRecords);

statusFilter.addEventListener("change", renderLeaveRecords);


// ==========================================
// INITIALIZE PAGE
// ==========================================

updateLeaveStats();

renderLeaveRecords();
