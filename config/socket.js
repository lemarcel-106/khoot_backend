const socketIo = require('socket.io');

// Configuration de Socket.IO
const configureSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Stockage des participants, scores, réponses et messages par salle
    const gameRooms = new Map();

    // Middleware d'authentification Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        // TODO: Vérifier le token JWT ici
        // Pour les tests, on accepte tous les tokens
        console.log(`Token reçu: ${token}`);
        next();
    });

    // Gestionnaire de connexion
    io.on('connection', (socket) => {
        console.log(`Utilisateur connecté: ${socket.id}`);

        // Rejoindre une salle de jeu
        socket.on('joinGame', (gameId) => {
            console.log(`🎮 Utilisateur ${socket.id} rejoint la salle: ${gameId}`);
            socket.join(gameId);

            // Initialiser la salle si elle n'existe pas
            if (!gameRooms.has(gameId)) {
                gameRooms.set(gameId, {
                    participants: new Map(),
                    scores: new Map(),
                    answers: new Map(),
                    messages: [],
                    typingUsers: new Set()
                });
                console.log(`Nouvelle salle créée: ${gameId}`);
            }

            const room = gameRooms.get(gameId);

            // Ajouter le participant à la salle
            room.participants.set(socket.id, {
                userId: socket.userId || `user-${socket.id.slice(0, 6)}`, // Fallback si pas d'userId
                joinedAt: new Date(),
                status: 'active'
            });

            const participantUserId = room.participants.get(socket.id).userId;

            // Initialiser le score du participant
            if (!room.scores.has(participantUserId)) {
                room.scores.set(participantUserId, 0);
            }

            console.log(`👥 Participants dans ${gameId}:`, room.participants.size);

            // Envoyer les listes initiales
            io.to(gameId).emit('participantsList', Array.from(room.participants.entries()));
            io.to(gameId).emit('scoresList', Array.from(room.scores.entries()));
            io.to(gameId).emit('answersList', Array.from(room.answers.entries()));
            io.to(gameId).emit('chatHistory', room.messages);

            // Notifier les autres utilisateurs
            socket.to(gameId).emit('userJoined', {
                userId: participantUserId,
                timestamp: new Date()
            });
        });

        // Quitter une salle de jeu
        socket.on('leaveGame', (gameId) => {
            console.log(`Utilisateur ${socket.id} quitte la salle: ${gameId}`);
            socket.leave(gameId);

            const room = gameRooms.get(gameId);
            if (room) {
                const participant = room.participants.get(socket.id);
                const userId = participant ? participant.userId : socket.userId;

                room.participants.delete(socket.id);
                room.typingUsers.delete(userId);

                io.to(gameId).emit('participantsList', Array.from(room.participants.entries()));

                socket.to(gameId).emit('userLeft', {
                    userId: userId,
                    timestamp: new Date()
                });
            }
        });

        // Envoyer une réponse
        socket.on('sendAnswer', (data) => {
            console.log(`Réponse reçue pour ${data.gameId}:`, data.answer);
            const room = gameRooms.get(data.gameId);
            if (room) {
                const participant = room.participants.get(socket.id);
                const userId = participant ? participant.userId : socket.userId || `user-${socket.id.slice(0, 6)}`;

                const answerId = `${userId}-${Date.now()}`;
                const answer = {
                    id: answerId,
                    userId: userId,
                    answer: data.answer,
                    status: 'pending',
                    timestamp: new Date()
                };

                room.answers.set(answerId, answer);

                // Émettre la nouvelle réponse à tous les clients
                io.to(data.gameId).emit('newAnswer', answer);
                // Émettre la liste complète des réponses
                io.to(data.gameId).emit('answersList', Array.from(room.answers.entries()));
            }
        });

        // Valider une réponse
        socket.on('validateAnswer', (data) => {
            console.log(`Validation de réponse:`, data);
            const room = gameRooms.get(data.gameId);
            if (room) {
                const answer = room.answers.get(data.answerId);
                if (answer) {
                    answer.status = data.isCorrect ? 'correct' : 'incorrect';
                    answer.validatedAt = new Date();

                    // Mettre à jour le score si la réponse est correcte
                    if (data.isCorrect) {
                        const currentScore = room.scores.get(answer.userId) || 0;
                        room.scores.set(answer.userId, currentScore + (data.points || 10));

                        // Émettre la mise à jour du score
                        io.to(data.gameId).emit('scoreUpdated', {
                            userId: answer.userId,
                            score: data.points || 10,
                            totalScore: room.scores.get(answer.userId),
                            timestamp: new Date()
                        });
                    }

                    // Émettre la validation de la réponse
                    io.to(data.gameId).emit('answerValidated', {
                        answerId: data.answerId,
                        isCorrect: data.isCorrect,
                        timestamp: new Date()
                    });

                    // Émettre les listes mises à jour
                    io.to(data.gameId).emit('scoresList', Array.from(room.scores.entries()));
                    io.to(data.gameId).emit('answersList', Array.from(room.answers.entries()));
                }
            }
        });

        // Mettre à jour le score
        socket.on('updateScore', (data) => {
            console.log(`Mise à jour du score:`, data);
            const room = gameRooms.get(data.gameId);
            if (room) {
                const currentScore = room.scores.get(data.userId) || 0;
                room.scores.set(data.userId, currentScore + data.score);

                io.to(data.gameId).emit('scoreUpdated', {
                    userId: data.userId,
                    score: data.score,
                    totalScore: room.scores.get(data.userId),
                    timestamp: new Date()
                });

                io.to(data.gameId).emit('scoresList', Array.from(room.scores.entries()));
            }
        });

        // Envoyer un message
        socket.on('sendMessage', (data) => {
            console.log(`Message reçu pour ${data.gameId}:`, data.content);
            const room = gameRooms.get(data.gameId);
            if (room) {
                const participant = room.participants.get(socket.id);
                const userId = participant ? participant.userId : socket.userId || `user-${socket.id.slice(0, 6)}`;

                const message = {
                    id: `${userId}-${Date.now()}`,
                    userId: userId,
                    content: data.content,
                    timestamp: new Date(),
                    status: 'sent',
                    readBy: new Set([userId])
                };

                room.messages.push(message);

                // Émettre le nouveau message à tous les clients
                io.to(data.gameId).emit('newMessage', message);
            }
        });

        // Indicateur de typage
        socket.on('typing', (data) => {
            const room = gameRooms.get(data.gameId);
            if (room) {
                room.typingUsers.add(data.userId);
                socket.to(data.gameId).emit('userTyping', {
                    userId: data.userId,
                    timestamp: new Date()
                });
            }
        });

        // Arrêt de l'indicateur de typage
        socket.on('stopTyping', (data) => {
            const room = gameRooms.get(data.gameId);
            if (room) {
                room.typingUsers.delete(data.userId);
                socket.to(data.gameId).emit('userStoppedTyping', {
                    userId: data.userId,
                    timestamp: new Date()
                });
            }
        });

        // Marquer un message comme lu
        socket.on('markMessageAsRead', (data) => {
            const room = gameRooms.get(data.gameId);
            if (room) {
                const message = room.messages.find(m => m.id === data.messageId);
                if (message) {
                    const participant = room.participants.get(socket.id);
                    const userId = participant ? participant.userId : socket.userId;

                    message.readBy.add(userId);
                    message.status = 'read';
                    io.to(data.gameId).emit('messageRead', {
                        messageId: data.messageId,
                        userId: userId,
                        timestamp: new Date()
                    });
                }
            }
        });

        // Déconnexion
        socket.on('disconnect', () => {
            console.log(`Utilisateur déconnecté: ${socket.id}`);

            // Nettoyer toutes les salles
            gameRooms.forEach((room, gameId) => {
                if (room.participants.has(socket.id)) {
                    const participant = room.participants.get(socket.id);
                    const userId = participant ? participant.userId : socket.userId;

                    room.participants.delete(socket.id);
                    room.typingUsers.delete(userId);

                    io.to(gameId).emit('participantsList', Array.from(room.participants.entries()));
                    io.to(gameId).emit('userLeft', {
                        userId: userId,
                        timestamp: new Date()
                    });

                    console.log(`🧹 Nettoyage de ${gameId} pour ${socket.id}`);
                }
            });
        });
    });

    return io;
};

module.exports = configureSocket;