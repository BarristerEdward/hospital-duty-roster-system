// =====================================
// CAREROSTER - SYSTEM SETTINGS
// =====================================

const HOSPITAL_KEY = "careroster_hospital_settings";
const ROSTER_SETTINGS_KEY = "careroster_roster_settings";

// Hospital information form
const hospitalForm = document.getElementById("hospitalSettingsForm");

const hospitalName = document.getElementById("hospitalName");
const hospitalLocation = document.getElementById("hospitalLocation");
const hospitalEmail = document.getElementById("hospitalEmail");
const hospitalPhone = document.getElementById("hospitalPhone");
const settingsMessage = document.getElementById("settingsMessage");

// Roster preferences form
const rosterForm = document.getElementById("rosterSettingsForm");

const morningStart = document.getElementById("morningStart");
const morningEnd = document.getElementById("morningEnd");
const afternoonStart = document.getElementById("afternoonStart");
const afternoonEnd = document.getElementById("afternoonEnd");
const nightStart = document.getElementById("nightStart");
const nightEnd = document.getElementById("nightEnd");

const rosterMessage = document.getElementById("rosterMessage");


// =====================================
// LOAD SAVED SETTINGS
// =====================================

function loadHospitalSettings() {
    const savedSettings = JSON.parse(
        localStorage.getItem(HOSPITAL_KEY)
    ) || {};

    hospitalName.value = savedSettings.name || "";
    hospitalLocation.value = savedSettings.location || "";
    hospitalEmail.value = savedSettings.email || "";
    hospitalPhone.value = savedSettings.phone || "";
}


function loadRosterSettings() {
    const savedSettings = JSON.parse(
        localStorage.getItem(ROSTER_SETTINGS_KEY)
    ) || {};

    morningStart.value = savedSettings.morningStart || "07:00";
    morningEnd.value = savedSettings.morningEnd || "15:00";

    afternoonStart.value = savedSettings.afternoonStart || "15:00";
    afternoonEnd.value = savedSettings.afternoonEnd || "23:00";

    nightStart.value = savedSettings.nightStart || "23:00";
    nightEnd.value = savedSettings.nightEnd || "07:00";
}


// =====================================
// SAVE HOSPITAL INFORMATION
// =====================================

hospitalForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const settings = {
        name: hospitalName.value.trim(),
        location: hospitalLocation.value.trim(),
        email: hospitalEmail.value.trim(),
        phone: hospitalPhone.value.trim()
    };

    if (!settings.name) {
        settingsMessage.textContent = "Please enter the hospital name.";
        settingsMessage.style.color = "#dc3545";
        return;
    }

    localStorage.setItem(
        HOSPITAL_KEY,
        JSON.stringify(settings)
    );

    settingsMessage.textContent = "Hospital information saved successfully.";
    settingsMessage.style.color = "#168653";
});


// =====================================
// SAVE ROSTER PREFERENCES
// =====================================

rosterForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const settings = {
        morningStart: morningStart.value,
        morningEnd: morningEnd.value,

        afternoonStart: afternoonStart.value,
        afternoonEnd: afternoonEnd.value,

        nightStart: nightStart.value,
        nightEnd: nightEnd.value
    };

    const times = [
        settings.morningStart,
        settings.morningEnd,
        settings.afternoonStart,
        settings.afternoonEnd,
        settings.nightStart,
        settings.nightEnd
    ];

    if (times.some(time => !time)) {
        rosterMessage.textContent = "Please complete all shift times.";
        rosterMessage.style.color = "#dc3545";
        return;
    }

    localStorage.setItem(
        ROSTER_SETTINGS_KEY,
        JSON.stringify(settings)
    );

    rosterMessage.textContent = "Roster preferences saved successfully.";
    rosterMessage.style.color = "#168653";
});


// =====================================
// INITIALIZE SETTINGS
// =====================================

loadHospitalSettings();
loadRosterSettings();
