// Integracion del Tutor IA para el Examen de Admision UABC
// Este script maneja la integracion de la API ChatGPT para explicaciones personalizadas

// Funcion para solicitar explicacion del tutor IA
function requestAITutor(questionText, userAnswer, correctAnswer, responseContainer) {
    // Mostrar estado de carga
    responseContainer.innerHTML = '<div class="loading">El tutor IA está pensando...</div>';
    responseContainer.style.display = 'block';

    // Solicitud a la API de ChatGPT
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un tutor de IA que ayuda a estudiantes a entender preguntas que han respondido incorrectamente en su examen de admision universitaria. Sé alentador, claro y educativo en tus explicaciones.'
                },
                {
                    role: 'user',
                    content: `Estoy estudiando para mi examen de admision a la universidad y necesito ayuda para entender esta pregunta:
                    
Pregunta: ${questionText}
Mi respuesta: ${userAnswer}
Respuesta correcta: ${correctAnswer}

¿Puedes explicarme por qué mi respuesta es incorrecta y por qué la respuesta correcta es la adecuada? Por favor, proporciona una explicacion clara y educativa que me ayude a entender mejor el concepto.
Cuando expliques preguntas de matemáticas, necesito que uses un formato claro y espaciado. No sobre-expliques y trata de ser tan breve pero claro como sea posible. Si la respuesta es simplemente un dato, sé extremadamente breve ya que es una respuesta que ni siquiera requiere una explicacion larga.
.Quiero que me proporciones esto en un formato de parrafo, como si fuera una conversacion (ejemplo: Tu respuesta "[respuesta incorrecta]" no es adecuada por.... . La respuesta "[correcta]" es adecuada en esta ocasion por...) 
puedes utilizar palabras similares pero sin dejar esa estructura.`
                }
            ],
            max_tokens: 500
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('La respuesta de red no fue correcta');
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            // Mostrar la explicacion de la IA
            const explanation = data.choices[0].message.content;
            responseContainer.innerHTML = `
                <h4>Explicacion del Tutor IA:</h4>
                <p>${formatExplanation(explanation)}</p>
            `;
        } else {
            throw new Error('Formato de respuesta inesperado de la API');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        responseContainer.innerHTML = `
            <div class="error">
                <p>Lo sentimos, hubo un error al obtener tu explicacion. Por favor, inténtalo de nuevo más tarde.</p>
                <p>Detalles del error: ${error.message}</p>
            </div>
        `;
    });
}

// Funcion auxiliar para formatear la explicacion con párrafos
function formatExplanation(text) {
    return text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// Registrar que el script del tutor IA se ha cargado correctamente
console.log('Script del Tutor IA cargado exitosamente');