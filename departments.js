
const STORAGE_KEY = "careroster_departments";

const modal = document.getElementById("departmentModal");
const form = document.getElementById("departmentForm");
const tableBody = document.getElementById("departmentTableBody");
const searchInput = document.getElementById("departmentSearch");
const statusFilter = document.getElementById("departmentStatusFilter");

let departments = loadDepartments();
let editingId = null;

function loadDepartments() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveDepartments() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(departments));
        return true;
    } catch {
        alert("Could not save departments in this browser.");
        return false;
    }
}

function openModal(department = null) {
    editingId = department ? department.id : null;
    form.reset();

    document.getElementById("departmentModalTitle").textContent =
        department ? "Edit Department" : "Add Department";

    document.getElementById("saveDepartmentBtn").textContent =
        department ? "Update Department" : "Save Department";

    document.getElementById("departmentName").value =
        department ? department.name : "";

    document.getElementById("departmentCode").value =
        department ? department.code : "";

    document.getElementById("departmentDescription").value =
        department ? department.description : "";

    document.getElementById("departmentStatus").value =
        department ? department.status : "Active";

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("departmentName").focus();
}

function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    editingId = null;
    form.reset();
}

document.getElementById("addDepartmentBtn").addEventListener("click", () => {
    openModal();
});

document.getElementById("closeDepartmentModal").addEventListener("click", closeModal);
document.getElementById("cancelDepartmentBtn").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
});

form.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("departmentName").value.trim();
    const code = document.getElementById("departmentCode").value.trim().toUpperCase();
    const description = document.getElementById("departmentDescription").value.trim();
    const status = document.getElementById("departmentStatus").value;

    if (!name || !code) {
        alert("Department name and code are required.");
        return;
    }

    const duplicate = departments.some(department =>
        department.code.toLowerCase() === code.toLowerCase() &&
        department.id !== editingId
    );

    if (duplicate) {
        alert("That department code already exists.");
        return;
    }

    const previous = editingId
        ? departments.find(department => department.id === editingId)
        : null;

    const updatedDepartment = {
        id: editingId || (crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now())),
        name,
        code,
        description,
        status,
        createdAt: previous ? previous.createdAt : new Date().toISOString()
    };

    const oldDepartments = [...departments];

    if (editingId) {
        departments = departments.map(department =>
            department.id === editingId ? updatedDepartment : department
        );
    } else {
        departments.push(updatedDepartment);
    }

    if (!saveDepartments()) {
        departments = oldDepartments;
        return;
    }

    closeModal();
    renderDepartments();
});

function renderDepartments() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filtered = departments.filter(department => {
        const matchesSearch = [
            department.name,
            department.code,
            department.description
        ].some(value => (value || "").toLowerCase().includes(search));

        const matchesStatus =
            !selectedStatus || department.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    tableBody.replaceChildren();

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "empty-state";
        cell.textContent = departments.length
            ? "No departments match your search or filters."
            : "No departments yet. Select Add Department to create one.";

        row.appendChild(cell);
        tableBody.appendChild(row);
    } else {
        filtered.forEach(department => {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = department.name;
            row.appendChild(nameCell);

            const codeCell = document.createElement("td");
            codeCell.textContent = department.code;
            row.appendChild(codeCell);

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = department.description || "—";
            row.appendChild(descriptionCell);

            const staffCell = document.createElement("td");
            staffCell.textContent = "0";
            staffCell.title = "Staff counts will be connected when staff data is integrated.";
            row.appendChild(staffCell);

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "status-badge " +
                (department.status === "Active" ? "status-active" : "status-inactive");
            badge.textContent = department.status;
            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            const actionsCell = document.createElement("td");
            const actions = document.createElement("div");
            actions.style.display = "flex";
            actions.style.gap = "8px";
            actions.style.flexWrap = "wrap";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn btn-secondary";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => openModal(department));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn btn-secondary";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", () => {
                const confirmed = confirm(
                    `Delete the ${department.name} department?`
                );

                if (!confirmed) return;

                const oldDepartments = [...departments];
                departments = departments.filter(item => item.id !== department.id);

                if (!saveDepartments()) {
                    departments = oldDepartments;
                    return;
                }

                renderDepartments();
            });

            actions.append(editButton, deleteButton);
            actionsCell.appendChild(actions);
            row.appendChild(actionsCell);

            tableBody.appendChild(row);
        });
    }

    document.getElementById("totalDepartments").textContent = departments.length;

    document.getElementById("activeDepartments").textContent =
        departments.filter(department => department.status === "Active").length;

    // Staff totals will be calculated once the staff module is connected.
    document.getElementById("assignedStaff").textContent = "0";

    document.getElementById("departmentCount").textContent =
        `Showing ${filtered.length} of ${departments.length} departments`;
}

searchInput.addEventListener("input", renderDepartments);
statusFilter.addEventListener("change", renderDepartments);

renderDepartments();

