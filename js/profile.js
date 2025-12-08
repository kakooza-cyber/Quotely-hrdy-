class ProfileManager {
    constructor() {
        this.userProfile = null;
        this.activeTab = 'activity';
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadProfile();
        this.setupEventListeners();
        this.loadUserData();
    }

    async checkAuth() {
        if (!window.supabaseClient || !window.supabaseClient.user) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    async loadProfile() {
        try {
            const result = await window.supabaseClient.getProfile();
            
            if (result.success) {
                this.userProfile = result.profile;
                this.displayProfile();
            } else {
                console.error('Failed to load profile:', result.error);
                this.showError('Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile');
        }
    }

    displayProfile() {
        // Update profile information
        const user = window.supabaseClient.user;
        
        // Name
        const nameElement = document.getElementById('profileName');
        if (nameElement) {
            nameElement.textContent = this.userProfile?.full_name || 
                                     user.user_metadata?.full_name || 
                                     user.email.split('@')[0];
        }

        // Email
        const emailElement = document.getElementById('profileEmail');
        if (emailElement) {
            emailElement.textContent = user.email;
        }

        // Bio
        const bioElement = document.getElementById('profileBio');
        if (bioElement && this.userProfile?.bio) {
            bioElement.textContent = this.userProfile.bio;
        }

        // Avatar
        const avatarElement = document.getElementById('profileAvatar');
        if (avatarElement && this.userProfile?.avatar_url) {
            avatarElement.src = this.userProfile.avatar_url;
        } else if (avatarElement) {
            // Generate avatar based on name
            const name = this.userProfile?.full_name || user.email.split('@')[0];
            avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=4A90E2&color=fff&bold=true`;
        }

        // Update user menu avatar as well
        const menuAvatar = document.getElementById('userAvatar');
        if (menuAvatar) {
            menuAvatar.src = avatarElement ? avatarElement.src : menuAvatar.src;
        }

        // Member since
        if (this.userProfile?.created_at) {
            const memberSince = document.querySelector('.member-since');
            if (memberSince) {
                const date = new Date(this.userProfile.created_at);
                memberSince.innerHTML = `<i class="fas fa-calendar-alt"></i> Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            }
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Edit profile button
        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.openEditProfileModal();
        });

        // Edit profile modal
        const editModal = document.getElementById('editProfileModal');
        if (editModal) {
            // Close modal buttons
            editModal.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeModal('editProfileModal');
                });
            });

            // Form submission
            document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditProfile(e.target);
            });
        }

        // Profile settings form
        document.getElementById('profileSettingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsForm(e.target);
        });

        // Discard changes button
        document.getElementById('discardChanges')?.addEventListener('click', () => {
            this.resetSettingsForm();
        });

        // Avatar upload
        document.getElementById('uploadAvatar')?.addEventListener('click', () => {
            this.triggerAvatarUpload();
        });
    }

    async loadUserData() {
        await this.loadUserStats();
        await this.loadUserFavorites();
        await this.loadUserSubmissions();
        await this.loadUserActivity();
    }

    async loadUserStats() {
        try {
            const result = await window.supabaseClient.getUserStats();
            
            if (result.success) {
                this.displayUserStats(result.stats);
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    displayUserStats(stats) {
        // Favorites
        const favoritesStat = document.getElementById('favoritesStat');
        if (favoritesStat) favoritesStat.textContent = stats.favorites || 0;

        // Likes
        const likesStat = document.getElementById('likesStat');
        if (likesStat) likesStat.textContent = stats.likes || 0;

        // Shares
        const sharesStat = document.getElementById('sharesStat');
        if (sharesStat) sharesStat.textContent = stats.shares || 0;

        // Streak
        const streakStat = document.getElementById('streakStat');
        if (streakStat) streakStat.textContent = `${stats.streak || 0} days`;

        // Views
        const viewsStat = document.getElementById('viewsStat');
        if (viewsStat) viewsStat.textContent = stats.viewed || 0;
    }

    async loadUserFavorites() {
        try {
            const result = await window.supabaseClient.getUserFavorites(1, 6); // First page, 6 items
            
            if (result.success && result.quotes.length > 0) {
                this.displayUserFavorites(result.quotes);
            } else {
                this.showEmptyFavorites();
            }
        } catch (error) {
            console.error('Error loading user favorites:', error);
        }
    }

    displayUserFavorites(quotes) {
        const container = document.getElementById('profileFavoritesGrid');
        if (!container) return;

        container.innerHTML = '';
        
        quotes.forEach(quote => {
            const quoteElement = this.createFavoriteCard(quote);
            container.appendChild(quoteElement);
        });
    }

    createFavoriteCard(quote) {
        const div = document.createElement('div');
        div.className = 'favorite-card';
        div.innerHTML = `
            <div class="favorite-content">
                <p class="favorite-text">"${quote.text.substring(0, 100)}${quote.text.length > 100 ? '...' : ''}"</p>
                <div class="favorite-meta">
                    <span class="favorite-author">${quote.author}</span>
                    <span class="favorite-category">${quote.category}</span>
                </div>
            </div>
            <div class="favorite-actions">
                <button class="btn-action view-favorite" data-quote-id="${quote.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action remove-favorite" data-quote-id="${quote.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        div.querySelector('.view-favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            this.viewFavorite(quote.id);
        });

        div.querySelector('.remove-favorite').addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.removeFavorite(quote.id, div);
        });

        div.addEventListener('click', () => {
            this.viewFavorite(quote.id);
        });

        return div;
    }

    async loadUserSubmissions() {
        // This would load user's submitted quotes from Supabase
        // For now, we'll show the empty state
        this.showEmptySubmissions();
    }

    async loadUserActivity() {
        // This would load user activity from Supabase
        // For now, we'll keep the static content
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === `${tabId}Tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Load data for the tab if needed
        if (tabId === 'favorites') {
            this.loadUserFavorites();
        } else if (tabId === 'submissions') {
            this.loadUserSubmissions();
        }
    }

    openEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        const form = document.getElementById('editProfileForm');
        
        if (modal && form) {
            // Fill form with current data
            form.querySelector('#editName').value = this.userProfile?.full_name || 
                                                    window.supabaseClient.user.user_metadata?.full_name || 
                                                    '';
            form.querySelector('#editBio').value = this.userProfile?.bio || '';
            form.querySelector('#editAvatar').value = this.userProfile?.avatar_url || '';
            
            modal.classList.add('active');
        }
        }
  closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async handleEditProfile(form) {
        const formData = new FormData(form);
        const profileData = {
            full_name: formData.get('name'),
            bio: formData.get('bio'),
            avatar_url: formData.get('avatar') || null
        };

        try {
            const result = await window.supabaseClient.updateProfile(profileData);
            
            if (result.success) {
                this.showNotification('Profile updated successfully!', 'success');
                this.closeModal('editProfileModal');
                await this.loadProfile(); // Reload profile
            } else {
                this.showNotification('Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Failed to update profile', 'error');
        }
    }

    async handleSettingsForm(form) {
        const formData = new FormData(form);
        const settingsData = {
            // Personal info
            full_name: formData.get('name'),
            username: formData.get('username'),
            bio: formData.get('bio'),
            website: formData.get('website') || null,
            location: formData.get('location') || null,
            
            // Display preferences
            theme: formData.get('theme'),
            quote_density: formData.get('quoteDensity')
        };

        // Password change
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmNewPassword');

        if (newPassword || confirmPassword || currentPassword) {
            if (!currentPassword) {
                this.showNotification('Current password is required to change password', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                this.showNotification('New passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                this.showNotification('New password must be at least 6 characters', 'error');
                return;
            }

            // Note: Password change would require Supabase Auth update
            // This is a placeholder for future implementation
            this.showNotification('Password change feature coming soon', 'info');
        }

        try {
            const result = await window.supabaseClient.updateProfile(settingsData);
            
            if (result.success) {
                this.showNotification('Settings saved successfully!', 'success');
                await this.loadProfile();
            } else {
                this.showNotification('Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    resetSettingsForm() {
        const form = document.getElementById('profileSettingsForm');
        if (form) {
            form.reset();
            this.showNotification('Changes discarded', 'info');
        }
    }

    triggerAvatarUpload() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.uploadAvatar(file);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    async uploadAvatar(file) {
        // Note: This requires Supabase Storage setup
        // This is a placeholder for future implementation
        this.showNotification('Avatar upload feature coming soon', 'info');
    }

    async removeFavorite(quoteId, element) {
        if (confirm('Remove this quote from favorites?')) {
            try {
                const result = await window.supabaseClient.toggleFavorite(quoteId);
                
                if (result.success && result.action === 'unfavorited') {
                    element.remove();
                    this.showNotification('Removed from favorites', 'success');
                    
                    // Update stats
                    await this.loadUserStats();
                }
            } catch (error) {
                console.error('Error removing favorite:', error);
                this.showNotification('Failed to remove favorite', 'error');
            }
        }
    }

    viewFavorite(quoteId) {
        window.location.href = `quote-details.html?id=${quoteId}`;
    }

    showEmptyFavorites() {
        const container = document.getElementById('profileFavoritesGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>No favorite quotes yet</h3>
                <p>Start favoriting quotes you love!</p>
                <a href="quotes.html" class="btn btn-primary">
                    <i class="fas fa-search"></i> Browse Quotes
                </a>
            </div>
        `;
    }

    showEmptySubmissions() {
        const container = document.getElementById('profileSubmissions');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-paper-plane"></i>
                <h3>No submissions yet</h3>
                <p>Submit your first quote and share wisdom with the community!</p>
                <a href="quotes.html#submitQuoteForm" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Submit a Quote
                </a>
            </div>
        `;
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
