const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const { requireAuth, sessionTimeout } = require('../middleware/auth');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

// Apply Session Timeout to all subsequent routes
router.use(sessionTimeout);

// Protected Routes
router.post('/logout', requireAuth, authController.logout);
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, authController.updateProfile);
router.post('/change-password', requireAuth, authController.changePassword);

router.get('/balance', requireAuth, accountController.getBalance);
router.post('/deposit', requireAuth, accountController.deposit);
router.post('/withdraw', requireAuth, accountController.withdraw);

router.post('/transfer', requireAuth, transactionController.transfer);
router.get('/transactions', requireAuth, transactionController.getTransactions);

router.get('/beneficiaries', requireAuth, accountController.getBeneficiaries);
router.post('/beneficiaries', requireAuth, accountController.addBeneficiary);
router.delete('/beneficiaries/:id', requireAuth, accountController.deleteBeneficiary);

router.post('/checkbook-request', requireAuth, accountController.checkbookRequest);
router.get('/checkbook-requests', requireAuth, accountController.getCheckbookRequests);

router.post('/fd/create', requireAuth, accountController.createFD);
router.get('/fd/list', requireAuth, accountController.listFD);

module.exports = router;
