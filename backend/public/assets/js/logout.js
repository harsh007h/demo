// Global Logout Handler
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.origin + '/api';
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('api_token');
            try {
                if (token) {
                    await fetch(`${API_URL}/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Error logging out:', error);
            } finally {
                localStorage.removeItem('api_token'); 
                localStorage.removeItem('user_role'); 
                localStorage.removeItem('user_name');
                window.location.href = '/login';
            }
        });
    }
});
