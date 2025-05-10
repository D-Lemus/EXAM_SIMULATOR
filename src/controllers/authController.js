const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        // Verificar si el email ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        
        // Crear nuevo usuario
        user = new User({
            nombre,
            email,
            password
        });
        
        await user.save();
        
        // Crear token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 día
        });
        
        res.status(201).json({ 
            success: true,
            user: {
                id: user._id,
                nombre: user.nombre,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        console.log('Intento de login recibido:', req.body);
        
        const { email, password } = req.body;
        
        // Verificar que se proporcionaron email y password
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Por favor proporcione email y contraseña' 
            });
        }
        
        // Buscar el usuario
        const user = await User.findOne({ email });
        
        // Si el usuario no existe
        if (!user) {
            console.log('Usuario no encontrado:', email);
            return res.status(400).json({ 
                success: false, 
                msg: 'Credenciales inválidas' 
            });
        }
        
        // Verificar la contraseña
        let isMatch = false;
        try {
            isMatch = await bcrypt.compare(password, user.password);
            console.log('Comparación de contraseñas:', isMatch);
        } catch (err) {
            console.error('Error al comparar contraseñas:', err);
        }
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Credenciales inválidas' 
            });
        }
        
        // Si todo es correcto, crear token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        // Configurar cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 día
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });
        
        // Enviar respuesta
        res.json({
            success: true,
            user: {
                id: user._id,
                nombre: user.nombre,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            msg: 'Error en el servidor' 
        });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
};

exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};