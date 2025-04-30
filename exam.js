// Esperamos a que la pagina haga load completamente 
document.addEventListener('DOMContentLoaded', function() {
    // Get references to the elements we need to update
    const optionElements = document.querySelectorAll('.option');
    const progressBar = document.getElementById('progress-bar');
    const questionsAnswered = document.getElementById('questions-answered');
    const submitButton = document.getElementById('submit-btn');
    
    // Track how many questions are answered
    let answeredCount = 0;
    
    // Add click event to options
    optionElements.forEach(option => {
        option.addEventListener('click', function() {
            // Remove 'selected' class from all options in this question
            const parentQuestion = this.closest('.question-card');
            const optionsInQuestion = parentQuestion.querySelectorAll('.option');
            
            optionsInQuestion.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add 'selected' class to the clicked option
            this.classList.add('selected');
            
            // If this is the first time answering this question, update the count
            if (!parentQuestion.dataset.answered) {
                parentQuestion.dataset.answered = 'true';
                answeredCount++;
                
                // Update the counter and progress bar
                questionsAnswered.textContent = answeredCount;
                const totalQuestions = parseInt(document.getElementById('question-total').textContent);
                const progressPercentage = (answeredCount / totalQuestions) * 100;
                progressBar.style.width = progressPercentage + '%';
                
                // Enable submit button if all questions are answered
                if (answeredCount === totalQuestions) {
                    submitButton.disabled = false;
                }
            }
        });
    });
    
    // Add timer functionality (basic version)
    startTimer(60 * 60); // 60 minutes
});

// Function to start the timer
function startTimer(durationInSeconds) {
    const timerElement = document.getElementById('time-remaining');
    let timeLeft = durationInSeconds;
    
    const timerInterval = setInterval(() => {
        // Calculate minutes and seconds
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        // Update the display
        timerElement.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        
        // Decrease time left
        timeLeft--;
        
        // Check if timer has finished
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            timerElement.textContent = '0:00';
            // Here you would automatically submit the exam
            alert('Time is up! Submitting exam...');
        }
    }, 1000);
}