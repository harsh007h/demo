const API_URL = window.location.origin + '/api';
let parties = [];
let currentPage = 1;
let currentSearch = '';
const token = localStorage.getItem('api_token');
const userRole = localStorage.getItem('user_role');

// Redirect to login if no token
if (!token) {
    window.location.href = 'login.html';
}

// Redirect to dashboard if user is not Admin
if (userRole !== 'Admin') {
    alert('Access denied. Staff cannot access Party Management.');
    window.location.href = 'dashboard.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

// DOM Elements
const partyTableBody = document.getElementById('partyTableBody');
const searchPartyInput = document.getElementById('searchPartyInput');
const searchPartyBtn = document.getElementById('searchPartyBtn');
const addPartyBtn = document.getElementById('addPartyBtn');
const partyModal = document.getElementById('partyModal');
const closeModal = document.getElementById('closeModal');
const partyForm = document.getElementById('partyForm');
const modalTitle = document.getElementById('modalTitle');
const paginationContainer = document.getElementById('paginationContainer');
const toastContainer = document.getElementById('toastContainer');
const savePartyBtn = document.getElementById('savePartyBtn');

// Form Fields
const partyIdInput = document.getElementById('partyId');
const partyNameInput = document.getElementById('partyName');
const mobileInput = document.getElementById('mobile');
const stateInput = document.getElementById('state');
const cityInput = document.getElementById('city');
const pincodeInput = document.getElementById('pincode');
const addressInput = document.getElementById('address');

// Utility: Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icon = type === 'success' ? '✓' : '⚠';
    
    toast.innerHTML = `
        <div style="font-size: 18px; font-weight: bold;">${icon}</div>
        <div>${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Utility: Button Loading State
function setLoading(btnElement, isLoading) {
    if (isLoading) {
        btnElement.classList.add('loading');
        btnElement.disabled = true;
    } else {
        btnElement.classList.remove('loading');
        btnElement.disabled = false;
    }
}

// Helper to clear parties cache
function clearPartiesCache() {
    sessionStorage.removeItem('dashboard_stats_cache');
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('parties_cache_')) {
            sessionStorage.removeItem(key);
        }
    });
}

// Fetch and Render Table with Stale-While-Revalidate caching
async function loadParties(page = 1, search = '') {
    const cacheKey = `parties_cache_p${page}_s${search}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    // 0ms instant render from cache if available
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            parties = data.data; // paginated items
            renderTable(parties);
            renderPagination(data);
        } catch (e) {
            console.error('Failed to parse cached parties:', e);
        }
    } else {
        setLoading(searchPartyBtn, true);
        partyTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 40px; color: var(--text-secondary);">
                    <div class="loader" style="display: block; margin: 0 auto 12px; border-top-color: var(--primary-color);"></div>
                    <div style="font-size: 14px; font-weight: 500;">Loading parties...</div>
                </td>
            </tr>`;
    }

    try {
        let url = `${API_URL}/parties?page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url, { headers });
        if (response.ok) {
            const data = await response.json();
            parties = data.data; // paginated items
            
            // Save to cache for subsequent fast loads
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            
            // Render fresh data in the background
            renderTable(parties);
            renderPagination(data);
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        } else {
            showToast('Failed to load parties', 'error');
        }
    } catch (error) {
        console.error('Error fetching parties:', error);
        if (!cachedData) {
            showToast('Network error while loading parties', 'error');
        }
    } finally {
        setLoading(searchPartyBtn, false);
    }
}

function renderTable(data) {
    partyTableBody.innerHTML = '';
    
    if (data.length === 0) {
        partyTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No parties found</td></tr>`;
        return;
    }
    
    data.forEach(party => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${party.name}</td>
            <td>${party.mobile}</td>
            <td>${party.city}</td>
            <td>${party.state}</td>
            <td>
                <button class="btn-icon edit-btn" onclick="openEditModal(${party.id})">Edit</button>
                <button class="btn-icon delete-btn" id="delBtn_${party.id}" onclick="deleteParty(${party.id})">Delete</button>
            </td>
        `;
        partyTableBody.appendChild(tr);
    });
}

function renderPagination(meta) {
    paginationContainer.innerHTML = '';
    
    if (meta.last_page <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = meta.current_page === 1;
    prevBtn.onclick = () => {
        currentPage = meta.current_page - 1;
        loadParties(currentPage, currentSearch);
    };
    paginationContainer.appendChild(prevBtn);

    // Page Numbers (simplified, showing all for now)
    for (let i = 1; i <= meta.last_page; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${meta.current_page === i ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            loadParties(currentPage, currentSearch);
        };
        paginationContainer.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = meta.current_page === meta.last_page;
    nextBtn.onclick = () => {
        currentPage = meta.current_page + 1;
        loadParties(currentPage, currentSearch);
    };
    paginationContainer.appendChild(nextBtn);
}

// Open Modal for Add
addPartyBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New Party';
    partyForm.reset();
    partyIdInput.value = '';
    partyModal.classList.add('show');
});

