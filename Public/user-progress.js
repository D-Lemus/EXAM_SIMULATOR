// Función para obtener progreso general
async function obtenerProgresoGeneral() {
    try {
        const respuesta = await fetch('/api/progress');
        
        if (respuesta.status === 401) {
            return { success: false, msg: 'No autenticado' };
        }
        
        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener progreso:', error);
        return { success: false, msg: 'Error de conexión' };
    }
}

// Función para obtener progreso de un tipo específico de examen
async function obtenerProgresoTipo(tipo) {
    try {
        const respuesta = await fetch(`/api/progress/${tipo}`);
        
        if (respuesta.status === 401) {
            return { success: false, msg: 'No autenticado' };
        }
        
        return await respuesta.json();
    } catch (error) {
        console.error(`Error al obtener progreso de ${tipo}:`, error);
        return { success: false, msg: 'Error de conexión' };
    }
}

// Función para guardar progreso
async function guardarProgreso(examenId, tipo, preguntasRespondidas, respuestas) {
    try {
        const respuesta = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                examenId,
                tipo,
                preguntasRespondidas,
                respuestas
            })
        });
        
        if (respuesta.status === 401) {
            window.location.href = '/';
            return { success: false, msg: 'No autenticado' };
        }
        
        const result = await respuesta.json();
        
        // Si estamos en la página principal, actualizar el progreso después de guardar
        if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
            actualizarProgresoUI();
        }
        
        return result;
    } catch (error) {
        console.error('Error al guardar progreso:', error);
        return { success: false, msg: 'Error de conexión' };
    }
}

// Función para cargar examen desde la API
async function cargarExamenAPI(tipo) {
    try {
        const respuesta = await fetch(`/api/exams/${tipo}`);
        return await respuesta.json();
    } catch (error) {
        console.error(`Error al cargar examen de ${tipo}:`, error);
        return null;
    }
}

// Función para actualizar la interfaz de progreso
function actualizarUIProgreso(progresoData) {
    if (!progresoData || !progresoData.success) return;
    
    // Actualizar barras de progreso
    const mathProgress = document.querySelector('.math-progress');
    const languageProgress = document.querySelector('.language-progress');
    const scienceProgress = document.querySelector('.science-progress');
    const totalProgress = document.querySelector('.total-progress');
    
    // Actualizar porcentajes mostrados
    const mathPercent = document.querySelector('.progress-title:nth-of-type(1) .progress-percent');
    const languagePercent = document.querySelector('.progress-title:nth-of-type(2) .progress-percent');
    const sciencePercent = document.querySelector('.progress-title:nth-of-type(3) .progress-percent');
    const totalPercent = document.querySelector('.total-percent');
    
    // Encontrar progreso por tipo
    const matematicas = progresoData.progress.find(p => p.tipo === 'matematicas');
    const lenguaje = progresoData.progress.find(p => p.tipo === 'lenguaje');
    const ciencias = progresoData.progress.find(p => p.tipo === 'ciencias');
    
    // Actualizar matemáticas
    if (matematicas && mathProgress && mathPercent) {
        const porcentaje = Math.round(matematicas.porcentajeCompletado);
        mathProgress.style.width = `${porcentaje}%`;
        mathPercent.textContent = `${porcentaje}%`;
    }
    
    // Actualizar lenguaje
    if (lenguaje && languageProgress && languagePercent) {
        const porcentaje = Math.round(lenguaje.porcentajeCompletado);
        languageProgress.style.width = `${porcentaje}%`;
        languagePercent.textContent = `${porcentaje}%`;
    }
    
    // Actualizar ciencias
    if (ciencias && scienceProgress && sciencePercent) {
        const porcentaje = Math.round(ciencias.porcentajeCompletado);
        scienceProgress.style.width = `${porcentaje}%`;
        sciencePercent.textContent = `${porcentaje}%`;
    }
    
    // Actualizar total
    if (totalProgress && totalPercent) {
        const porcentajeTotal = Math.round(progresoData.porcentajeTotal);
        totalProgress.style.width = `${porcentajeTotal}%`;
        totalPercent.textContent = `${porcentajeTotal}%`;
    }
}

// Función para actualizar el progreso en la UI
async function actualizarProgresoUI() {
    if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
        const progresoData = await obtenerProgresoGeneral();
        actualizarUIProgreso(progresoData);
    }
}

// Cargar progreso al iniciar la página
document.addEventListener('DOMContentLoaded', async function() {
    // Solo cargar progreso si estamos en la página principal (exam.html)
    if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
        actualizarProgresoUI();
    }
    
    // Añadir listener para actualizar progreso cuando el usuario vuelve a la página
    window.addEventListener('focus', function() {
        if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
            actualizarProgresoUI();
        }
    });
});