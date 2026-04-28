const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin, sessionTimeout } = require('../middleware/auth');

// Apply middleware
router.use(sessionTimeout);
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/transactions', adminController.getAllTransactions);
router.get('/logs', adminController.getLogs);
router.get('/checkbook-requests', adminController.getAllCheckbookRequests);
router.put('/checkbook/:id', adminController.updateCheckbookStatus);

module.exports = router;
