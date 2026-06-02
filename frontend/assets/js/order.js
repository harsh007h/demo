const API_URL = 'http://127.0.0.1:8000/api';
const token = localStorage.getItem('api_token');

// Redirect to login if no token
if (!token) {
    window.location.href = 'login.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

// State Variables
let parties = [];
let currentFilteredParties = [];
let orders = [];
let availableStocks = [];
let currentPage = 1;
let currentSearch = '';
let currentStatus = '';

// DOM Elements - List & Filter View
const orderTableBody = document.getElementById('orderTableBody');
const searchOrderInput = document.getElementById('searchOrderInput');
const searchOrderBtn = document.getElementById('searchOrderBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const addOrderBtn = document.getElementById('addOrderBtn');
const paginationContainer = document.getElementById('paginationContainer');
const toastContainer = document.getElementById('toastContainer');

// DOM Elements - Modal & Form View
const orderModal = document.getElementById('orderModal');
const closeModal = document.getElementById('closeModal');
const orderForm = document.getElementById('orderForm');
const modalTitle = document.getElementById('modalTitle');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const printOrderBtn = document.getElementById('printOrderBtn');
const addPartyRedirectBtn = document.getElementById('addPartyRedirectBtn');

// Form Fields
const orderIdInput = document.getElementById('orderId');
const orderDateInput = document.getElementById('orderDate');
const partyNameSelect = document.getElementById('partyName');
const stateInput = document.getElementById('state');
const cityInput = document.getElementById('city');
const pincodeInput = document.getElementById('pincode');
const addressInput = document.getElementById('address');
const transportNameInput = document.getElementById('transportName');
const transportNumberInput = document.getElementById('transportNumber');
const mobileInput = document.getElementById('mobile');
const paymentMethodSelect = document.getElementById('paymentMethod');
const notesTextarea = document.getElementById('notes');

const addProductBtn = document.getElementById('addProductBtn');
const productList = document.getElementById('productList');

// Step Navigation
const step1Container = document.getElementById('step1Container');
const step2Container = document.getElementById('step2Container');
const nextStepBtn = document.getElementById('nextStepBtn');
const prevStepBtn = document.getElementById('prevStepBtn');

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

// Load Parties for Dropdown
async function loadParties() {
    try {
        const response = await fetch(`${API_URL}/parties?per_page=100`, { headers });
        if (response.ok) {
            const data = await response.json();
            parties = data.data || data; // Handle paginated or flat data
            
            // Clear current options (except placeholder)
            partyNameSelect.innerHTML = '<option value="" disabled selected>Select Party</option>';
            
            parties.forEach(party => {
                const option = document.createElement('option');
                option.value = party.id;
                option.textContent = `${party.name} (${party.mobile} - ${party.city})`;
                partyNameSelect.appendChild(option);
            });

            // Initialize custom searchable dropdown
            renderCustomPartyDropdown(parties);
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching parties:', error);
        showToast('Failed to load party list', 'error');
    }
}

// Load Transports for Dropdown
async function loadTransports() {
    try {
        const response = await fetch(`${API_URL}/transports?per_page=200`, { headers });
        if (response.ok) {
            const data = await response.json();
            const transportList = data.data || data; // Handle paginated or flat data
            
            // Clear current options (except placeholder)
            if (transportNameInput) {
                transportNameInput.innerHTML = '<option value="" disabled selected>Select Transport</option>';
                
                transportList.forEach(transport => {
                    const option = document.createElement('option');
                    option.value = transport.transport_name;
                    option.textContent = transport.transport_name;
                    transportNameInput.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error fetching transports:', error);
        showToast('Failed to load transport list', 'error');
    }
}

// Render Custom Dropdown Items
function renderCustomPartyDropdown(list) {
    const partyDropdown = document.getElementById('partyDropdown');
    if (!partyDropdown) return;
    
    currentFilteredParties = list; // Update global filtered list reference
    partyDropdown.innerHTML = '';
    
    if (list.length === 0) {
        partyDropdown.innerHTML = '<div style="padding: 12px 14px; color: var(--text-secondary); text-align: center; font-size: 13px;">No parties found</div>';
        return;
    }
    
    list.forEach(party => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.value = party.id;
        item.innerHTML = `
            <div style="font-weight: 600; color: white; font-size: 14px;">${party.name}</div>
            <div class="sub-text" style="font-size: 11px; margin-top: 4px; color: var(--text-secondary);">${party.mobile} • ${party.city}</div>
        `;
        
        item.addEventListener('click', () => {
            selectParty(party);
        });
        
        partyDropdown.appendChild(item);
    });
}

// Handle Party Selection
function selectParty(party) {
    const partySearchInput = document.getElementById('partySearchInput');
    const partyDropdown = document.getElementById('partyDropdown');
    
    if (party) {
        partySearchInput.value = `${party.name} (${party.mobile})`;
        partyNameSelect.value = party.id;
    } else {
        partySearchInput.value = '';
        partyNameSelect.value = '';
    }
    
    // Trigger change event to autofill other fields
    partyNameSelect.dispatchEvent(new Event('change'));
    
    if (partyDropdown) {
        partyDropdown.style.display = 'none';
    }
}

// Auto-fill party details when selected
partyNameSelect.addEventListener('change', (e) => {
    const selectedParty = parties.find(p => p.id == e.target.value);
    if (selectedParty) {
        mobileInput.value = selectedParty.mobile || '';
        stateInput.value = selectedParty.state || '';
        cityInput.value = selectedParty.city || '';
        pincodeInput.value = selectedParty.pincode || '';
        addressInput.value = selectedParty.address || '';
    } else {
        clearPartyFields();
    }
});

// Setup searchable select search input event listeners
document.addEventListener('DOMContentLoaded', () => {
    const partySearchInput = document.getElementById('partySearchInput');
    const partyDropdown = document.getElementById('partyDropdown');
    let activeIndex = -1;
    
    if (partySearchInput && partyDropdown) {
        partySearchInput.addEventListener('focus', () => {
            partyDropdown.style.display = 'block';
            activeIndex = -1;
            // Show all options initially on focus
            renderCustomPartyDropdown(parties);
        });
        
        partySearchInput.addEventListener('input', (e) => {
            activeIndex = -1;
            const query = e.target.value.toLowerCase().trim();
            
            if (query === '') {
                partyNameSelect.value = '';
                partyNameSelect.dispatchEvent(new Event('change'));
                renderCustomPartyDropdown(parties);
                partyDropdown.style.display = 'block';
                return;
            }
            
            const filtered = parties.filter(party => {
                const name = (party.name || '').toLowerCase();
                const mobile = (party.mobile || '').toLowerCase();
                const city = (party.city || '').toLowerCase();
                return name.includes(query) || mobile.includes(query) || city.includes(query);
            });
            
            renderCustomPartyDropdown(filtered);
            partyDropdown.style.display = 'block';
        });

        // Keyboard Navigation (Arrow keys & Enter)
        partySearchInput.addEventListener('keydown', (e) => {
            const items = partyDropdown.querySelectorAll('.dropdown-item');
            
            if (e.key === 'ArrowDown') {
                if (items.length === 0) return;
                e.preventDefault();
                partyDropdown.style.display = 'block';
                activeIndex = (activeIndex + 1) % items.length;
                updateActiveHighlight(items);
            } else if (e.key === 'ArrowUp') {
                if (items.length === 0) return;
                e.preventDefault();
                partyDropdown.style.display = 'block';
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                updateActiveHighlight(items);
            } else if (e.key === 'Enter') {
                e.preventDefault(); // Stop default form submit
                
                if (activeIndex >= 0 && activeIndex < currentFilteredParties.length) {
                    selectParty(currentFilteredParties[activeIndex]);
                } else if (currentFilteredParties.length > 0) {
                    // Fallback: select the first matching item in the list
                    selectParty(currentFilteredParties[0]);
                }
                activeIndex = -1;
            } else if (e.key === 'Escape') {
                partyDropdown.style.display = 'none';
                activeIndex = -1;
            }
        });
        
        function updateActiveHighlight(items) {
            items.forEach((item, idx) => {
                if (idx === activeIndex) {
                    item.classList.add('active');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('active');
                }
            });
        }
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.searchable-select-wrapper')) {
                partyDropdown.style.display = 'none';
                activeIndex = -1;
            }
        });
    }
});

function clearPartyFields() {
    mobileInput.value = '';
    stateInput.value = '';
    cityInput.value = '';
    pincodeInput.value = '';
    addressInput.value = '';
}

// Redirect to add party page in a new tab
if (addPartyRedirectBtn) {
    addPartyRedirectBtn.addEventListener('click', () => {
        window.open('party.html', '_blank');
    });
}

// Fetch available stock levels from Stock module
let stocksPromise = null;
function loadAvailableStocks(forceRefresh = false) {
    if (stocksPromise && !forceRefresh) {
        return stocksPromise;
    }
    stocksPromise = (async () => {
        try {
            const response = await fetch(`${API_URL}/stocks?per_page=100`, { headers });
            if (response.ok) {
                const data = await response.json();
                availableStocks = data.data || [];
                // Update dropdown options if they are already rendered in the modal
                updateProductDropdowns();
            }
        } catch (error) {
            console.error('Error fetching available stocks:', error);
        }
        return availableStocks;
    })();
    return stocksPromise;
}

// Update visible product dropdowns in the modal
function updateProductDropdowns() {
    const selects = productList.querySelectorAll('.serialNo');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = getProductOptionHTML(currentValue);
    });
}

// Generate product options dynamically from Stock module
function getProductOptionHTML(selectedProduct = '') {
    let optionsHTML = '';
    
    // Add placeholder option
    optionsHTML += `<option value="" disabled ${!selectedProduct ? 'selected' : ''}>Select Product</option>`;
    
    // Get unique product names from availableStocks
    const uniqueProductNames = [...new Set(availableStocks.map(s => s.product_name).filter(Boolean))];
    
    uniqueProductNames.forEach(prodVal => {
        const isSelected = selectedProduct && prodVal.toUpperCase() === selectedProduct.toUpperCase();
        optionsHTML += `<option value="${prodVal}" ${isSelected ? 'selected' : ''}>${prodVal}</option>`;
    });

    return optionsHTML;
}

// Generate static size options
function getSizeOptionHTML(productName = '', selectedSize = '') {
    const lowerName = String(productName || '').toLowerCase();
    let sizes = ['M', 'L', 'XL', 'XXL']; // default sizes
    if (lowerName.includes('shirt')) {
        sizes = ['M', 'L', 'XL', 'XXL'];
    } else if (lowerName.includes('jeans')) {
        sizes = ['32', '34', '36'];
    }
    
    let optionsHTML = '';
    
    optionsHTML += `<option value="" disabled ${!selectedSize ? 'selected' : ''}>Select Size</option>`;
    
    sizes.forEach(sizeVal => {
        const isSelected = selectedSize && sizeVal.toString().toUpperCase() === selectedSize.toString().toUpperCase();
        optionsHTML += `<option value="${sizeVal}" ${isSelected ? 'selected' : ''}>${sizeVal}</option>`;
    });
    
    return optionsHTML;
}

// Dynamic Products Logic (Add blank row)
function createBlankProductRow(serial = '', size = '', pieces = '') {
    const row = document.createElement('div');
    row.className = 'product-row';
    row.style.cssText = 'display: flex; gap: 16px; margin-bottom: 16px; align-items: center;';
    
    row.innerHTML = `
        <div style="flex: 2;">
            <select class="serialNo" required style="margin-bottom: 0;">
                ${getProductOptionHTML(serial)}
            </select>
        </div>
        <div style="flex: 1;">
            <select class="size" required style="margin-bottom: 0;">
                ${getSizeOptionHTML(serial, size)}
            </select>
        </div>
        <div style="flex: 1;">
            <input type="number" class="pieces" required placeholder="Pieces Number" value="${pieces}" min="1" style="margin-bottom: 0;">
        </div>
        <div>
            <button type="button" class="btn remove-product-btn" style="background: #ef4444; width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; border: none; flex-shrink: 0;">X</button>
        </div>
    `;
    productList.appendChild(row);
}

addProductBtn.addEventListener('click', () => {
    createBlankProductRow();
});

// Remove Product Row
productList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-product-btn')) {
        const rows = productList.querySelectorAll('.product-row');
        if (rows.length > 1) {
            e.target.closest('.product-row').remove();
        } else {
            showToast('At least one product is required.', 'error');
        }
    }
});

