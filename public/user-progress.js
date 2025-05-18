// Función para obtener progreso general
async function obtenerProgresoGeneral() {
    try {
        const respuesta = await fetch('/api/progress', {
            credentials: 'include' // Make sure cookies are sent
        });
        
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
        const respuesta = await fetch(`/api/progress/${tipo}`, {
            credentials: 'include' // Make sure cookies are sent
        });
        
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
        console.log('Guardando progreso:', {
            examenId,
            tipo,
            preguntasRespondidas: preguntasRespondidas.length,
            respuestas: Object.keys(respuestas).length
        });
        
        const respuesta = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                examenId,
                tipo,
                preguntasRespondidas,
                respuestas
            }),
            credentials: 'include' // Make sure cookies are sent
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
        const respuesta = await fetch(`/api/exams/${tipo}`, {
            credentials: 'include' // Make sure cookies are sent
        });
        return await respuesta.json();
    } catch (error) {
        console.error(`Error al cargar examen de ${tipo}:`, error);
        return null;
    }
}

// Función para actualizar la interfaz de progreso
function actualizarUIProgreso(progresoData) {
    if (!progresoData || !progresoData.success) {
        console.warn('No hay datos válidos de progreso para actualizar UI');
        return;
    }
    
    console.log('Actualizando UI con datos de progreso:', progresoData);
    
    // IMPORTANTE: Verificar primero qué elementos existen
    const progressBars = document.querySelectorAll('.progress-container .progress-fill');
    const percentTexts = document.querySelectorAll('.progress-container .progress-percent');
    
    if (progressBars.length === 0 || percentTexts.length === 0) {
        console.warn('No se encontraron elementos de progreso para actualizar');
        return;
    }
    
    console.log('Encontrados elementos de progreso:', progressBars.length, percentTexts.length);
    
    // Mapear los contenedores para un acceso más sencillo
    // Encontrar los elementos correctos por su clase
    const mathProgress = document.querySelector('.math-progress');
    const languageProgress = document.querySelector('.language-progress');
    const scienceProgress = document.querySelector('.science-progress');
    const totalProgress = document.querySelector('.total-progress');
    
    // Mostrar los elementos encontrados para depuración
    console.log('Elementos progress encontrados:',
               'math:', mathProgress ? 'sí' : 'no',
               'language:', languageProgress ? 'sí' : 'no',
               'science:', scienceProgress ? 'sí' : 'no',
               'total:', totalProgress ? 'sí' : 'no');
    
    // Obtener referencias a textos de porcentaje
    // Buscar los elementos a través del DOM de manera más precisa
    const containers = document.querySelectorAll('.progress-container');
    
    // Obtener elementos para matemáticas (primer contenedor)
    let mathContainer, mathPercent;
    let languageContainer, languagePercent;
    let scienceContainer, sciencePercent;
    let totalContainer, totalPercent;
    
    // Identificar contenedores por sus títulos
    containers.forEach(container => {
        const titleText = container.querySelector('.progress-title')?.textContent?.toLowerCase() || '';
        
        if (titleText.includes('matemáticas')) {
            mathContainer = container;
            mathPercent = container.querySelector('.progress-percent');
        } else if (titleText.includes('lenguaje')) {
            languageContainer = container;
            languagePercent = container.querySelector('.progress-percent');
        } else if (titleText.includes('ciencias')) {
            scienceContainer = container;
            sciencePercent = container.querySelector('.progress-percent');
        } else if (titleText.includes('total')) {
            totalContainer = container;
            totalPercent = container.querySelector('.progress-percent');
        }
    });
    
    console.log('Contenedores encontrados por título:',
               'math:', mathContainer ? 'sí' : 'no',
               'language:', languageContainer ? 'sí' : 'no',
               'science:', scienceContainer ? 'sí' : 'no',
               'total:', totalContainer ? 'sí' : 'no');
    
    // Inicializar variables de progreso
    let mathValue = 0;
    let languageValue = 0;
    let scienceValue = 0;
    
    // Procesar los datos para cada tipo de examen
    progresoData.progress.forEach(p => {
        console.log('Procesando progreso para:', p.tipo, p.porcentajeCompletado);
        
        if (p.tipo === 'matematicas') {
            mathValue = Math.round(p.porcentajeCompletado);
        } else if (p.tipo === 'lenguaje') {
            languageValue = Math.round(p.porcentajeCompletado);
        } else if (p.tipo === 'ciencias') {
            scienceValue = Math.round(p.porcentajeCompletado);
        }
    });
    
    // Actualizar UI para matemáticas
    if (mathContainer && mathProgress && mathPercent) {
        mathProgress.style.width = `${mathValue}%`;
        mathPercent.textContent = `${mathValue}%`;
        console.log('Actualizado progreso matemáticas:', mathValue);
    } else {
        console.warn('No se pudo actualizar el progreso de matemáticas - elementos no encontrados');
    }
    
    // Actualizar UI para lenguaje
    if (languageContainer && languageProgress && languagePercent) {
        languageProgress.style.width = `${languageValue}%`;
        languagePercent.textContent = `${languageValue}%`;
        console.log('Actualizado progreso lenguaje:', languageValue);
    } else {
        console.warn('No se pudo actualizar el progreso de lenguaje - elementos no encontrados');
    }
    
    // Actualizar UI para ciencias
    if (scienceContainer && scienceProgress && sciencePercent) {
        scienceProgress.style.width = `${scienceValue}%`;
        sciencePercent.textContent = `${scienceValue}%`;
        console.log('Actualizado progreso ciencias:', scienceValue);
    } else {
        console.warn('No se pudo actualizar el progreso de ciencias - elementos no encontrados');
    }
    
    // Actualizar progreso total
    if (totalContainer && totalProgress && totalPercent) {
        const porcentajeTotal = Math.round(progresoData.porcentajeTotal);
        totalProgress.style.width = `${porcentajeTotal}%`;
        totalPercent.textContent = `${porcentajeTotal}%`;
        console.log('Actualizado progreso total:', porcentajeTotal);
    } else {
        console.warn('No se pudo actualizar el progreso total - elementos no encontrados');
    }
}

