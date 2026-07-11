const API_URL = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('api_token');
    if (token) {
        window.location.href = '/dashboard';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const errorMessage = document.getElementById('errorMessage');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordGroup = document.querySelector('.password-group');
    const togglePassword = document.getElementById('togglePassword');
    
    // OTP Specific Elements
    const otpGroup = document.getElementById('otpGroup');
    const otpInput = document.getElementById('otp');
    const countdownTimer = document.getElementById('countdownTimer');
    const resendOtpLink = document.getElementById('resendOtpLink');
    const loginSubtitle = document.getElementById('loginSubtitle');
    const rememberMeOptions = document.getElementById('rememberMeOptions');
    const toggleOtpLogin = document.getElementById('toggleOtpLogin');

    let loginMode = 'password'; // 'password', 'otp_step1', 'otp_step2'
    let countdownInterval = null;
    let countdownTime = 30;

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
            : type === 'error'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12.01" y2="16"></line><path d="M12 8v4"></path></svg>`;

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

    // Dynamic UI state flow controller
    function updateUI() {
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
        
        if (loginMode === 'password') {
            loginSubtitle.textContent = 'Enter your credentials to access your account';
            
            // Show password fields and options
            passwordGroup.style.display = 'block';
            passwordInput.required = true;
            rememberMeOptions.style.display = 'block';
            
            // Hide OTP elements
            otpGroup.style.display = 'none';
            otpInput.required = false;
            otpInput.value = '';
            
            // Configure email input
            emailInput.readOnly = false;
            
            // Submit Button
            submitBtnText.textContent = 'Sign In';
            
            // Toggle Link
            toggleOtpLogin.textContent = 'Login with OTP instead';
            
            // Stop countdown timer
            clearInterval(countdownInterval);
            countdownTimer.textContent = '';
        } 
        else if (loginMode === 'otp_step1') {
            loginSubtitle.textContent = 'Enter your mobile number or email to log in';
            
            // Hide password fields and options
            passwordGroup.style.display = 'none';
            passwordInput.required = false;
            passwordInput.value = '';
            rememberMeOptions.style.display = 'none';
            
            // Hide OTP elements
            otpGroup.style.display = 'none';
            otpInput.required = false;
            otpInput.value = '';
            
            // Configure email input
            emailInput.readOnly = false;
            
            // Submit Button
            submitBtnText.textContent = 'Send OTP';
            
            // Toggle Link
            toggleOtpLogin.textContent = 'Login with Password instead';
            
            // Stop countdown timer
            clearInterval(countdownInterval);
            countdownTimer.textContent = '';
        }
        else if (loginMode === 'otp_step2') {
            loginSubtitle.textContent = 'Enter your mobile number and OTP to log in';
            
            // Hide password fields and options
            passwordGroup.style.display = 'none';
            passwordInput.required = false;
            passwordInput.value = '';
            rememberMeOptions.style.display = 'none';
            
            // Show OTP elements
            otpGroup.style.display = 'block';
            otpInput.required = true;
            otpInput.focus();
            
            // Configure email input
            emailInput.readOnly = true; // Readonly during verification so they don't change the email
            
            // Submit Button
            submitBtnText.textContent = 'Verify OTP';
            
            // Toggle Link
            toggleOtpLogin.textContent = 'Login with Password instead';
            
            // Start the 30 seconds countdown
            startCountdown();
        }
    }

    // Countdown Timer logic for Resend OTP
    function startCountdown() {
        clearInterval(countdownInterval);
        countdownTime = 30;
        
        resendOtpLink.style.pointerEvents = 'none';
        resendOtpLink.style.opacity = '0.5';
        countdownTimer.textContent = `(${countdownTime}s)`;

        countdownInterval = setInterval(() => {
            countdownTime--;
            if (countdownTime > 0) {
                countdownTimer.textContent = `(${countdownTime}s)`;
            } else {
                clearInterval(countdownInterval);
                countdownTimer.textContent = '';
                resendOtpLink.style.pointerEvents = 'auto';
                resendOtpLink.style.opacity = '1';
            }
        }, 1000);
    }

    // OTP toggle click handler
    if (toggleOtpLogin) {
        toggleOtpLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginMode === 'password') {
                loginMode = 'otp_step1';
            } else {
                loginMode = 'password';
            }
            updateUI();
        });
    }

    // Resend OTP click handler
    if (resendOtpLink) {
        resendOtpLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (countdownTime > 0) return; // Prevent clicking if timer is active
            
            showToast('Resending OTP...', 'info');
            const email = emailInput.value.trim();
            
            try {
                const response = await fetch(`${API_URL}/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message || 'New OTP sent successfully!', 'success');
                    startCountdown(); // Restart the countdown timer
                } else {
                    showToast(data.message || 'Failed to resend OTP.', 'error');
                }
            } catch (error) {
                showToast('A network error occurred while resending OTP.', 'error');
                console.error('Resend OTP error:', error);
            }
        });
    }

    // Form Submission handler for Password & OTP modes
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset error state
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
        
        // Set loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const email = emailInput.value.trim();

        if (loginMode === 'password') {
            const password = passwordInput.value;
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
                    localStorage.setItem('api_token', data.token);
                    localStorage.setItem('user_role', data.user.role);
                    localStorage.setItem('user_name', data.user.name);
                    showToast('Login successful! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 800);
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
        } 
        else if (loginMode === 'otp_step1') {
            try {
                const response = await fetch(`${API_URL}/send-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(data.message || 'OTP sent successfully!', 'success');
                    loginMode = 'otp_step2';
                    updateUI();
                } else {
                    errorMessage.textContent = data.message || 'Failed to send OTP. Please try again.';
                    errorMessage.classList.add('show');
                }
            } catch (error) {
                errorMessage.textContent = 'A network error occurred. Is the API running?';
                errorMessage.classList.add('show');
                console.error('Send OTP error:', error);
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
        else if (loginMode === 'otp_step2') {
            const otp = otpInput.value.trim();
            try {
                const response = await fetch(`${API_URL}/verify-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, otp })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('api_token', data.token);
                    localStorage.setItem('user_role', data.user.role);
                    localStorage.setItem('user_name', data.user.name);
                    showToast('OTP verified successfully! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 800);
                } else {
                    errorMessage.textContent = data.message || 'Invalid OTP. Please try again.';
                    errorMessage.classList.add('show');
                }
            } catch (error) {
                errorMessage.textContent = 'A network error occurred. Is the API running?';
                errorMessage.classList.add('show');
                console.error('Verify OTP error:', error);
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    });

    // Run initial setup based on password mode
    updateUI();
});

