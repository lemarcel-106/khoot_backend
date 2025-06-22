// Gestionnaire des participants
class ParticipantsManager {
    constructor() {
        this.participants = new Map();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Écouter quand un utilisateur rejoint
        socket.on('userJoined', (data) => {
            this.addParticipant(data.userId);
            this.updateParticipantsList();
        });

        // Écouter quand un utilisateur quitte
        socket.on('userLeft', (data) => {
            this.removeParticipant(data.userId);
            this.updateParticipantsList();
        });

        // Écouter la liste initiale des participants
        socket.on('participantsList', (participants) => {
            this.participants = new Map(participants);
            this.updateParticipantsList();
        });
    }

    addParticipant(userId) {
        if (!this.participants.has(userId)) {
            this.participants.set(userId, {
                joinedAt: new Date(),
                status: 'active'
            });
        }
    }

    removeParticipant(userId) {
        this.participants.delete(userId);
    }

    updateParticipantsList() {
        const participantsList = document.getElementById('participants-list');
        if (!participantsList) return;

        participantsList.innerHTML = '';
        this.participants.forEach((data, userId) => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant-item';
            participantElement.innerHTML = `
                <div class="participant-info">
                    <span class="participant-name">${userId}</span>
                    <span class="participant-status ${data.status}"></span>
                </div>
                <div class="participant-joined">
                    Rejoint: ${new Date(data.joinedAt).toLocaleTimeString()}
                </div>
            `;
            participantsList.appendChild(participantElement);
        });
    }
}

// Initialiser le gestionnaire de participants
const participantsManager = new ParticipantsManager(); 