document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    if (!apiClient.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Load user profile
    await loadUserProfile();
    
    // Load user stats
    await loadUserStats();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadUserProfile() {
    try {
        const profile = await API.user.getProfile();
        
        // Fill form fields
        document.getElementById('name').value = profile.name || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('bio').value = profile.bio || '';
        
        // Update display name
        document.getElementById('displayName').textContent = profile.name || 'User';
        
        // Update avatar if exists
        if (profile.avatar) {
            document.getElementById('avatarPreview').src = profile.avatar;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}

async function loadUserStats() {
    try {
        const stats = await API.user.getStats();
        
        // Update stats in UI
        document.getElementById('joinedDate').textContent = formatDate(stats.joinedAt);
        document.getElementById('totalFavoritesStats').textContent = stats.totalFavorites || 0;
        document.getElementById('quotesViewed').textContent = stats.quotesViewed || 0;
        document.getElementById('proverbsViewed').textContent = stats.proverbsViewed || 0;
        document.getElementById('accountType').textContent = stats.accountType || 'Free';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                bio: document.getElementById('bio').value,
            };
            
            try {
                await API.user.updateProfile(formData);
                showNotification('Profile updated successfully!', 'success');
                
                // Update display name
                document.getElementById('displayName').textContent = formData.name;
                
                // Update local storage
                const user = JSON.parse(localStorage.getItem('user'));
                user.name = formData.name;
                localStorage.setItem('user', JSON.stringify(user));
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }
    
    // Avatar upload
    const avatarInput = document.getElementById('avatarInput');
    const avatarBtn = document.getElementById('avatarBtn');
    
    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image.*')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification('Image size must be less than 5MB', 'error');
                return;
            }
            
            try {
                // In a real app, you would upload to your backend
                // For now, we'll create a local preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('avatarPreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                showNotification('Avatar updated (preview only)', 'success');
            } catch (error) {
                showNotification('Failed to update avatar', 'error');
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await API.auth.logout();
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                // Clear local storage
                apiClient.clearToken();
                localStorage.removeItem('user');
                
                // Redirect to login
                window.location.href = 'index.html';
            }
        });
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Add close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize profile manager
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});
