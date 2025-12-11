document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication (optional for about page)
    // Load about page content
    await loadAboutContent();
});

async function loadAboutContent() {
    try {
        // You might want to load this from an API endpoint
        // For now, we'll use static content
        const content = {
            title: "About Quotely Hardy",
            description: "Your daily dose of wisdom and inspiration",
            features: [
                "Curated collection of quotes and proverbs",
                "Personalized recommendations",
                "Save your favorites",
                "Daily inspiration"
            ],
            stats: {
                quotes: 10000,
                proverbs: 5000,
                users: 10000
            }
        };
        
        // Update UI with content
        document.getElementById('aboutTitle').textContent = content.title;
        document.getElementById('aboutDescription').textContent = content.description;
        
        // Update features list
        const featuresList = document.getElementById('featuresList');
        if (featuresList) {
            featuresList.innerHTML = content.features.map(feature => 
                `<li><i class="fas fa-check"></i> ${feature}</li>`
            ).join('');
        }
        
        // Update stats
        document.getElementById('statsQuotes').textContent = content.stats.quotes.toLocaleString();
        document.getElementById('statsProverbs').textContent = content.stats.proverbs.toLocaleString();
        document.getElementById('statsUsers').textContent = content.stats.users.toLocaleString();
        
    } catch (error) {
        console.error('Error loading about content:', error);
    }
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
}

// Initialize about manager
document.addEventListener('DOMContentLoaded', () => {
    window.aboutManager = new AboutManager();
});
