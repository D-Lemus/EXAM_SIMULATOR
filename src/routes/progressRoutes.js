const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas requieren autenticación
router.use(authMiddleware);

router.get('/', progressController.getProgress);
router.post('/', progressController.saveProgress);
router.get('/:tipo', progressController.getProgressByType);

module.exports = router;