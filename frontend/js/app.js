/**
 * INTERVIEW INTELLIGENCE PLATFORM - CLIENT CLIENT (PHASE 1)
 * Handles state management, search, interactive sorting, and FastAPI CRUD API interactions.
 */

// Configuration
const API_BASE_URL = "http://127.0.0.1:8080/api";

// App State Management
const state = {
    candidates: [],         // Active cache of candidates loaded from SQLite
    filteredCandidates: [], // Cache of candidates matching active search/filter
    sortColumn: "full_name",// Active column sorted: "full_name", "college", or "experience_years"
    sortDirection: "asc",   // Active direction: "asc" or "desc"
    searchQuery: "",        // Active search filter
    isEditing: false,       // Modal context tracker
    activeEditId: null      // Tracker for update operations
};

// ==========================================================================
// DOM ELEMENTS REFERENCE
// ==========================================================================
const DOM = {
    tbody: document.getElementById("candidates-tbody"),
    searchInput: document.getElementById("search-input"),
    totalCandidatesCount: document.getElementById("stats-total-candidates"),
    avgExperienceCount: document.getElementById("stats-avg-experience"),
    candidateCountSummary: document.getElementById("candidate-count-summary"),
    
    // Modal controls
    modal: document.getElementById("candidate-modal"),
    form: document.getElementById("candidate-form"),
    modalTitle: document.getElementById("modal-title"),
    modalSubtitle: document.getElementById("modal-subtitle"),
    submitBtnText: document.getElementById("submit-btn-text"),
    modalIcon: document.getElementById("modal-icon"),
    formErrorAlert: document.getElementById("form-error-alert"),
    formErrorMessage: document.getElementById("form-error-message"),
    
    // Inputs
    idInput: document.getElementById("candidate-id-input"),
    nameInput: document.getElementById("input-full-name"),
    emailInput: document.getElementById("input-email"),
    phoneInput: document.getElementById("input-phone"),
    collegeInput: document.getElementById("input-college"),
    experienceInput: document.getElementById("input-experience"),
    skillsInput: document.getElementById("input-skills"),
    
    // Header triggers
    btnOpenAddModal: document.getElementById("btn-open-add-modal"),
    btnCloseModal: document.getElementById("btn-close-modal"),
    btnCancelModal: document.getElementById("btn-cancel-modal"),
    
    // Sorting table headers
    thName: document.getElementById("th-name"),
    thCollege: document.getElementById("th-college"),
    thExperience: document.getElementById("th-experience")
};

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Initial data fetch
    fetchCandidates();
    
    // Event listeners registration
    registerEventListeners();
});

function registerEventListeners() {
    // Search listener (keyup/input)
    DOM.searchInput.addEventListener("input", handleSearch);
    
    // Modal open/close actions
    DOM.btnOpenAddModal.addEventListener("click", () => openModal(false));
    DOM.btnCloseModal.addEventListener("click", closeModal);
    DOM.btnCancelModal.addEventListener("click", closeModal);
    
    // Form submission
    DOM.form.addEventListener("submit", handleFormSubmit);
    
    // Table sorting listeners
    [DOM.thName, DOM.thCollege, DOM.thExperience].forEach(header => {
        header.addEventListener("click", () => {
            const sortField = header.dataset.sort;
            handleSort(sortField);
        });
    });

    // Close modal on background clicks
    DOM.modal.addEventListener("click", (e) => {
        if (e.target === DOM.modal) {
            closeModal();
        }
    });

    // Setup empty state button dynamically delegating
    document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "btn-empty-state-add") {
            openModal(false);
        }
    });
}

// ==========================================================================
// CORE API OPERATIONS (FASTAPI FETCH HANDLERS)
// ==========================================================================

/**
 * Fetch all registered candidates from FastAPI
 */
async function fetchCandidates() {
    try {
        const response = await fetch(`${API_BASE_URL}/candidates`);
        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }
        
        const data = await response.json();
        state.candidates = data;
        state.filteredCandidates = [...data];
        
        // Apply default sorting and render
        applySortingAndRender();
        updateDashboardMetrics();
    } catch (error) {
        console.error("Error fetching candidates:", error);
        showToast("Database Error", "Failed to retrieve candidates from the FastAPI server.", "error");
    }
}

