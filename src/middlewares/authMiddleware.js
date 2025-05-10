const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ msg: 'No hay token, autorización denegada' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ msg: 'Token no válido' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        res.status(401).json({ msg: 'Token no válido' });
    }
};