
const staffModal = document.getElementById("staffModal");
const addStaffBtn = document.getElementById("addStaffBtn");
const closeStaffModal = document.getElementById("closeStaffModal");
const cancelStaffBtn = document.getElementById("cancelStaffBtn");
const staffForm = document.getElementById("staffForm");

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

// Close the form when clicking outside the card.
staffModal.addEventListener("click", function (event) {
    if (event.target === staffModal) {
        closeModal();
    }
});

// Close the form with the Escape key.
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !staffModal.hidden) {
        closeModal();
    }
});
