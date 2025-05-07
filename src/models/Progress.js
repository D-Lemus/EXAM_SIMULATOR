const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    tipo: {
        type: String,
        enum: ['matematicas', 'lenguaje', 'ciencias'],
        required: true
    },
    preguntasRespondidas: {
        type: [String], // Array de IDs de preguntas respondidas
        default: []
    },
    respuestas: {
        type: Map,
        of: Number,
        default: {}
    },
    porcentajeCompletado: {
        type: Number,
        default: 0
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Progress', ProgressSchema);