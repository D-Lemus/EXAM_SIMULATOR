const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    // Verificar si existe el token en las cookies
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, autorización denegada' });
    }
    
    try {
        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'Token no válido' });
        }
        
        // Agregar usuario al objeto request
        req.user = user;
        next();
        
    } catch (error) {
        console.error(error);
        res.status(401).json({ msg: 'Token no válido' });
    }
};