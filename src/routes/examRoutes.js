const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/:tipo', examController.getExam);

// Rutas protegidas
router.post('/', authMiddleware, examController.createExam); // Solo para admin

module.exports = router;