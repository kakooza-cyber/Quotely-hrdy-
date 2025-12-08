class AboutManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.loadTeamMembers();
        this.setupFAQs();
    }

    async checkAuth() {
        // About page can be public, but we check if user is logged in for contact form
        if (window.supabaseClient && window.supabaseClient.user) {
            this.setupAuthenticatedUser();
        }
    }

    setupAuthenticatedUser() {
        // Pre-fill contact form with user data if logged in
        const user = window.supabaseClient.user;
        const contactName = document.getElementById('contactName');
        const contactEmail = document.getElementById('contactEmail');
        
        if (contactName && user.user_metadata?.full_name) {
            contactName.value = user.user_metadata.full_name;
        }
        
        if (contactEmail && user.email) {
            contactEmail.value = user.email;
        }
    }

    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(contactForm);
            });
        }

        // FAQ toggle
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', (e) => {
                this.toggleFAQ(e.currentTarget);
            });
        });

        // Social links
        this.setupSocialLinks();
    }

    async handleContactForm(form) {
        const formData = new FormData(form);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject') || 'General Inquiry',
            message: formData.get('message')
        };

        // Validate
        if (!contactData.name || !contactData.email || !contactData.message) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (!this.validateEmail(contactData.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            // Save to Supabase
            if (window.supabaseClient) {
                const result = await window.supabaseClient.submitContactForm(contactData);
                
                if (result.success) {
                    this.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                    form.reset();
                    
                    // Reset to user data if logged in
                    this.setupAuthenticatedUser();
                } else {
                    this.showNotification('Failed to send message. Please try again.', 'error');
                }
            } else {
                // Fallback: Log to console
                console.log('Contact form submission:', contactData);
                this.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                form.reset();
            }
        } catch (error) {
            console.error('Error submitting contact form:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    loadTeamMembers() {
        // This could be loaded from Supabase in the future
        // For now, we'll keep the static content
        console.log('Team members loaded from static content');
    }

    setupFAQs() {
        // FAQ functionality is already in HTML/CSS
        // Add keyboard support
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleFAQ(question);
                }
            });
        });
    }

    toggleFAQ(questionElement) {
        const faqItem = questionElement.closest('.faq-item');
        const answer = faqItem.querySelector('.faq-answer');
        const icon = questionElement.querySelector('i');

        // Close all other FAQs
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.maxHeight = null;
                item.querySelector('.faq-question i').className = 'fas fa-chevron-down';
            }
        });

        // Toggle current FAQ
        if (faqItem.classList.contains('active')) {
            faqItem.classList.remove('active');
            answer.style.maxHeight = null;
            icon.className = 'fas fa-chevron-down';
        } else {
            faqItem.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            icon.className = 'fas fa-chevron-up';
        }
    }

    setupSocialLinks() {
        // Add target="_blank" to all external links
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.getAttribute('target')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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
