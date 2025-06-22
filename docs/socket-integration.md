# Documentation d'Intégration Socket.IO

## Vue d'ensemble
Cette documentation explique comment intégrer le backend Socket.IO avec une application Next.js frontend.

## Configuration du Backend
Le backend est configuré avec les fonctionnalités suivantes :
- Gestion des salles de jeu
- Gestion des participants
- Système de scores en temps réel
- Système de réponses en temps réel
- Système de chat en temps réel

## Événements Socket.IO Disponibles

### Connexion et Authentification
```javascript
// Connexion au serveur
const socket = io('http://votre-serveur:port', {
    auth: {
        token: 'votre-token-jwt' // Requis pour l'authentification
    }
});
```

### Événements de Salle de Jeu
```javascript
// Rejoindre une salle
socket.emit('joinGame', gameId);

// Quitter une salle
socket.emit('leaveGame', gameId);

// Écouter les participants
socket.on('participantsList', (participants) => {
    // participants: Array<[socketId, {userId, joinedAt, status}]>
});

// Écouter les nouveaux participants
socket.on('userJoined', (data) => {
    // data: { userId, timestamp }
});

// Écouter les participants qui partent
socket.on('userLeft', (data) => {
    // data: { userId, timestamp }
});
```

### Événements de Score
```javascript
// Mettre à jour un score
socket.emit('updateScore', {
    gameId: 'id-du-jeu',
    userId: 'id-utilisateur',
    score: points
});

// Écouter les mises à jour de score
socket.on('scoreUpdated', (data) => {
    // data: { userId, score, totalScore, timestamp }
});

// Écouter la liste des scores
socket.on('scoresList', (scores) => {
    // scores: Array<[userId, score]>
});
```

### Événements de Réponses
```javascript
// Envoyer une réponse
socket.emit('sendAnswer', {
    gameId: 'id-du-jeu',
    answer: 'réponse'
});

// Valider une réponse
socket.emit('validateAnswer', {
    gameId: 'id-du-jeu',
    answerId: 'id-réponse',
    isCorrect: true,
    points: 10
});

// Écouter les nouvelles réponses
socket.on('newAnswer', (answer) => {
    // answer: { id, userId, answer, status, timestamp }
});

// Écouter la validation des réponses
socket.on('answerValidated', (data) => {
    // data: { answerId, isCorrect, timestamp }
});

// Écouter la liste des réponses
socket.on('answersList', (answers) => {
    // answers: Array<[answerId, answer]>
});
```

### Événements de Chat
```javascript
// Envoyer un message
socket.emit('sendMessage', {
    gameId: 'id-du-jeu',
    content: 'message'
});

// Indiquer que l'utilisateur est en train d'écrire
socket.emit('typing', {
    gameId: 'id-du-jeu',
    userId: 'id-utilisateur'
});

// Arrêter l'indicateur de typage
socket.emit('stopTyping', {
    gameId: 'id-du-jeu',
    userId: 'id-utilisateur'
});

// Marquer un message comme lu
socket.emit('markMessageAsRead', {
    gameId: 'id-du-jeu',
    messageId: 'id-message'
});

// Écouter les nouveaux messages
socket.on('newMessage', (message) => {
    // message: { id, userId, content, timestamp, status }
});

// Écouter l'historique du chat
socket.on('chatHistory', (messages) => {
    // messages: Array<message>
});

// Écouter les indicateurs de typage
socket.on('userTyping', (data) => {
    // data: { userId, timestamp }
});

// Écouter les notifications de lecture
socket.on('messageRead', (data) => {
    // data: { messageId, userId, timestamp }
});
```

## Intégration avec Next.js

### Installation des Dépendances
```bash
npm install socket.io-client
```

### Configuration du Client Socket.IO
Créez un fichier `lib/socket.js` :
```javascript
import { io } from 'socket.io-client';

let socket;

export const initSocket = (token) => {
    if (!socket) {
        socket = io('http://votre-serveur:port', {
            auth: { token }
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket non initialisé');
    }
    return socket;
};
```

### Utilisation dans les Composants Next.js
```javascript
import { useEffect, useState } from 'react';
import { initSocket, getSocket } from '../lib/socket';

export default function GameRoom({ gameId, token }) {
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        // Initialiser le socket
        const socket = initSocket(token);

        // Rejoindre la salle
        socket.emit('joinGame', gameId);

        // Écouter les messages
        socket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Écouter les participants
        socket.on('participantsList', (participants) => {
            setParticipants(participants);
        });

        // Nettoyage
        return () => {
            socket.emit('leaveGame', gameId);
            socket.off('newMessage');
            socket.off('participantsList');
        };
    }, [gameId, token]);

    // ... reste du composant
}
```

### Gestion des États avec React
Pour une meilleure gestion des états, vous pouvez utiliser des hooks personnalisés :

```javascript
// hooks/useGameRoom.js
import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';

export function useGameRoom(gameId) {
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [scores, setScores] = useState(new Map());
    const [answers, setAnswers] = useState(new Map());

    useEffect(() => {
        const socket = getSocket();
        
        // Configuration des écouteurs
        socket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('participantsList', (participants) => {
            setParticipants(participants);
        });

        socket.on('scoresList', (scores) => {
            setScores(new Map(scores));
        });

        socket.on('answersList', (answers) => {
            setAnswers(new Map(answers));
        });

        // Nettoyage
        return () => {
            socket.off('newMessage');
            socket.off('participantsList');
            socket.off('scoresList');
            socket.off('answersList');
        };
    }, [gameId]);

    return {
        messages,
        participants,
        scores,
        answers,
        sendMessage: (content) => {
            getSocket().emit('sendMessage', { gameId, content });
        },
        sendAnswer: (answer) => {
            getSocket().emit('sendAnswer', { gameId, answer });
        }
    };
}
```

## Bonnes Pratiques
1. Toujours gérer la déconnexion dans les composants
2. Utiliser des hooks personnalisés pour la logique Socket.IO
3. Implémenter une gestion d'erreur robuste
4. Utiliser des types TypeScript pour une meilleure maintenabilité
5. Mettre en place un système de reconnexion automatique

## Exemple de Gestion d'Erreur
```javascript
socket.on('connect_error', (error) => {
    console.error('Erreur de connexion:', error);
    // Implémenter une logique de reconnexion
});

socket.on('error', (error) => {
    console.error('Erreur Socket.IO:', error);
    // Gérer l'erreur de manière appropriée
});
```

## Sécurité
1. Toujours utiliser HTTPS en production
2. Valider les tokens JWT côté serveur
3. Implémenter une gestion des timeouts
4. Limiter le nombre de connexions par utilisateur
5. Mettre en place une protection contre les attaques DDoS 