// Update sizes dynamically based on selected product (Shirt vs Jeans)
productList.addEventListener('change', (e) => {
    if (e.target.classList.contains('serialNo')) {
        const row = e.target.closest('.product-row');
        if (row) {
            const sizeSelect = row.querySelector('.size');
            if (sizeSelect) {
                const productName = e.target.value;
                const currentSelectedSize = sizeSelect.value;
                sizeSelect.innerHTML = getSizeOptionHTML(productName, currentSelectedSize);
            }
        }
    }
});

// Step Navigation Logic
nextStepBtn.addEventListener('click', () => {
    const requiredInputs = step1Container.querySelectorAll('input[required], select[required]');
    let isValid = true;
    for (const input of requiredInputs) {
        const parentEditOnly = input.closest('.edit-only-field');
        if (parentEditOnly && parentEditOnly.style.display === 'none') {
            continue;
        }
        if (!input.checkValidity()) {
            input.reportValidity();
            isValid = false;
            break;
        }
    }
    if (isValid) {
        step1Container.style.display = 'none';
        step2Container.style.display = 'block';
    }
});

prevStepBtn.addEventListener('click', () => {
    step1Container.style.display = 'block';
    step2Container.style.display = 'none';
});

// Helper to clear orders cache
function clearOrdersCache() {
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('orders_cache_')) {
            sessionStorage.removeItem(key);
        }
    });
}