/**
 * Save new candidate or update existing candidate
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    hideFormError();

    // Compile payload
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
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!response.ok) {
            // Handle validation or duplicate record constraints
            const errorMessage = result.detail || "Unable to save candidate record.";
            throw new Error(errorMessage);
        }

        // Action successful
        closeModal();
        showToast(
            isEdit ? "Candidate Updated" : "Candidate Registered", 
            `${payload.full_name}'s professional profile has been saved.`, 
            "success"
        );
        
        // Reload all data to synchronize with DB state
        await fetchCandidates();
    } catch (error) {
        console.error("Form submit error:", error);
        showFormError(error.message);
    }
}

/**
 * Delete a candidate by ID
 */
async function deleteCandidate(candidateId, candidateName) {
    const confirmed = confirm(`Are you sure you want to delete the candidate "${candidateName}"?\nThis action will immediately drop the record from the SQLite database.`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        showToast("Candidate Deleted", `Removed profile of ${candidateName} from the registry.`, "info");
        await fetchCandidates();
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Deletion Failed", "Failed to delete candidate. Please check backend log.", "error");
    }
}

// ==========================================================================
// INTERACTIVE FILTERING & SORTING LOGIC
// ==========================================================================

/**
 * Filter list in real time as the user types
 */
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    state.searchQuery = query;
    
    if (!query) {
        state.filteredCandidates = [...state.candidates];
    } else {
        state.filteredCandidates = state.candidates.filter(candidate => {
            const nameMatch = candidate.full_name.toLowerCase().includes(query);
            const collegeMatch = (candidate.college || "").toLowerCase().includes(query);
            const skillsMatch = (candidate.skills || "").toLowerCase().includes(query);
            return nameMatch || collegeMatch || skillsMatch;
        });
    }
    
    // Sort filtered list and render it
    applySortingAndRender();
}

/**
 * Sort columns dynamically
 */
function handleSort(columnName) {
    // If clicking already sorted column, toggle direction. Otherwise default to Ascending
    if (state.sortColumn === columnName) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    } else {
        state.sortColumn = columnName;
        state.sortDirection = "asc";
    }
    
    // Update active visual classes in table headers
    updateHeaderSortIndicators();
    
    // Sort and re-render
    applySortingAndRender();
}

/**
 * Sorts locally cached filtered list and renders to table
 */
function applySortingAndRender() {
    const col = state.sortColumn;
    const dir = state.sortDirection;
    
    state.filteredCandidates.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        
        // Handle numeric experience comparison vs text fields
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
    
    renderTable();
}

/**
 * Updates UI sort icons state
 */
function updateHeaderSortIndicators() {
    const headers = {
        full_name: DOM.thName,
        college: DOM.thCollege,
        experience_years: DOM.thExperience
    };
    
    // Remove active styles
    Object.values(headers).forEach(header => {
        header.classList.remove("sort-asc", "sort-desc");
    });
    
    // Add sorting state class
    const activeHeader = headers[state.sortColumn];
    if (activeHeader) {
        activeHeader.classList.add(state.sortDirection === "asc" ? "sort-asc" : "sort-desc");
    }
}

// ==========================================================================
// DYNAMIC DOM RENDERING & STATS
// ==========================================================================

/**
 * Render database entries to candidate table
 */
function renderTable() {
    DOM.tbody.innerHTML = "";
    
    if (state.filteredCandidates.length === 0) {
        DOM.tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="7">
                    <div class="table-empty-state">
                        <i data-lucide="search-x" class="empty-state-icon"></i>
                        <h3>No Matches Found</h3>
                        <p>No candidates fit your search term "${state.searchQuery}". Try modifying your keyword or tags.</p>
                        <button class="btn btn-secondary btn-sm" id="btn-clear-search">Clear Search</button>
                    </div>
                </td>
            </tr>
        `;
        
        // Bind clear search button
        document.getElementById("btn-clear-search")?.addEventListener("click", () => {
            DOM.searchInput.value = "";
            state.searchQuery = "";
            state.filteredCandidates = [...state.candidates];
            applySortingAndRender();
        });
        
        lucide.createIcons();
        DOM.candidateCountSummary.textContent = "Showing 0 candidates";
        return;
    }
    
    // Render list
    state.filteredCandidates.forEach(candidate => {
        const tr = document.createElement("tr");
        
        // Generate skill badges
        const skillsArray = candidate.skills 
            ? candidate.skills.split(",").map(s => s.trim()).filter(s => s.length > 0)
            : [];
        const skillsHTML = skillsArray.length > 0
            ? skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join("")
            : `<span class="text-muted" style="font-size:0.75rem;">None</span>`;
            
        // Initials avatar
        const initials = candidate.full_name
            .split(" ")
            .map(n => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
            
        tr.innerHTML = `
            <td>
                <div class="candidate-meta">
                    <div class="candidate-avatar-wrap">
                        <div class="candidate-avatar">${initials}</div>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem;">ID #${candidate.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <span style="font-weight: 600; color: #ffffff;">${candidate.full_name}</span>
            </td>
            <td>
                <div class="contact-info">
                    <span class="contact-email">${candidate.email}</span>
                    <span class="contact-phone">${candidate.phone || "No phone input"}</span>
                </div>
            </td>
            <td>
                <span class="college-name">${candidate.college || '<span class="text-muted" style="font-style: italic; font-size: 0.8rem;">Not Specified</span>'}</span>
            </td>
            <td>
                <div class="skills-list">${skillsHTML}</div>
            </td>
            <td>
                <span class="exp-badge">${candidate.experience_years} ${candidate.experience_years === 1 ? 'year' : 'years'}</span>
            </td>
            <td>
                <div class="actions-cell">
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
    });
    
    // Bind action buttons click handlers
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", () => {
            const candidateId = parseInt(btn.dataset.id);
            openModal(true, candidateId);
        });
    });
    
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", () => {
            const candidateId = parseInt(btn.dataset.id);
            const candidateName = btn.dataset.name;
            deleteCandidate(candidateId, candidateName);
        });
    });
    
    // Re-create icons for new elements
    lucide.createIcons();
    
    // Update count summary
    DOM.candidateCountSummary.textContent = `Showing ${state.filteredCandidates.length} of ${state.candidates.length} candidates`;
}

