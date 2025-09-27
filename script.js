// Assessment functionality
let currentQuestion = 1;
const totalQuestions = 3;
const correctAnswers = {
    q1: 'b', // let myVar = 10;
    q2: 'c', // Integer (not a JavaScript data type)
    q3: 'c'  // Compares values and types without type coercion
};

// Initialize assessment
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    updateNavigationButtons();
});

// Change question function
function changeQuestion(direction) {
    const currentContainer = document.querySelector(`.question-container[data-question="${currentQuestion}"]`);
    currentContainer.classList.remove('active');
    
    currentQuestion += direction;
    
    const newContainer = document.querySelector(`.question-container[data-question="${currentQuestion}"]`);
    newContainer.classList.add('active');
    
    updateProgress();
    updateNavigationButtons();
}

// Update progress bar and text
function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    const progressPercentage = ((currentQuestion - 1) / (totalQuestions - 1)) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Previous button
    prevBtn.disabled = currentQuestion === 1;
    
    // Next/Submit buttons
    if (currentQuestion === totalQuestions) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

// Handle form submission
document.getElementById('assessmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateResults();
});

// Calculate and display results
function calculateResults() {
    const formData = new FormData(document.getElementById('assessmentForm'));
    let score = 0;
    const answers = {};
    
    // Get user answers
    for (let i = 1; i <= totalQuestions; i++) {
        const answer = formData.get(`q${i}`);
        answers[`q${i}`] = answer;
        if (answer === correctAnswers[`q${i}`]) {
            score++;
        }
    }
    
    // Hide form and show results
    document.querySelector('.assessment-form').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    
    // Update score display
    document.getElementById('scoreValue').textContent = `${score}/${totalQuestions}`;
    
    // Generate feedback
    const feedback = generateFeedback(score, answers);
    document.getElementById('feedback').innerHTML = feedback;
    
    // Update progress bar to 100%
    document.querySelector('.progress-fill').style.width = '100%';
    document.querySelector('.progress-text').textContent = 'Assessment Complete';
}

// Generate feedback based on score and answers
function generateFeedback(score, answers) {
    let feedback = '<h4>Answer Review:</h4><ul>';
    
    const questions = [
        'What is the correct way to declare a variable in JavaScript?',
        'Which of the following is NOT a JavaScript data type?',
        'What does the \'===\' operator do in JavaScript?'
    ];
    
    const explanations = [
        'The correct answer is "let myVar = 10;" - This is the modern way to declare variables in JavaScript.',
        'The correct answer is "Integer" - JavaScript has Number type, but not a specific Integer type.',
        'The correct answer is "Compares values and types without type coercion" - The === operator performs strict equality comparison.'
    ];
    
    for (let i = 1; i <= totalQuestions; i++) {
        const userAnswer = answers[`q${i}`];
        const correctAnswer = correctAnswers[`q${i}`];
        const isCorrect = userAnswer === correctAnswer;
        
        feedback += `<li>
            <strong>Question ${i}:</strong> ${questions[i-1]}<br>
            <span class="${isCorrect ? 'correct' : 'incorrect'}">
                ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </span><br>
            <small>${explanations[i-1]}</small>
        </li>`;
    }
    
    feedback += '</ul>';
    
    // Add overall performance message
    let performanceMessage = '';
    if (score === totalQuestions) {
        performanceMessage = '<div class="excellent">🎉 Excellent! You got all questions correct!</div>';
    } else if (score >= totalQuestions * 0.7) {
        performanceMessage = '<div class="good">👍 Good job! You have a solid understanding.</div>';
    } else if (score >= totalQuestions * 0.5) {
        performanceMessage = '<div class="average">📚 Not bad! Consider reviewing the concepts.</div>';
    } else {
        performanceMessage = '<div class="needs-improvement">📖 Keep studying! Review the fundamentals.</div>';
    }
    
    return feedback + performanceMessage;
}

// Restart assessment
function restartAssessment() {
    currentQuestion = 1;
    
    // Reset form
    document.getElementById('assessmentForm').reset();
    
    // Show form and hide results
    document.querySelector('.assessment-form').style.display = 'block';
    document.getElementById('resultsContainer').style.display = 'none';
    
    // Reset question display
    document.querySelectorAll('.question-container').forEach(container => {
        container.classList.remove('active');
    });
    document.querySelector('.question-container[data-question="1"]').classList.add('active');
    
    // Reset progress and buttons
    updateProgress();
    updateNavigationButtons();
}

// Add some CSS for feedback styling
const style = document.createElement('style');
style.textContent = `
    .feedback ul {
        text-align: left;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .feedback li {
        margin-bottom: 15px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
    }
    
    .correct {
        color: #27ae60;
        font-weight: bold;
    }
    
    .incorrect {
        color: #e74c3c;
        font-weight: bold;
    }
    
    .excellent {
        background: #d4edda;
        color: #155724;
        padding: 15px;
        border-radius: 6px;
        margin-top: 20px;
        font-weight: bold;
    }
    
    .good {
        background: #cce5ff;
        color: #004085;
        padding: 15px;
        border-radius: 6px;
        margin-top: 20px;
        font-weight: bold;
    }
    
    .average {
        background: #fff3cd;
        color: #856404;
        padding: 15px;
        border-radius: 6px;
        margin-top: 20px;
        font-weight: bold;
    }
    
    .needs-improvement {
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 6px;
        margin-top: 20px;
        font-weight: bold;
    }
`;
document.head.appendChild(style);