// Fetch and Render Orders Table with Stale-While-Revalidate caching
async function loadOrders(page = 1, search = '', status = '') {
    const cacheKey = `orders_cache_p${page}_s${search}_st${status}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    // 0ms instant render from cache if available
    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            orders = data.data; // paginated items
            renderTable(orders);
            renderPagination(data);
        } catch (e) {
            console.error('Failed to parse cached orders:', e);
        }
    } else {
        setLoading(searchOrderBtn, true);
        orderTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center" style="padding: 40px; color: var(--text-secondary);">
                    <div class="loader" style="display: block; margin: 0 auto 12px; border-top-color: var(--primary-color);"></div>
                    <div style="font-size: 14px; font-weight: 500;">Loading orders...</div>
                </td>
            </tr>`;
    }

    try {
        let url = `${API_URL}/orders?page=${page}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        if (status) {
            url += `&status=${encodeURIComponent(status)}`;
        }

        const response = await fetch(url, { headers });
        if (response.ok) {
            const data = await response.json();
            orders = data.data; // paginated items
            
            // Save to cache for subsequent fast loads
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
            
            // Render fresh data in the background
            renderTable(orders);
            renderPagination(data);
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        } else {
            showToast('Failed to load orders', 'error');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        if (!cachedData) {
            showToast('Network error while loading orders', 'error');
        }
    } finally {
        setLoading(searchOrderBtn, false);
    }
}

function renderTable(data) {
    orderTableBody.innerHTML = '';
    
    if (data.length === 0) {
        orderTableBody.innerHTML = `<tr><td colspan="4" class="text-center">No orders found</td></tr>`;
        return;
    }
    
    data.forEach(order => {
        const tr = document.createElement('tr');
        
        // Party sub-details
        const partyName = order.party ? order.party.name : 'Unknown Party';
        const partySub = order.party ? `${order.party.mobile} • ${order.party.city}` : 'No Details';
        
        // Format Date nicely
        let formattedDate = order.order_date;
        try {
            const d = new Date(order.order_date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
        } catch(e) {}

        tr.innerHTML = `
            <td>
                <div style="font-weight: 600; color: white;">${partyName}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${partySub}</div>
            </td>
            <td>${formattedDate}</td>
            <td>
                <div style="font-weight: 500;">${order.transport_name || '-'}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${order.transport_number || '-'}</div>
            </td>
            <td>
                <button class="btn-icon edit-btn" onclick="openEditModal(${order.id})">Edit</button>
                <button class="btn-icon" style="color: #10b981; background: rgba(16, 185, 129, 0.1);" onclick="printOrderDirect(${order.id})">Print</button>
                <button class="btn-icon delete-btn" id="delBtn_${order.id}" onclick="deleteOrder(${order.id})">Delete</button>
            </td>
        `;
        orderTableBody.appendChild(tr);
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
        loadOrders(currentPage, currentSearch, currentStatus);
    };
    paginationContainer.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= meta.last_page; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${meta.current_page === i ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            loadOrders(currentPage, currentSearch, currentStatus);
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
        loadOrders(currentPage, currentSearch, currentStatus);
    };
    paginationContainer.appendChild(nextBtn);
}

let datasetsLoaded = false;
async function loadModalDatasets() {
    if (datasetsLoaded) {
        return;
    }
    
    // Show a loading text in select dropdowns while fetching in background
    if (partyNameSelect) partyNameSelect.innerHTML = '<option value="" disabled selected>Loading parties...</option>';
    if (transportNameInput) transportNameInput.innerHTML = '<option value="" disabled selected>Loading transports...</option>';
    
    await Promise.all([
        loadParties(),
        loadAvailableStocks(true),
        loadTransports()
    ]);
    datasetsLoaded = true;
}

// Reset form and set default date
function resetOrderForm() {
    orderForm.reset();
    orderIdInput.value = '';
    
    // Reset to Step 1
    step1Container.style.display = 'block';
    step2Container.style.display = 'none';
    
    // Set default date to today
    const today = new Date();
    orderDateInput.valueAsDate = today;
    
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    orderDateInput.min = `${yyyy}-${mm}-${dd}`;
    
    // Clear product list and put one empty row
    productList.innerHTML = '';
    createBlankProductRow();
    
    clearPartyFields();

    // Reset searchable select dropdown
    const partySearchInput = document.getElementById('partySearchInput');
    if (partySearchInput) {
        partySearchInput.value = '';
    }
    renderCustomPartyDropdown(parties);
}

// Open Modal for Add
addOrderBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Create New Order';
    // Hide edit-only fields when creating a new order
    document.querySelectorAll('.edit-only-field').forEach(el => el.style.display = 'none');
    
    // Trigger modal dataset loading in parallel
    loadModalDatasets();
    
    resetOrderForm();
    orderModal.classList.add('show');
});

// Close Modal
closeModal.addEventListener('click', () => {
    orderModal.classList.remove('show');
});

// Open Modal for Edit
window.openEditModal = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    // Reset to Step 1 when editing
    step1Container.style.display = 'block';
    step2Container.style.display = 'none';
    
    // Show edit-only fields when editing an order
    document.querySelectorAll('.edit-only-field').forEach(el => el.style.display = 'block');
    
    modalTitle.textContent = 'Edit Order';
    orderIdInput.value = order.id;
    orderDateInput.value = order.order_date;
    
    // Wait for the modal datasets to load completely before setting edit values
    await loadModalDatasets();
    
    // Select party and fill fields
    partyNameSelect.value = order.party_id;

    // Set searchable select value on edit
    const selectedParty = parties.find(p => p.id == order.party_id);
    const partySearchInput = document.getElementById('partySearchInput');
    if (partySearchInput) {
        if (selectedParty) {
            partySearchInput.value = `${selectedParty.name} (${selectedParty.mobile})`;
        } else {
            partySearchInput.value = '';
        }
    }
    
    mobileInput.value = order.party ? order.party.mobile : '';
    stateInput.value = order.party ? order.party.state : '';
    cityInput.value = order.party ? order.party.city : '';
    pincodeInput.value = order.party ? order.party.pincode : '';
    addressInput.value = order.party ? order.party.address : '';
    
    transportNameInput.value = order.transport_name || '';
    transportNumberInput.value = order.transport_number || '';
    paymentMethodSelect.value = order.payment_method;
    notesTextarea.value = order.notes || '';
    
    // Clear and populate products
    productList.innerHTML = '';
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            createBlankProductRow(item.serial_no, item.size, item.pieces);
        });
    } else {
        createBlankProductRow();
    }
    
    orderModal.classList.add('show');
};

// Generate Beautiful Custom Printable Receipt HTML
function updatePrintLayout(data) {
    const container = document.getElementById('printableOrderReceipt');
    if (!container) return;
    
    // Format Date
    let formattedDate = data.order_date;
    try {
        const d = new Date(data.order_date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        formattedDate = `${day}-${month}-${year}`;
    } catch(e) {}

    // Calculate total pieces
    const totalPieces = data.items.reduce((sum, item) => sum + (parseInt(item.pieces, 10) || 0), 0);

    // Build items rows
    let itemsHTML = '';
    data.items.forEach((item, index) => {
        itemsHTML += `
            <tr>
                <td style="width: 8%; text-align: center;">${index + 1}</td>
                <td style="font-weight: 600;">${item.serial_no}</td>
                <td style="width: 15%; text-align: center; font-weight: 600;">${item.size}</td>
                <td style="width: 20%; text-align: right; font-weight: 600; padding-right: 24px;">${item.pieces}</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="invoice-header">
            <div class="invoice-logo-title">
                <h1>ORDER RECEIPT</h1>
                <p>Order Information & Dispatch Slip</p>
            </div>
            <div class="invoice-details">
                <h2>ORDER #${data.id}</h2>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Status:</strong> Pending</p>
            </div>
        </div>
        
        <div class="invoice-grid">
            <div class="invoice-col">
                <h3>Billed To (Customer)</h3>
                <p><strong>Name:</strong> ${data.party_name}</p>
                <p><strong>Mobile:</strong> ${data.mobile || '-'}</p>
                <p><strong>Address:</strong> ${data.address || '-'}</p>
                <p><strong>City/State:</strong> ${data.city || '-'} / ${data.state || '-'} ${data.pincode ? `(${data.pincode})` : ''}</p>
            </div>
            <div class="invoice-col">
                <h3>Transport & Payment</h3>
                <p><strong>Transport:</strong> ${data.transport_name || '-'}</p>
                ${data.transport_number ? `<p><strong>Vehicle No:</strong> ${data.transport_number}</p>` : ''}
                <p><strong>Payment Method:</strong> ${data.payment_method || '-'}</p>
            </div>
        </div>
        
        <table class="invoice-table">
            <thead>
                <tr>
                    <th style="text-align: center;">Sr No.</th>
                    <th>Product Details</th>
                    <th style="text-align: center;">Size</th>
                    <th style="text-align: right; padding-right: 24px;">Pieces</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right; font-weight: 700; padding-right: 20px;">Total Qty (Pieces):</td>
                    <td style="text-align: right; font-weight: 700; padding-right: 24px;">${totalPieces}</td>
                </tr>
            </tbody>
        </table>
        
        ${data.notes ? `
        <div class="invoice-notes">
            <h4>Additional Notes / Instructions</h4>
            <p>${data.notes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
        
        <div class="invoice-footer">
            <div>
                <p>Thank you for your business!</p>
                <p style="font-size: 10px; margin-top: 5px;">Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-title">Authorized Signatory</div>
            </div>
        </div>
    `;
}

// Print Directly from list row
window.printOrderDirect = (id) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    // Build direct printable layout data structure without opening modal
    const items = (order.items || []).map(item => ({
        serial_no: item.serial_no,
        size: item.size,
        pieces: item.pieces
    }));
    
    const printData = {
        id: order.id,
        order_date: order.order_date,
        party_name: order.party ? order.party.name : 'Unknown Party',
        mobile: order.party ? order.party.mobile : '',
        state: order.party ? order.party.state : '',
        city: order.party ? order.party.city : '',
        pincode: order.party ? order.party.pincode : '',
        address: order.party ? order.party.address : '',
        transport_name: order.transport_name || '',
        transport_number: order.transport_number || '',
        payment_method: order.payment_method || 'Cash',
        notes: order.notes || '',
        items: items
    };
    
    updatePrintLayout(printData);
    
    // Wait briefly for UI to draw print layout, then print
    setTimeout(() => {
        window.print();
    }, 50);
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

// Delete Order
window.deleteOrder = async (id) => {
    const confirmed = await showConfirmModal({
        title: 'Delete Order',
        message: 'Are you sure you want to delete this order? This action cannot be undone.'
    });
    
    if (confirmed) {
        const delBtn = document.getElementById(`delBtn_${id}`);
        if (delBtn) delBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/orders/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok) {
                clearOrdersCache(); // Invalidate cache
                showToast('Order deleted successfully!', 'success');
                loadOrders(currentPage, currentSearch, currentStatus);
            } else {
                showToast('Failed to delete order.', 'error');
                if (delBtn) delBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            showToast('Network error while deleting.', 'error');
            if (delBtn) delBtn.disabled = false;
        }
    }
};