/**
 * Recomputes aggregate analytics metrics locally
 */
function updateDashboardMetrics() {
    const total = state.candidates.length;
    DOM.totalCandidatesCount.textContent = total;
    
    if (total === 0) {
        DOM.avgExperienceCount.textContent = "0 yrs";
        return;
    }
    
    const sumExperience = state.candidates.reduce((sum, c) => sum + (parseInt(c.experience_years) || 0), 0);
    const avg = (sumExperience / total).toFixed(1);
    DOM.avgExperienceCount.textContent = `${avg} yrs`;
}

// ==========================================================================
// MODAL CONTROLS & FORM HELPERS
// ==========================================================================

function openModal(editMode = false, candidateId = null) {
    state.isEditing = editMode;
    state.activeEditId = candidateId;
    
    hideFormError();
    DOM.form.reset();
    
    if (editMode && candidateId !== null) {
        // Edit Mode setup
        const candidate = state.candidates.find(c => c.id === candidateId);
        if (!candidate) return;
        
        DOM.modalTitle.textContent = "Edit Candidate Profile";
        DOM.modalSubtitle.textContent = `Modify credentials for candidate ID #${candidate.id} in SQLite registry.`;
        DOM.submitBtnText.textContent = "Update Profile";
        DOM.modalIcon.className = "lucide-user-cog";
        
        // Populate form fields
        DOM.idInput.value = candidate.id;
        DOM.nameInput.value = candidate.full_name;
        DOM.emailInput.value = candidate.email;
        DOM.phoneInput.value = candidate.phone || "";
        DOM.collegeInput.value = candidate.college || "";
        DOM.experienceInput.value = candidate.experience_years;
        DOM.skillsInput.value = candidate.skills || "";
    } else {
        // Add Mode setup
        DOM.modalTitle.textContent = "Register New Candidate";
        DOM.modalSubtitle.textContent = "Register professional details into secure SQLite repository.";
        DOM.submitBtnText.textContent = "Register Candidate";
        DOM.modalIcon.className = "lucide-user-plus";
        DOM.idInput.value = "";
    }
    
    DOM.modal.classList.add("open");
    lucide.createIcons();
}

function closeModal() {
    DOM.modal.classList.remove("open");
}

function showFormError(message) {
    DOM.formErrorMessage.textContent = message;
    DOM.formErrorAlert.classList.remove("hidden");
    // Scroll error into view inside modal
    DOM.formErrorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormError() {
    DOM.formErrorAlert.classList.add("hidden");
}

// ==========================================================================
// PREMIUM FLOAT TOAST NOTIFICATIONS
// ==========================================================================

function showToast(title, text, type = "success") {
    const container = document.getElementById("toast-container");
    
    // Choose icon and classes
    let iconName = "check-circle2";
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
    
    // Trigger slide-in transition after delay
    setTimeout(() => {
        toast.classList.add("show");
    }, 50);
    
    // Automatically trigger slide-out and cleanup
    setTimeout(() => {
        toast.classList.remove("show");
        // Remove from DOM after transition completes
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4500);
}
