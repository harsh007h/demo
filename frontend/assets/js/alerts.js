const API_URL = 'http://127.0.0.1:8000/api';
const token = localStorage.getItem('api_token');
const userRole = localStorage.getItem('user_role');

// Redirect if not logged in
if (!token) {
    window.location.href = 'login.html';
}

// Redirect to dashboard if user is not Admin
if (userRole !== 'Admin') {
    alert('Access denied. Staff cannot access Alerts.');
    window.location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const dashboardContent = document.getElementById('dashboardContent');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const avatarInitial = document.getElementById('avatarInitial');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const feedHeaderTitle = document.getElementById('feedHeaderTitle');
    const alertsTitle = document.getElementById('alertsTitle');
    const notificationsFeed = document.getElementById('notificationsFeed');
    const paginationContainer = document.getElementById('paginationContainer');
    const liveAnnouncer = document.getElementById('liveAnnouncer');

    const filterAllBtn = document.getElementById('filterAllBtn');
    const filterAlertsBtn = document.getElementById('filterAlertsBtn');
    const sidebarAlertLink = document.getElementById('sidebarAlertNameLink');

    // State Variables
    let notifications = [];
    let activeSection = 'all'; // 'all' or 'Alert Name'
    let currentPage = 1;
    const itemsPerPage = 4; // Show 4 items per page

    // Fallback Dummy Data in case backend is offline
    const dummyNotifications = [
        {
            id: 9991,
            title: "Stock shortage: L Size",
            message: "Item 'Polo Shirt (L)' is running low on stock. Only 2 units remaining.",
            type: "stock_shortage",
            is_read: false,
            created_at: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
            id: 9992,
            title: "New Order Recieved",
            message: "Order #4092 has been submitted by Party 'Sunshine Traders'.",
            type: "new_order",
            is_read: false,
            created_at: new Date(Date.now() - 30 * 60000).toISOString()
        },
        {
            id: 9993,
            title: "Low Stock: XL Size",
            message: "Item 'Slim Fit Jeans (XL)' is low. 4 units left.",
            type: "low_stock",
            is_read: true,
            created_at: new Date(Date.now() - 120 * 60000).toISOString()
        },
        {
            id: 9994,
            title: "System Maintenance Scheduled",
            message: "Database system optimization will run tonight at 02:00 AM.",
            type: "general",
            is_read: true,
            created_at: new Date(Date.now() - 360 * 60000).toISOString()
        }
    ];

    // Helper: Determine if notification belongs to "Alert Name" section
    function isAlertNotification(item) {
        return item.type === 'stock_shortage' || item.type === 'low_stock' || item.section === 'Alert Name';
    }

    // Keyboard Navigation Controller
    function handleKeyboardNav(e, index, totalItems) {
        const cards = notificationsFeed.querySelectorAll('.notification-feed-card');
        if (e.key === 'ArrowDown' && index < totalItems - 1) {
            e.preventDefault();
            cards[index + 1].focus();
        } else if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            cards[index - 1].focus();
        }
    }

    // Render Pagination Controls
    function renderPagination(totalItems) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) return;

        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = 'Prev';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            currentPage--;
            renderFeed();
            liveAnnouncer.textContent = `Switched to page ${currentPage}.`;
            const firstCard = notificationsFeed.querySelector('.notification-feed-card');
            if (firstCard) firstCard.focus();
        };
        paginationContainer.appendChild(prevBtn);

        // Page Number Buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${currentPage === i ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                renderFeed();
                liveAnnouncer.textContent = `Switched to page ${currentPage}.`;
                const firstCard = notificationsFeed.querySelector('.notification-feed-card');
                if (firstCard) firstCard.focus();
            };
            paginationContainer.appendChild(pageBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            currentPage++;
            renderFeed();
            liveAnnouncer.textContent = `Switched to page ${currentPage}.`;
            const firstCard = notificationsFeed.querySelector('.notification-feed-card');
            if (firstCard) firstCard.focus();
        };
        paginationContainer.appendChild(nextBtn);
    }

    // Render Notifications Feed
    function renderFeed() {
        notificationsFeed.innerHTML = '';
        
        // Filter based on active section
        const filtered = notifications.filter(item => {
            if (activeSection === 'Alert Name') {
                return isAlertNotification(item);
            }
            return true;
        });

        // Paginated display calculations
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToShow = filtered.slice(startIndex, endIndex);

        if (itemsToShow.length === 0) {
            notificationsFeed.innerHTML = `<div style="text-align: center; padding: 32px; color: var(--text-secondary);">No notifications found.</div>`;
            paginationContainer.innerHTML = '';
            return;
        }

        // Render card items
        itemsToShow.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `notification-feed-card ${item.is_read ? 'read' : 'unread'}`;
            card.tabIndex = 0;
            card.setAttribute('role', 'article');
            card.setAttribute('aria-label', `${item.type.replace('_', ' ')} notification: ${item.title}`);

            // Keyboard navigation listener
            card.addEventListener('keydown', (e) => handleKeyboardNav(e, index, itemsToShow.length));

            // Emoji / Icon selector
            let emoji = '📢';
            if (item.type === 'stock_shortage') emoji = '🚨';
            else if (item.type === 'low_stock') emoji = '⚠️';
            else if (item.type === 'new_order') emoji = '📦';

            // Nice creation time
            let timeString = 'N/A';
            if (item.created_at) {
                const date = new Date(item.created_at);
                timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            card.innerHTML = `
                <div class="notification-feed-header">
                    <span class="notification-feed-badge badge-${item.type}">${emoji} ${item.type.replace('_', ' ')}</span>
                    <span class="notification-feed-time">${timeString}</span>
                </div>
                <h4 class="notification-feed-title">${item.title}</h4>
                <p class="notification-feed-message">${item.message}</p>
            `;

            notificationsFeed.appendChild(card);
        });

        // Render dynamic pagination buttons
        renderPagination(filtered.length);
    }

    // Set Active Section
    function setSection(section) {
        activeSection = section;
        currentPage = 1; // Reset to page 1 on filter switch
        
        if (section === 'Alert Name') {
            if (filterAlertsBtn) {
                filterAlertsBtn.classList.add('active');
                filterAlertsBtn.setAttribute('aria-selected', 'true');
            }
            if (filterAllBtn) {
                filterAllBtn.classList.remove('active');
                filterAllBtn.setAttribute('aria-selected', 'false');
            }
            
            feedHeaderTitle.textContent = 'Alert Name section';
            alertsTitle.textContent = 'Alerts Center - Alert Name';
        } else {
            if (filterAllBtn) {
                filterAllBtn.classList.add('active');
                filterAllBtn.setAttribute('aria-selected', 'true');
            }
            if (filterAlertsBtn) {
                filterAlertsBtn.classList.remove('active');
                filterAlertsBtn.setAttribute('aria-selected', 'false');
            }
            
            feedHeaderTitle.textContent = 'All Notifications';
            alertsTitle.textContent = 'Alerts Center - All';
        }

        renderFeed();
        
        // Announce change to screen readers
        liveAnnouncer.textContent = `Filtered view switched to ${activeSection === 'all' ? 'All Notifications' : 'Alert Name section'}.`;
    }

    // Filtering listeners
    if (filterAllBtn) filterAllBtn.addEventListener('click', () => setSection('all'));
    if (filterAlertsBtn) filterAlertsBtn.addEventListener('click', () => setSection('Alert Name'));
    if (sidebarAlertLink) {
        sidebarAlertLink.addEventListener('click', (e) => {
            // Keep page transition but allow local hash override if clicked on same page
            if (window.location.pathname.endsWith('alerts.html')) {
                e.preventDefault();
                setSection('Alert Name');
            }
        });
    }

    // Profile modal event binding
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

    // Load User and Stats/Notifications
    try {
        const response = await fetch(`${API_URL}/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            // Populate user info
            userNameElement.textContent = user.name;
            userEmailElement.textContent = user.email;
            if (user.name) {
                avatarInitial.textContent = user.name.charAt(0).toUpperCase();
            }

            // Populate Modal
            const profileModalName = document.getElementById('profileModalName');
            const profileModalEmail = document.getElementById('profileModalEmail');
            const profileModalMobile = document.getElementById('profileModalMobile');
            const profileModalRole = document.getElementById('profileModalRole');
            const profileModalStatus = document.getElementById('profileModalStatus');
            const profileModalAvatar = document.getElementById('profileModalAvatar');

            if (profileModalName) profileModalName.textContent = user.name;
            if (profileModalEmail) profileModalEmail.textContent = user.email;
            if (profileModalMobile) profileModalMobile.textContent = user.mobile || 'N/A';
            if (profileModalAvatar && user.name) {
                profileModalAvatar.textContent = user.name.charAt(0).toUpperCase();
            }
            if (profileModalRole) {
                const role = user.role || 'Staff';
                const roleClass = role === 'Admin' ? 'role-admin' : 'role-staff';
                profileModalRole.innerHTML = `<span class="role-badge ${roleClass}">${role}</span>`;
            }
            if (profileModalStatus) {
                const status = user.status || 'Active';
                const statusClass = status === 'Active' ? 'status-active' : 'status-inactive';
                profileModalStatus.innerHTML = `<span class="status-badge ${statusClass}">${status}</span>`;
            }

            // Fetch Notifications list
            try {
                const notifRes = await fetch(`${API_URL}/notifications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (notifRes.ok) {
                    notifications = await notifRes.json();
                } else {
                    notifications = dummyNotifications;
                }
            } catch (e) {
                console.warn('API error, using dummy notifications:', e);
                notifications = dummyNotifications;
            }

            // Show page content
            dashboardContent.style.display = 'flex';

            // Initial view: check if page requested Alert Name filter directly
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('filter') === 'alerts') {
                setSection('Alert Name');
            } else {
                setSection('all');
            }

        } else {
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    } catch (e) {
        console.error('Error connecting to user profile:', e);
        // Fallback for dashboard showcase
        userNameElement.textContent = "Admin Demo";
        userEmailElement.textContent = "admin@demo.com";
        avatarInitial.textContent = "A";
        notifications = dummyNotifications;
        dashboardContent.style.display = 'flex';
        setSection('all');
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
            localStorage.removeItem('api_token');
            window.location.href = 'login.html';
        }
    });
});
