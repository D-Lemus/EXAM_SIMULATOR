const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout); // Changed from GET to POST to match frontend

// Protected routes
router.get('/user', authMiddleware, authController.getUserInfo);

module.exports = router;