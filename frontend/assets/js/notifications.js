const NOTIF_API_URL = 'http://127.0.0.1:8000/api';
const notifToken = localStorage.getItem('api_token');
const notifUserRole = localStorage.getItem('user_role');

// Only proceed if user is logged in and is Admin
if (notifToken && notifUserRole === 'Admin') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeNotificationSystem();
    });
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
