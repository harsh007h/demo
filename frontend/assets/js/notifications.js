// Immediately check and apply theme before DOM is fully parsed to avoid flicker
(function() {
    const savedTheme = localStorage.getItem('dashboard_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
})();

const NOTIF_API_URL = 'http://127.0.0.1:8000/api';
const notifToken = localStorage.getItem('api_token');
const notifUserRole = localStorage.getItem('user_role');

// Only proceed if user is logged in and is Admin
if (notifToken && notifUserRole === 'Admin') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeNotificationSystem();
    });
}

// Theme toggle & Responsive Sidebar initialization (global, runs on all dashboard pages)
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeSystem();
    initializeResponsiveSidebar();
});

function initializeThemeSystem() {
    const navbarUser = document.querySelector('.navbar-user');
    if (!navbarUser) return;

    // Create theme toggle button if it doesn't already exist
    if (document.getElementById('themeToggleBtn')) return;

    const themeBtn = document.createElement('button');
    themeBtn.id = 'themeToggleBtn';
    themeBtn.className = 'theme-toggle-btn';
    themeBtn.title = 'Switch Theme';

    const currentTheme = localStorage.getItem('dashboard_theme') || 'dark';
    updateThemeButtonIcon(themeBtn, currentTheme);

    // Insert right before user profile or notifications bell (prepend it in navbar-user)
    navbarUser.insertBefore(themeBtn, navbarUser.firstChild);

    themeBtn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        const newTheme = isLight ? 'light' : 'dark';
        localStorage.setItem('dashboard_theme', newTheme);
        updateThemeButtonIcon(themeBtn, newTheme);
        
        // Toast feedback if toast container/function is present
        if (typeof showToast === 'function') {
            showToast(`Switched to ${newTheme} theme`, 'success');
        }
    });
}

function updateThemeButtonIcon(button, theme) {
    if (theme === 'light') {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        `;
    } else {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        `;
    }
}

