// Connexion au serveur Socket.IO
const socket = io();

// Fonction pour rejoindre une salle de jeu
function joinGame(gameId) {
    socket.emit('joinGame', gameId);
}

// Fonction pour quitter une salle de jeu
function leaveGame(gameId) {
    socket.emit('leaveGame', gameId);
}

// Fonction pour envoyer une réponse
function sendAnswer(gameId, answer, userId) {
    const data = {
        gameId,
        answer,
        userId,
        timestamp: new Date()
    };
    socket.emit('sendAnswer', data);
}

// Fonction pour mettre à jour le score
function updateScore(gameId, userId, score) {
    const data = {
        gameId,
        userId,
        score,
        timestamp: new Date()
    };
    socket.emit('updateScore', data);
}

// Écouter les nouvelles réponses
socket.on('newAnswer', (data) => {
    // Mettre à jour l'interface utilisateur avec la nouvelle réponse
    console.log('Nouvelle réponse reçue:', data);
    // TODO: Implémenter la logique pour afficher la réponse dans l'interface
});

// Écouter les mises à jour de score
socket.on('scoreUpdated', (data) => {
    // Mettre à jour l'interface utilisateur avec le nouveau score
    console.log('Score mis à jour:', data);
    // TODO: Implémenter la logique pour afficher le score dans l'interface
});

// Gérer la connexion
socket.on('connect', () => {
    console.log('Connecté au serveur Socket.IO');
});

// Gérer la déconnexion
socket.on('disconnect', () => {
    console.log('Déconnecté du serveur Socket.IO');
}); 