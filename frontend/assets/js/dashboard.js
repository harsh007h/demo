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
    const totalPartiesCount = document.getElementById('totalPartiesCount');
    const recentOrdersBody = document.getElementById('recentOrdersBody');
    const lowStockDetailsContainer = document.getElementById('lowStockDetailsContainer');

    function renderRecentOrders(orders) {
        recentOrdersBody.innerHTML = '';
        if (orders.length === 0) {
            recentOrdersBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center" style="padding: 24px; color: var(--text-secondary);">
                        No recent orders found
                    </td>
                </tr>`;
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            // Party details
            const partyName = order.party ? order.party.name : 'Unknown';
            const partyMobile = order.party ? order.party.mobile : '';
            const partyCell = `
                <div style="font-weight: 600;">${partyName}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${partyMobile}</div>
            `;
            
            // Date formatting
            let formattedDate = order.order_date;
            if (formattedDate) {
                const d = new Date(formattedDate);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            } else {
                formattedDate = 'N/A';
            }

            // Transport details
            const transportName = order.transport_name || 'N/A';
            const transportNum = order.transport_number ? `(${order.transport_number})` : '';
            const transportCell = `
                <div>${transportName}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${transportNum}</div>
            `;

            // Status Badge
            let badgeClass = 'status-pending';
            const status = order.status || 'Pending';
            if (status === 'In Review') badgeClass = 'status-in-review';
            else if (status === 'Bill Sent') badgeClass = 'status-bill-sent';
            else if (status === 'Completed') badgeClass = 'status-completed';

            const statusCell = `<span class="status-badge ${badgeClass}">${status}</span>`;

            tr.innerHTML = `
                <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${partyCell}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${formattedDate}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${transportCell}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">${statusCell}</td>
            `;
            recentOrdersBody.appendChild(tr);
        });
    }

    function renderLowStockDetails(lowStockItems) {
        lowStockDetailsContainer.innerHTML = '';
        if (lowStockItems.length === 0) {
            lowStockDetailsContainer.innerHTML = `
                <div class="empty-stock-alert">
                    ✓ All items are fully in stock!
                </div>`;
            return;
        }

        lowStockItems.forEach(item => {
            const div = document.createElement('a');
            div.href = 'stock.html';
            div.className = 'low-stock-item';
            div.innerHTML = `
                <span class="size-label">${item.product_name || 'Product'} (${item.product_size})</span>
                <span class="quantity-badge">${item.quantity} left</span>
            `;
            lowStockDetailsContainer.appendChild(div);
        });
    }

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

        // Fetch Stock Alerts Count
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

        // Fetch Total Parties Count
        try {
            const res = await fetch(`${API_URL}/parties?per_page=1`, { headers });
            if (res.ok) {
                const data = await res.json();
                totalPartiesCount.textContent = data.total !== undefined ? data.total : 0;
            } else {
                totalPartiesCount.textContent = 'Error';
            }
        } catch (e) {
            console.error('Error fetching party stats:', e);
            totalPartiesCount.textContent = 'Error';
        }

        // Fetch Recent Orders (latest 5)
        try {
            const res = await fetch(`${API_URL}/orders?per_page=5`, { headers });
            if (res.ok) {
                const paginated = await res.json();
                const orders = paginated.data || [];
                renderRecentOrders(orders);
            } else {
                recentOrdersBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 24px; color: var(--error-color);">Error loading recent orders</td></tr>`;
            }
        } catch (e) {
            console.error('Error fetching recent orders:', e);
            recentOrdersBody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding: 24px; color: var(--error-color);">Network error</td></tr>`;
        }

        // Fetch Low Stock details
        try {
            const res = await fetch(`${API_URL}/stocks?per_page=100`, { headers });
            if (res.ok) {
                const paginated = await res.json();
                const stocks = paginated.data || [];
                const lowStockItems = stocks.filter(stock => stock.quantity < 10);
                renderLowStockDetails(lowStockItems);
            } else {
                lowStockDetailsContainer.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--error-color);">Error loading low stock details</div>`;
            }
        } catch (e) {
            console.error('Error fetching low stock details:', e);
            lowStockDetailsContainer.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--error-color);">Network error</div>`;
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
            
            // Populate Profile Modal details
            const profileModalName = document.getElementById('profileModalName');
            const profileModalEmail = document.getElementById('profileModalEmail');
            const profileModalMobile = document.getElementById('profileModalMobile');
            const profileModalRole = document.getElementById('profileModalRole');
            const profileModalStatus = document.getElementById('profileModalStatus');
            const profileModalAvatar = document.getElementById('profileModalAvatar');

            if (profileModalName) profileModalName.textContent = user.name;
            if (profileModalEmail) profileModalEmail.textContent = user.email;
            if (profileModalMobile) profileModalMobile.textContent = user.mobile || 'N/A';
            
            // Set modal avatar initial
            if (user.name && profileModalAvatar) {
                profileModalAvatar.textContent = user.name.charAt(0).toUpperCase();
            }

            // Role Badge
            if (profileModalRole) {
                const role = user.role || 'Staff';
                const roleClass = role === 'Admin' ? 'role-admin' : 'role-staff';
                profileModalRole.innerHTML = `<span class="role-badge ${roleClass}">${role}</span>`;
            }

            // Status Badge
            if (profileModalStatus) {
                const status = user.status || 'Active';
                const statusClass = status === 'Active' ? 'status-active' : 'status-inactive';
                profileModalStatus.innerHTML = `<span class="status-badge ${statusClass}">${status}</span>`;
            }

            // Bind profile modal events
            const userInfoMini = document.querySelector('.user-info-mini');
            const profileModal = document.getElementById('profileModal');
            const closeProfileModal = document.getElementById('closeProfileModal');
            const profileModalLogoutBtn = document.getElementById('profileModalLogoutBtn');

            if (userInfoMini && profileModal) {
                userInfoMini.addEventListener('click', () => {
                    profileModal.classList.add('show');
                });
            }

            if (closeProfileModal && profileModal) {
                closeProfileModal.addEventListener('click', () => {
                    profileModal.classList.remove('show');
                });
            }

            if (profileModal) {
                profileModal.addEventListener('click', (e) => {
                    if (e.target === profileModal) {
                        profileModal.classList.remove('show');
                    }
                });
            }

            if (profileModalLogoutBtn) {
                profileModalLogoutBtn.addEventListener('click', async () => {
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
                        window.location.href = 'login.html';
                    }
                });
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
