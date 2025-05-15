const Progress = require('../models/Progress');
const Exam = require('../models/Exam');

exports.getProgress = async (req, res) => {
    try {
        // Get all user progress for all exams
        const progress = await Progress.find({ usuario: req.user.id })
                                      .populate('examen', 'tipo nombre')
                                      .sort({ fecha: -1 });
        
        console.log('User progress found:', progress.length, 'records');
        
        // Group by exam type and take the most recent
        const progressByType = {};
        
        progress.forEach(p => {
            const tipo = p.tipo; // Use the tipo field directly from Progress model
            
            if (!progressByType[tipo] || new Date(p.fecha) > new Date(progressByType[tipo].fecha)) {
                progressByType[tipo] = {
                    id: p._id,
                    tipo: tipo,
                    examen: p.examen,
                    porcentajeCompletado: p.porcentajeCompletado,
                    fecha: p.fecha
                };
            }
        });
        
        // Calculate total percentage
        let porcentajeTotal = 0;
        let tiposContados = 0;
        
        for (const tipo in progressByType) {
            porcentajeTotal += progressByType[tipo].porcentajeCompletado;
            tiposContados++;
        }
        
        const promedioTotal = tiposContados > 0 ? porcentajeTotal / tiposContados : 0;
        
        res.json({
            success: true,
            progress: Object.values(progressByType),
            porcentajeTotal: Math.round(promedioTotal)
        });
        
    } catch (error) {
        console.error('Error getting progress:', error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.getProgressByType = async (req, res) => {
    try {
        const { tipo } = req.params;
        
        // Validar tipo de examen
        if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de examen inválido' });
        }
        
        // Obtener el examen más reciente
        const exam = await Exam.findOne({ tipo }).sort({ createdAt: -1 });
        
        if (!exam) {
            return res.status(404).json({ msg: 'Examen no encontrado' });
        }
        
        // Buscar progreso del usuario en este examen
        let progress = await Progress.findOne({ 
            usuario: req.user.id,
            examen: exam._id
        });
        
        // Si no existe, crear uno nuevo
        if (!progress) {
            progress = new Progress({
                usuario: req.user.id,
                examen: exam._id,
                tipo
            });
            
            await progress.save();
        }
        
        res.json({
            success: true,
            progress: {
                id: progress._id,
                preguntasRespondidas: progress.preguntasRespondidas,
                respuestas: Object.fromEntries(progress.respuestas),
                porcentajeCompletado: progress.porcentajeCompletado
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.saveProgress = async (req, res) => {
    try {
        const { examenId, tipo, preguntasRespondidas, respuestas } = req.body;
        
        console.log('Saving progress:', {
            userId: req.user.id,
            examenId,
            tipo,
            preguntasCount: preguntasRespondidas.length,
            respuestasCount: Object.keys(respuestas).length
        });
        
        // Validate exam type
        if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de examen inválido' });
        }
        
        // Find exam
        const exam = await Exam.findById(examenId);
        if (!exam) {
            return res.status(404).json({ msg: 'Examen no encontrado' });
        }
        
        // Calculate completion percentage
        const porcentajeCompletado = exam.preguntas.length > 0 
            ? (preguntasRespondidas.length / exam.preguntas.length) * 100 
            : 0;
        
        // Create or update progress
        let progress = await Progress.findOne({
            usuario: req.user.id,
            examen: examenId
        });
        
        if (progress) {
            // Update existing progress
            progress.preguntasRespondidas = preguntasRespondidas;
            
            // Convert answers object to Map
            const respuestasMap = new Map();
            Object.keys(respuestas).forEach(key => {
                respuestasMap.set(key, respuestas[key]);
            });
            
            progress.respuestas = respuestasMap;
            progress.porcentajeCompletado = porcentajeCompletado;
            progress.tipo = tipo; // Ensure tipo is set correctly
        } else {
            // Create new progress
            const respuestasMap = new Map();
            Object.keys(respuestas).forEach(key => {
                respuestasMap.set(key, respuestas[key]);
            });
            
            progress = new Progress({
                usuario: req.user.id,
                examen: examenId,
                tipo,
                preguntasRespondidas,
                respuestas: respuestasMap,
                porcentajeCompletado
            });
        }
        
        await progress.save();
        console.log('Progress saved successfully:', {
            id: progress._id,
            tipo: progress.tipo,
            porcentajeCompletado: progress.porcentajeCompletado
        });
        
        res.json({ 
            success: true, 
            progress: {
                id: progress._id,
                tipo: progress.tipo,
                porcentajeCompletado: progress.porcentajeCompletado
            }
        });
        
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};