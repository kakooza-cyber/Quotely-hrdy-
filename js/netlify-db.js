class NetlifyDB {
    constructor() {
        this.baseUrl = '/.netlify/functions';
        this.isNetlify = window.location.hostname.includes('netlify.app');
    }

    // User Authentication
    async signup(userData) {
        return this.callFunction('users', {
            action: 'signup',
            ...userData
        });
    }

    async login(credentials) {
        return this.callFunction('users', {
            action: 'login',
            ...credentials
        });
    }

    async socialLogin(provider, token) {
        return this.callFunction('users', {
            action: 'social-login',
            provider,
            token
        });
    }

    async resetPassword(email) {
        return this.callFunction('users', {
            action: 'reset-password',
            email
        });
    }

    // Quotes
    async getDailyQuote() {
        return this.callFunction('quotes', {
            action: 'get-daily'
        });
    }

    async getQuotes(filters = {}) {
        return this.callFunction('quotes', {
            action: 'get-all',
            filters
        });
    }

    async searchQuotes(query, category = null) {
        return this.callFunction('quotes', {
            action: 'search',
            query,
            category
        });
    }

    async submitQuote(quoteData) {
        return this.callFunction('quotes', {
            action: 'submit',
            ...quoteData
        });
    }

    // Proverbs
    async getProverbs(category = null) {
        return this.callFunction('proverbs', {
            action: 'get',
            category
        });
    }

    async searchProverbs(query) {
        return this.callFunction('proverbs', {
            action: 'search',
            query
        });
    }

    // User Actions
    async likeQuote(quoteId) {
        return this.callFunction('favorites', {
            action: 'like',
            quoteId
        });
    }

    async unlikeQuote(quoteId) {
        return this.callFunction('favorites', {
            action: 'unlike',
            quoteId
        });
    }

    async favoriteQuote(quoteId) {
        return this.callFunction('favorites', {
            action: 'favorite',
            quoteId
        });
    }

    async unfavoriteQuote(quoteId) {
        return this.callFunction('favorites', {
            action: 'unfavorite',
            quoteId
        });
    }

    async getUserFavorites() {
        return this.callFunction('favorites', {
            action: 'get-user-favorites'
        });
    }

    async getUserStats() {
        return this.callFunction('users', {
            action: 'get-stats'
        });
    }

    // Newsletter
    async subscribeNewsletter(email) {
        return this.callFunction('users', {
            action: 'subscribe-newsletter',
            email
        });
    }

    // Contact Form
    async submitContact(formData) {
        return this.callFunction('contact', {
            action: 'submit',
            ...formData
        });
    }

    // Generic function call
    async callFunction(functionName, data) {
        try {
            // Check if we're on Netlify
            if (!this.isNetlify) {
                console.warn('Not running on Netlify, using mock data');
                return this.mockResponse(functionName, data);
            }

            const response = await fetch(`${this.baseUrl}/${functionName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('quotely_token')}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error calling ${functionName}:`, error);
            throw error;
        }
    }

    mockResponse(functionName, data) {
        // Return mock data for local development
        return new Promise((resolve) => {
            setTimeout(() => {
                switch (functionName) {
                    case 'users':
                        resolve(this.mockUserResponse(data.action, data));
                    case 'quotes':
                        resolve(this.mockQuoteResponse(data.action, data));
                    case 'proverbs':
                        resolve(this.mockProverbResponse(data.action, data));
                    case 'favorites':
                        resolve(this.mockFavoriteResponse(data.action, data));
                    default:
                        resolve({ success: true, message: 'Mock response' });
                }
            }, 500);
        });
    }

    mockUserResponse(action, data) {
        switch (action) {
            case 'login':
                return {
                    success: true,
                    user: {
                        id: '1',
                        name: data.email.split('@')[0],
                        email: data.email,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.email.split('@')[0])}&background=4A90E2&color=fff`
                    },
                    token: 'mock-jwt-token'
                };
            case 'signup':
                return {
                    success: true,
                    message: 'Account created successfully'
                };
            case 'get-stats':
                return {
                    stats: {
                        favorites: 12,
                        viewed: 47,
                        shared: 8,
                        streak: 5
                    }
                };
            default:
                return { success: true };
        }
    }

    mockQuoteResponse(action, data) {
        const sampleQuotes = [
            {
                id: 1,
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs",
                category: "Motivation",
                likes: 42,
                isLiked: false,
                isFavorited: false
            },
            {
                id: 2,
                text: "Life is what happens to you while you're busy making other plans.",
                author: "John Lennon",
                category: "Life",
                likes: 38,
                isLiked: true,
                isFavorited: false
            }
        ];

        switch (action) {
            case 'get-daily':
                return { quote: sampleQuotes[0] };
            case 'get-all':
                return { quotes: sampleQuotes, total: 2, page: 1 };
            case 'search':
                return { quotes: sampleQuotes.filter(q => 
                    q.text.toLowerCase().includes(data.query.toLowerCase()) ||
                    q.author.toLowerCase().includes(data.query.toLowerCase())
                ) };
            default:
                return { success: true };
        }
    }

    mockProverbResponse(action, data) {
        const sampleProverbs = [
            {
                id: 1,
                text: "A journey of a thousand miles begins with a single step.",
                origin: "Chinese",
                category: "Perseverance",
                meaning: "Even the biggest projects start with small beginnings."
            }
        ];

        return { proverbs: sampleProverbs };
    }

    mockFavoriteResponse(action, data) {
        return { success: true };
    }
}

// Export as global
window.NetlifyDB = new NetlifyDB();
