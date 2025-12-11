import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../supabase/client.js';

const router = express.Router();

// GET user profile (authenticated users can see their own profile)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: userId,
            username: `user_${userId.substring(0, 8)}`,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        
        return res.json({
          success: true,
          data: newProfile,
          message: 'Profile created'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// UPDATE user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, avatar_url, bio } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (avatar_url) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Profile updated'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// GET user stats (favorites count, submitted quotes, etc.)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get submitted quotes count
    const { count: quotesCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', userId);

    // Get likes received on user's quotes
    const { data: userQuotes } = await supabase
      .from('quotes')
      .select('id')
      .eq('submitted_by', userId);

    const quoteIds = userQuotes?.map(q => q.id) || [];
    
    let totalLikes = 0;
    if (quoteIds.length > 0) {
      const { count: likesCount } = await supabase
        .from('quote_likes')
        .select('*', { count: 'exact', head: true })
        .in('quote_id', quoteIds);
      totalLikes = likesCount || 0;
    }

    res.json({
      success: true,
      data: {
        favorites_count: favoritesCount || 0,
        submitted_quotes: quotesCount || 0,
        total_likes_received: totalLikes
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats'
    });
  }
});

// GET user's submitted quotes
router.get('/my-quotes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('quotes')
      .select('*')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { count: totalCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('submitted_by', userId);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Get user quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user quotes'
    });
  }
});

export default router;
