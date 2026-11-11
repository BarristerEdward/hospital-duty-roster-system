// ==========================================
// CAREROSTER - STAFF MANAGEMENT
// ==========================================

const STAFF_KEY = "careroster_staff";

const staffModal = document.getElementById("staffModal");
const addStaffBtn = document.getElementById("addStaffBtn");
const closeStaffModal = document.getElementById("closeStaffModal");
const cancelStaffBtn = document.getElementById("cancelStaffBtn");
const staffForm = document.getElementById("staffForm");
const staffTableBody = document.getElementById("staffTableBody");
const staffSearch = document.getElementById("staffSearch");
const departmentFilter = document.getElementById("departmentFilter");
const statusFilter = document.getElementById("statusFilter");

function loadStaff() {
    try {
        const saved = JSON.parse(localStorage.getItem(STAFF_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

let staffMembers = loadStaff();

function saveStaff() {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staffMembers));
}


// ==========================================
// MODAL CONTROLS
// ==========================================

function openStaffModal() {
    staffModal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("staffName").focus();
}

function closeModal() {
    staffModal.hidden = true;
    document.body.style.overflow = "";
}

addStaffBtn.addEventListener("click", openStaffModal);
closeStaffModal.addEventListener("click", closeModal);
cancelStaffBtn.addEventListener("click", closeModal);

staffModal.addEventListener("click", function(event) {
    if (event.target === staffModal) closeModal();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && !staffModal.hidden) {
        closeModal();
    }
});


// ==========================================
// ADD STAFF
// ==========================================

staffForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const staff = {
        name: document.getElementById("staffName").value.trim(),
        id: document.getElementById("staffId").value.trim(),
        department: document.getElementById("staffDepartment").value,
        role: document.getElementById("staffRole").value.trim(),
        email: document.getElementById("staffEmail").value.trim(),
        phone: document.getElementById("staffPhone").value.trim(),
        status: "Active"
    };

    if (!staff.name || !staff.id || !staff.department || !staff.role) {
        alert("Please complete all required fields.");
        return;
    }

    const duplicate = staffMembers.some(function(member) {
        return member.id.toLowerCase() === staff.id.toLowerCase();
    });

    if (duplicate) {
        alert("That Staff ID already exists.");
        return;
    }

    staffMembers.push(staff);

    saveStaff();
    renderStaff();

    staffForm.reset();
    closeModal();

    alert("Staff member added successfully!");
});


// ==========================================
// DELETE STAFF
// ==========================================

function deleteStaff(staffId) {
    const staff = staffMembers.find(function(member) {
        return member.id === staffId;
    });

    if (!staff) return;

    if (confirm("Delete " + staff.name + " from this list?")) {
        staffMembers = staffMembers.filter(function(member) {
            return member.id !== staffId;
        });

        saveStaff();
        renderStaff();
    }
}


// ==========================================
// DISPLAY STAFF
// ==========================================

function renderStaff() {
    const searchTerm = staffSearch.value.trim().toLowerCase();
    const selectedDepartment = departmentFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredStaff = staffMembers.filter(function(staff) {
        const matchesSearch =
            staff.name.toLowerCase().includes(searchTerm) ||
            staff.id.toLowerCase().includes(searchTerm) ||
            (staff.email || "").toLowerCase().includes(searchTerm);

        const matchesDepartment =
            !selectedDepartment ||
            staff.department === selectedDepartment;

        const matchesStatus =
            !selectedStatus ||
            staff.status === selectedStatus;

        return matchesSearch && matchesDepartment && matchesStatus;
    });

    staffTableBody.replaceChildren();

    if (filteredStaff.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;

        cell.className = "empty-state";

        cell.textContent = staffMembers.length
            ? "No staff members match your filters."
            : 'No staff members added yet. Click "Add Staff Member" to get started.';

        row.appendChild(cell);
        staffTableBody.appendChild(row);

    } else {

        filteredStaff.forEach(function(staff) {
            const row = document.createElement("tr");

            const values = [
                staff.name,
                staff.id,
                staff.department,
                staff.role
            ];

            values.forEach(function(value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "status-badge status-active";
            statusBadge.textContent = staff.status;

            statusCell.appendChild(statusBadge);
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "btn btn-secondary";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", function() {
                deleteStaff(staff.id);
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            staffTableBody.appendChild(row);
        });
    }

    document.getElementById("totalStaff").textContent =
        staffMembers.length;

    document.getElementById("activeStaff").textContent =
        staffMembers.filter(function(staff) {
            return staff.status === "Active";
        }).length;

    document.getElementById("totalDepartments").textContent =
        new Set(staffMembers.map(function(staff) {
            return staff.department;
        })).size;

    document.getElementById("staffCount").textContent =
        "Showing " + filteredStaff.length +
        " of " + staffMembers.length + " staff members";

    updateDepartmentFilter();
}


// ==========================================
// DEPARTMENT FILTER
// ==========================================

function updateDepartmentFilter() {
    const currentValue = departmentFilter.value;

    const departments = [
        ...new Set(staffMembers.map(function(staff) {
            return staff.department;
        }))
    ];

    departmentFilter.replaceChildren();

    const allOption = document.createElement("option");

    allOption.value = "";
    allOption.textContent = "All Departments";

    departmentFilter.appendChild(allOption);

    departments.forEach(function(department) {
        const option = document.createElement("option");

        option.value = department;
        option.textContent = department;

        departmentFilter.appendChild(option);
    });

    departmentFilter.value = departments.includes(currentValue)
        ? currentValue
        : "";
}


// ==========================================
// SEARCH AND FILTER EVENTS
// ==========================================

staffSearch.addEventListener("input", renderStaff);
departmentFilter.addEventListener("change", renderStaff);
statusFilter.addEventListener("change", renderStaff);


// ==========================================
// INITIALIZE
// ==========================================

renderStaff();
