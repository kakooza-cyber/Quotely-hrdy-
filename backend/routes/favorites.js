import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { DatabaseQueries } from '../supabase/queries.js';

const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);

// GET user's favorites
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { data, error, count } = await DatabaseQueries.getUserFavorites(userId, page, limit);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites'
    });
  }
});

// ADD to favorites
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { quote_id } = req.body;

    if (!quote_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing quote_id',
        message: 'Quote ID is required'
      });
    }

    const { data, error } = await DatabaseQueries.addFavorite(userId, quote_id);

    if (error) {
      if (error.message === 'Already favorited') {
        return res.status(400).json({
          success: false,
          error: 'Already favorited',
          message: 'This quote is already in your favorites'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Added to favorites'
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add favorite'
    });
  }
});

// REMOVE from favorites
router.delete('/:quoteId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { quoteId } = req.params;

    const { error } = await DatabaseQueries.removeFavorite(userId, quoteId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove favorite'
    });
  }
});

// CHECK if quote is favorited
router.get('/check/:quoteId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { quoteId } = req.params;

    const { data, error } = await DatabaseQueries.checkFavorite(userId, quoteId);

    if (error && error.code !== 'PGRST116') throw error;

    res.json({
      success: true,
      is_favorited: !!data
    });

  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite status'
    });
  }
});

export default router;
