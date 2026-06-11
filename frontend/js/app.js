/**
 * INTERVIEW INTELLIGENCE PLATFORM - CLIENT SCRIPT (PHASE 4+5)
 * Handles:
 *  - Phase 1: Candidate state management, search, sorting, CRUD
 *  - Phase 2: Interview scheduling, history drawer, interviews page, interview CRUD
 *  - Phase 3: Candidate evaluation (scoring), scorecards, evaluation table
 *  - Phase 4: Comparison dashboard — ranked table with per-category winner highlights
 *  - Phase 5: Reports & Export — CSV download and print report
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
    activeScheduleCandidateId: null,
    openDrawerCandidateId: null,

    // --- View ---
    currentView: "dashboard", // "dashboard", "interviews", "evaluations", "compare", "reports"

    // --- Evaluations (Phase 3) ---
    evaluations: [],

    // --- Comparison (Phase 4) ---
    compareData: [],
    compareSortMetric: "overall_score",
    compareSortDir: "desc"
};

// ============================================================================
// DOM REFERENCES
// ============================================================================
const DOM = {
    // Views
    viewDashboard: document.getElementById("view-dashboard"),
    viewInterviews: document.getElementById("view-interviews"),
    viewEvaluations: document.getElementById("view-evaluations"),
    viewCompare: document.getElementById("view-compare"),
    viewReports: document.getElementById("view-reports"),

    // Sidebar nav
    navDashboard: document.getElementById("nav-dashboard"),
    navInterviews: document.getElementById("nav-interviews"),
    navEvaluations: document.getElementById("nav-evaluations"),
    navCompare: document.getElementById("nav-compare"),
    navReports: document.getElementById("nav-reports"),
    interviewsNavBadge: document.getElementById("interviews-nav-badge"),

    // Sidebar stats
    statsTotalCandidates: document.getElementById("stats-total-candidates"),
    statsTotalInterviews: document.getElementById("stats-total-interviews"),
    statsTotalEvaluations: document.getElementById("stats-total-evaluations"),
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
    DOM.navEvaluations.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("evaluations");
    });
    DOM.navCompare.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("compare");
    });
    DOM.navReports.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("reports");
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

    // ---- Export CSV button (on evaluations page) ----
    const btnExportCsv = document.getElementById("btn-export-csv");
    if (btnExportCsv) btnExportCsv.addEventListener("click", exportCandidatesCSV);

    // ---- Report page buttons ----
    const btnReportExportCsv = document.getElementById("btn-report-export-csv");
    if (btnReportExportCsv) btnReportExportCsv.addEventListener("click", exportCandidatesCSV);
    const btnReportPrint = document.getElementById("btn-report-print");
    if (btnReportPrint) btnReportPrint.addEventListener("click", printReport);

    // ---- Compare table — sortable column headers ----
    document.querySelectorAll(".compare-sort-header").forEach(th => {
        th.addEventListener("click", () => {
            const metric = th.dataset.metric;
            if (state.compareSortMetric === metric) {
                state.compareSortDir = state.compareSortDir === "desc" ? "asc" : "desc";
            } else {
                state.compareSortMetric = metric;
                state.compareSortDir = "desc";
            }
            renderCompareTable();
        });
    });

    // ---- Global delegated clicks (dynamic buttons) ----
    document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "btn-empty-state-add") {
            openCandidateModal(false);
        }
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
    const allViews = ["dashboard", "interviews", "evaluations", "compare", "reports"];

    // Toggle sections
    allViews.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.toggle("active-view", v === view);
    });

    // Toggle nav active state
    ["dashboard", "interviews", "evaluations", "compare", "reports"].forEach(v => {
        const nav = DOM[`nav${v.charAt(0).toUpperCase() + v.slice(1)}`];
        if (nav) nav.classList.toggle("active", v === view);
    });

    // Refresh view-specific data
    if (view === "interviews") fetchInterviews();
    if (view === "evaluations") fetchEvaluations();
    if (view === "compare") fetchCompareData();
    if (view === "reports") populateReportStats();
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
                    <button class="btn-icon-only btn-evaluate" title="Evaluate Candidate" data-id="${candidate.id}" style="color:var(--color-warning);border-color:rgba(245,158,11,0.3);background:rgba(245,158,11,0.05);">
                        <i data-lucide="star"></i>
                    </button>
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
    DOM.tbody.querySelectorAll(".btn-evaluate").forEach(btn =>
        btn.addEventListener("click", () => openEvalModal(parseInt(btn.dataset.id)))
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
        if (DOM.statsTotalEvaluations) {
            DOM.statsTotalEvaluations.textContent = data.total_evaluations ?? 0;
        }
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
    inner.innerHTML = `<div class="drawer-loading"><div class="spinner"></div> Loading candidate data...</div>`;

    try {
        const [interviews, evaluationResp] = await Promise.all([
            fetchCandidateInterviews(candidateId).catch(() => []),
            fetch(`${API_BASE_URL}/candidates/${candidateId}/evaluation`).catch(() => null)
        ]);
        
        let evaluation = null;
        if (evaluationResp && evaluationResp.ok) {
            evaluation = await evaluationResp.json();
        }

        const name = candidateName || state.candidates.find(c => c.id === candidateId)?.full_name || "Candidate";
        let evalHTML = "";

        if (evaluation) {
            let badgeClass = "poor";
            let badgeText = "Poor";
            if (evaluation.overall_score >= 85) { badgeClass = "excellent"; badgeText = "Excellent"; }
            else if (evaluation.overall_score >= 70) { badgeClass = "good"; badgeText = "Good"; }
            else if (evaluation.overall_score >= 50) { badgeClass = "average"; badgeText = "Average"; }

            evalHTML = `
            <div class="eval-summary-card">
                <div class="eval-summary-header">
                    <div>
                        <h5 style="margin:0;font-size:0.95rem;color:var(--color-warning);">Evaluation Scorecard</h5>
                        <span style="font-size:0.75rem;color:var(--text-muted);">${evaluation.comments || "No comments"}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span class="eval-badge ${badgeClass}">${badgeText}</span>
                        <div style="font-size:1.8rem;font-weight:800;color:var(--text-primary);">${evaluation.overall_score}%</div>
                        <button class="btn btn-secondary btn-sm" onclick="openEvalModal(${candidateId})">
                            <i data-lucide="pencil" style="width:14px;height:14px"></i>
                        </button>
                    </div>
                </div>
                <div class="score-bars-container">
                    ${["Technical", "Communication", "Confidence", "Problem_Solving", "Leadership", "Learning_Ability"].map(key => {
                        const score = evaluation[key.toLowerCase()] || 0;
                        return `
                        <div class="score-bar-wrapper">
                            <div class="score-bar-label"><span>${key.replace("_", " ")}</span> <span>${score}%</span></div>
                            <div class="score-bar-track">
                                <div class="score-bar-fill" style="width: ${score}%; background: ${score >= 70 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'};"></div>
                            </div>
                        </div>`
                    }).join("")}
                </div>
            </div>`;
        } else {
            evalHTML = `
            <div class="eval-summary-card" style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.02);border-style:dashed;">
                <span style="color:var(--text-muted);font-size:0.85rem;"><i data-lucide="star" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"></i>No evaluation scorecard exists for this candidate.</span>
                <button class="btn btn-primary btn-sm" style="background-color:var(--color-warning);border-color:var(--color-warning);color:#000;" onclick="openEvalModal(${candidateId})">
                    Evaluate Now
                </button>
            </div>`;
        }

        if (interviews.length === 0) {
            inner.innerHTML = evalHTML + `
                <div class="history-drawer-header" style="margin-top:20px;">
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

        inner.innerHTML = evalHTML + `
            <div class="history-drawer-header" style="margin-top:20px;">
                <i data-lucide="clock-3"></i>
                <h4>${name} — ${interviews.length} Interview${interviews.length !== 1 ? "s" : ""}</h4>
                <button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="openInterviewModal(false, ${candidateId})">
                    <i data-lucide="calendar-plus"></i> Add
                </button>
            </div>
            <div class="interview-history-list">${itemsHTML}</div>`;
        lucide.createIcons();
    } catch (error) {
        inner.innerHTML = `<p style="color:var(--color-danger);font-size:0.85rem">Failed to load candidate details.</p>`;
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
// EVALUATIONS PAGE — FETCH & RENDER (PHASE 3)
// ============================================================================

async function fetchEvaluations() {
    try {
        const response = await fetch(`${API_BASE_URL}/evaluations`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.evaluations = await response.json();
        renderEvaluationsTable();
    } catch (err) {
        console.error("Error fetching evaluations:", err);
    }
}

function renderEvaluationsTable() {
    const tbody = document.getElementById("evaluations-tbody");
    const countEl = document.getElementById("eval-count-summary");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (state.evaluations.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="9">
                    <div class="table-empty-state">
                        <i data-lucide="star" class="empty-state-icon"></i>
                        <h3>No Evaluations Yet</h3>
                        <p>Go to the Dashboard and click the Star icon on any candidate to evaluate them.</p>
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
        if (countEl) countEl.textContent = "No evaluations recorded";
        return;
    }

    state.evaluations.forEach(ev => {
        const name = ev.candidate_name || `Candidate #${ev.candidate_id}`;
        const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

        let badgeClass = "poor", badgeText = "Poor";
        if (ev.overall_score >= 85) { badgeClass = "excellent"; badgeText = "Excellent"; }
        else if (ev.overall_score >= 70) { badgeClass = "good"; badgeText = "Good"; }
        else if (ev.overall_score >= 50) { badgeClass = "average"; badgeText = "Average"; }

        const scoreBar = (score) => `
            <div style="display:flex;flex-direction:column;gap:3px;">
                <span style="font-weight:700;font-size:0.9rem;">${score}</span>
                <div style="width:50px;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
                    <div style="width:${score}%;height:100%;background:${score >= 70 ? 'var(--color-success)' : score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'};border-radius:3px;"></div>
                </div>
            </div>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="candidate-meta">
                    <div class="candidate-avatar">${initials}</div>
                    <div>
                        <div style="font-weight:600;color:#fff;">${name}</div>
                        <span class="eval-badge ${badgeClass}" style="font-size:0.65rem;">${badgeText}</span>
                    </div>
                </div>
            </td>
            <td>${scoreBar(ev.technical)}</td>
            <td>${scoreBar(ev.communication)}</td>
            <td>${scoreBar(ev.confidence)}</td>
            <td>${scoreBar(ev.problem_solving)}</td>
            <td>${scoreBar(ev.leadership)}</td>
            <td>${scoreBar(ev.learning_ability)}</td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.5rem;font-weight:800;font-family:var(--font-heading);color:var(--color-warning);">${ev.overall_score}%</span>
                </div>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon-only btn-edit btn-eval-edit" title="Edit Evaluation" data-id="${ev.candidate_id}">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn-icon-only btn-delete btn-eval-delete" title="Delete Evaluation" data-id="${ev.id}" data-name="${name}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-eval-edit").forEach(btn =>
        btn.addEventListener("click", () => openEvalModal(parseInt(btn.dataset.id)))
    );
    tbody.querySelectorAll(".btn-eval-delete").forEach(btn =>
        btn.addEventListener("click", () => deleteEvaluation(parseInt(btn.dataset.id), btn.dataset.name))
    );

    lucide.createIcons();
    if (countEl) countEl.textContent = `${state.evaluations.length} evaluation${state.evaluations.length !== 1 ? "s" : ""} recorded`;
}

async function deleteEvaluation(evalId, candidateName) {
    if (!confirm(`Delete evaluation for "${candidateName}"? This cannot be undone.`)) return;
    try {
        const resp = await fetch(`${API_BASE_URL}/evaluations/${evalId}`, { method: "DELETE" });
        if (!resp.ok) throw new Error("Delete failed");
        showToast("Evaluation Deleted", `Scorecard for ${candidateName} removed.`, "info");
        await fetchEvaluations();
        await fetchStats();
        if (state.openDrawerCandidateId) loadHistoryDrawer(state.openDrawerCandidateId);
    } catch (err) {
        showToast("Error", "Could not delete the evaluation.", "error");
    }
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

// ============================================================================
// PHASE 3: EVALUATION LOGIC
// ============================================================================

const evalModal = document.getElementById("evaluation-modal");
const evalForm = document.getElementById("evaluation-form");
const evalCandidateId = document.getElementById("eval-candidate-id");
const evalId = document.getElementById("eval-id");
const evalScoreDisplay = document.getElementById("eval-overall-score-display");
const evalComments = document.getElementById("eval-comments");

const metrics = ["technical", "communication", "confidence", "problem-solving", "leadership", "learning"];
const evalInputs = {};

document.addEventListener("DOMContentLoaded", () => {
    metrics.forEach(m => {
        evalInputs[m] = document.getElementById(`eval-${m}`);
        const display = document.getElementById(`val-${m}`);
        if(evalInputs[m]) {
            evalInputs[m].addEventListener("input", (e) => {
                display.textContent = e.target.value;
                updateOverallScorePreview();
            });
        }
    });

    const btnCloseEval = document.getElementById("btn-close-eval-modal");
    if(btnCloseEval) btnCloseEval.addEventListener("click", closeEvalModal);
    
    const btnCancelEval = document.getElementById("btn-cancel-eval-modal");
    if(btnCancelEval) btnCancelEval.addEventListener("click", closeEvalModal);
    
    if(evalForm) evalForm.addEventListener("submit", handleEvalSubmit);
});

function updateOverallScorePreview() {
    const sum = metrics.reduce((acc, m) => acc + parseInt(evalInputs[m].value || 0), 0);
    const avg = Math.round(sum / metrics.length);
    evalScoreDisplay.textContent = `${avg}%`;
}

async function openEvalModal(candidateId) {
    evalCandidateId.value = candidateId;
    evalForm.reset();
    metrics.forEach(m => {
        document.getElementById(`val-${m}`).textContent = "0";
    });
    updateOverallScorePreview();
    document.getElementById("eval-form-error-alert").classList.add("hidden");

    // Fetch existing evaluation
    try {
        const resp = await fetch(`${API_BASE_URL}/candidates/${candidateId}/evaluation`);
        if (resp.ok) {
            const data = await resp.json();
            evalId.value = data.id;
            evalInputs["technical"].value = data.technical;
            evalInputs["communication"].value = data.communication;
            evalInputs["confidence"].value = data.confidence;
            evalInputs["problem-solving"].value = data.problem_solving;
            evalInputs["leadership"].value = data.leadership;
            evalInputs["learning"].value = data.learning_ability;
            evalComments.value = data.comments || "";
            
            metrics.forEach(m => {
                document.getElementById(`val-${m}`).textContent = evalInputs[m].value;
            });
            updateOverallScorePreview();
            document.getElementById("eval-submit-btn-text").textContent = "Update Evaluation";
        } else {
            evalId.value = "";
            document.getElementById("eval-submit-btn-text").textContent = "Save Evaluation";
        }
    } catch (e) {
        console.error(e);
    }

    evalModal.classList.add("open");
    lucide.createIcons();
}

function closeEvalModal() {
    evalModal.classList.remove("open");
}

async function handleEvalSubmit(e) {
    e.preventDefault();
    document.getElementById("eval-form-error-alert").classList.add("hidden");

    const candidateId = parseInt(evalCandidateId.value);
    const existingId = evalId.value;

    const payload = {
        candidate_id: candidateId,
        technical: parseInt(evalInputs["technical"].value),
        communication: parseInt(evalInputs["communication"].value),
        confidence: parseInt(evalInputs["confidence"].value),
        problem_solving: parseInt(evalInputs["problem-solving"].value),
        leadership: parseInt(evalInputs["leadership"].value),
        learning_ability: parseInt(evalInputs["learning"].value),
        comments: evalComments.value.trim()
    };

    const url = existingId ? `${API_BASE_URL}/evaluations/${existingId}` : `${API_BASE_URL}/evaluations`;
    const method = existingId ? "PUT" : "POST";

    try {
        const resp = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.detail || "Failed to save evaluation.");

        showToast("Success", "Candidate evaluation saved.", "success");
        closeEvalModal();
        
        if (state.openDrawerCandidateId === candidateId) {
            loadHistoryDrawer(candidateId);
        }
    } catch (err) {
        document.getElementById("eval-form-error-message").textContent = err.message;
        document.getElementById("eval-form-error-alert").classList.remove("hidden");
    }
}

// ============================================================================
// PHASE 4: COMPARISON DASHBOARD
// ============================================================================

async function fetchCompareData() {
    const tbody = document.getElementById("compare-tbody");
    const summary = document.getElementById("compare-count-summary");
    if (tbody) tbody.innerHTML = `<tr><td colspan="9"><div class="drawer-loading"><div class="spinner"></div> Loading comparison data...</div></td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/compare`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.compareData = await response.json();
        renderCompareTable();
    } catch (err) {
        console.error("Error fetching compare data:", err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--color-danger);padding:30px;">Failed to load comparison data.</td></tr>`;
    }
}

function renderCompareTable() {
    const tbody = document.getElementById("compare-tbody");
    const summary = document.getElementById("compare-count-summary");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (state.compareData.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="9">
                    <div class="table-empty-state">
                        <i data-lucide="bar-chart-3" class="empty-state-icon"></i>
                        <h3>No Data to Compare</h3>
                        <p>Evaluate at least 2 candidates using the ⭐ Star icon on the Dashboard.</p>
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
        if (summary) summary.textContent = "No evaluated candidates";
        return;
    }

    // Sort by selected metric
    const metrics = ["technical", "communication", "confidence", "problem_solving", "leadership", "learning_ability", "overall_score"];
    const sorted = [...state.compareData].sort((a, b) => {
        const aVal = a[state.compareSortMetric] ?? 0;
        const bVal = b[state.compareSortMetric] ?? 0;
        return state.compareSortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    // Find winner for each category (highest score per column)
    const categoryKeys = ["technical", "communication", "confidence", "problem_solving", "leadership", "learning_ability"];
    const winners = {};
    categoryKeys.forEach(key => {
        const maxScore = Math.max(...state.compareData.map(c => c[key] ?? 0));
        winners[key] = maxScore;
    });

    sorted.forEach((c, index) => {
        const actualRank = state.compareData.findIndex(d => d.candidate_id === c.candidate_id) + 1;
        const rankClass = actualRank === 1 ? "rank-1" : actualRank === 2 ? "rank-2" : actualRank === 3 ? "rank-3" : "rank-other";
        const overallClass = c.overall_score >= 85 ? "score-excellent" : c.overall_score >= 70 ? "score-good" : c.overall_score >= 50 ? "score-average" : "score-poor";
        const initials = c.candidate_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

        const scoreCell = (key) => {
            const score = c[key] ?? 0;
            const isWinner = score === winners[key] && state.compareData.length > 1;
            const color = score >= 70 ? "var(--color-success)" : score >= 50 ? "var(--color-warning)" : "var(--color-danger)";
            const cellClass = isWinner ? "cell-winner" : "";
            return `<td class="${cellClass}">
                <div class="score-chip">
                    <span class="score-chip-value">${score}</span>
                    <div class="score-chip-bar"><div class="score-chip-fill" style="width:${score}%;background:${color};"></div></div>
                </div>
            </td>`;
        };

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${actualRank}</span></td>
            <td>
                <div class="candidate-meta">
                    <div class="candidate-avatar">${initials}</div>
                    <div>
                        <div style="font-weight:600;color:#fff;">${c.candidate_name}</div>
                        <span style="font-size:0.75rem;color:var(--text-muted);">${c.college || ""} ${c.experience_years ? "· " + c.experience_years + " yrs" : ""}</span>
                    </div>
                </div>
            </td>
            ${scoreCell("technical")}
            ${scoreCell("communication")}
            ${scoreCell("confidence")}
            ${scoreCell("problem_solving")}
            ${scoreCell("leadership")}
            ${scoreCell("learning_ability")}
            <td><span class="overall-score-pill ${overallClass}">${c.overall_score}%</span></td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
    if (summary) summary.textContent = `${sorted.length} candidate${sorted.length !== 1 ? "s" : ""} ranked`;
}

// ============================================================================
// PHASE 5: EXPORT & REPORTS
// ============================================================================

function exportCandidatesCSV() {
    showToast("Generating CSV", "Preparing your download...", "info");
    // Trigger backend CSV download
    const link = document.createElement("a");
    link.href = `${API_BASE_URL}/export/candidates`;
    link.download = "talent_ai_candidates.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => showToast("CSV Downloaded", "talent_ai_candidates.csv saved.", "success"), 1000);
}

function printReport() {
    // Switch to compare view first so print shows it
    switchView("compare");
    fetchCompareData().then(() => {
        setTimeout(() => window.print(), 600);
    });
}

async function populateReportStats() {
    try {
        const resp = await fetch(`${API_BASE_URL}/stats`);
        if (!resp.ok) return;
        const data = await resp.json();
        const c = document.getElementById("report-stat-candidates");
        const i = document.getElementById("report-stat-interviews");
        const e = document.getElementById("report-stat-evaluations");
        if (c) c.textContent = data.total_candidates;
        if (i) i.textContent = data.total_interviews;
        if (e) e.textContent = data.total_evaluations ?? 0;
    } catch (err) {
        console.error("Error loading report stats:", err);
    }
}
