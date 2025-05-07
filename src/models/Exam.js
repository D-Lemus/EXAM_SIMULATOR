const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['matematicas', 'lenguaje', 'ciencias'],
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    descripcion: String,
    preguntas: [{
        id: String,
        text: String,
        options: [String],
        correctAnswer: Number,
        defaultFeedback: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exam', ExamSchema);