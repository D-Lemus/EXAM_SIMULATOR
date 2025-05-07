const Progress = require('../models/Progress');
const Exam = require('../models/Exam');

exports.getProgress = async (req, res) => {
    try {
        // Obtener todo el progreso del usuario en todos los exámenes
        const progress = await Progress.find({ usuario: req.user.id })
                                       .populate('examen', 'tipo nombre')
                                       .sort({ fecha: -1 });
        
        // Agrupar por tipo de examen y tomar el más reciente
        const progressByType = {};
        
        progress.forEach(p => {
            if (!progressByType[p.tipo] || new Date(p.fecha) > new Date(progressByType[p.tipo].fecha)) {
                progressByType[p.tipo] = {
                    id: p._id,
                    tipo: p.tipo,
                    examen: p.examen,
                    porcentajeCompletado: p.porcentajeCompletado,
                    fecha: p.fecha
                };
            }
        });
        
        // Calcular porcentaje total
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
        console.error(error);
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
        
        // Validar tipo de examen
        if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
            return res.status(400).json({ msg: 'Tipo de examen inválido' });
        }
        
        // Buscar examen
        const exam = await Exam.findById(examenId);
        if (!exam) {
            return res.status(404).json({ msg: 'Examen no encontrado' });
        }
        
        // Calcular porcentaje completado
        const porcentajeCompletado = (preguntasRespondidas.length / exam.preguntas.length) * 100;
        
        // Crear o actualizar el progreso
        let progress = await Progress.findOne({
            usuario: req.user.id,
            examen: examenId
        });
        
        if (progress) {
            // Actualizar progreso existente
            progress.preguntasRespondidas = preguntasRespondidas;
            
            // Convertir el objeto respuestas a un Map
            const respuestasMap = new Map();
            Object.keys(respuestas).forEach(key => {
                respuestasMap.set(key, respuestas[key]);
            });
            
            progress.respuestas = respuestasMap;
            progress.porcentajeCompletado = porcentajeCompletado;
        } else {
            // Crear nuevo progreso
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
        
        res.json({ 
            success: true, 
            progress: {
                id: progress._id,
                porcentajeCompletado: progress.porcentajeCompletado
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};