// Form Validation
function validateForm() {
    if (!partyNameSelect.value) {
        showToast('Please select a Party.', 'error');
        return false;
    }
    if (!mobileInput.value.trim()) {
        showToast('Mobile number is required.', 'error');
        return false;
    }
    
    // Check product rows
    const rows = productList.querySelectorAll('.product-row');
    if (rows.length === 0) {
        showToast('At least one product is required.', 'error');
        return false;
    }
    
    let valid = true;
    rows.forEach(row => {
        const serialSelected = row.querySelector('.serialNo').value;
        const pieces = parseInt(row.querySelector('.pieces').value, 10);
        const sizeSelected = row.querySelector('.size').value;
        
        if (!serialSelected) {
            showToast('Product is required for all product rows.', 'error');
            valid = false;
            return;
        }
        if (!sizeSelected) {
            showToast('Please select a size for all product rows.', 'error');
            valid = false;
            return;
        }
        if (!pieces || pieces < 1) {
            showToast('Pieces must be greater than or equal to 1.', 'error');
            valid = false;
            return;
        }

        // Validate stock quantity using the selected product name and selected size
        // (Bypassed to allow orders to be saved successfully even with shortage, creating admin notifications)
        /*
        const stockItem = availableStocks.find(s => 
            s.product_name && s.product_name.toUpperCase() === serialSelected.toUpperCase() &&
            s.product_size && s.product_size.toUpperCase() === sizeSelected.toUpperCase()
        );
        const availableQty = stockItem ? stockItem.quantity : 0;
        if (pieces > availableQty) {
            showToast(`Error: Product "${serialSelected}" (Size: ${sizeSelected}) only has ${availableQty} pieces in stock, but you entered ${pieces}.`, 'error');
            valid = false;
        }
        */
    });

    return valid;
}

