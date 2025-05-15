require('dotenv').config();

console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken'); // Añadido el import de jwt

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const progressRoutes = require('./src/routes/progressRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
require('./src/config/db');

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/progress', progressRoutes);

// Ruta principal
app.get('/', (req, res) => {
    // Simplemente sirve home.html sin verificar tokens
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Ruta para la página de usuario (protegida)
app.get('/exam', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'exam.html'));
});

// Rutas para los exámenes
app.get('/Examen_mate.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Examen_mate.html'));
});

app.get('/Examen_Lenguaje.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Examen_Lenguaje.html'));
});

app.get('/Examen_Ciencias.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Examen_Ciencias.html'));
});

// Middleware para verificar autenticación
function checkAuth(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/');
    }
    
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.redirect('/');
    }
}

// Iniciar el servidor - Esta parte faltaba
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


