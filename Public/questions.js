document.addEventListener('DOMContentLoaded', async () => {
    if (typeof examJsonPath === 'undefined') {
        alert('Error: No se especificó la ruta del JSON de preguntas.');
        return;
    }

    // Verificar autenticación primero
    try {
        const authResult = await obtenerUsuario();
        if (!authResult.success) {
            window.location.href = '/';
            return;
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/';
        return;
    }

    // Determinar tipo de examen basado en la URL o la variable examJsonPath
    let tipoExamen = 'matematicas'; // Default
    
    if (window.location.pathname.includes('Examen_Lenguaje.html') || examJsonPath.includes('Lenguage_questions')) {
        tipoExamen = 'lenguaje';
    } else if (window.location.pathname.includes('Examen_Ciencias.html') || examJsonPath.includes('Cience_questions')) {
        tipoExamen = 'ciencias';
    } else if (window.location.pathname.includes('Examen_mate.html') || examJsonPath.includes('Math_questions')) {
        tipoExamen = 'matematicas';
    }
    
    // Variables para el progreso
    let examenId = null;
    let userAnswers = {};
    let preguntasRespondidas = [];
    
    // Obtener el examen primero para tener el ID
    try {
        const examResponse = await cargarExamenAPI(tipoExamen);
        if (examResponse && !examResponse.msg) {
            examenId = examResponse._id;
        }
    } catch (error) {
        console.warn('Error al cargar examen desde API:', error);
    }
    
    // Intentar cargar progreso guardado
    let progresoResponse = null;
    try {
        progresoResponse = await obtenerProgresoTipo(tipoExamen);
        if (progresoResponse && progresoResponse.success) {
            const progress = progresoResponse.progress;
            
            // Restaurar respuestas si existen
            if (progress.respuestas) {
                userAnswers = progress.respuestas;
                preguntasRespondidas = progress.preguntasRespondidas || [];
            }
        }
    } catch (error) {
        console.warn('Error al cargar progreso guardado:', error);
    }

    // Continuar con la carga del JSON local
    fetch(examJsonPath)
        .then(response => {
            if (!response.ok) throw new Error(`No se pudo cargar el JSON: ${examJsonPath}`);
            return response.json();
        })
        .then(async examQuestions => {
            // Si no tenemos ID de examen de la API, crear uno en el servidor
            if (!examenId && examQuestions.length > 0) {
                try {
                    const newExam = {
                        tipo: tipoExamen,
                        nombre: `Examen de ${tipoExamen}`,
                        preguntas: examQuestions
                    };
                    
                    const examResult = await fetch('/api/exams', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newExam)
                    });
                    
                    const examData = await examResult.json();
                    if (examData.success) {
                        examenId = examData.exam._id;
                    }
                } catch (error) {
                    console.warn('Error al crear examen:', error);
                }
            }
            
            // Configurar variables para el examen
            const examContent = document.getElementById('exam-content');
            const questionsAnsweredElem = document.getElementById('questions-answered');
            const questionTotalElem = document.getElementById('question-total');
            const progressBar = document.getElementById('progress-bar');
            const submitBtn = document.getElementById('submit-btn');
            const timerElem = document.getElementById('time-remaining');

            questionTotalElem.textContent = examQuestions.length;

            // Generar preguntas
            examQuestions.forEach((question, index) => {
                const questionCard = document.createElement('div');
                questionCard.className = 'question-card';
                questionCard.id = `question-${question.id}`;

                let optionsHTML = '';
                question.options.forEach((option, optIndex) => {
                    // Verificar si esta opción ya fue seleccionada previamente
                    const isSelected = userAnswers[question.id] === optIndex;
                    const selectedClass = isSelected ? 'selected' : '';
                    
                    optionsHTML += `
                        <div class="option ${selectedClass}" data-question="${question.id}" data-option="${optIndex}">
                            ${option}
                        </div>
                    `;
                });

                questionCard.innerHTML = `
                    <div class="question-text">${index + 1}. ${question.text}</div>
                    <div class="options-list">${optionsHTML}</div>
                    <div class="feedback" id="feedback-${question.id}" style="display:none;">${question.defaultFeedback}</div>
                    <div class="ai-response-container" id="ai-response-${question.id}"></div>
                    <button class="ai-feedback-btn" id="ai-btn-${question.id}" style="display:none;">
                        ¿No entendiste? Obtén explicación AI
                    </button>
                `;
                examContent.appendChild(questionCard);
                
                // Si la pregunta ya fue respondida antes, marcarla como tal
                if (preguntasRespondidas.includes(question.id)) {
                    questionCard.dataset.answered = 'true';
                }
            });
            
            // Actualizar progreso inicial
            const answeredCount = preguntasRespondidas.length;
            questionsAnsweredElem.textContent = answeredCount;
            const progressPercent = (answeredCount / examQuestions.length) * 100;
            progressBar.style.width = progressPercent + '%';
            
            // Habilitar submit si ya contestó todas
            submitBtn.disabled = answeredCount !== examQuestions.length;

            // Manejar click en opciones
            examContent.addEventListener('click', async e => {
                if (!e.target.classList.contains('option')) return;
                const questionId = e.target.dataset.question;
                const optionIndex = parseInt(e.target.dataset.option);

                // Deseleccionar
                const allOptions = examContent.querySelectorAll(`.option[data-question="${questionId}"]`);
                allOptions.forEach(opt => opt.classList.remove('selected'));

                // Seleccionar la clickeada
                e.target.classList.add('selected');

                // Guardar respuesta
                userAnswers[questionId] = optionIndex;

                // Actualizar progreso
                const questionCard = document.getElementById(`question-${questionId}`);
                if (!questionCard.dataset.answered) {
                    questionCard.dataset.answered = 'true';
                    preguntasRespondidas.push(questionId);
                    
                    // Actualizar contador y barra de progreso
                    const answeredCount = preguntasRespondidas.length;
                    questionsAnsweredElem.textContent = answeredCount;
                    const progressPercent = (answeredCount / examQuestions.length) * 100;
                    progressBar.style.width = progressPercent + '%';
                    
                    // Habilitar submit si contesta todas
                    submitBtn.disabled = answeredCount !== examQuestions.length;
                }
                
                // Guardar progreso en servidor
                try {
                    await guardarProgreso(
                        examenId, 
                        tipoExamen, 
                        preguntasRespondidas, 
                        userAnswers
                    );
                } catch (error) {
                    console.warn('Error al guardar progreso:', error);
                }
            });

            // Enviar examen
            submitBtn.addEventListener('click', () => {
                let score = 0;
                examQuestions.forEach(q => {
                    const userAnswer = userAnswers[q.id];
                    const isCorrect = userAnswer === q.correctAnswer;
                    
                    if (isCorrect) score++;
                    
                    // Mostrar retroalimentación
                    const feedbackEl = document.getElementById(`feedback-${q.id}`);
                    const aiButtonEl = document.getElementById(`ai-btn-${q.id}`);
                    
                    if (feedbackEl) feedbackEl.style.display = 'block';
                    
                    // Solo mostrar el botón de AI para respuestas incorrectas
                    if (!isCorrect && aiButtonEl) {
                        aiButtonEl.style.display = 'block';
                    }
                });
                
                alert(`Examen terminado. Tu puntuación: ${score} / ${examQuestions.length}`);
                
                // Añadir eventos a botones de explicación AI
                setupAITutorButtons(examQuestions, userAnswers);
            });

            // Temporizador (60 minutos)
            let timeLeft = 60 * 60;
            const interval = setInterval(() => {
                if (timeLeft < 0) {
                    clearInterval(interval);
                    alert('Tiempo agotado. Se enviará el examen automáticamente.');
                    submitBtn.click();
                    return;
                }
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                timerElem.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
                timeLeft--;
            }, 1000);
        })
        .catch(err => {
            alert('Error al cargar el examen: ' + err.message);
        });
});

// Función para configurar los botones de AI Tutor
function setupAITutorButtons(examQuestions, userAnswers) {
    const aiButtons = document.querySelectorAll('.ai-feedback-btn');
    
    aiButtons.forEach(button => {
        button.addEventListener('click', function() {
            const questionId = this.id.replace('ai-btn-', '');
            const question = examQuestions.find(q => q.id === questionId);
            const userAnswer = userAnswers[questionId];
            
            if (question) {
                const questionText = question.text;
                const userAnswerText = question.options[userAnswer];
                const correctAnswerText = question.options[question.correctAnswer];
                
                // Obtener el contenedor para la respuesta de AI
                const responseContainer = document.getElementById(`ai-response-${questionId}`);
                
                // Verificar si la función requestAITutor está disponible
                if (typeof requestAITutor === 'function') {
                    requestAITutor(questionText, userAnswerText, correctAnswerText, responseContainer);
                } else {
                    responseContainer.innerHTML = '<div class="error">El servicio de AI tutor no está disponible. Asegúrate de que ai-tutor.js esté cargado.</div>';
                    responseContainer.style.display = 'block';
                }
            }
        });
    });
}