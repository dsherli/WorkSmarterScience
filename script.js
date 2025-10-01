// Assessment functionality
const totalQuestions = 3;

// Sample answers for reference (in a real scenario, you'd have more sophisticated evaluation)
const sampleAnswers = {
    q1: "Based on the data, a chemical reaction occurred. Before heating, there were two separate liquids (Liquid 1 and Liquid 2) with different densities. After heating, the layers formed (Layer A and Layer B) have different densities than either original liquid, indicating new substances were formed through a chemical reaction.",
    q2: "When two different liquids are mixed, they may either form a homogeneous mixture (if miscible) or separate into distinct layers (if immiscible). Factors that influence this include: density differences, polarity (polar vs non-polar), molecular size, temperature, and chemical compatibility. Polar liquids tend to mix with other polar liquids, while non-polar liquids mix with non-polar liquids.",
    q3: "If a third liquid with intermediate density were added, it would form a middle layer between the existing top and bottom layers. The three liquids would arrange themselves in order of density from highest (bottom) to lowest (top), assuming they are all immiscible with each other. The middle-density liquid would settle above the densest liquid but below the least dense liquid."
};

// Initialize assessment
document.addEventListener('DOMContentLoaded', function () {
    // Initialize AI sidebar
    initializeAISidebar();
});

// AI Sidebar Functionality
function initializeAISidebar() {
    const aiToggle = document.getElementById('aiToggle');
    const aiSidebar = document.getElementById('aiSidebar');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const hintButtons = document.querySelectorAll('.hint-btn');

    // Toggle sidebar collapse/expand
    aiToggle.addEventListener('click', function () {
        aiSidebar.classList.toggle('collapsed');
        const toggleIcon = aiToggle.querySelector('.toggle-icon');
        toggleIcon.textContent = aiSidebar.classList.contains('collapsed') ? '+' : '−';
    });

    // Handle chat input
    function handleChatMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addUserMessage(message);
            chatInput.value = '';

            // Simulate AI response after a short delay
            setTimeout(() => {
                const aiResponse = generateAIResponse(message);
                addAIMessage(aiResponse);
            }, 1000);
        }
    }

    // Send button click
    sendBtn.addEventListener('click', handleChatMessage);

    // Enter key in chat input
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleChatMessage();
        }
    });

    // Handle hint buttons
    hintButtons.forEach(button => {
        button.addEventListener('click', function () {
            const hintType = this.dataset.hint;
            const hintMessage = getHintMessage(hintType);
            addAIMessage(hintMessage);
        });
    });

    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="sender">You</span>
                <p>${message}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addAIMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="sender">AI Assistant</span>
                <p>${message}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();

        if (message.includes('density')) {
            return "Density is mass per unit volume (ρ = m/V). In the table, you can see different density values for each substance. Denser substances sink below less dense ones, which helps explain the layering you observe.";
        } else if (message.includes('chemical') || message.includes('reaction')) {
            return "A chemical reaction creates new substances with different properties. Look at the density values before and after heating - do they match? If the densities changed, it suggests new substances were formed.";
        } else if (message.includes('table') || message.includes('data')) {
            return "The data table shows properties before and after heating. Compare the density values of the original liquids to the final layers. Are they the same or different? This is key evidence for determining if a reaction occurred.";
        } else if (message.includes('layer')) {
            return "Layers form when liquids have different densities and don't mix. The denser liquid sinks to the bottom. In this case, heating may have caused a chemical reaction that created new substances with different densities.";
        } else {
            return "That's a great question! Think about how the properties in the data table change from before to after heating. What does this tell you about whether new substances were formed? Focus on comparing the density values.";
        }
    }

    function getHintMessage(hintType) {
        const hints = {
            density: "💡 Density Hint: Density = mass ÷ volume. When substances have different densities, they separate into layers with the denser substance at the bottom. Compare the density values in the table before and after heating.",
            reactions: "⚗️ Chemical Reaction Hint: A chemical reaction produces new substances with different properties than the starting materials. Look for changes in the data that indicate new substances were formed.",
            data: "📊 Data Table Hint: Compare the 'before heating' and 'after heating' columns. Pay special attention to the density values. Do the final layers have the same densities as the original liquids?"
        };
        return hints[hintType] || "I'm here to help! What specific aspect would you like assistance with?";
    }
}

// Handle form submission
document.getElementById('assessmentForm').addEventListener('submit', function (e) {
    e.preventDefault();
    calculateResults();
});

// Calculate and display results
function calculateResults() {
    const formData = new FormData(document.getElementById('assessmentForm'));
    const answers = {};
    let totalLength = 0;
    let answeredQuestions = 0;

    // Get user answers and calculate metrics
    for (let i = 1; i <= totalQuestions; i++) {
        const answer = formData.get(`q${i}`);
        answers[`q${i}`] = answer || '';
        if (answer && answer.trim().length > 0) {
            answeredQuestions++;
            totalLength += answer.trim().length;
        }
    }

    // Hide form and show results
    document.querySelector('.assessment-form').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';

    // Update score display (based on completion and response quality)
    const completionScore = Math.round((answeredQuestions / totalQuestions) * 100);
    document.getElementById('scoreValue').textContent = `${completionScore}% Complete`;

    // Generate feedback
    const feedback = generateFeedback(answers, answeredQuestions, totalLength);
    document.getElementById('feedback').innerHTML = feedback;
}

