import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { DatabaseQueries } from '../supabase/queries.js';
import { supabase } from '../supabase/client.js';

const router = express.Router();

// GET dashboard stats (requires authentication)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get dashboard stats
    const stats = await DatabaseQueries.getDashboardStats(userId);

    // Get recent quotes
    const { data: recentQuotes } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent proverbs
    const { data: recentProverbs } = await supabase
      .from('proverbs')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...stats,
        recent_quotes: recentQuotes || [],
        recent_proverbs: recentProverbs || []
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

// GET trending quotes (most liked)
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    // Get quotes with their like counts
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get like counts for each quote
    const quoteIds = quotes.map(q => q.id);
    const { data: likes } = await supabase
      .from('quote_likes')
      .select('quote_id')
      .in('quote_id', quoteIds);

    // Count likes for each quote
    const likeCounts = {};
    likes.forEach(like => {
      likeCounts[like.quote_id] = (likeCounts[like.quote_id] || 0) + 1;
    });

    // Sort quotes by like count
    const trendingQuotes = quotes
      .map(quote => ({
        ...quote,
        like_count: likeCounts[quote.id] || 0
      }))
      .sort((a, b) => b.like_count - a.like_count)
      .slice(0, 10);

    res.json({
      success: true,
      data: trendingQuotes
    });

  } catch (error) {
    console.error('Trending quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending quotes'
    });
  }
});

// GET daily quote
router.get('/daily', async (req, res) => {
  try {
    // Use date to get a consistent "daily" quote
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Get total count
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    if (!count || count === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No quotes available'
      });
    }

    // Use seed to get consistent index for the day
    const dailyIndex = seed % count;
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .range(dailyIndex, dailyIndex)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Daily quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily quote'
    });
  }
});

// GET system health
router.get('/health', async (req, res) => {
  try {
    // Check all tables
    const [quotes, proverbs, users, favorites] = await Promise.all([
      supabase.from('quotes').select('id', { count: 'exact', head: true }),
      supabase.from('proverbs').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_favorites').select('id', { count: 'exact', head: true })
    ]);

    res.json({
      success: true,
      data: {
        tables: {
          quotes: !quotes.error,
          proverbs: !proverbs.error,
          users: !users.error,
          favorites: !favorites.error
        },
        counts: {
          quotes: quotes.count || 0,
          proverbs: proverbs.count || 0,
          users: users.count || 0,
          favorites: favorites.count || 0
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health'
    });
  }
});

export default router;
