let currentExamType = 'matematicas';
let examQuestions = [];
let deleteQuestionId = null;
document.addEventListener('DOMContentLoaded', async function() {
try {
const userData = await obtenerUsuario();
if (!userData.success) {
window.location.href = '/';
return;
}
} catch (error) {
console.error('Error al verificar autenticación:', error);
window.location.href = '/';
return;
}
setupEventListeners();
loadExamQuestions(currentExamType);
});
function setupEventListeners() {
document.getElementById('exam-type').addEventListener('change', function() {
currentExamType = this.value;
document.getElementById('current-exam-title').textContent = `Examen de ${getCurrentExamTitle()}`;
loadExamQuestions(currentExamType);
});
document.getElementById('add-question-btn').addEventListener('click', function() {
    openQuestionModal();
});

document.getElementById('save-question-btn').addEventListener('click', function() {
    saveQuestion();
});

document.getElementById('confirm-delete-btn').addEventListener('click', function() {
    if (deleteQuestionId) {
        deleteQuestion(deleteQuestionId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
        modal.hide();
    }
});

document.getElementById('save-all-btn').addEventListener('click', function() {
    saveAllChanges();
});

document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
});
}
function getCurrentExamTitle() {
switch(currentExamType) {
case 'matematicas':
return 'Matemáticas';
case 'lenguaje':
return 'Lenguaje';
case 'ciencias':
return 'Ciencias';
default:
return currentExamType.charAt(0).toUpperCase() + currentExamType.slice(1);
}
}
async function loadExamQuestions(examType) {
try {
const questionsContainer = document.getElementById('questions-container');
questionsContainer.innerHTML = '<div class="alert alert-info text-center">Cargando preguntas...</div>';
    try {
        const response = await fetch(`/api/admin/exams/${examType}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.questions) {
                examQuestions = data.questions;
                renderQuestions();
                return;
            }
        }
    } catch (apiError) {
        console.warn('Error al cargar preguntas desde API:', apiError);
    }
    
    const jsonPath = getJsonPath(examType);
    const response = await fetch(jsonPath);
    if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo JSON: ${jsonPath}`);
    }
    
    examQuestions = await response.json();
    renderQuestions();
} catch (error) {
    console.error('Error al cargar preguntas:', error);
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = `
        <div class="alert alert-danger">
            <h5>Error al cargar las preguntas</h5>
            <p>${error.message}</p>
            <button class="btn btn-outline-danger btn-sm mt-2" onclick="loadExamQuestions('${examType}')">
                Intentar nuevamente
            </button>
        </div>
    `;
}
}
function getJsonPath(examType) {
switch(examType) {
case 'matematicas':
return 'jsons/Math_questions.json';
case 'lenguaje':
return 'jsons/Lenguage_questions.json';
case 'ciencias':
return 'jsons/Cience_questions.json';
default:
throw new Error(`Tipo de examen desconocido: ${examType}`);
}
}
function renderQuestions() {
const questionsContainer = document.getElementById('questions-container');
if (!examQuestions || examQuestions.length === 0) {
    questionsContainer.innerHTML = `
        <div class="alert alert-warning text-center">
            No hay preguntas disponibles para este examen.
            <button class="btn btn-sm btn-outline-primary ms-3" id="add-first-question-btn">
                Agregar primera pregunta
            </button>
        </div>
    `;
    
    document.getElementById('add-first-question-btn').addEventListener('click', function() {
        openQuestionModal();
    });
    
    return;
}

let html = '';

examQuestions.forEach((question, index) => {
    const options = question.options.map((option, optIndex) => {
        const isCorrect = optIndex === question.correctAnswer;
        return `
            <div class="option-item ${isCorrect ? 'correct' : ''}">
                <input type="radio" class="option-radio" ${isCorrect ? 'checked' : ''} disabled>
                <span>${option}</span>
            </div>
        `;
    }).join('');
    
    html += `
        <div class="question-card" id="question-${question.id}">
            <div class="question-actions">
                <button class="btn btn-sm btn-outline-primary btn-action edit-btn" data-id="${question.id}">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action delete-btn" data-id="${question.id}">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
            <div class="question-text">
                <span class="question-number">${index + 1}</span>
                ${question.text}
            </div>
            <div class="options-list">
                ${options}
            </div>
            <div class="feedback-container">
                <strong>Retroalimentación:</strong> ${question.defaultFeedback}
            </div>
        </div>
    `;
});

questionsContainer.innerHTML = html;

document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const questionId = this.getAttribute('data-id');
        editQuestion(questionId);
    });
});

