const API_URL = window.location.origin + '/api';
let stocks = [];
let currentPage = 1;
let currentSearch = '';
const token = localStorage.getItem('api_token');
const userRole = localStorage.getItem('user_role');

// Redirect to login if no token
if (!token) {
    window.location.href = '/login';
}

// Redirect to dashboard if user is not Admin
if (userRole !== 'Admin') {
    alert('Access denied. Staff cannot access Stock Management.');
    window.location.href = '/dashboard';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

// DOM Elements
const stockTableBody = document.getElementById('stockTableBody');
const searchStockInput = document.getElementById('searchStockInput');
const searchStockBtn = document.getElementById('searchStockBtn');
const addStockBtn = document.getElementById('addStockBtn');
const stockModal = document.getElementById('stockModal');
const closeModal = document.getElementById('closeModal');
const stockForm = document.getElementById('stockForm');
const modalTitle = document.getElementById('modalTitle');
const paginationContainer = document.getElementById('paginationContainer');
const toastContainer = document.getElementById('toastContainer');
const saveStockBtn = document.getElementById('saveStockBtn');
const lowStockBanner = document.getElementById('lowStockBanner');
const lowStockBannerText = document.getElementById('lowStockBannerText');
const dismissBanner = document.getElementById('dismissBanner');
const logoutBtn = document.getElementById('logoutBtn');

// Form Fields
const stockIdInput = document.getElementById('stockId');
const productNameInput = document.getElementById('productName');
const productSizeInput = document.getElementById('productSize');
const quantityInput = document.getElementById('quantity');

// Utility: Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '⚠';
    
    toast.innerHTML = `
        <div style="font-size: 18px; font-weight: bold;">${icon}</div>
        <div>${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
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

// Fetch and Check Stats for Low Stock Alerts
async function checkStats() {
    try {
        const response = await fetch(`${API_URL}/stocks/stats`, { headers });
        if (response.ok) {
            const stats = await response.json();
            if (stats.low_stock_count > 0) {
                lowStockBannerText.textContent = `Warning: There are ${stats.low_stock_count} item(s) running low on stock (Quantity < 10)!`;
                lowStockBanner.classList.add('show');
            } else {
                lowStockBanner.classList.remove('show');
            }
        }
    } catch (error) {
        console.error('Error fetching stock stats:', error);
    }
}

// Helper to clear stocks cache
function clearStocksCache() {
    sessionStorage.removeItem('dashboard_stats_cache');
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('stocks_cache_')) {
            sessionStorage.removeItem(key);
        }
    });
}

// Fetch and Render Table with Stale-While-Revalidate caching
async function loadStocks(page = 1, search = '') {
    const cacheKey = `stocks_cache_p${page}_s${search}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            stocks = data.data; // paginated items
            renderTable(stocks);
            renderPagination(data);
        } catch (e) {
            console.error('Failed to parse cached stocks:', e);
        }
    } else {
        setLoading(searchStockBtn, true);
        stockTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 40px; color: var(--text-secondary);">
                    <div class="loader" style="display: block; margin: 0 auto 12px; border-top-color: var(--primary-color);"></div>
                    <div style="font-size: 14px; font-weight: 500;">Loading stocks...</div>
                </td>
            </tr>`;
    }

    try {
        let url = `${API_URL}/stocks?page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        const response = await fetch(url, { headers });
        if (response.ok) {
            const data = await response.json();
            stocks = data.data; // paginated items
            
            // Save to cache for subsequent fast loads
            sessionStorage.setItem(cacheKey, JSON.stringify(data));

            renderTable(stocks);
            renderPagination(data);
            await checkStats(); // Check stats dynamically on each load
        } else if (response.status === 401) {
            localStorage.removeItem('api_token'); localStorage.removeItem('user_role'); localStorage.removeItem('user_name');
            window.location.href = '/login';
        } else {
            showToast('Failed to load stocks', 'error');
        }
    } catch (error) {
        console.error('Error fetching stocks:', error);
        if (!cachedData) {
            showToast('Network error while loading stocks', 'error');
        }
    } finally {
        setLoading(searchStockBtn, false);
    }
}

