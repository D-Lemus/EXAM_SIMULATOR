document.addEventListener('DOMContentLoaded', () => {
    if (typeof examJsonPath === 'undefined') {
        alert('Error: No se especificó la ruta del JSON de preguntas.');
        return;
    }

    fetch(examJsonPath)
        .then(response => {
            if (!response.ok) throw new Error(`No se pudo cargar el JSON: ${examJsonPath}`);
            return response.json();
        })
        .then(examQuestions => {
            // Aquí empieza el código que tienes para manejar el examen:
            let userAnswers = {};
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
                    optionsHTML += `
                        <div class="option" data-question="${question.id}" data-option="${optIndex}">
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
            });

            // Manejar click en opciones
            examContent.addEventListener('click', e => {
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
                const answeredCount = Object.keys(userAnswers).length;
                questionsAnsweredElem.textContent = answeredCount;
                const progressPercent = (answeredCount / examQuestions.length) * 100;
                progressBar.style.width = progressPercent + '%';

                // Habilitar submit si contesta todas
                submitBtn.disabled = answeredCount !== examQuestions.length;
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
                timerElem.textContent = `Tiempo restante: ${m}:${s < 10 ? '0' : ''}${s}`;
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