const API_URL = window.location.origin + '/api';
let users = [];
let currentPage = 1;
let currentSearch = '';
const token = localStorage.getItem('api_token');
const userRole = localStorage.getItem('user_role');

// Page authorization check
if (!token) {
    window.location.href = 'login';
}

if (userRole !== 'Admin') {
    alert('Access denied. Staff cannot access User Management.');
    window.location.href = 'dashboard';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

// DOM Elements
const userTableBody = document.getElementById('userTableBody');
const searchUserInput = document.getElementById('searchUserInput');
const searchUserBtn = document.getElementById('searchUserBtn');
const addUserBtn = document.getElementById('addUserBtn');
const userModal = document.getElementById('userModal');
const closeModal = document.getElementById('closeModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const paginationContainer = document.getElementById('paginationContainer');
const toastContainer = document.getElementById('toastContainer');
const saveUserBtn = document.getElementById('saveUserBtn');

// Form Inputs
const userIdInput = document.getElementById('userId');
const userNameInput = document.getElementById('userNameInput');
const userEmailInput = document.getElementById('userEmailInput');
const userMobileInput = document.getElementById('userMobileInput');
const userPasswordInput = document.getElementById('userPasswordInput');
const passwordNote = document.getElementById('passwordNote');
const passwordLabel = document.getElementById('passwordLabel');
const userRoleSelect = document.getElementById('userRoleSelect');
const userStatusSelect = document.getElementById('userStatusSelect');
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

// Fetch and Render Users
async function loadUsers(page = 1, search = '') {
    try {
        setLoading(searchUserBtn, true);
        userTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 40px; color: var(--text-secondary);">
                    <div class="loader" style="display: block; margin: 0 auto 12px; border-top-color: var(--primary-color);"></div>
                    <div style="font-size: 14px; font-weight: 500;">Loading users...</div>
                </td>
            </tr>`;
        
        let url = `${API_URL}/users?page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url, { headers });
        if (response.ok) {
            const data = await response.json();
            users = data.data; // paginated items
            renderTable(users);
            renderPagination(data);
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            window.location.href = 'login';
        } else if (response.status === 403) {
            showToast('Access Denied: You do not have permissions to manage users.', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard';
            }, 1500);
        } else {
            showToast('Failed to load users', 'error');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Network error while loading users', 'error');
    } finally {
        setLoading(searchUserBtn, false);
    }
}

function renderTable(data) {
    userTableBody.innerHTML = '';
    
    if (data.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No users found</td></tr>`;
        return;
    }
    
    data.forEach(user => {
        const tr = document.createElement('tr');
        
        const roleClass = user.role === 'Admin' ? 'role-admin' : 'role-staff';
        const statusClass = user.status === 'Active' ? 'status-active' : 'status-inactive';
        
        tr.innerHTML = `
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td>${user.mobile || '-'}</td>
            <td><span class="role-badge ${roleClass}">${user.role}</span></td>
            <td><span class="status-badge ${statusClass}">${user.status}</span></td>
            <td>
                <button class="btn-icon edit-btn" onclick="openEditModal(${user.id})">Edit</button>
                <button class="btn-icon delete-btn" id="delBtn_${user.id}" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
        userTableBody.appendChild(tr);
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
        loadUsers(currentPage, currentSearch);
    };
    paginationContainer.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= meta.last_page; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${meta.current_page === i ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            loadUsers(currentPage, currentSearch);
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
        loadUsers(currentPage, currentSearch);
    };
    paginationContainer.appendChild(nextBtn);
}

// Open Modal for Add
addUserBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New User';
    userForm.reset();
    userIdInput.value = '';
    userPasswordInput.required = true;
    passwordNote.style.display = 'none';
    userModal.classList.add('show');
});

// Close Modal
closeModal.addEventListener('click', () => {
    userModal.classList.remove('show');
});

// Open Modal for Edit (Reset Password / Status Updates)
window.openEditModal = (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    modalTitle.textContent = 'Edit User';
    userIdInput.value = user.id;
    userNameInput.value = user.name;
    userEmailInput.value = user.email;
    userMobileInput.value = user.mobile || '';
    userPasswordInput.value = '';
    userPasswordInput.required = false;
    passwordNote.style.display = 'block';
    userRoleSelect.value = user.role;
    userStatusSelect.value = user.status;
    
    userModal.classList.add('show');
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

// Delete User
window.deleteUser = async (id) => {
    const confirmed = await showConfirmModal({
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.'
    });
    
    if (confirmed) {
        const delBtn = document.getElementById(`delBtn_${id}`);
        if (delBtn) delBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers
            });
            
            if (response.ok || response.status === 204) {
                showToast('User deleted successfully!', 'success');
                loadUsers(currentPage, currentSearch);
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to delete user.', 'error');
                if (delBtn) delBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Network error while deleting user.', 'error');
            if (delBtn) delBtn.disabled = false;
        }
    }
};


// Form Validation
function validateForm() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmailInput.value.trim())) {
        showToast('Please enter a valid email address.', 'error');
        return false;
    }

    if (userMobileInput.value.trim()) {
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(userMobileInput.value.trim())) {
            showToast('Mobile number must be exactly 10 digits.', 'error');
            return false;
        }
    }

    const editId = userIdInput.value;
    if (!editId && userPasswordInput.value.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return false;
    }

    if (editId && userPasswordInput.value && userPasswordInput.value.length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return false;
    }

    return true;
}

// Handle Form Submit (Add/Edit)
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const userData = {
        name: userNameInput.value.trim(),
        email: userEmailInput.value.trim(),
        mobile: userMobileInput.value.trim(),
        role: userRoleSelect.value,
        status: userStatusSelect.value
    };
    
    if (userPasswordInput.value) {
        userData.password = userPasswordInput.value;
    }
    
    const editId = userIdInput.value;
    setLoading(saveUserBtn, true);
    
    try {
        let response;
        if (editId) {
            // Update existing user details, status or password
            response = await fetch(`${API_URL}/users/${editId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(userData)
            });
        } else {
            // Add new user
            response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers,
                body: JSON.stringify(userData)
            });
        }

        const data = await response.json();

        if (response.ok || response.status === 200 || response.status === 201) {
            showToast(editId ? 'User updated successfully!' : 'User added successfully!', 'success');
            userModal.classList.remove('show');
            loadUsers(currentPage, currentSearch);
        } else {
            console.error('Validation/Server Error:', data);
            showToast(data.message || 'Failed to save user.', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showToast('Network error while saving.', 'error');
    } finally {
        setLoading(saveUserBtn, false);
    }
});

// Search functionality
function handleSearch() {
    currentSearch = searchUserInput.value.trim();
    currentPage = 1; // reset to first page on search
    loadUsers(currentPage, currentSearch);
}

searchUserBtn.addEventListener('click', handleSearch);
searchUserInput.addEventListener('keyup', (e) => {
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
        // Clear all cached keys
        localStorage.removeItem('api_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        window.location.href = 'login';
    }
});

// Hide User Management links if active user is Staff (additional safeguard)
function configureSidebar() {
    if (userRole !== 'Admin') {
        const userNavs = document.querySelectorAll('.sidebar-nav a[href="user"]');
        userNavs.forEach(nav => nav.remove());
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    configureSidebar();
    loadUsers(currentPage, currentSearch);
});

