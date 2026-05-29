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

// DOM Elements
const orderForm = document.getElementById('orderForm');
const partyNameSelect = document.getElementById('partyName');
const mobileInput = document.getElementById('mobile');
const stateInput = document.getElementById('state');
const cityInput = document.getElementById('city');
const pincodeInput = document.getElementById('pincode');
const addressInput = document.getElementById('address');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const printOrderBtn = document.getElementById('printOrderBtn');
const toastContainer = document.getElementById('toastContainer');
const addPartyRedirectBtn = document.getElementById('addPartyRedirectBtn');

// Set default date and minimum date to today
const today = new Date();
const dateInput = document.getElementById('orderDate');
dateInput.valueAsDate = today;

// Format today's date as YYYY-MM-DD for the min attribute
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInput.min = `${yyyy}-${mm}-${dd}`;

let parties = [];

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

// Load Parties for Dropdown
async function loadParties() {
    try {
        // Fetch all parties for the dropdown
        const response = await fetch(`${API_URL}/parties?per_page=100`, { headers });
        if (response.ok) {
            const data = await response.json();
            parties = data.data || data; // Handle depending on API structure
            
            parties.forEach(party => {
                const option = document.createElement('option');
                option.value = party.id;
                option.textContent = party.name;
                partyNameSelect.appendChild(option);
            });
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching parties:', error);
        showToast('Failed to load party list', 'error');
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
        mobileInput.value = '';
        stateInput.value = '';
        cityInput.value = '';
        pincodeInput.value = '';
        addressInput.value = '';
    }
});

// Redirect to add party page in a new tab
if (addPartyRedirectBtn) {
    addPartyRedirectBtn.addEventListener('click', () => {
        window.open('party.html', '_blank');
    });
}

// Dynamic Products Logic
const addProductBtn = document.getElementById('addProductBtn');
const productList = document.getElementById('productList');

addProductBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'product-row';
    row.style.cssText = 'display: flex; gap: 16px; margin-bottom: 16px; align-items: center;';
    
    row.innerHTML = `
        <div style="flex: 2;">
            <input type="text" class="serialNo" required placeholder="Serial No" style="margin-bottom: 0;">
        </div>
        <div style="flex: 1;">
            <select class="size" required style="margin-bottom: 0;">
                <option value="M" selected>M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
            </select>
        </div>
        <div style="flex: 1;">
            <input type="number" class="pieces" required value="1" min="1" style="margin-bottom: 0;">
        </div>
        <div>
            <button type="button" class="btn remove-product-btn" style="background: #ef4444; width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; border: none; flex-shrink: 0;">X</button>
        </div>
    `;
    
    productList.appendChild(row);
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

// Form Submit
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect products
    const products = [];
    document.querySelectorAll('.product-row').forEach(row => {
        products.push({
            serial_no: row.querySelector('.serialNo').value.trim(),
            size: row.querySelector('.size').value,
            pieces: row.querySelector('.pieces').value
        });
    });

    const paymentMethod = document.getElementById('paymentMethod').value;
    const transportNumberEl = document.getElementById('transportNumber');

    const orderData = {
        order_date: document.getElementById('orderDate').value,
        party_id: partyNameSelect.value,
        products: products,
        transport_name: document.getElementById('transportName').value.trim(),
        transport_number: transportNumberEl ? transportNumberEl.value.trim() : '',
        payment_method: paymentMethod,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value.trim()
    };

    setLoading(saveOrderBtn, true);

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData)
        });

        if (response.ok || response.status === 201) {
            showToast('Order created successfully!', 'success');
            orderForm.reset();
            document.getElementById('orderDate').valueAsDate = new Date(); // reset date to today
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

// Print Button
printOrderBtn.addEventListener('click', () => {
    window.print();
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadParties();
});
