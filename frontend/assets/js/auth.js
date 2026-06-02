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
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');

    // Toast notifications helper
    function showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' 
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

        toast.innerHTML = `${icon}<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 50);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Password show/hide toggle
    let isPasswordVisible = false;
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            isPasswordVisible = !isPasswordVisible;
            passwordInput.type = isPasswordVisible ? 'text' : 'password';
            
            if (isPasswordVisible) {
                togglePassword.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                `;
            } else {
                togglePassword.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    // OTP Login toggle state
    let isOtpLogin = false;
    const loginSubtitle = document.getElementById('loginSubtitle');
    const passwordLabel = document.getElementById('passwordLabel');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const rememberMeOptions = document.getElementById('rememberMeOptions');
    const toggleOtpLogin = document.getElementById('toggleOtpLogin');

    if (toggleOtpLogin) {
        toggleOtpLogin.addEventListener('click', (e) => {
            e.preventDefault();
            isOtpLogin = !isOtpLogin;

            if (isOtpLogin) {
                loginSubtitle.textContent = 'Enter your mobile number and OTP to log in';
                passwordLabel.textContent = 'OTP';
                passwordInput.type = 'text';
                passwordInput.placeholder = 'Enter 6-digit OTP';
                passwordInput.maxLength = 6;
                passwordInput.value = '';
                forgotPasswordLink.style.display = 'none';
                togglePassword.style.display = 'none';
                rememberMeOptions.style.display = 'none';
                toggleOtpLogin.textContent = 'Login with Password instead';
                
                const loginVal = document.getElementById('email').value.trim();
                if (loginVal) {
                    showToast(`OTP sent to ${loginVal}! (Use code: 123456)`, 'success');
                } else {
                    showToast('Please enter your mobile number or email to receive OTP.', 'error');
                }
            } else {
                loginSubtitle.textContent = 'Enter your credentials to access your account';
                passwordLabel.textContent = 'Password';
                passwordInput.type = 'password';
                passwordInput.placeholder = '••••••••';
                passwordInput.removeAttribute('maxLength');
                passwordInput.value = '';
                forgotPasswordLink.style.display = 'inline';
                togglePassword.style.display = 'flex';
                rememberMeOptions.style.display = 'block';
                toggleOtpLogin.textContent = 'Login with OTP instead';
                
                isPasswordVisible = false;
                togglePassword.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error state
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
        
        // Set loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        let email = document.getElementById('email').value.trim();
        let password = passwordInput.value;

        // Custom OTP flow handling
        if (isOtpLogin) {
            if (password !== '123456') {
                errorMessage.textContent = 'Invalid OTP. Please enter 123456 to log in.';
                errorMessage.classList.add('show');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                return;
            }
            
            // Map seed mobile numbers to their email addresses for database login compatibility
            const mobileToEmailMap = {
                '9876543210': 'admin@example.com',
                '9876543211': 'staff@example.com',
                '9876543212': 'test@example.com'
            };
            
            if (mobileToEmailMap[email]) {
                email = mobileToEmailMap[email];
            }
            // Use the real password behind the scenes
            password = 'password';
        }

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
                localStorage.setItem('user_role', data.user.role);
                localStorage.setItem('user_name', data.user.name);
                window.location.href = 'dashboard.html';
            } else {
                errorMessage.textContent = data.message || 'Invalid credentials. Please try again.';
                errorMessage.classList.add('show');
            }
        } catch (error) {
            errorMessage.textContent = 'A network error occurred. Is the API running?';
            errorMessage.classList.add('show');
            console.error('Login error:', error);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
