const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('api_token');
    
    // If no token, redirect to login
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const dashboardContent = document.getElementById('dashboardContent');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const avatarInitial = document.getElementById('avatarInitial');
    const logoutBtn = document.getElementById('logoutBtn');

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
            dashboardContent.style.display = 'block';
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
