const fs = require('fs');
const path = require('path');
const util = require('util');
const Exam = require('../models/Exam');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const access = util.promisify(fs.access);
exports.getExamQuestions = async (req, res) => {
try {
const { tipo } = req.params;
    if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
        return res.status(400).json({ success: false, msg: 'Tipo de examen inválido' });
    }
    
    try {
        const exam = await Exam.findOne({ tipo }).sort({ createdAt: -1 });
        
        if (exam) {
            return res.json({
                success: true,
                questions: exam.preguntas
            });
        }
    } catch (dbError) {
        console.warn('Error al buscar examen en la base de datos:', dbError);
    }
    
    const jsonPath = getJsonPath(tipo);
    const jsonData = await readFile(jsonPath, 'utf8');
    const questions = JSON.parse(jsonData);
    
    res.json({
        success: true,
        questions
    });
} catch (error) {
    console.error('Error al obtener preguntas:', error);
    res.status(500).json({ 
        success: false,
        msg: 'Error al obtener preguntas',
        error: error.message
    });
}
};
exports.updateExamQuestions = async (req, res) => {
try {
const { tipo } = req.params;
const { questions } = req.body;
    if (!tipo || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ 
            success: false, 
            msg: 'Datos inválidos'
        });
    }
    
    if (!['matematicas', 'lenguaje', 'ciencias'].includes(tipo)) {
        return res.status(400).json({ 
            success: false, 
            msg: 'Tipo de examen inválido'
        });
    }
    
    try {
        let exam = await Exam.findOne({ tipo }).sort({ createdAt: -1 });
        
        if (exam) {
            exam.preguntas = questions;
            await exam.save();
        } else {
            exam = new Exam({
                tipo,
                nombre: `Examen de ${getTipoExamen(tipo)}`,
                descripcion: `Examen de ${getTipoExamen(tipo)} actualizado el ${new Date().toLocaleDateString()}`,
                preguntas: questions
            });
            await exam.save();
        }
        
        console.log(`Examen de ${tipo} actualizado en la base de datos.`);
    } catch (dbError) {
        console.warn('Error al actualizar examen en base de datos:', dbError);
    }
    
    try {
        const jsonDir = path.join(__dirname, '..', '..', 'public', 'jsons');
        try {
            await access(jsonDir, fs.constants.F_OK);
        } catch (dirError) {
            await mkdir(jsonDir, { recursive: true });
        }
        
        const jsonPath = getJsonPath(tipo);
        const jsonData = JSON.stringify(questions, null, 4);
        
        await writeFile(jsonPath, jsonData, 'utf8');
        console.log(`Archivo JSON para ${tipo} actualizado: ${jsonPath}`);
        
        res.json({
            success: true,
            msg: 'Preguntas actualizadas correctamente'
        });
    } catch (fileError) {
        console.error('Error al actualizar archivo JSON:', fileError);
        res.status(500).json({ 
            success: false, 
            msg: 'Error al guardar el archivo JSON',
            error: fileError.message
        });
    }
} catch (error) {
    console.error('Error general al actualizar preguntas:', error);
    res.status(500).json({ 
        success: false, 
        msg: 'Error al actualizar preguntas',
        error: error.message
    });
}
};
function getJsonPath(tipo) {
let filename;
switch(tipo) {
    case 'matematicas':
        filename = 'Math_questions.json';
        break;
    case 'lenguaje':
        filename = 'Lenguage_questions.json';
        break;
    case 'ciencias':
        filename = 'Cience_questions.json';
        break;
    default:
        filename = `${tipo}_questions.json`;
}

return path.join(__dirname, '..', '..', 'public', 'jsons', filename);
}
function getTipoExamen(tipo) {
switch(tipo) {
case 'matematicas':
return 'Matemáticas';
case 'lenguaje':
return 'Lenguaje';
case 'ciencias':
return 'Ciencias';
default:
return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
}