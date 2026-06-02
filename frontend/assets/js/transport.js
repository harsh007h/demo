const API_URL = 'http://127.0.0.1:8000/api';
let transports = [];
let currentPage = 1;
let currentSearch = '';
const token = localStorage.getItem('api_token');
const userRole = localStorage.getItem('user_role');

// Page authorization check
if (!token) {
    window.location.href = 'login.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

// DOM Elements
const transportTableBody = document.getElementById('transportTableBody');
const searchTransportInput = document.getElementById('searchTransportInput');
const searchTransportBtn = document.getElementById('searchTransportBtn');
const addTransportBtn = document.getElementById('addTransportBtn');
const transportModal = document.getElementById('transportModal');
const closeModal = document.getElementById('closeModal');
const transportForm = document.getElementById('transportForm');
const modalTitle = document.getElementById('modalTitle');
const paginationContainer = document.getElementById('paginationContainer');
const toastContainer = document.getElementById('toastContainer');
const saveTransportBtn = document.getElementById('saveTransportBtn');
const actionHeader = document.getElementById('actionHeader');

// Form Inputs
const transportIdInput = document.getElementById('transportId');
const transportNameInput = document.getElementById('transportNameInput');
const logoutBtn = document.getElementById('logoutBtn');

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
    if (!btnElement) return;
    if (isLoading) {
        btnElement.classList.add('loading');
        btnElement.disabled = true;
    } else {
        btnElement.classList.remove('loading');
        btnElement.disabled = false;
    }
}

// Configure Access UI Restrictions based on Role
function configureAccessUI() {
    if (userRole !== 'Admin') {
        // Hide add button
        if (addTransportBtn) {
            addTransportBtn.style.display = 'none';
        }
        // Hide actions header column
        if (actionHeader) {
            actionHeader.style.display = 'none';
        }
    }
}

// Fetch and Render Transports
async function loadTransports(page = 1, search = '') {
    try {
        setLoading(searchTransportBtn, true);
        
        let url = `${API_URL}/transports?page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url, { headers });
        if (response.ok) {
            const data = await response.json();
            transports = data.data; // paginated items
            renderTable(transports, data.from || 1);
            renderPagination(data);
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            window.location.href = 'login.html';
        } else {
            showToast('Failed to load transports', 'error');
        }
    } catch (error) {
        console.error('Error fetching transports:', error);
        showToast('Network error while loading transports', 'error');
    } finally {
        setLoading(searchTransportBtn, false);
    }
}

function renderTable(data, startIndex) {
    transportTableBody.innerHTML = '';
    
    // Check if column counts need to adjust for Staff/User role
    const isAdmin = (userRole === 'Admin');
    const colspanCount = isAdmin ? 4 : 3;

    if (data.length === 0) {
        transportTableBody.innerHTML = `<tr><td colspan="${colspanCount}" class="text-center">No transports found</td></tr>`;
        return;
    }
    
    data.forEach((transport, index) => {
        const tr = document.createElement('tr');
        
        // Format Created Date
        const createdDate = new Date(transport.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Build Row HTML
        let rowHTML = `
            <td><strong>${startIndex + index}</strong></td>
            <td>${transport.transport_name}</td>
            <td>${createdDate}</td>
        `;

        if (isAdmin) {
            rowHTML += `
                <td>
                    <button class="btn-icon edit-btn" onclick="openEditModal(${transport.id})">Edit</button>
                    <button class="btn-icon delete-btn" id="delBtn_${transport.id}" onclick="deleteTransport(${transport.id})">Delete</button>
                </td>
            `;
        }

        tr.innerHTML = rowHTML;
        transportTableBody.appendChild(tr);
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
        loadTransports(currentPage, currentSearch);
    };
    paginationContainer.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= meta.last_page; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${meta.current_page === i ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            loadTransports(currentPage, currentSearch);
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
        loadTransports(currentPage, currentSearch);
    };
    paginationContainer.appendChild(nextBtn);
}

// Open Modal for Add
if (addTransportBtn) {
    addTransportBtn.addEventListener('click', () => {
        if (userRole !== 'Admin') {
            showToast('Access Denied: Only Admins can add transports.', 'error');
            return;
        }
        modalTitle.textContent = 'Add New Transport';
        transportForm.reset();
        transportIdInput.value = '';
        transportModal.classList.add('show');
    });
}

// Close Modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        transportModal.classList.remove('show');
    });
}

// Open Modal for Edit
window.openEditModal = (id) => {
    if (userRole !== 'Admin') {
        showToast('Access Denied: Only Admins can edit transports.', 'error');
        return;
    }
    const transport = transports.find(t => t.id === id);
    if (!transport) return;
    
    modalTitle.textContent = 'Edit Transport';
    transportIdInput.value = transport.id;
    transportNameInput.value = transport.transport_name;
    
    transportModal.classList.add('show');
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

// Delete Transport
window.deleteTransport = async (id) => {
    if (userRole !== 'Admin') {
        showToast('Access Denied: Only Admins can delete transports.', 'error');
        return;
    }
    const confirmed = await showConfirmModal({
        title: 'Delete Transport',
        message: 'Are you sure you want to delete this transport? This action cannot be undone.'
    });
    
    if (confirmed) {
        const delBtn = document.getElementById(`delBtn_${id}`);
        if (delBtn) delBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/transports/${id}`, {
                method: 'DELETE',
                headers
            });
            
            if (response.ok || response.status === 204) {
                showToast('Transport deleted successfully!', 'success');
                loadTransports(currentPage, currentSearch);
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to delete transport.', 'error');
                if (delBtn) delBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error deleting transport:', error);
            showToast('Network error while deleting transport.', 'error');
            if (delBtn) delBtn.disabled = false;
        }
    }
};

