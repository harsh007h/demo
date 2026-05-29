const API_URL = 'http://127.0.0.1:8000/api';
let parties = [];
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
const partyTableBody = document.getElementById('partyTableBody');
const searchPartyInput = document.getElementById('searchPartyInput');
const searchPartyBtn = document.getElementById('searchPartyBtn');
const addPartyBtn = document.getElementById('addPartyBtn');
const partyModal = document.getElementById('partyModal');
const closeModal = document.getElementById('closeModal');
const partyForm = document.getElementById('partyForm');
const modalTitle = document.getElementById('modalTitle');

// Form Fields
const partyIdInput = document.getElementById('partyId');
const partyNameInput = document.getElementById('partyName');
const mobileInput = document.getElementById('mobile');
const stateInput = document.getElementById('state');
const cityInput = document.getElementById('city');
const pincodeInput = document.getElementById('pincode');
const addressInput = document.getElementById('address');

// Fetch and Render Table
async function loadParties() {
    try {
        const response = await fetch(`${API_URL}/parties`, { headers });
        if (response.ok) {
            parties = await response.json();
            renderTable(parties);
        } else if (response.status === 401) {
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching parties:', error);
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
                <button class="btn-icon delete-btn" onclick="deleteParty(${party.id})">Delete</button>
            </td>
        `;
        partyTableBody.appendChild(tr);
    });
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

// Delete Party
window.deleteParty = async (id) => {
    if (confirm('Are you sure you want to delete this party?')) {
        try {
            const response = await fetch(`${API_URL}/parties/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok || response.status === 204) {
                parties = parties.filter(p => p.id !== id);
                renderTable(parties);
            } else {
                alert('Failed to delete party.');
            }
        } catch (error) {
            console.error('Error deleting party:', error);
        }
    }
};

// Handle Form Submit (Add/Edit)
partyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const partyData = {
        name: partyNameInput.value,
        mobile: mobileInput.value,
        state: stateInput.value,
        city: cityInput.value,
        pincode: pincodeInput.value,
        address: addressInput.value
    };
    
    const editId = partyIdInput.value;
    
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
            const savedParty = await response.json();
            
            if (editId) {
                parties = parties.map(p => p.id === parseInt(editId) ? savedParty : p);
            } else {
                parties.push(savedParty);
            }
            
            partyModal.classList.remove('show');
            renderTable(parties);
        } else {
            const errorData = await response.json();
            console.error('Validation Error:', errorData);
            alert('Failed to save party. Check console for details.');
        }
    } catch (error) {
        console.error('Error saving party:', error);
    }
});

// Search functionality
function handleSearch() {
    const searchTerm = searchPartyInput.value.toLowerCase().trim();
    if (!searchTerm) {
        renderTable(parties);
        return;
    }
    
    const filteredParties = parties.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.mobile.includes(searchTerm)
    );
    renderTable(filteredParties);
}

searchPartyBtn.addEventListener('click', handleSearch);
searchPartyInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Initial Load
document.addEventListener('DOMContentLoaded', loadParties);