function initializeResponsiveSidebar() {
    const navbar = document.querySelector('.top-navbar');
    if (!navbar || document.getElementById('menuToggleBtn')) return;

    // Create hamburger button
    const menuBtn = document.createElement('button');
    menuBtn.id = 'menuToggleBtn';
    menuBtn.className = 'menu-toggle-btn';
    menuBtn.title = 'Toggle Sidebar';
    menuBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    `;

    // Prepend inside the top navbar (first element, aligns left)
    navbar.insertBefore(menuBtn, navbar.firstChild);

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // Insert close button inside sidebar if it doesn't exist
        if (!document.getElementById('sidebarCloseBtn')) {
            const closeBtn = document.createElement('button');
            closeBtn.id = 'sidebarCloseBtn';
            closeBtn.className = 'sidebar-close-btn';
            closeBtn.title = 'Close Menu';
            closeBtn.innerHTML = `&times;`;
            sidebar.appendChild(closeBtn);
        }

        // Create backdrop overlay
        let overlay = document.getElementById('sidebarOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        const closeBtn = document.getElementById('sidebarCloseBtn');

        // Toggle sidebar contextual active status
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 768) {
                // Mobile: toggle drawer
                sidebar.classList.add('active');
                overlay.classList.add('active');
            } else {
                // Desktop: toggle body collapse class
                document.body.classList.toggle('sidebar-collapsed');
            }
        });

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };

        closeBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Close sidebar if clicking a link on mobile
        sidebar.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', closeSidebar);
        });
    }
}

function initializeNotificationSystem() {
    const navbarUser = document.querySelector('.navbar-user');
    if (!navbarUser) return;

    // Create Notification Bell & Dropdown HTML structure
    const bellContainer = document.createElement('div');
    bellContainer.className = 'notification-bell-container';
    bellContainer.id = 'notificationBellContainer';

    bellContainer.innerHTML = `
        <button class="notification-bell-btn" id="notificationBellBtn" title="Notifications">
            <span>🔔</span>
            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
        </button>
        <div class="notification-dropdown" id="notificationDropdown">
            <div class="dropdown-header">
                <h3>Notifications</h3>
                <button class="mark-all-read-btn" id="markAllReadBtn" style="display: none;">Mark all as read</button>
            </div>
            <div class="dropdown-body" id="notificationList">
                <div class="empty-notifications">Loading notifications...</div>
            </div>
        </div>
    `;

    // Prepend the bell container to the navbar-user element
    navbarUser.insertBefore(bellContainer, navbarUser.firstChild);

    // DOM Elements
    const bellBtn = document.getElementById('notificationBellBtn');
    const dropdown = document.getElementById('notificationDropdown');
    const badge = document.getElementById('notificationBadge');
    const listContainer = document.getElementById('notificationList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    const headers = {
        'Authorization': `Bearer ${notifToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    // Toggle Dropdown
    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // Close Dropdown when clicking outside
    document.addEventListener('click', (e) => {
        // Do not close if click is within the bell container or if the target element was removed from the DOM during re-rendering
        if (bellContainer.contains(e.target) || !document.body.contains(e.target)) {
            return;
        }
        dropdown.classList.remove('show');
    });

    // Fetch Notifications
    async function loadNotifications() {
        try {
            const response = await fetch(`${NOTIF_API_URL}/notifications`, { headers });
            if (response.ok) {
                const notifications = await response.json();
                renderNotifications(notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    // Format creation time nicely
    function formatTime(dateTimeStr) {
        try {
            const date = new Date(dateTimeStr);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    // Render notifications in dropdown
    function renderNotifications(data) {
        listContainer.innerHTML = '';
        
        // Count unread
        const unreadCount = data.filter(n => !n.is_read).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
            markAllReadBtn.style.display = 'block';
        } else {
            badge.style.display = 'none';
            markAllReadBtn.style.display = 'none';
        }

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="empty-notifications">No notifications yet</div>';
            return;
        }

        data.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `notification-item ${item.is_read ? 'read' : 'unread'}`;
            
            // Add click-to-read functionality on the item card
            itemElement.addEventListener('click', (e) => {
                // Prevent marking read if clicking the action buttons themselves
                if (e.target.closest('.btn-notif-action')) return;
                if (!item.is_read) {
                    markAsRead(item.id);
                }
            });

            const emoji = item.type === 'stock_shortage' ? '🔔' : '📢';
            
            itemElement.innerHTML = `
                <div class="notification-title-row">
                    <span class="notification-title">${emoji} ${item.title}</span>
                    <span class="notification-time">${formatTime(item.created_at)}</span>
                </div>
                <div class="notification-message">${item.message}</div>
                <div class="notification-actions">
                    ${!item.is_read ? `<button class="btn-notif-action btn-notif-read" data-id="${item.id}">Mark Read</button>` : ''}
                    <button class="btn-notif-action btn-notif-delete" data-id="${item.id}">Delete</button>
                </div>
            `;
            listContainer.appendChild(itemElement);
        });

        // Add action button listeners
        listContainer.querySelectorAll('.btn-notif-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                markAsRead(id);
            });
        });

        listContainer.querySelectorAll('.btn-notif-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteNotification(id);
            });
        });
    }

    // Mark as read API call
    async function markAsRead(id) {
        try {
            const response = await fetch(`${NOTIF_API_URL}/notifications/read/${id}`, {
                method: 'POST',
                headers
            });
            if (response.ok) {
                // Reload list to update badge and items
                loadNotifications();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Mark all as read click handler
    markAllReadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        // Find all unread elements and trigger markAsRead calls or wait for all of them
        const unreadItems = Array.from(document.querySelectorAll('.btn-notif-read'));
        if (unreadItems.length === 0) return;
        
        markAllReadBtn.disabled = true;
        markAllReadBtn.textContent = 'Processing...';

        try {
            await Promise.all(unreadItems.map(btn => {
                const id = btn.getAttribute('data-id');
                return fetch(`${NOTIF_API_URL}/notifications/read/${id}`, {
                    method: 'POST',
                    headers
                });
            }));
            await loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            markAllReadBtn.disabled = false;
            markAllReadBtn.textContent = 'Mark all as read';
        }
    });

    // Delete API call
    async function deleteNotification(id) {
        try {
            const response = await fetch(`${NOTIF_API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.ok) {
                loadNotifications();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }

    // Initial load
    loadNotifications();

    // Poll for notifications every 30 seconds
    setInterval(loadNotifications, 30000);
}
