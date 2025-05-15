const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 

exports.register = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        // Verify if email already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }
        
        // Create new user
        user = new User({
            nombre,
            email,
            password
        });
        
        await user.save();
        
        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 day
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
        console.log('Login attempt received:', req.body);
        
        const { email, password } = req.body;
        
        // Verify that email and password were provided
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Por favor proporcione email y contraseña' 
            });
        }
        
        // Find the user
        const user = await User.findOne({ email });
        
        // If user doesn't exist
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ 
                success: false, 
                msg: 'Credenciales inválidas' 
            });
        }
        
        // Check password - using the User model method instead of direct bcrypt
        const isMatch = await user.comparePassword(password);
        console.log('Password comparison:', isMatch);
        
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Credenciales inválidas' 
            });
        }
        
        // If everything is correct, create token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });
        
        // Send response
        res.json({
            success: true,
            user: {
                id: user._id,
                nombre: user.nombre,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
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