const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('api_token');
    
    // If no token, redirect to login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Hide User Management for Staff
    const userRole = localStorage.getItem('user_role');
    if (userRole !== 'Admin') {
        const userNav = document.querySelectorAll('.sidebar-nav a[href="user.html"]');
        userNav.forEach(el => el.remove());
    }

    const dashboardContent = document.getElementById('dashboardContent');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const avatarInitial = document.getElementById('avatarInitial');
    const logoutBtn = document.getElementById('logoutBtn');

    const totalOrdersCount = document.getElementById('totalOrdersCount');
    const pendingOrdersCount = document.getElementById('pendingOrdersCount');
    const lowStockCountVal = document.getElementById('lowStockCountVal');

    async function loadStats() {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };

        // Fetch Order Stats (Total and Pending in a single call)
        try {
            const res = await fetch(`${API_URL}/orders/stats`, { headers });
            if (res.ok) {
                const data = await res.json();
                totalOrdersCount.textContent = data.total_orders !== undefined ? data.total_orders : 0;
                pendingOrdersCount.textContent = data.pending_orders !== undefined ? data.pending_orders : 0;
            } else {
                totalOrdersCount.textContent = 'Error';
                pendingOrdersCount.textContent = 'Error';
            }
        } catch (e) {
            console.error('Error fetching order stats:', e);
            totalOrdersCount.textContent = 'Error';
            pendingOrdersCount.textContent = 'Error';
        }

        // Fetch Stock Alerts
        try {
            const res = await fetch(`${API_URL}/stocks/stats`, { headers });
            if (res.ok) {
                const data = await res.json();
                const count = data.low_stock_count !== undefined ? data.low_stock_count : 0;
                lowStockCountVal.textContent = count > 0 ? `${count} Items` : '0 Items';
                lowStockCountVal.style.color = count > 0 ? 'var(--error-color)' : '#10b981';
            } else {
                lowStockCountVal.textContent = 'Error';
            }
        } catch (e) {
            console.error('Error fetching stock stats:', e);
            lowStockCountVal.textContent = 'Error';
        }
    }

    try {
        // Fetch user data
        const response = await fetch(`${API_URL}/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            // Populate UI
            userNameElement.textContent = user.name;
            userEmailElement.textContent = user.email;
            
            // Set avatar initial
            if (user.name) {
                avatarInitial.textContent = user.name.charAt(0).toUpperCase();
            }
            
            // Show dashboard content
            dashboardContent.style.display = 'flex';

            // Load all stats dynamically
            await loadStats();
        } else {
            // Token invalid or expired
            console.warn('Session expired or invalid token');
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        alert('Network error. Could not connect to API.');
    }

    // Handle logout
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
            // Always clear token and redirect, even if API call fails
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    });
});
