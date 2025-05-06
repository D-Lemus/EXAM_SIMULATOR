// AI Tutor Integration for UABC Entrance Exam
// This script handles the ChatGPT API integration for personalized explanations

// Function to request AI tutor explanation
function requestAITutor(questionText, userAnswer, correctAnswer, responseContainer) {
    // Show loading state
    responseContainer.innerHTML = '<div class="loading">AI tutor is thinking...</div>';
    responseContainer.style.display = 'block';

    // Make API request to ChatGPT
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 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' // Replace with your actual API key
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI tutor helping university entrance exam students understand questions they got wrong. Be encouraging, clear, and educational in your explanations.'
                },
                {
                    role: 'user',
                    content: `I'm studying for my university entrance exam and need help understanding this question:
                    
Question: ${questionText}
My answer: ${userAnswer}
Correct answer: ${correctAnswer}

Can you explain why my answer is incorrect and why the correct answer is right? Please provide a clear, educational explanation that will help me understand the concept better.
When providing math questions i need you to use a format that is clear & spacious for the user. Dont over explain things and try to be as brief but as clear as possible. If the answer is just a fact try to be as extremely brief as possible
as it is an answer that doesnt even require long explanation. A`
                }
            ],
            max_tokens: 500
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            // Display the AI's explanation
            const explanation = data.choices[0].message.content;
            responseContainer.innerHTML = `
                <h4>AI Tutor Explanation:</h4>
                <p>${formatExplanation(explanation)}</p>
            `;
        } else {
            throw new Error('Unexpected response format from API');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        responseContainer.innerHTML = `
            <div class="error">
                <p>Sorry, there was an error getting your explanation. Please try again later.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `;
    });
}

// Helper function to format the explanation with paragraphs
function formatExplanation(text) {
    return text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}

// Log that the AI tutor script is loaded
console.log('AI Tutor script loaded successfully');