// Form Validation
function validateForm() {
    if (!transportNameInput.value.trim()) {
        showToast('Transport Name is required.', 'error');
        return false;
    }
    return true;
}

// Handle Form Submit (Add/Edit)
transportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (userRole !== 'Admin') {
        showToast('Access Denied: Only Admins can submit data.', 'error');
        return;
    }

    if (!validateForm()) return;

    const transportData = {
        transport_name: transportNameInput.value.trim()
    };
    
    const editId = transportIdInput.value;
    setLoading(saveTransportBtn, true);
    
    try {
        let response;
        if (editId) {
            response = await fetch(`${API_URL}/transports/${editId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(transportData)
            });
        } else {
            response = await fetch(`${API_URL}/transports`, {
                method: 'POST',
                headers,
                body: JSON.stringify(transportData)
            });
        }

        const data = await response.json();

        if (response.ok || response.status === 200 || response.status === 201) {
            showToast(editId ? 'Transport updated successfully!' : 'Transport added successfully!', 'success');
            transportModal.classList.remove('show');
            loadTransports(currentPage, currentSearch);
        } else {
            console.error('Validation/Server Error:', data);
            showToast(data.message || 'Failed to save transport. Note: Name must be unique.', 'error');
        }
    } catch (error) {
        console.error('Error saving transport:', error);
        showToast('Network error while saving.', 'error');
    } finally {
        setLoading(saveTransportBtn, false);
    }
});

// Search functionality
function handleSearch() {
    currentSearch = searchTransportInput.value.trim();
    currentPage = 1; // reset to first page on search
    loadTransports(currentPage, currentSearch);
}

searchTransportBtn.addEventListener('click', handleSearch);
searchTransportInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Handle Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error logging out:', error);
    } finally {
        localStorage.removeItem('api_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        window.location.href = 'login.html';
    }
});

// Hide User Management links if active user is Staff
function configureSidebar() {
    if (userRole !== 'Admin') {
        const userNavs = document.querySelectorAll('.sidebar-nav a[href="user.html"]');
        userNavs.forEach(nav => nav.remove());
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    configureSidebar();
    configureAccessUI();
    loadTransports(currentPage, currentSearch);
});
