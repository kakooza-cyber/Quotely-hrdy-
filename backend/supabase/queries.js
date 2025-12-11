import { supabase } from './client.js';

export const DatabaseQueries = {
  // User Management - using user_profiles table
  async getUserById(id) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') return { error };
    return { data };
  },

  async createUserProfile(userData) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([userData])
      .select()
      .single();
    
    return { data, error };
  },

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Quotes
  async getQuotes(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.author) {
      query = query.ilike('author', `%${filters.author}%`);
    }
    
    if (filters.category) {
      query = query.contains('categories', [filters.category]);
    }
    
    if (filters.search) {
      query = query.or(`content.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error, count };
  },

  async getQuoteById(id) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async getRandomQuote() {
    // Get total count first
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });
    
    if (!count || count === 0) {
      return { data: null, error: { message: 'No quotes found' } };
    }
    
    // Get random offset
    const randomOffset = Math.floor(Math.random() * count);
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .range(randomOffset, randomOffset)
      .single();
    
    return { data, error };
  },

  // Proverbs - NEW
  async getProverbs(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('proverbs')
      .select('*', { count: 'exact' });
    
    if (filters.origin) {
      query = query.ilike('origin', `%${filters.origin}%`);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.search) {
      query = query.or(`content.ilike.%${filters.search}%,meaning.ilike.%${filters.search}%`);
    }
    
    // Only show approved proverbs for non-admins
    if (filters.status !== 'all') {
      query = query.eq('status', 'approved');
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error, count };
  },

  async getProverbById(id) {
    const { data, error } = await supabase
      .from('proverbs')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async getRandomProverb() {
    // Get total count of approved proverbs
    const { count } = await supabase
      .from('proverbs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    if (!count || count === 0) {
      return { data: null, error: { message: 'No proverbs found' } };
    }
    
    // Get random offset
    const randomOffset = Math.floor(Math.random() * count);
    
    const { data, error } = await supabase
      .from('proverbs')
      .select('*')
      .eq('status', 'approved')
      .range(randomOffset, randomOffset)
      .single();
    
    return { data, error };
  },

  async createProverb(proverbData) {
    const { data, error } = await supabase
      .from('proverbs')
      .insert([proverbData])
      .select()
      .single();
    
    return { data, error };
  },

  // Favorites - using user_favorites table
  async getUserFavorites(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('user_favorites')
      .select(`
        *,
        quotes:quote_id(*)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { data, error, count };
  },

  async addFavorite(userId, quoteId) {
    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('quote_id', quoteId)
      .single();
    
    if (existing) {
      return { data: existing, error: { message: 'Already favorited' } };
    }
    
    const { data, error } = await supabase
      .from('user_favorites')
      .insert([{
        user_id: userId,
        quote_id: quoteId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async removeFavorite(userId, quoteId) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('quote_id', quoteId);
    
    return { error };
  },

  async checkFavorite(userId, quoteId) {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('quote_id', quoteId)
      .single();
    
    if (error && error.code !== 'PGRST116') return { error };
    return { data };
  },

  // Dashboard Stats
  async getDashboardStats(userId = null) {
    const [
      { count: totalQuotes },
      { count: totalUsers },
      { count: totalFavorites },
      { count: totalProverbs },
      { count: userFavoritesCount },
      { count: userQuotesCount }
    ] = await Promise.all([
      supabase.from('quotes').select('*', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_favorites').select('*', { count: 'exact', head: true }),
      supabase.from('proverbs').select('*', { count: 'exact', head: true }),
      userId ? supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId) : Promise.resolve({ count: 0 }),
      userId ? supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userId) : Promise.resolve({ count: 0 })
    ]);
    
    return {
      total_quotes: totalQuotes || 0,
      total_users: totalUsers || 0,
      total_favorites: totalFavorites || 0,
      total_proverbs: totalProverbs || 0,
      user_favorites: userFavoritesCount || 0,
      user_quotes: userQuotesCount || 0
    };
  }
};