// Handle Form Submit (Add/Edit)
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Collect products
    const products = [];
    document.querySelectorAll('.product-row').forEach(row => {
        products.push({
            serial_no: row.querySelector('.serialNo').value.trim(),
            size: row.querySelector('.size').value,
            pieces: parseInt(row.querySelector('.pieces').value, 10)
        });
    });

    const editId = orderIdInput.value;

    const orderData = {
        order_date: orderDateInput.value,
        party_id: partyNameSelect.value,
        products: products,
        transport_name: transportNameInput.value.trim(),
        transport_number: transportNumberInput.value.trim(),
        payment_method: paymentMethodSelect.value,
        status: editId ? (orders.find(o => o.id == editId)?.status || 'Pending') : 'Pending',
        notes: notesTextarea.value.trim()
    };
    
    setLoading(saveOrderBtn, true);
    
    try {
        let response;
        if (editId) {
            // Update existing
            response = await fetch(`${API_URL}/orders/${editId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(orderData)
            });
        } else {
            // Add new
            response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(orderData)
            });
        }

        if (response.ok || response.status === 201) {
            clearOrdersCache(); // Invalidate cache
            showToast(editId ? 'Order updated successfully!' : 'Order added successfully!', 'success');
            orderModal.classList.remove('show');
            loadOrders(currentPage, currentSearch, currentStatus);
        } else {
            const errorData = await response.json();
            console.error('Validation Error:', errorData);
            showToast(errorData.message || 'Failed to save order.', 'error');
        }
    } catch (error) {
        console.error('Error saving order:', error);
        showToast('Network error while saving order.', 'error');
    } finally {
        setLoading(saveOrderBtn, false);
    }
});

// Print Button inside Modal
printOrderBtn.addEventListener('click', () => {
    const editId = orderIdInput.value;
    const partySearchInput = document.getElementById('partySearchInput');
    
    // Parse party name from search input or select
    let partyNameText = '';
    if (partySearchInput) {
        partyNameText = partySearchInput.value.split('(')[0].trim();
    }
    if (!partyNameText && partyNameSelect.value) {
        const selParty = parties.find(p => p.id == partyNameSelect.value);
        if (selParty) partyNameText = selParty.name;
    }
    if (!partyNameText) partyNameText = 'Unknown Party';
    
    // Gather products from UI rows
    const items = [];
    document.querySelectorAll('.product-row').forEach(row => {
        const serial = row.querySelector('.serialNo').value;
        const sz = row.querySelector('.size').value;
        const pcs = parseInt(row.querySelector('.pieces').value, 10);
        if (serial && sz && pcs) {
            items.push({
                serial_no: serial,
                size: sz,
                pieces: pcs
            });
        }
    });
    
    const printData = {
        id: editId || 'NEW',
        order_date: orderDateInput.value,
        party_name: partyNameText,
        mobile: mobileInput.value,
        state: stateInput.value,
        city: cityInput.value,
        pincode: pincodeInput.value,
        address: addressInput.value,
        transport_name: transportNameInput.value,
        transport_number: transportNumberInput.value,
        payment_method: paymentMethodSelect.value,
        notes: notesTextarea.value,
        items: items
    };
    
    updatePrintLayout(printData);
    
    // Trigger print
    window.print();
});

// Search & Filter Operations
function handleFilterSearch() {
    currentSearch = searchOrderInput.value.trim();
    currentStatus = '';
    currentPage = 1; // Reset to page 1 on filter
    loadOrders(currentPage, currentSearch, currentStatus);
}

searchOrderBtn.addEventListener('click', handleFilterSearch);
searchOrderInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleFilterSearch();
    }
});

resetFilterBtn.addEventListener('click', () => {
    searchOrderInput.value = '';
    currentSearch = '';
    currentStatus = '';
    currentPage = 1;
    loadOrders(currentPage, currentSearch, currentStatus);
});

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    // Role-based UI Customization
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'Admin') {
        // Change sidebar header to User Panel
        const sidebarHeader = document.querySelector('.sidebar-header h2');
        if (sidebarHeader) sidebarHeader.textContent = 'User Panel';

        // Change tab title to User Panel
        document.title = document.title.replace('Admin Panel', 'User Panel');

        // Hide unauthorized sidebar navigation options
        const unauthorizedNavs = document.querySelectorAll('.sidebar-nav a[href="party.html"], .sidebar-nav a[href="stock.html"], .sidebar-nav a[href="user.html"], .sidebar-nav a[href="transport.html"]');
        unauthorizedNavs.forEach(el => el.remove());

        // Hide '+ Add' party redirect button in the order modal
        const addPartyRedirectBtn = document.getElementById('addPartyRedirectBtn');
        if (addPartyRedirectBtn) addPartyRedirectBtn.style.display = 'none';
    }
    
    // Load orders first to render the table instantly
    loadOrders(currentPage, currentSearch, currentStatus);
});
