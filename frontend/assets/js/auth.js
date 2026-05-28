const API_URL = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('api_token');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error state
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
        
        // Set loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and redirect
                localStorage.setItem('api_token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                // Show error message
                errorMessage.textContent = data.message || 'Invalid credentials. Please try again.';
                errorMessage.classList.add('show');
            }
        } catch (error) {
            errorMessage.textContent = 'A network error occurred. Is the API running?';
            errorMessage.classList.add('show');
            console.error('Login error:', error);
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
