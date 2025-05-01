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
                    if (userAnswers[q.id] === q.correctAnswer) score++;
                    const feedbackEl = document.getElementById(`feedback-${q.id}`);
                    if (feedbackEl) feedbackEl.style.display = 'block';
                });
                alert(`Examen terminado. Tu puntuación: ${score} / ${examQuestions.length}`);
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