function renderTable(data) {
    stockTableBody.innerHTML = '';
    
    if (data.length === 0) {
        stockTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No stock records found</td></tr>`;
        return;
    }
    
    data.forEach(stock => {
        const tr = document.createElement('tr');
        const isLow = stock.quantity < 10;
        const statusBadge = isLow 
            ? `<span class="status-badge status-low">Low Stock</span>`
            : `<span class="status-badge status-ok">In Stock</span>`;
            
        tr.innerHTML = `
            <td><strong>${stock.product_name || '-'}</strong></td>
            <td><strong>${stock.product_size}</strong></td>
            <td>
                <span style="font-size: 16px; font-weight: 600; color: ${isLow ? 'var(--error-color)' : '#ffffff'}">
                    ${stock.quantity}
                </span>
            </td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-icon edit-btn" onclick="openEditModal(${stock.id})">Edit</button>
                <button class="btn-icon delete-btn" id="delBtn_${stock.id}" onclick="deleteStock(${stock.id})">Delete</button>
            </td>
        `;
        stockTableBody.appendChild(tr);
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
        loadStocks(currentPage, currentSearch);
    };
    paginationContainer.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= meta.last_page; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${meta.current_page === i ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            loadStocks(currentPage, currentSearch);
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
        loadStocks(currentPage, currentSearch);
    };
    paginationContainer.appendChild(nextBtn);
}

// Open Modal for Add
addStockBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New Stock';
    stockForm.reset();
    stockIdInput.value = '';
    if (productNameInput) {
        productNameInput.disabled = false;
        productNameInput.value = '';
    }
    productSizeInput.disabled = false; // Allow size typing on creation
    stockModal.classList.add('show');
});

// Close Modal
closeModal.addEventListener('click', () => {
    stockModal.classList.remove('show');
});

// Open Modal for Edit
window.openEditModal = (id) => {
    const stock = stocks.find(s => s.id === id);
    if (!stock) return;
    
    modalTitle.textContent = 'Edit Stock';
    stockIdInput.value = stock.id;
    if (productNameInput) {
        productNameInput.value = stock.product_name || '';
        productNameInput.disabled = false;
    }
    productSizeInput.value = stock.product_size;
    productSizeInput.disabled = false; // keep it enabled, or disabled if they shouldn't change sizes. Let's keep it editable.
    quantityInput.value = stock.quantity;
    
    stockModal.classList.add('show');
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

// Delete Stock
window.deleteStock = async (id) => {
    const confirmed = await showConfirmModal({
        title: 'Delete Stock Record',
        message: 'Are you sure you want to delete this stock record? This action cannot be undone.'
    });
    
    if (confirmed) {
        const delBtn = document.getElementById(`delBtn_${id}`);
        if (delBtn) delBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/stocks/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok || response.status === 204) {
                clearStocksCache();
                showToast('Stock record deleted successfully!', 'success');
                loadStocks(currentPage, currentSearch);
            } else {
                showToast('Failed to delete stock record.', 'error');
                if (delBtn) delBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error deleting stock:', error);
            showToast('Network error while deleting.', 'error');
            if (delBtn) delBtn.disabled = false;
        }
    }
};


// Handle Form Submit (Add/Edit)
stockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const stockData = {
        product_name: productNameInput.value.trim(),
        product_size: productSizeInput.value.trim(),
        quantity: parseInt(quantityInput.value)
    };
    
    const editId = stockIdInput.value;
    setLoading(saveStockBtn, true);
    
    try {
        let response;
        if (editId) {
            // Update existing
            response = await fetch(`${API_URL}/stocks/${editId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(stockData)
            });
        } else {
            // Add new
            response = await fetch(`${API_URL}/stocks`, {
                method: 'POST',
                headers,
                body: JSON.stringify(stockData)
            });
        }

        if (response.ok || response.status === 201) {
            clearStocksCache();
            showToast(editId ? 'Stock updated successfully!' : 'Stock added successfully!', 'success');
            stockModal.classList.remove('show');
            loadStocks(currentPage, currentSearch);
        } else {
            const errorData = await response.json();
            console.error('Validation Error:', errorData);
            showToast(errorData.message || 'Failed to save stock.', 'error');
        }
    } catch (error) {
        console.error('Error saving stock:', error);
        showToast('Network error while saving.', 'error');
    } finally {
        setLoading(saveStockBtn, false);
    }
});

// Search functionality
function handleSearch() {
    currentSearch = searchStockInput.value.trim();
    currentPage = 1;
    loadStocks(currentPage, currentSearch);
}

searchStockBtn.addEventListener('click', handleSearch);
searchStockInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Dismiss Low Stock Banner
dismissBanner.addEventListener('click', () => {
    lowStockBanner.classList.remove('show');
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
        localStorage.removeItem('api_token'); localStorage.removeItem('user_role'); localStorage.removeItem('user_name');
        window.location.href = '/login';
    }
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Hide User Management for Staff
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'Admin') {
        const userNav = document.querySelectorAll('.sidebar-nav a[href="user"]');
        userNav.forEach(el => el.remove());
    }
    loadStocks(currentPage, currentSearch);
});