// Initialize assessment
document.addEventListener('DOMContentLoaded', function () {
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
document.getElementById('assessmentForm').addEventListener('submit', function (e) {
    e.preventDefault();
    calculateResults();
});

// Calculate and display results
function calculateResults() {
    const formData = new FormData(document.getElementById('assessmentForm'));
    const answers = {};
    let totalLength = 0;
    let answeredQuestions = 0;

    // Get user answers and calculate metrics
    for (let i = 1; i <= totalQuestions; i++) {
        const answer = formData.get(`q${i}`);
        answers[`q${i}`] = answer || '';
        if (answer && answer.trim().length > 0) {
            answeredQuestions++;
            totalLength += answer.trim().length;
        }
    }

    // Hide form and show results
    document.querySelector('.assessment-form').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';

    // Update score display (based on completion and response quality)
    const completionScore = Math.round((answeredQuestions / totalQuestions) * 100);
    document.getElementById('scoreValue').textContent = `${completionScore}% Complete`;

    // Generate feedback
    const feedback = generateFeedback(answers, answeredQuestions, totalLength);
    document.getElementById('feedback').innerHTML = feedback;

    // Update progress bar to 100%
    document.querySelector('.progress-fill').style.width = '100%';
    document.querySelector('.progress-text').textContent = 'Assessment Complete';
}

// Generate feedback based on answers
function generateFeedback(answers, answeredQuestions, totalLength) {
    let feedback = '<h4>Your Responses:</h4><div class="responses-review">';

    const questions = [
        'Based on Figure 1, explain why some liquids form distinct layers instead of mixing together. What property determines the order of these layers?',
        'Observing Figure 2, describe what happens when two different liquids are mixed. What factors might influence whether liquids will separate into layers or form a homogeneous mixture?',
        'Using both figures as reference, predict what would happen if you added a third liquid with a density between the top and bottom layers shown in Figure 1. Explain your reasoning.'
    ];

    for (let i = 1; i <= totalQuestions; i++) {
        const userAnswer = answers[`q${i}`];
        const hasAnswer = userAnswer && userAnswer.trim().length > 0;

        feedback += `<div class="response-item">
            <div class="question-text">
                <strong>Question ${i}:</strong> ${questions[i - 1]}
            </div>
            <div class="user-response ${hasAnswer ? 'answered' : 'not-answered'}">
                <strong>Your Answer:</strong><br>
                ${hasAnswer ? userAnswer : '<em>No answer provided</em>'}
            </div>
            <div class="sample-response">
                <strong>Sample Answer:</strong><br>
                <em>${sampleAnswers[`q${i}`]}</em>
            </div>
        </div>`;
    }

    feedback += '</div>';

    // Add overall performance message
    let performanceMessage = '';
    const avgLength = answeredQuestions > 0 ? Math.round(totalLength / answeredQuestions) : 0;

    if (answeredQuestions === totalQuestions && avgLength >= 100) {
        performanceMessage = '<div class="excellent">🎉 Excellent! You provided comprehensive answers to all questions!</div>';
    } else if (answeredQuestions === totalQuestions) {
        performanceMessage = '<div class="good">👍 Good job! You answered all questions. Consider providing more detailed explanations.</div>';
    } else if (answeredQuestions >= totalQuestions * 0.7) {
        performanceMessage = '<div class="average">📚 Well done! Try to answer all questions for a complete assessment.</div>';
    } else {
        performanceMessage = '<div class="needs-improvement">📖 Please try to answer more questions to get better feedback.</div>';
    }

    return feedback + performanceMessage;
}

// Restart assessment
function restartAssessment() {
    // Reset form
    document.getElementById('assessmentForm').reset();

    // Show form and hide results
    document.querySelector('.assessment-form').style.display = 'block';
    document.getElementById('resultsContainer').style.display = 'none';

    // Scroll to top of assessment
    document.querySelector('.assessment-container').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}// Add some CSS for feedback styling
const style = document.createElement('style');
style.textContent = `
    .responses-review {
        text-align: left;
        max-width: 100%;
        margin: 0;
    }
    
    .response-item {
        margin-bottom: 32px;
        padding: 24px;
        background: #f8fafc;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
    }
    
    .question-text {
        margin-bottom: 16px;
        color: #0f172a;
        line-height: 1.6;
    }
    
    .user-response {
        margin-bottom: 16px;
        padding: 16px;
        border-radius: 12px;
        line-height: 1.6;
    }
    
    .user-response.answered {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #1e40af;
    }
    
    .user-response.not-answered {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
    }
    
    .sample-response {
        padding: 16px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        color: #166534;
        line-height: 1.6;
        font-size: 0.95rem;
    }
    
    .excellent {
        background: #d4edda;
        color: #155724;
        padding: 20px;
        border-radius: 12px;
        margin-top: 24px;
        font-weight: 600;
        text-align: center;
    }
    
    .good {
        background: #cce5ff;
        color: #004085;
        padding: 20px;
        border-radius: 12px;
        margin-top: 24px;
        font-weight: 600;
        text-align: center;
    }
    
    .average {
        background: #fff3cd;
        color: #856404;
        padding: 20px;
        border-radius: 12px;
        margin-top: 24px;
        font-weight: 600;
        text-align: center;
    }
    
    .needs-improvement {
        background: #f8d7da;
        color: #721c24;
        padding: 20px;
        border-radius: 12px;
        margin-top: 24px;
        font-weight: 600;
        text-align: center;
    }
    
    @media (max-width: 768px) {
        .response-item {
            padding: 16px;
            margin-bottom: 24px;
        }
        
        .user-response, .sample-response {
            padding: 12px;
        }
        
        .excellent, .good, .average, .needs-improvement {
            padding: 16px;
        }
    }
`;
document.head.appendChild(style);