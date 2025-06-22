// Gestionnaire des scores
class ScoresManager {
    constructor() {
        this.scores = new Map();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Écouter les mises à jour de score
        socket.on('scoreUpdated', (data) => {
            this.updateScore(data.userId, data.score);
            this.updateScoresDisplay();
        });

        // Écouter la liste initiale des scores
        socket.on('scoresList', (scores) => {
            this.scores = new Map(scores);
            this.updateScoresDisplay();
        });
    }

    updateScore(userId, score) {
        const currentScore = this.scores.get(userId) || 0;
        this.scores.set(userId, currentScore + score);
    }

    updateScoresDisplay() {
        const scoresList = document.getElementById('scores-list');
        if (!scoresList) return;

        // Convertir les scores en tableau et les trier
        const sortedScores = Array.from(this.scores.entries())
            .sort((a, b) => b[1] - a[1]);

        scoresList.innerHTML = '';
        sortedScores.forEach(([userId, score], index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-item';
            scoreElement.innerHTML = `
                <div class="score-rank">#${index + 1}</div>
                <div class="score-info">
                    <span class="score-name">${userId}</span>
                    <span class="score-value">${score} points</span>
                </div>
                <div class="score-trend">
                    ${this.getScoreTrend(userId, score)}
                </div>
            `;
            scoresList.appendChild(scoreElement);
        });
    }

    getScoreTrend(userId, currentScore) {
        const previousScore = this.scores.get(userId) || 0;
        const difference = currentScore - previousScore;

        if (difference > 0) {
            return `<span class="trend-up">+${difference}</span>`;
        } else if (difference < 0) {
            return `<span class="trend-down">${difference}</span>`;
        }
        return '';
    }
}

// Initialiser le gestionnaire de scores
const scoresManager = new ScoresManager(); 