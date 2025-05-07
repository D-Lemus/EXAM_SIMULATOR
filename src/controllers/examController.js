const Exam = require('../models/Exam');

exports.getExam = async (req, res) => {
    try {
        const { tipo } = req.params;
        
        // Validar tipo de examen
        if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de examen inválido' });
        }
        
        // Obtener el examen más reciente del tipo solicitado
        const exam = await Exam.findOne({ tipo }).sort({ createdAt: -1 });
        
        if (!exam) {
            return res.status(404).json({ msg: 'Examen no encontrado' });
        }
        
        res.json(exam);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.createExam = async (req, res) => {
    try {
        const { tipo, nombre, descripcion, preguntas } = req.body;
        
        // Validar tipo de examen
        if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de examen inválido' });
        }
        
        // Crear nuevo examen
        const exam = new Exam({
            tipo,
            nombre,
            descripcion,
            preguntas
        });
        
        await exam.save();
        
        res.status(201).json({ success: true, exam });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};