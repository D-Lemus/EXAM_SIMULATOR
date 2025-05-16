const User = require('../models/User');
module.exports = async (req, res, next) => {
try {
if (!req.user) {
return res.status(401).json({ msg: 'No autorizado' });
}
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    
    if (req.user.role === 'admin' || adminEmails.includes(req.user.email)) {
        next();
    } else {
        res.status(403).json({ msg: 'Acceso denegado: Se requieren privilegios de administrador' });
    }
} catch (error) {
    console.error('Error en middleware de administrador:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
}
};