document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const questionId = this.getAttribute('data-id');
        confirmDeleteQuestion(questionId);
    });
});
}
function openQuestionModal(question = null) {
const modal = new bootstrap.Modal(document.getElementById('questionModal'));
const modalTitle = document.getElementById('modalTitle');
const form = document.getElementById('question-form');
form.reset();

if (question) {
    modalTitle.textContent = 'Editar Pregunta';
    document.getElementById('question-id').value = question.id;
    document.getElementById('question-text').value = question.text;
    document.getElementById('feedback-text').value = question.defaultFeedback;
    
    const optionInputs = document.querySelectorAll('.option-input');
    question.options.forEach((option, index) => {
        if (index < optionInputs.length) {
            optionInputs[index].value = option;
        }
    });
    
    const correctRadio = document.querySelector(`input[name="correct-answer"][value="${question.correctAnswer}"]`);
    if (correctRadio) correctRadio.checked = true;
} else {
    modalTitle.textContent = 'Agregar Pregunta';
    document.getElementById('question-id').value = '';
    
    const prefix = getExamPrefix();
    const newId = `${prefix}_q${examQuestions.length + 1}`;
    document.getElementById('question-id').value = newId;
}

modal.show();
}
function getExamPrefix() {
switch(currentExamType) {
case 'matematicas':
return 'math';
case 'lenguaje':
return 'lang';
case 'ciencias':
return 'sci';
default:
return 'q';
}
}
function editQuestion(questionId) {
const question = examQuestions.find(q => q.id === questionId);
if (question) {
openQuestionModal(question);
} else {
console.error('Pregunta no encontrada:', questionId);
}
}
function confirmDeleteQuestion(questionId) {
deleteQuestionId = questionId;
const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
modal.show();
}
function deleteQuestion(questionId) {
examQuestions = examQuestions.filter(q => q.id !== questionId);
renderQuestions();
showToast('Pregunta eliminada correctamente');
}
function saveQuestion() {
const form = document.getElementById('question-form');
if (!form.checkValidity()) {
    form.reportValidity();
    return;
}

const questionId = document.getElementById('question-id').value;
const questionText = document.getElementById('question-text').value;
const feedbackText = document.getElementById('feedback-text').value;

const options = [];
document.querySelectorAll('.option-input').forEach(input => {
    options.push(input.value);
});

const correctAnswerRadio = document.querySelector('input[name="correct-answer"]:checked');
if (!correctAnswerRadio) {
    alert('Debes seleccionar una respuesta correcta');
    return;
}

const correctAnswer = parseInt(correctAnswerRadio.value);

const updatedQuestion = {
    id: questionId,
    text: questionText,
    options: options,
    correctAnswer: correctAnswer,
    defaultFeedback: feedbackText
};

const existingIndex = examQuestions.findIndex(q => q.id === questionId);

if (existingIndex >= 0) {
    examQuestions[existingIndex] = updatedQuestion;
} else {
    examQuestions.push(updatedQuestion);
}

const modal = bootstrap.Modal.getInstance(document.getElementById('questionModal'));
modal.hide();

renderQuestions();
showToast('Pregunta guardada correctamente');
}
async function saveAllChanges() {
try {
const saveBtn = document.getElementById('save-all-btn');
const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Guardando...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/admin/exams/${currentExamType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questions: examQuestions }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showToast('Cambios guardados correctamente');
                return;
            }
        }
        
        throw new Error('Error al guardar a través de API');
    } catch (apiError) {
        console.warn('API de guardado no disponible, usando fallback local:', apiError);
        
        const jsonString = JSON.stringify(examQuestions, null, 4);
        const fileName = getJsonFileName();
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Archivo JSON generado. Descarga iniciada.');
    }
} catch (error) {
    console.error('Error al guardar cambios:', error);
    showToast('Error al guardar cambios', 'danger');
} finally {
    const saveBtn = document.getElementById('save-all-btn');
    saveBtn.textContent = 'Guardar Cambios';
    saveBtn.disabled = false;
}
}
function getJsonFileName() {
switch(currentExamType) {
case 'matematicas':
return 'Math_questions.json';
case 'lenguaje':
return 'Lenguage_questions.json';
case 'ciencias':
return 'Cience_questions.json';
default:
return `${currentExamType}_questions.json`;
}
}
function showToast(message, type = 'success') {
const toastEl = document.createElement('div');
toastEl.className = `toast save-success bg-${type} text-white`;
toastEl.setAttribute('role', 'alert');
toastEl.setAttribute('aria-live', 'assertive');
toastEl.setAttribute('aria-atomic', 'true');
toastEl.innerHTML = `
    <div class="toast-body">
        <i class="bi bi-check-circle me-2"></i> ${message}
    </div>
`;

document.body.appendChild(toastEl);

const toast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 3000
});
toast.show();

setTimeout(() => {
    if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
    }
}, 3500);
}