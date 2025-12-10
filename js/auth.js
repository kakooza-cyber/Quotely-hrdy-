// js/auth.js - UPDATED VERSION
class AuthManager {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    checkExistingSession() {
        // Check if user is already logged in
        const userData = localStorage.getItem('quotely_user');
        if (userData) {
            const user = JSON.parse(userData);
            this.updateUIForLoggedInUser(user);
            
            // Redirect from login page if already logged in
            if (window.location.pathname.endsWith('index.html') || 
                window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Signup form
        document.getElementById('signupForm')?.addEventListener('submit', (e) => this.handleSignup(e));
        
        // Reset password form
        document.getElementById('resetForm')?.addEventListener('submit', (e) => this.handleResetPassword(e));
        
        // Form toggles
        document.getElementById('showSignup')?.addEventListener('click', (e) => this.toggleForm('signup'));
        document.getElementById('showLogin')?.addEventListener('click', (e) => this.toggleForm('login'));
        document.getElementById('forgotPassword')?.addEventListener('click', (e) => this.toggleForm('reset'));
        document.getElementById('showLoginFromReset')?.addEventListener('click', (e) => this.toggleForm('login'));
        
        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => this.handleLogout(e));
    }

    toggleForm(formType) {
        event.preventDefault();
        
        const forms = ['login', 'signup', 'reset'];
        forms.forEach(type => {
            const form = document.getElementById(`${type}Form`);
            if (form) {
                form.style.display = type === formType ? 'block' : 'none';
            }
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validate
        if (!this.validateEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            return;
        }
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        try {
            const result = await window.apiClient.login(email, password);
            
            if (result.success) {
                // Save user data
                localStorage.setItem('quotely_user', JSON.stringify(result.user));
                
                this.showSuccess('Login successful!');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showError('password', result.error || 'Invalid credentials');
            }
        } catch (error) {
            this.showError('password', 'Login failed. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleSignup(event) {
        event.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate
        if (!name.trim()) {
            this.showError('signupName', 'Name is required');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('signupEmail', 'Please enter a valid email address');
            return;
        }
        
        if (password.length < 6) {
            this.showError('signupPassword', 'Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('confirmPassword', 'Passwords do not match');
            return;
        }
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;
        
        try {
            const result = await window.apiClient.signUp(email, password, name);
            
            if (result.success) {
                this.showSuccess('Account created successfully! Please login.');
                this.toggleForm('login');
            } else {
                this.showError('signupEmail', result.error || 'Signup failed');
            }
        } catch (error) {
            this.showError('signupEmail', 'Failed to create account. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleResetPassword(event) {
        event.preventDefault();
        // TODO: Implement password reset
        this.showError('resetEmail', 'Password reset not implemented yet');
    }

    async handleLogout(event) {
        event.preventDefault();
        
        localStorage.removeItem('quotely_user');
        this.updateUIForLoggedOutUser();
        
        // Redirect to login
        window.location.href = 'index.html';
    }

    updateUIForLoggedInUser(user) {
        // Update UI elements
        document.querySelectorAll('.user-avatar').forEach(el => {
            el.src = user.avatar || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=4A90E2&color=fff`;
        });
        
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name || user.email;
        });
    }

    updateUIForLoggedOutUser() {
        // Reset UI elements
        document.querySelectorAll('.user-avatar').forEach(el => {
            el.src = 'https://ui-avatars.com/api/?name=User&background=4A90E2&color=fff';
        });
        
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = 'User';
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showError(fieldId, message) {
        // Your existing error showing code
        console.error(message);
        alert(message); // Temporary - replace with your UI
    }

    showSuccess(message) {
        // Your existing success showing code
        alert(message); // Temporary - replace with your UI
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
