const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, analyticsController.getOverview);
router.get('/users', protect, analyticsController.getUserStats);
router.get('/orders', protect, analyticsController.getOrderStats);
router.get('/products', protect, analyticsController.getProductStats);
router.get('/revenue', protect, analyticsController.getRevenueStats);

module.exports = router;