// Close Modal
closeModal.addEventListener('click', () => {
    partyModal.classList.remove('show');
});

// Open Modal for Edit
window.openEditModal = (id) => {
    const party = parties.find(p => p.id === id);
    if (!party) return;
    
    modalTitle.textContent = 'Edit Party';
    partyIdInput.value = party.id;
    partyNameInput.value = party.name;
    mobileInput.value = party.mobile;
    stateInput.value = party.state;
    cityInput.value = party.city;
    pincodeInput.value = party.pincode;
    addressInput.value = party.address;
    
    partyModal.classList.add('show');
};

// Reusable Custom Confirm Modal
function showConfirmModal({ title, message, confirmText = 'Yes, Delete', cancelText = 'Cancel' }) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        
        overlay.innerHTML = `
            <div class="confirm-modal-card">
                <div class="confirm-modal-icon-container">
                    <div class="confirm-modal-icon">🗑</div>
                </div>
                <h3 class="confirm-modal-title">${title}</h3>
                <p class="confirm-modal-message">${message}</p>
                <div class="confirm-modal-buttons">
                    <button class="btn-confirm btn-confirm-cancel" id="confirmCancelBtn">${cancelText}</button>
                    <button class="btn-confirm btn-confirm-action" id="confirmActionBtn">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        const cleanup = (result) => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 300);
        };
        
        overlay.querySelector('#confirmCancelBtn').addEventListener('click', () => cleanup(false));
        overlay.querySelector('#confirmActionBtn').addEventListener('click', () => cleanup(true));
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup(false);
            }
        });
    });
}

// Delete Party
window.deleteParty = async (id) => {
    const confirmed = await showConfirmModal({
        title: 'Delete Party',
        message: 'Are you sure you want to delete this party? This action cannot be undone.'
    });
    
    if (confirmed) {
        const delBtn = document.getElementById(`delBtn_${id}`);
        if(delBtn) delBtn.disabled = true; // basic loading state for delete

        try {
            const response = await fetch(`${API_URL}/parties/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok || response.status === 204) {
                clearPartiesCache(); // Invalidate cache
                showToast('Party deleted successfully!', 'success');
                loadParties(currentPage, currentSearch);
            } else {
                showToast('Failed to delete party.', 'error');
                if(delBtn) delBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error deleting party:', error);
            showToast('Network error while deleting.', 'error');
            if(delBtn) delBtn.disabled = false;
        }
    }
};


// Form Validation
function validateForm() {
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileInput.value.trim())) {
        showToast('Mobile number must be exactly 10 digits.', 'error');
        return false;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincodeInput.value.trim())) {
        showToast('Pincode must be exactly 6 digits.', 'error');
        return false;
    }

    return true;
}

// Handle Form Submit (Add/Edit)
partyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const partyData = {
        name: partyNameInput.value.trim(),
        mobile: mobileInput.value.trim(),
        state: stateInput.value.trim(),
        city: cityInput.value.trim(),
        pincode: pincodeInput.value.trim(),
        address: addressInput.value.trim()
    };
    
    const editId = partyIdInput.value;
    setLoading(savePartyBtn, true);
    
    try {
        let response;
        if (editId) {
            // Update existing
            response = await fetch(`${API_URL}/parties/${editId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(partyData)
            });
        } else {
            // Add new
            response = await fetch(`${API_URL}/parties`, {
                method: 'POST',
                headers,
                body: JSON.stringify(partyData)
            });
        }

        if (response.ok || response.status === 201) {
            clearPartiesCache(); // Invalidate cache
            showToast(editId ? 'Party updated successfully!' : 'Party added successfully!', 'success');
            partyModal.classList.remove('show');
            loadParties(currentPage, currentSearch); // reload current page
        } else {
            const errorData = await response.json();
            console.error('Validation Error:', errorData);
            showToast(errorData.message || 'Failed to save party.', 'error');
        }
    } catch (error) {
        console.error('Error saving party:', error);
        showToast('Network error while saving.', 'error');
    } finally {
        setLoading(savePartyBtn, false);
    }
});

// Search functionality
function handleSearch() {
    currentSearch = searchPartyInput.value.trim();
    currentPage = 1; // reset to first page on new search
    loadParties(currentPage, currentSearch);
}

searchPartyBtn.addEventListener('click', handleSearch);
searchPartyInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Hide User Management for Staff
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'Admin') {
        const userNav = document.querySelectorAll('.sidebar-nav a[href="user.html"]');
        userNav.forEach(el => el.remove());
    }
    loadParties(currentPage, currentSearch);
});
