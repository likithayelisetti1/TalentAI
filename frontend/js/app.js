/**
 * INTERVIEW INTELLIGENCE PLATFORM - CLIENT SCRIPT (PHASE 2)
 * Handles:
 *  - Phase 1: Candidate state management, search, sorting, CRUD
 *  - Phase 2: Interview scheduling, history drawer, interviews page, interview CRUD
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE_URL = "http://127.0.0.1:8080/api";

// ============================================================================
// APP STATE
// ============================================================================
const state = {
    // --- Candidates (Phase 1) ---
    candidates: [],
    filteredCandidates: [],
    sortColumn: "full_name",
    sortDirection: "asc",
    searchQuery: "",
    isEditing: false,
    activeEditId: null,

    // --- Interviews (Phase 2) ---
    interviews: [],
    filteredInterviews: [],
    interviewSearchQuery: "",
    isEditingInterview: false,
    activeInterviewEditId: null,
    activeScheduleCandidateId: null, // pre-fill candidate when scheduling from a row
    openDrawerCandidateId: null,     // which candidate's history drawer is open

    // --- View ---
    currentView: "dashboard" // "dashboard" or "interviews"
};

// ============================================================================
// DOM REFERENCES
// ============================================================================
const DOM = {
    // Views
    viewDashboard: document.getElementById("view-dashboard"),
    viewInterviews: document.getElementById("view-interviews"),

    // Sidebar nav
    navDashboard: document.getElementById("nav-dashboard"),
    navInterviews: document.getElementById("nav-interviews"),
    interviewsNavBadge: document.getElementById("interviews-nav-badge"),

    // Sidebar stats
    statsTotalCandidates: document.getElementById("stats-total-candidates"),
    statsTotalInterviews: document.getElementById("stats-total-interviews"),
    statsAvgExperience: document.getElementById("stats-avg-experience"),

    // Candidate table
    tbody: document.getElementById("candidates-tbody"),
    searchInput: document.getElementById("search-input"),
    candidateCountSummary: document.getElementById("candidate-count-summary"),

    // Candidate modal
    candidateModal: document.getElementById("candidate-modal"),
    candidateForm: document.getElementById("candidate-form"),
    modalTitle: document.getElementById("modal-title"),
    modalSubtitle: document.getElementById("modal-subtitle"),
    submitBtnText: document.getElementById("submit-btn-text"),
    formErrorAlert: document.getElementById("form-error-alert"),
    formErrorMessage: document.getElementById("form-error-message"),

    // Candidate form inputs
    idInput: document.getElementById("candidate-id-input"),
    nameInput: document.getElementById("input-full-name"),
    emailInput: document.getElementById("input-email"),
    phoneInput: document.getElementById("input-phone"),
    collegeInput: document.getElementById("input-college"),
    experienceInput: document.getElementById("input-experience"),
    skillsInput: document.getElementById("input-skills"),

    // Candidate modal buttons
    btnOpenAddModal: document.getElementById("btn-open-add-modal"),
    btnCloseModal: document.getElementById("btn-close-modal"),
    btnCancelModal: document.getElementById("btn-cancel-modal"),

    // Sortable table headers
    thName: document.getElementById("th-name"),
    thCollege: document.getElementById("th-college"),
    thExperience: document.getElementById("th-experience"),

    // Interviews page
    interviewsTbody: document.getElementById("interviews-tbody"),
    interviewSearchInput: document.getElementById("interview-search-input"),
    interviewCountSummary: document.getElementById("interview-count-summary"),
    btnOpenScheduleModalPage: document.getElementById("btn-open-schedule-modal-page"),

    // Interview modal
    interviewModal: document.getElementById("interview-modal"),
    interviewForm: document.getElementById("interview-form"),
    interviewModalTitle: document.getElementById("interview-modal-title"),
    interviewModalSubtitle: document.getElementById("interview-modal-subtitle"),
    interviewSubmitBtnText: document.getElementById("interview-submit-btn-text"),
    interviewFormErrorAlert: document.getElementById("interview-form-error-alert"),
    interviewFormErrorMessage: document.getElementById("interview-form-error-message"),

    // Interview form inputs
    interviewIdInput: document.getElementById("interview-id-input"),
    interviewCandidateSelect: document.getElementById("input-interview-candidate"),
    interviewTypeSelect: document.getElementById("input-interview-type"),
    interviewStatusSelect: document.getElementById("input-interview-status"),
    interviewerNameInput: document.getElementById("input-interviewer-name"),
    interviewDateInput: document.getElementById("input-interview-date"),
    interviewNotesInput: document.getElementById("input-interview-notes"),

    // Interview modal buttons
    btnCloseInterviewModal: document.getElementById("btn-close-interview-modal"),
    btnCancelInterviewModal: document.getElementById("btn-cancel-interview-modal"),
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    fetchCandidates();
    fetchInterviews();
    fetchStats();
    registerEventListeners();
});

function registerEventListeners() {
    // ---- Navigation ----
    DOM.navDashboard.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("dashboard");
    });
    DOM.navInterviews.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("interviews");
    });

    // ---- Candidate search & sort ----
    DOM.searchInput.addEventListener("input", handleCandidateSearch);
    [DOM.thName, DOM.thCollege, DOM.thExperience].forEach(header => {
        header.addEventListener("click", () => handleSort(header.dataset.sort));
    });

    // ---- Candidate modal ----
    DOM.btnOpenAddModal.addEventListener("click", () => openCandidateModal(false));
    DOM.btnCloseModal.addEventListener("click", closeCandidateModal);
    DOM.btnCancelModal.addEventListener("click", closeCandidateModal);
    DOM.candidateModal.addEventListener("click", (e) => {
        if (e.target === DOM.candidateModal) closeCandidateModal();
    });
    DOM.candidateForm.addEventListener("submit", handleCandidateFormSubmit);

    // ---- Interviews page search ----
    DOM.interviewSearchInput.addEventListener("input", handleInterviewSearch);

    // ---- Schedule interview buttons ----
    DOM.btnOpenScheduleModalPage.addEventListener("click", () => openInterviewModal(false, null));
    DOM.btnCloseInterviewModal.addEventListener("click", closeInterviewModal);
    DOM.btnCancelInterviewModal.addEventListener("click", closeInterviewModal);
    DOM.interviewModal.addEventListener("click", (e) => {
        if (e.target === DOM.interviewModal) closeInterviewModal();
    });
    DOM.interviewForm.addEventListener("submit", handleInterviewFormSubmit);

    // ---- Global delegated clicks (dynamic buttons) ----
    document.addEventListener("click", (e) => {
        // Empty state add candidate button
        if (e.target && e.target.id === "btn-empty-state-add") {
            openCandidateModal(false);
        }
        // Clear candidate search button
        if (e.target && e.target.id === "btn-clear-search") {
            DOM.searchInput.value = "";
            state.searchQuery = "";
            state.filteredCandidates = [...state.candidates];
            applySortingAndRender();
        }
    });
}

// ============================================================================
// VIEW SWITCHING
// ============================================================================
function switchView(view) {
    state.currentView = view;

    // Toggle sections
    DOM.viewDashboard.classList.toggle("active-view", view === "dashboard");
    DOM.viewInterviews.classList.toggle("active-view", view === "interviews");

    // Toggle nav active state
    DOM.navDashboard.classList.toggle("active", view === "dashboard");
    DOM.navInterviews.classList.toggle("active", view === "interviews");

    // Refresh the relevant view's data
    if (view === "interviews") {
        fetchInterviews();
    }
}

// ============================================================================
// CANDIDATE API OPERATIONS (PHASE 1)
// ============================================================================

async function fetchCandidates() {
    try {
        const response = await fetch(`${API_BASE_URL}/candidates`);
        if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
        const data = await response.json();
        state.candidates = data;
        state.filteredCandidates = [...data];
        applySortingAndRender();
        populateCandidateDropdown();
    } catch (error) {
        console.error("Error fetching candidates:", error);
        showToast("Database Error", "Failed to retrieve candidates from the FastAPI server.", "error");
    }
}

async function handleCandidateFormSubmit(e) {
    e.preventDefault();
    hideCandidateFormError();

    const payload = {
        full_name: DOM.nameInput.value.trim(),
        email: DOM.emailInput.value.trim(),
        phone: DOM.phoneInput.value.trim() || null,
        college: DOM.collegeInput.value.trim() || null,
        experience_years: parseInt(DOM.experienceInput.value) || 0,
        skills: DOM.skillsInput.value.trim()
    };

    const isEdit = state.isEditing;
    const url = isEdit
        ? `${API_BASE_URL}/candidates/${state.activeEditId}`
        : `${API_BASE_URL}/candidates`;
    const method = isEdit ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Unable to save candidate record.");

        closeCandidateModal();
        showToast(
            isEdit ? "Candidate Updated" : "Candidate Registered",
            `${payload.full_name}'s profile has been saved.`,
            "success"
        );
        await fetchCandidates();
        await fetchStats();
    } catch (error) {
        showCandidateFormError(error.message);
    }
}

async function deleteCandidate(candidateId, candidateName) {
    const confirmed = confirm(`Delete candidate "${candidateName}"?\nThis will also remove all their interviews.`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        showToast("Candidate Deleted", `Removed ${candidateName} from the registry.`, "info");
        await fetchCandidates();
        await fetchInterviews();
        await fetchStats();
    } catch (error) {
        showToast("Deletion Failed", "Could not delete the candidate.", "error");
    }
}

// ============================================================================
// CANDIDATE SEARCH & SORT (PHASE 1)
// ============================================================================

function handleCandidateSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    state.searchQuery = query;
    state.filteredCandidates = query
        ? state.candidates.filter(c =>
            c.full_name.toLowerCase().includes(query) ||
            (c.college || "").toLowerCase().includes(query) ||
            (c.skills || "").toLowerCase().includes(query)
          )
        : [...state.candidates];
    applySortingAndRender();
}

function handleSort(columnName) {
    state.sortDirection = state.sortColumn === columnName
        ? (state.sortDirection === "asc" ? "desc" : "asc")
        : "asc";
    state.sortColumn = columnName;
    updateHeaderSortIndicators();
    applySortingAndRender();
}

function applySortingAndRender() {
    const { sortColumn: col, sortDirection: dir } = state;
    state.filteredCandidates.sort((a, b) => {
        let valA = a[col], valB = b[col];
        if (col === "experience_years") {
            valA = parseInt(valA) || 0;
            valB = parseInt(valB) || 0;
        } else {
            valA = (valA || "").toString().toLowerCase();
            valB = (valB || "").toString().toLowerCase();
        }
        if (valA < valB) return dir === "asc" ? -1 : 1;
        if (valA > valB) return dir === "asc" ? 1 : -1;
        return 0;
    });
    renderCandidatesTable();
}

function updateHeaderSortIndicators() {
    const headers = {
        full_name: DOM.thName,
        college: DOM.thCollege,
        experience_years: DOM.thExperience
    };
    Object.values(headers).forEach(h => h.classList.remove("sort-asc", "sort-desc"));
    const active = headers[state.sortColumn];
    if (active) active.classList.add(state.sortDirection === "asc" ? "sort-asc" : "sort-desc");
}

// ============================================================================
// CANDIDATE TABLE RENDERING (PHASE 1 + Phase 2 actions)
// ============================================================================

function renderCandidatesTable() {
    DOM.tbody.innerHTML = "";

    if (state.filteredCandidates.length === 0) {
        const emptyMsg = state.searchQuery
            ? `No candidates match "${state.searchQuery}".`
            : 'Click "Add Candidate" to get started.';
        const emptyIcon = state.searchQuery ? "search-x" : "users-round";
        DOM.tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="7">
                    <div class="table-empty-state">
                        <i data-lucide="${emptyIcon}" class="empty-state-icon"></i>
                        <h3>${state.searchQuery ? "No Matches Found" : "No Candidates Registered"}</h3>
                        <p>${emptyMsg}</p>
                        ${state.searchQuery
                            ? `<button class="btn btn-secondary btn-sm" id="btn-clear-search">Clear Search</button>`
                            : `<button class="btn btn-secondary btn-sm" id="btn-empty-state-add"><i data-lucide="plus"></i> Add First Candidate</button>`
                        }
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
        DOM.candidateCountSummary.textContent = "Showing 0 candidates";
        return;
    }

    state.filteredCandidates.forEach(candidate => {
        const skillsHTML = candidate.skills
            ? candidate.skills.split(",").map(s => s.trim()).filter(Boolean)
                .map(s => `<span class="skill-tag">${s}</span>`).join("")
            : `<span class="text-muted" style="font-size:0.75rem;color:var(--text-muted)">None</span>`;

        const initials = candidate.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

        // Count interviews for this candidate
        const interviewCount = state.interviews.filter(i => i.candidate_id === candidate.id).length;

        const tr = document.createElement("tr");
        tr.dataset.candidateId = candidate.id;
        tr.innerHTML = `
            <td>
                <div class="candidate-meta">
                    <div class="candidate-avatar">${initials}</div>
                    <div style="font-weight:700;font-size:0.85rem;color:var(--text-muted)">#${candidate.id}</div>
                </div>
            </td>
            <td><span style="font-weight:600;color:#ffffff">${candidate.full_name}</span></td>
            <td>
                <div class="contact-info">
                    <span class="contact-email">${candidate.email}</span>
                    <span class="contact-phone">${candidate.phone || "—"}</span>
                </div>
            </td>
            <td><span class="college-name">${candidate.college || '<span style="color:var(--text-muted);font-size:0.8rem;font-style:italic">Not specified</span>'}</span></td>
            <td><div class="skills-list">${skillsHTML}</div></td>
            <td><span class="exp-badge">${candidate.experience_years} ${candidate.experience_years === 1 ? "yr" : "yrs"}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon-only btn-schedule" title="Schedule Interview" data-id="${candidate.id}">
                        <i data-lucide="calendar-plus"></i>
                    </button>
                    <button class="btn-icon-only btn-history" title="View Interview History (${interviewCount})" data-id="${candidate.id}" data-name="${candidate.full_name}">
                        <i data-lucide="clock-3"></i>
                    </button>
                    <button class="btn-icon-only btn-edit" title="Edit Profile" data-id="${candidate.id}">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn-icon-only btn-delete" title="Delete Profile" data-id="${candidate.id}" data-name="${candidate.full_name}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;

        DOM.tbody.appendChild(tr);

        // History drawer row (always inserted, toggled with CSS)
        const drawerRow = document.createElement("tr");
        drawerRow.className = "history-drawer-row";
        drawerRow.dataset.drawerId = candidate.id;
        drawerRow.innerHTML = `
            <td colspan="7">
                <div class="history-drawer" id="drawer-${candidate.id}">
                    <div class="history-drawer-inner">
                        <div class="drawer-loading">
                            <div class="spinner"></div> Loading interview history...
                        </div>
                    </div>
                </div>
            </td>
        `;
        DOM.tbody.appendChild(drawerRow);
    });

    // Re-attach dynamic buttons
    DOM.tbody.querySelectorAll(".btn-edit").forEach(btn =>
        btn.addEventListener("click", () => openCandidateModal(true, parseInt(btn.dataset.id)))
    );
    DOM.tbody.querySelectorAll(".btn-delete").forEach(btn =>
        btn.addEventListener("click", () => deleteCandidate(parseInt(btn.dataset.id), btn.dataset.name))
    );
    DOM.tbody.querySelectorAll(".btn-schedule").forEach(btn =>
        btn.addEventListener("click", () => openInterviewModal(false, parseInt(btn.dataset.id)))
    );
    DOM.tbody.querySelectorAll(".btn-history").forEach(btn =>
        btn.addEventListener("click", () => toggleHistoryDrawer(parseInt(btn.dataset.id), btn.dataset.name))
    );

    lucide.createIcons();
    DOM.candidateCountSummary.textContent = `Showing ${state.filteredCandidates.length} of ${state.candidates.length} candidates`;
}

// ============================================================================
// CANDIDATE MODAL (PHASE 1)
// ============================================================================

function openCandidateModal(editMode = false, candidateId = null) {
    state.isEditing = editMode;
    state.activeEditId = candidateId;
    hideCandidateFormError();
    DOM.candidateForm.reset();

    if (editMode && candidateId !== null) {
        const c = state.candidates.find(c => c.id === candidateId);
        if (!c) return;
        DOM.modalTitle.textContent = "Edit Candidate Profile";
        DOM.modalSubtitle.textContent = `Modify credentials for candidate #${c.id}`;
        DOM.submitBtnText.textContent = "Update Profile";
        DOM.idInput.value = c.id;
        DOM.nameInput.value = c.full_name;
        DOM.emailInput.value = c.email;
        DOM.phoneInput.value = c.phone || "";
        DOM.collegeInput.value = c.college || "";
        DOM.experienceInput.value = c.experience_years;
        DOM.skillsInput.value = c.skills || "";
    } else {
        DOM.modalTitle.textContent = "Register New Candidate";
        DOM.modalSubtitle.textContent = "Register professional details into the secure SQLite database.";
        DOM.submitBtnText.textContent = "Register Candidate";
        DOM.idInput.value = "";
    }

    DOM.candidateModal.classList.add("open");
    lucide.createIcons();
}

function closeCandidateModal() {
    DOM.candidateModal.classList.remove("open");
}

function showCandidateFormError(message) {
    DOM.formErrorMessage.textContent = message;
    DOM.formErrorAlert.classList.remove("hidden");
    DOM.formErrorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideCandidateFormError() {
    DOM.formErrorAlert.classList.add("hidden");
}

// ============================================================================
// INTERVIEW API OPERATIONS (PHASE 2)
// ============================================================================

async function fetchInterviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/interviews`);
        if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
        state.interviews = await response.json();
        state.filteredInterviews = [...state.interviews];
        renderInterviewsTable();
        updateInterviewBadge();
    } catch (error) {
        console.error("Error fetching interviews:", error);
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) return;
        const data = await response.json();
        DOM.statsTotalCandidates.textContent = data.total_candidates;
        DOM.statsTotalInterviews.textContent = data.total_interviews;
        DOM.statsAvgExperience.textContent = `${data.avg_experience} yrs`;
        DOM.interviewsNavBadge.textContent = data.total_interviews;
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

async function fetchCandidateInterviews(candidateId) {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/interviews`);
    if (!response.ok) throw new Error("Failed to fetch history");
    return await response.json();
}

async function handleInterviewFormSubmit(e) {
    e.preventDefault();
    hideInterviewFormError();

    const payload = {
        candidate_id: parseInt(DOM.interviewCandidateSelect.value),
        interview_type: DOM.interviewTypeSelect.value,
        interviewer_name: DOM.interviewerNameInput.value.trim(),
        interview_date: DOM.interviewDateInput.value,
        status: DOM.interviewStatusSelect.value,
        notes: DOM.interviewNotesInput.value.trim() || null
    };

    if (!payload.candidate_id || !payload.interview_type || !payload.interviewer_name || !payload.interview_date) {
        showInterviewFormError("Please fill in all required fields.");
        return;
    }

    const isEdit = state.isEditingInterview;
    const url = isEdit
        ? `${API_BASE_URL}/interviews/${state.activeInterviewEditId}`
        : `${API_BASE_URL}/interviews`;
    const method = isEdit ? "PUT" : "POST";

    const editPayload = isEdit
        ? {
            interview_type: payload.interview_type,
            interviewer_name: payload.interviewer_name,
            interview_date: payload.interview_date,
            status: payload.status,
            notes: payload.notes
          }
        : payload;

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editPayload)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Could not save interview.");

        closeInterviewModal();
        const candidateName = DOM.interviewCandidateSelect.options[DOM.interviewCandidateSelect.selectedIndex]?.text || "Candidate";
        showToast(
            isEdit ? "Interview Updated" : "Interview Scheduled",
            `${isEdit ? "Updated" : "Scheduled"} interview for ${isEdit ? "the record" : candidateName}.`,
            "success"
        );
        await fetchInterviews();
        await fetchStats();

        // Refresh open drawer if relevant
        if (state.openDrawerCandidateId === payload.candidate_id) {
            loadHistoryDrawer(payload.candidate_id);
        }
    } catch (error) {
        showInterviewFormError(error.message);
    }
}

async function deleteInterview(interviewId, candidateName) {
    const confirmed = confirm(`Delete this interview session for "${candidateName}"?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Delete failed");
        showToast("Interview Deleted", `Session for ${candidateName} removed.`, "info");
        await fetchInterviews();
        await fetchStats();

        // Refresh open drawer
        if (state.openDrawerCandidateId) {
            loadHistoryDrawer(state.openDrawerCandidateId);
        }
    } catch (error) {
        showToast("Delete Failed", "Could not delete the interview.", "error");
    }
}

// ============================================================================
// INTERVIEW SEARCH (PHASE 2)
// ============================================================================

function handleInterviewSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    state.interviewSearchQuery = query;
    state.filteredInterviews = query
        ? state.interviews.filter(i =>
            (i.candidate_name || "").toLowerCase().includes(query) ||
            (i.interviewer_name || "").toLowerCase().includes(query) ||
            (i.interview_type || "").toLowerCase().includes(query) ||
            (i.status || "").toLowerCase().includes(query)
          )
        : [...state.interviews];
    renderInterviewsTable();
}

// ============================================================================
// INTERVIEWS TABLE RENDERING (PHASE 2)
// ============================================================================

function renderInterviewsTable() {
    DOM.interviewsTbody.innerHTML = "";

    if (state.filteredInterviews.length === 0) {
        DOM.interviewsTbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="8">
                    <div class="table-empty-state">
                        <i data-lucide="calendar-x" class="empty-state-icon"></i>
                        <h3>${state.interviewSearchQuery ? "No Matching Interviews" : "No Interviews Scheduled"}</h3>
                        <p>${state.interviewSearchQuery
                            ? `No interviews match "${state.interviewSearchQuery}".`
                            : 'Use "Schedule Interview" or the calendar icon on any candidate row.'
                        }</p>
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
        DOM.interviewCountSummary.textContent = "Showing 0 interviews";
        return;
    }

    state.filteredInterviews.forEach(interview => {
        const tr = document.createElement("tr");
        const typeBadgeClass = getTypeBadgeClass(interview.interview_type);
        const statusBadgeClass = getStatusBadgeClass(interview.status);
        const formattedDate = formatDate(interview.interview_date);

        tr.innerHTML = `
            <td style="color:var(--text-muted);font-size:0.85rem">#${interview.id}</td>
            <td><span class="interview-candidate-link">${interview.candidate_name || "—"}</span></td>
            <td><span class="interview-type-badge ${typeBadgeClass}">${interview.interview_type}</span></td>
            <td style="font-weight:500">${interview.interviewer_name}</td>
            <td style="color:var(--text-secondary)">${formattedDate}</td>
            <td><span class="status-badge ${statusBadgeClass}">${interview.status || "Scheduled"}</span></td>
            <td><span class="interview-notes-preview">${interview.notes || "—"}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon-only btn-edit btn-interview-edit" title="Edit Interview"
                        data-id="${interview.id}"
                        data-candidate="${interview.candidate_id}">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn-icon-only btn-delete btn-interview-delete" title="Delete Interview"
                        data-id="${interview.id}"
                        data-name="${interview.candidate_name || 'this candidate'}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        DOM.interviewsTbody.appendChild(tr);
    });

    DOM.interviewsTbody.querySelectorAll(".btn-interview-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            openInterviewModal(true, null, id);
        });
    });

    DOM.interviewsTbody.querySelectorAll(".btn-interview-delete").forEach(btn => {
        btn.addEventListener("click", () => deleteInterview(parseInt(btn.dataset.id), btn.dataset.name));
    });

    lucide.createIcons();
    DOM.interviewCountSummary.textContent = `Showing ${state.filteredInterviews.length} of ${state.interviews.length} interviews`;
}

// ============================================================================
// INTERVIEW HISTORY DRAWER (PHASE 2)
// ============================================================================

function toggleHistoryDrawer(candidateId, candidateName) {
    const drawer = document.getElementById(`drawer-${candidateId}`);
    if (!drawer) return;

    const isOpen = drawer.classList.contains("open");

    // Close any currently open drawer first
    document.querySelectorAll(".history-drawer.open").forEach(d => d.classList.remove("open"));
    state.openDrawerCandidateId = null;

    if (!isOpen) {
        drawer.classList.add("open");
        state.openDrawerCandidateId = candidateId;
        loadHistoryDrawer(candidateId, candidateName);
    }
}

async function loadHistoryDrawer(candidateId, candidateName) {
    const drawer = document.getElementById(`drawer-${candidateId}`);
    if (!drawer) return;

    const inner = drawer.querySelector(".history-drawer-inner");
    inner.innerHTML = `<div class="drawer-loading"><div class="spinner"></div> Loading interview history...</div>`;

    try {
        const interviews = await fetchCandidateInterviews(candidateId);
        const name = candidateName || state.candidates.find(c => c.id === candidateId)?.full_name || "Candidate";

        if (interviews.length === 0) {
            inner.innerHTML = `
                <div class="history-drawer-header">
                    <i data-lucide="clock-3"></i>
                    <h4>${name} — Interview History</h4>
                </div>
                <p style="color:var(--text-muted);font-size:0.85rem">No interviews scheduled yet.
                    <button class="btn btn-secondary btn-sm" style="margin-left:10px" onclick="openInterviewModal(false, ${candidateId})">
                        <i data-lucide="calendar-plus"></i> Schedule Now
                    </button>
                </p>`;
            lucide.createIcons();
            return;
        }

        const itemsHTML = interviews.map(iv => {
            const typeBadgeClass = getTypeBadgeClass(iv.interview_type);
            const statusBadgeClass = getStatusBadgeClass(iv.status);
            return `
                <div class="interview-history-item">
                    <span class="interview-history-date">${formatDate(iv.interview_date)}</span>
                    <span class="interview-type-badge ${typeBadgeClass}">${iv.interview_type}</span>
                    <span class="interview-history-interviewer">by ${iv.interviewer_name}</span>
                    <span class="status-badge ${statusBadgeClass}">${iv.status || "Scheduled"}</span>
                    <span class="interview-history-notes">${iv.notes || "No notes"}</span>
                    <div class="interview-history-actions">
                        <button class="btn-icon-only btn-edit" title="Edit" onclick="openInterviewModal(true, null, ${iv.id})">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-icon-only btn-delete" title="Delete" onclick="deleteInterview(${iv.id}, '${name}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>`;
        }).join("");

        inner.innerHTML = `
            <div class="history-drawer-header">
                <i data-lucide="clock-3"></i>
                <h4>${name} — ${interviews.length} Interview${interviews.length !== 1 ? "s" : ""}</h4>
                <button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="openInterviewModal(false, ${candidateId})">
                    <i data-lucide="calendar-plus"></i> Add
                </button>
            </div>
            <div class="interview-history-list">${itemsHTML}</div>`;
        lucide.createIcons();
    } catch (error) {
        inner.innerHTML = `<p style="color:var(--color-danger);font-size:0.85rem">Failed to load interview history.</p>`;
    }
}

// ============================================================================
// INTERVIEW MODAL (PHASE 2)
// ============================================================================

function openInterviewModal(editMode = false, prefilledCandidateId = null, interviewId = null) {
    state.isEditingInterview = editMode;
    state.activeInterviewEditId = interviewId;
    state.activeScheduleCandidateId = prefilledCandidateId;
    hideInterviewFormError();
    DOM.interviewForm.reset();

    // Set default date to today
    DOM.interviewDateInput.value = new Date().toISOString().split("T")[0];
    DOM.interviewStatusSelect.value = "Scheduled";

    if (editMode && interviewId !== null) {
        // Find the interview data
        const iv = state.interviews.find(i => i.id === interviewId);
        if (!iv) return;

        DOM.interviewModalTitle.textContent = "Edit Interview";
        DOM.interviewModalSubtitle.textContent = `Updating interview #${iv.id} details.`;
        DOM.interviewSubmitBtnText.textContent = "Update Interview";

        DOM.interviewIdInput.value = iv.id;
        DOM.interviewCandidateSelect.value = iv.candidate_id;
        DOM.interviewCandidateSelect.disabled = true; // Cannot change candidate in edit mode
        DOM.interviewTypeSelect.value = iv.interview_type;
        DOM.interviewStatusSelect.value = iv.status || "Scheduled";
        DOM.interviewerNameInput.value = iv.interviewer_name;
        DOM.interviewDateInput.value = iv.interview_date;
        DOM.interviewNotesInput.value = iv.notes || "";
    } else {
        DOM.interviewModalTitle.textContent = "Schedule Interview";
        DOM.interviewModalSubtitle.textContent = "Link an interview session to a candidate.";
        DOM.interviewSubmitBtnText.textContent = "Schedule Interview";
        DOM.interviewIdInput.value = "";
        DOM.interviewCandidateSelect.disabled = false;

        // Pre-select candidate if called from a candidate row
        if (prefilledCandidateId) {
            DOM.interviewCandidateSelect.value = prefilledCandidateId;
        }
    }

    DOM.interviewModal.classList.add("open");
    lucide.createIcons();
}

function closeInterviewModal() {
    DOM.interviewModal.classList.remove("open");
    DOM.interviewCandidateSelect.disabled = false;
}

function showInterviewFormError(message) {
    DOM.interviewFormErrorMessage.textContent = message;
    DOM.interviewFormErrorAlert.classList.remove("hidden");
    DOM.interviewFormErrorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideInterviewFormError() {
    DOM.interviewFormErrorAlert.classList.add("hidden");
}

// ============================================================================
// CANDIDATE DROPDOWN POPULATION (PHASE 2)
// ============================================================================

function populateCandidateDropdown() {
    const select = DOM.interviewCandidateSelect;
    // Keep the placeholder
    select.innerHTML = `<option value="">— Select Candidate —</option>`;
    state.candidates.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = `${c.full_name} (#${c.id})`;
        select.appendChild(option);
    });
}

// ============================================================================
// SIDEBAR BADGE UPDATE
// ============================================================================

function updateInterviewBadge() {
    DOM.interviewsNavBadge.textContent = state.interviews.length;
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function getTypeBadgeClass(type) {
    if (type === "Structured") return "type-structured";
    if (type === "Unstructured") return "type-unstructured";
    if (type === "Hybrid") return "type-hybrid";
    return "type-structured";
}

function getStatusBadgeClass(status) {
    if (status === "Completed") return "status-completed";
    if (status === "Cancelled") return "status-cancelled";
    return "status-scheduled";
}

function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return dateStr;
    }
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(title, text, type = "success") {
    const container = document.getElementById("toast-container");
    let iconName = "check-circle-2";
    if (type === "error") iconName = "alert-octagon";
    if (type === "info") iconName = "info";

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <div class="toast-content">
            <h5>${title}</h5>
            <p>${text}</p>
        </div>
    `;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}
