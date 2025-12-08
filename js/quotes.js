class QuotesManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalQuotes = 0;
        this.viewMode = 'grid';
        this.filters = {
            category: '',
            author: '',
            search: '',
            sort: 'newest'
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadInitialData();
        this.setupEventListeners();
        await this.loadQuotes();
    }

    async checkAuth() {
        if (!window.supabaseClient || !window.supabaseClient.user) {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    async loadInitialData() {
        try {
            // Load categories for filter
            await this.loadCategories();
            
            // Load popular authors
            await this.loadPopularAuthors();
            
            // Set up view mode from localStorage
            const savedViewMode = localStorage.getItem('quotely_view_mode');
            if (savedViewMode) {
                this.setViewMode(savedViewMode);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadQuotes() {
        try {
            const container = document.getElementById('quotesGrid');
            if (!container) return;

            // Show loading
            container.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading quotes...</p>
                </div>
            `;

            // Prepare filters
            const supabaseFilters = {
                category: this.filters.category || null,
                author: this.filters.author || null,
                search: this.filters.search || null
            };

            // Get quotes from Supabase
            const result = await window.supabaseClient.getQuotes(
                supabaseFilters,
                this.currentPage,
                this.pageSize
            );

            if (result.success) {
                this.quotes = result.quotes;
                this.totalQuotes = result.total;
                
                // Display quotes
                this.displayQuotes(result.quotes);
                
                // Update pagination
                this.updatePagination(result);
                
                // Update results count
                this.updateResultsCount(result.total);
            } else {
                this.showError('Failed to load quotes. Please try again.');
                this.displayEmptyState();
            }
        } catch (error) {
            console.error('Error loading quotes:', error);
            this.showError('Failed to load quotes. Please try again.');
            this.displayEmptyState();
        }
    }

    async loadCategories() {
        try {
            const result = await window.supabaseClient.getCategories();
            if (result.success) {
                this.populateCategoryFilter(result.categories);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadPopularAuthors() {
        // This could be enhanced to get actual popular authors from Supabase
        // For now, we'll use a static list or implement later
    }

    displayQuotes(quotes) {
        const container = document.getElementById('quotesGrid');
        if (!container || !quotes || quotes.length === 0) {
            this.displayEmptyState();
            return;
        }

        container.innerHTML = '';
        
        quotes.forEach(quote => {
            const quoteElement = this.createQuoteElement(quote);
            container.appendChild(quoteElement);
        });
    }

    createQuoteElement(quote) {
        const quoteDiv = document.createElement('div');
        quoteDiv.className = `quote-item ${this.viewMode}`;
        
        let html = '';
        
        switch(this.viewMode) {
            case 'grid':
                html = this.createGridView(quote);
                break;
            case 'list':
                html = this.createListView(quote);
                break;
            case 'minimal':
                html = this.createMinimalView(quote);
                break;
            default:
                html = this.createGridView(quote);
        }
        
        quoteDiv.innerHTML = html;
        
        // Add event listeners
        this.addQuoteEventListeners(quoteDiv, quote);
        
        return quoteDiv;
    }

    createGridView(quote) {
        return `
            <div class="quote-card">
                <div class="quote-background" style="background-image: url('${quote.background_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f'}')"></div>
                <div class="quote-content">
                    <p class="quote-text">"${quote.text}"</p>
                    <p class="quote-author">- ${quote.author}</p>
                    <div class="quote-meta">
                        <span class="quote-category">${quote.category}</span>
                        <div class="quote-stats">
                            <span class="quote-likes">
                                <i class="fas fa-heart"></i> ${quote.likes_count || 0}
                            </span>
                            <span class="quote-favorites">
                                <i class="fas fa-star"></i> ${quote.favorites_count || 0}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="quote-actions">
                    <button class="btn-action like-btn ${quote.is_liked ? 'active' : ''}" 
                            data-quote-id="${quote.id}" data-action="like">
                        <i class="${quote.is_liked ? 'fas' : 'far'} fa-heart"></i>
                        <span class="like-count">${quote.likes_count || 0}</span>
                    </button>
                    <button class="btn-action favorite-btn ${quote.is_favorited ? 'active' : ''}" 
                            data-quote-id="${quote.id}" data-action="favorite">
                        <i class="${quote.is_favorited ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <button class="btn-action share-btn" data-quote-id="${quote.id}" data-action="share">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="btn-action copy-btn" data-quote-id="${quote.id}" data-action="copy">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }

    createListView(quote) {
        return `
            <div class="quote-list-item">
                <div class="list-content">
                    <p class="quote-text">"${quote.text}"</p>
                    <div class="list-meta">
                        <span class="quote-author">${quote.author}</span>
                        <span class="quote-category">${quote.category}</span>
                        <div class="list-stats">
                            <span class="stat-item">
                                <i class="fas fa-heart"></i> ${quote.likes_count || 0}
                            </span>
                            <span class="stat-item">
                                <i class="fas fa-star"></i> ${quote.favorites_count || 0}
                            </span>
                            <span class="stat-item">
                                <i class="fas fa-calendar"></i> ${new Date(quote.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="list-actions">
                    <button class="btn-action like-btn ${quote.is_liked ? 'active' : ''}" 
                            data-quote-id="${quote.id}" data-action="like">
                        <i class="${quote.is_liked ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="btn-action favorite-btn ${quote.is_favorited ? 'active' : ''}" 
                            data-quote-id="${quote.id}" data-action="favorite">
                        <i class="${quote.is_favorited ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
            </div>
        `;
    }

    createMinimalView(quote) {
        return `
            <div class="quote-minimal">
                <p class="quote-text">"${quote.text}"</p>
                <div class="minimal-meta">
                    <span class="quote-author">${quote.author}</span>
                    <span class="quote-category">${quote.category}</span>
                </div>
            </div>
        `;
    }

    addQuoteEventListeners(element, quote) {
        // Like button
        const likeBtn = element.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.handleLike(quote.id, likeBtn);
            });
        }

        // Favorite button
        const favoriteBtn = element.querySelector('.favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.handleFavorite(quote.id, favoriteBtn);
            });
        }

        // Share button
        const shareBtn = element.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareQuote(quote);
            });
        }

        // Copy button
        const copyBtn = element.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyQuote(quote);
            });
        }

        // View quote details on click
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-action')) {
                this.viewQuoteDetails(quote.id);
            }
        });
    }

    populateCategoryFilter(categories) {
        const select = document.getElementById('quoteCategory');
        if (!select) return;

        // Clear existing options (keep the first "All Categories")
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        // Search
        document.getElementById('searchQuotesBtn')?.addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('quoteSearch')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Filters
        document.getElementById('quoteCategory')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.currentPage = 1;
            this.loadQuotes();
        });

        document.getElementById('quoteAuthor')?.addEventListener('change', (e) => {
            this.filters.author = e.target.value;
            this.currentPage = 1;
            this.loadQuotes();
        });

        document.getElementById('quoteSort')?.addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.currentPage = 1;
            this.loadQuotes();
        });

        // Clear filters
        document.getElementById('clearQuoteFilters')?.addEventListener('click', () => {
            this.clearFilters();
        });

        // View mode toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewMode = e.currentTarget.dataset.view;
                this.setViewMode(viewMode);
            });
        });

        // Pagination
        document.getElementById('prevQuotesPage')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadQuotes();
            }
        });

        document.getElementById('nextQuotesPage')?.addEventListener('click', () => {
            const totalPages = Math.ceil(this.totalQuotes / this.pageSize);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.loadQuotes();
            }
        });

        // Submit quote form
        document.getElementById('submitQuoteForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmitQuote(e.target);
        });

        // Author view buttons
        document.querySelectorAll('.view-author').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const author = e.currentTarget.dataset.author;
                this.viewAuthorQuotes(author);
            });
        });
    }

    setViewMode(mode) {
        this.viewMode = mode;
        localStorage.setItem('quotely_view_mode', mode);

        // Update UI
        document.querySelectorAll('.view-btn').forEach(btn => {
            if (btn.dataset.view === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update container class
        const container = document.getElementById('quotesGrid');
        if (container) {
            container.className = `quotes-${mode}`;
            
            // Reload quotes with new view mode
            if (this.quotes) {
                this.displayQuotes(this.quotes);
            }
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('quoteSearch');
        if (searchInput) {
            this.filters.search = searchInput.value.trim();
            this.currentPage = 1;
            this.loadQuotes();
        }
    }

    clearFilters() {
        this.filters = {
            category: '',
            author: '',
            search: '',
            sort: 'newest'
        };

        // Reset UI
        const categorySelect = document.getElementById('quoteCategory');
        const authorSelect = document.getElementById('quoteAuthor');
        const sortSelect = document.getElementById('quoteSort');
        const searchInput = document.getElementById('quoteSearch');

        if (categorySelect) categorySelect.value = '';
        if (authorSelect) authorSelect.value = '';
        if (sortSelect) sortSelect.value = 'newest';
        if (searchInput) searchInput.value = '';

        this.currentPage = 1;
        this.loadQuotes();
    }

    async handleLike(quoteId, button) {
        try {
            const result = await window.supabaseClient.toggleLike(quoteId);
            
            if (result.success) {
                // Update button UI
                const icon = button.querySelector('i');
                const countSpan = button.querySelector('.like-count');
                
                if (result.action === 'liked') {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    button.classList.add('active');
                    
                    if (countSpan) {
                        countSpan.textContent = parseInt(countSpan.textContent) + 1;
                    }
                    
                    this.showNotification('Quote liked!', 'success');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    button.classList.remove('active');
                    
                    if (countSpan) {
                        countSpan.textContent = parseInt(countSpan.textContent) - 1;
                    }
                    
                    this.showNotification('Quote unliked', 'info');
                }
            } else {
                this.showNotification('Failed to like quote', 'error');
            }
        } catch (error) {
            console.error('Error handling like:', error);
            this.showNotification('Failed to like quote', 'error');
        }
    }

    async handleFavorite(quoteId, button) {
        try {
            const result = await window.supabaseClient.toggleFavorite(quoteId);
            
            if (result.success) {
                // Update button UI
                const icon = button.querySelector('i');
                
                if (result.action === 'favorited') {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    button.classList.add('active');
                    this.showNotification('Added to favorites!', 'success');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    button.classList.remove('active');
                    this.showNotification('Removed from favorites', 'info');
                }
            } else {
                this.showNotification('Failed to favorite quote', 'error');
            }
        } catch (error) {
            console.error('Error handling favorite:', error);
            this.showNotification('Failed to favorite quote', 'error');
        }
    }

    async handleSubmitQuote(form) {
        const formData = new FormData(form);
        const quoteData = {
            text: formData.get('quoteText'),
            author: formData.get('quoteAuthor'),
            category: formData.get('category'),
            source: formData.get('source') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
        };

        // Validate
        if (!quoteData.text || !quoteData.author || !quoteData.category) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        try {
            const result = await window.supabaseClient.submitQuote(quoteData);
            
            if (result.success) {
                this.showNotification('Quote submitted successfully! It will be reviewed before publishing.', 'success');
                form.reset();
                
                // Reload quotes to show new submission
                this.loadQuotes();
            } else {
                this.showNotification(result.error || 'Failed to submit quote', 'error');
            }
        } catch (error) {
            console.error('Error submitting quote:', error);
            this.showNotification('Failed to submit quote', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    shareQuote(quote) {
        const text = `"${quote.text}" - ${quote.author}`;
        const url = `${window.location.origin}/quote.html?id=${quote.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Inspiring Quote',
                text: text,
                url: url
            });
        } else {
              // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${text}\n\n${url}`);
            this.showNotification('Quote link copied to clipboard!', 'success');
        }
    }

    copyQuote(quote) {
        const text = `"${quote.text}" - ${quote.author}`;
        navigator.clipboard.writeText(text);
        this.showNotification('Quote copied to clipboard!', 'success');
    }

    viewQuoteDetails(quoteId) {
        // Navigate to quote details page (create this page if needed)
        window.location.href = `quote-details.html?id=${quoteId}`;
    }

    viewAuthorQuotes(authorName) {
        // Filter by author
        this.filters.author = authorName;
        this.currentPage = 1;
        this.loadQuotes();
    }

    updatePagination(result) {
        const prevBtn = document.getElementById('prevQuotesPage');
        const nextBtn = document.getElementById('nextQuotesPage');
        const pageNumbers = document.getElementById('pageNumbers');
        
        if (!prevBtn || !nextBtn || !pageNumbers) return;

        const totalPages = Math.ceil(result.total / this.pageSize);
        
        // Previous button
        prevBtn.disabled = this.currentPage === 1;
        
        // Next button
        nextBtn.disabled = this.currentPage === totalPages;
        
        // Page numbers
        pageNumbers.innerHTML = '';
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.loadQuotes();
            });
            pageNumbers.appendChild(pageBtn);
        }
    }

    updateResultsCount(total) {
        const countElement = document.getElementById('resultsCount');
        if (countElement) {
            countElement.textContent = total;
        }
    }

    displayEmptyState() {
        const container = document.getElementById('quotesGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-quote-right"></i>
                <h3>No quotes found</h3>
                <p>Try changing your search or filters</p>
                <button class="btn btn-primary" id="clearFiltersBtn">Clear All Filters</button>
            </div>
        `;

        // Add event listener to clear filters button
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.clearFilters();
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

// Initialize quotes manager
document.addEventListener('DOMContentLoaded', () => {
    window.quotesManager = new QuotesManager();
});
