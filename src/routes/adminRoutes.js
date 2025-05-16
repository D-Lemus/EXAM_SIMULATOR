const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Solo usar authMiddleware por ahora, quitar la referencia a adminMiddleware
router.use(authMiddleware);

// Ruta para verificar si el usuario es administrador
router.get('/check', (req, res) => {
    // Verificación simple basada en email
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    if (req.user && (req.user.role === 'admin' || adminEmails.includes(req.user.email))) {
        return res.json({ success: true, isAdmin: true });
    }
    return res.status(403).json({ success: false, isAdmin: false });
});

// Rutas protegidas - solo accesibles por admins
router.get('/exams/:tipo', checkAdminInline, adminController.getExamQuestions);
router.post('/exams/:tipo', checkAdminInline, adminController.updateExamQuestions);

// Middleware inline para verificar admin
function checkAdminInline(req, res, next) {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    if (req.user && (req.user.role === 'admin' || adminEmails.includes(req.user.email))) {
        return next();
    }
    return res.status(403).json({ msg: 'Acceso denegado: Se requieren privilegios de administrador' });
}

module.exports = router;