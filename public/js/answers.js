// Gestionnaire des réponses
class AnswersManager {
    constructor() {
        this.answers = new Map();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Écouter les nouvelles réponses
        socket.on('newAnswer', (data) => {
            this.addAnswer(data);
            this.updateAnswersDisplay();
        });

        // Écouter la liste initiale des réponses
        socket.on('answersList', (answers) => {
            this.answers = new Map(answers);
            this.updateAnswersDisplay();
        });

        // Écouter la validation des réponses
        socket.on('answerValidated', (data) => {
            this.validateAnswer(data.answerId, data.isCorrect);
            this.updateAnswersDisplay();
        });
    }

    addAnswer(data) {
        const answerId = `${data.userId}-${Date.now()}`;
        this.answers.set(answerId, {
            ...data,
            id: answerId,
            status: 'pending',
            timestamp: new Date()
        });
    }

    validateAnswer(answerId, isCorrect) {
        const answer = this.answers.get(answerId);
        if (answer) {
            answer.status = isCorrect ? 'correct' : 'incorrect';
            answer.validatedAt = new Date();
        }
    }

    updateAnswersDisplay() {
        const answersList = document.getElementById('answers-list');
        if (!answersList) return;

        // Convertir les réponses en tableau et les trier par date
        const sortedAnswers = Array.from(this.answers.values())
            .sort((a, b) => b.timestamp - a.timestamp);

        answersList.innerHTML = '';
        sortedAnswers.forEach(answer => {
            const answerElement = document.createElement('div');
            answerElement.className = `answer-item ${answer.status}`;
            answerElement.innerHTML = `
                <div class="answer-header">
                    <span class="answer-user">${answer.userId}</span>
                    <span class="answer-time">${this.formatTime(answer.timestamp)}</span>
                </div>
                <div class="answer-content">
                    ${answer.answer}
                </div>
                <div class="answer-status">
                    ${this.getStatusBadge(answer.status)}
                </div>
            `;
            answersList.appendChild(answerElement);
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge pending">En attente</span>',
            correct: '<span class="badge correct">Correct</span>',
            incorrect: '<span class="badge incorrect">Incorrect</span>'
        };
        return badges[status] || badges.pending;
    }
}

// Initialiser le gestionnaire de réponses
const answersManager = new AnswersManager(); 