// Función para actualizar el progreso en la UI
async function actualizarProgresoUI() {
    if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
        console.log('Solicitando datos de progreso...');
        const progresoData = await obtenerProgresoGeneral();
        
        if (progresoData && progresoData.success) {
            console.log('Datos de progreso recibidos correctamente');
            actualizarUIProgreso(progresoData);
        } else {
            console.warn('No se pudieron obtener datos de progreso:', progresoData);
        }
    }
}

// Configurar actualización periódica de progreso
function configurarActualizacionProgreso() {
    // Actualización inicial
    actualizarProgresoUI();
    
    // Actualizar cada 5 segundos
    setInterval(actualizarProgresoUI, 5000);
}

// Cargar progreso al iniciar la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Página cargada, verificando si mostrar progreso...');
    
    // Comprobar los elementos disponibles en la página
    console.log('Elementos de progreso en la página:');
    document.querySelectorAll('.progress-container').forEach((container, index) => {
        const title = container.querySelector('.progress-title')?.textContent || 'Sin título';
        const fillElement = container.querySelector('.progress-fill');
        const percentElement = container.querySelector('.progress-percent');
        
        console.log(`Contenedor ${index+1}: "${title}"`, 
                   'Progress-fill:', fillElement ? fillElement.className : 'no encontrado',
                   'Percent:', percentElement ? 'encontrado' : 'no encontrado');
    });
    
 
    if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
        console.log('En página principal, configurando actualización de progreso');
        configurarActualizacionProgreso();
    }
    
    
    window.addEventListener('focus', function() {
        if (window.location.pathname === '/' || window.location.pathname === '/exam.html') {
            console.log('Ventana recuperó el foco, actualizando progreso');
            actualizarProgresoUI();
        }
    });
});