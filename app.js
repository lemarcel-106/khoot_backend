require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan'); // ➕ Import de Morgan pour le logging des requêtes HTTP
const fs = require('fs'); // ➕ Import pour la gestion des fichiers (logs)

// Importation des utilitaires
const logger = require('./logger');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const configureSocket = require('./config/socket');

// Initialisation de l'application Express
const app = express();

// ==================================================================
// CONFIGURATION DU LOGGING DES REQUÊTES AVEC MORGAN
// ==================================================================

// 📝 Création du répertoire de logs s'il n'existe pas
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('📁 Répertoire logs créé');
}

// 📄 Création d'un stream pour écrire les logs d'accès dans un fichier
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'), 
    { flags: 'a' } // 'a' pour append (ajouter à la fin du fichier)
);

// 🎨 Format personnalisé pour Morgan avec informations détaillées
morgan.token('real-ip', (req) => {
    // Récupération de la vraie IP (utile derrière un proxy/load balancer)
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.ip;
});

morgan.token('user-agent', (req) => {
    return req.headers['user-agent'] || 'N/A';
});

morgan.token('timestamp', () => {
    return new Date().toISOString();
});

// 🔧 Configuration de Morgan selon l'environnement
if (process.env.NODE_ENV === 'production') {
    // 🏭 PRODUCTION: Logs détaillés uniquement dans les fichiers
    app.use(morgan('combined', {
        stream: accessLogStream,
        // Filtrer les logs: ne pas logger les requêtes de santé/monitoring
        skip: (req, res) => {
            return req.url === '/health' || req.url === '/favicon.ico';
        }
    }));
    
    // Logs d'erreurs uniquement dans la console en production
    app.use(morgan('short', {
        skip: (req, res) => res.statusCode < 400
    }));
    
} else {
    // 🛠️ DÉVELOPPEMENT: Logs colorés dans la console + fichier
    
    // Format personnalisé pour le développement avec couleurs
    const devFormat = ':timestamp [:method] :url :status :response-time ms - :res[content-length] bytes - IP: :real-ip';
    
    // Logs dans la console (colorés)
    app.use(morgan('dev'));
    
    // Logs détaillés dans le fichier
    app.use(morgan(devFormat, {
        stream: accessLogStream
    }));
    
    // Logs spéciaux pour les erreurs 4xx et 5xx
    app.use(morgan(':timestamp [ERROR] :method :url :status - :res[content-length] bytes - IP: :real-ip - User-Agent: :user-agent', {
        skip: (req, res) => res.statusCode < 400,
        stream: {
            write: (message) => {
                // Utiliser votre logger personnalisé pour les erreurs
                logger.error(`HTTP Error: ${message.trim()}`);
            }
        }
    }));
}

// 📊 Middleware personnalisé pour logger les données de requête sensibles
app.use((req, res, next) => {
    // Ne logger les bodies que pour certaines routes et en développement
    if (process.env.NODE_ENV === 'development' && 
        req.method === 'POST' && 
        req.url.includes('/api/auth')) {
        
        // ⚠️ ATTENTION: Ne jamais logger les mots de passe en production
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) {
            sanitizedBody.password = '***HIDDEN***';
        }
        
        logger.debug(`📝 Request Body pour ${req.method} ${req.url}:`, sanitizedBody);
    }
    next();
});

// ==================================================================
// CONFIGURATION CORS
// ==================================================================
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==================================================================
// MIDDLEWARES DE PARSING (AVANT LES ROUTES)
// ==================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================================================================
// CONFIGURATION DES FICHIERS STATIQUES ET VUES
// ==================================================================
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================================================================
// ROUTE DE HEALTH CHECK (pour monitoring)
// ==================================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ==================================================================
// IMPORTATION DES ROUTES
// ==================================================================
const appRoutes = require('./routes/appRoutes');
const userRoutes = require('./routes/api/userRoutes');
const jeuRoute = require('./routes/api/jeuRoutes');
const apprenantRoutes = require('./routes/api/apprenantRoutes');
const questionRoute = require('./routes/api/questionRoutes');
const reponseAppRoute = require('./routes/api/reponseAppRoutes');
const reponseRoute = require('./routes/api/reponseRoutes');
const typeQuestionRoute = require('./routes/api/typeQuestionRoutes');
const pointRoute = require('./routes/api/pointRoutes');
const authRoute = require('./routes/api/authRoutes');
const adminRoute = require('./routes/api/adminRoutes');
const ecoleRoute = require('./routes/api/ecoleRoutes');
const participantRoute = require('./routes/api/participantRoutes');
const planificationRoute = require('./routes/api/planificationRoutes');
const roleRoute = require('./routes/api/roleRoutes');
const paysRoute = require('./routes/api/paysRoutes');
const avatarRoute = require('./routes/api/avatarRoutes');

// Routes additionnelles
const abonnementRoutes = require('./routes/api/abonnementRoutes');
const notificationRoutes = require('./routes/api/notificationRoutes');
const temoignageRoutes = require('./routes/api/temoignageRoutes');
const faqRoutes = require('./routes/api/faqRoutes');

// ==================================================================
// DÉFINITION DES ROUTES
// ==================================================================

// Route principale
app.use('/', appRoutes);

// Routes API principales
app.use('/api', authRoute);
app.use('/api', userRoutes);
app.use('/api', apprenantRoutes);
app.use('/api', jeuRoute);
app.use('/api', questionRoute);
app.use('/api', reponseAppRoute);
app.use('/api', reponseRoute);
app.use('/api', typeQuestionRoute);
app.use('/api', pointRoute);
app.use('/api', adminRoute);
app.use('/api', ecoleRoute);
app.use('/api', participantRoute);
app.use('/api', planificationRoute);
app.use('/api', roleRoute);
app.use('/api', paysRoute);
app.use('/api', avatarRoute);

// Routes API spécialisées
app.use('/api/abonnements', abonnementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/temoignages', temoignageRoutes);
app.use('/api/faqs', faqRoutes);

// ==================================================================
// MIDDLEWARE DE GESTION D'ERREURS 404
// ==================================================================
app.use('*', (req, res) => {
    // Logger les tentatives d'accès à des routes inexistantes
    logger.warn(`🚫 Tentative d'accès à une route inexistante: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} non trouvée`
    });
});

// ==================================================================
// MIDDLEWARE DE GESTION D'ERREURS (DOIT ÊTRE EN DERNIER)
// ==================================================================
app.use(errorHandler);

// ==================================================================
// CRÉATION DU SERVEUR HTTP ET CONFIGURATION SOCKET.IO
// ==================================================================
const server = http.createServer(app);

// Configuration Socket.IO
const io = configureSocket(server);

// Rendre io accessible dans l'application
app.set('socketio', io);

// Middleware pour injecter io dans les requêtes (optionnel)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ==================================================================
// FONCTION DE DÉMARRAGE DU SERVEUR
// ==================================================================
const startServer = async () => {
    try {
        // Connexion à MongoDB
        await connectDB();
        logger.info('🗄️ Base de données connectée avec succès');

        // Démarrage du serveur
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
            logger.info(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`📡 Socket.IO configuré et prêt`);
            logger.info(`📝 Morgan logger configuré - Logs sauvegardés dans: ${path.join(logsDir, 'access.log')}`);
        });

        // Gestion propre de l'arrêt du serveur
        const gracefulShutdown = () => {
            logger.info('⏹️ Arrêt du serveur en cours...');
            
            // Fermer le stream de logs
            if (accessLogStream) {
                accessLogStream.end();
                logger.info('📝 Stream de logs fermé');
            }
            
            // Fermer les connexions Socket.IO
            io.close(() => {
                logger.info('📡 Socket.IO fermé');
            });
            
            // Fermer le serveur HTTP
            server.close(() => {
                logger.info('✅ Serveur arrêté proprement');
                process.exit(0);
            });
        };

        // Écouter les signaux d'arrêt
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        logger.error('❌ Erreur lors du démarrage du serveur:', error.message);
        process.exit(1);
    }
};

// ==================================================================
// GESTION DES ERREURS NON CAPTURÉES
// ==================================================================
process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Rejet de promesse non géré:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('❌ Exception non capturée:', error);
    process.exit(1);
});

// Démarrage du serveur
startServer();

// Export pour les tests
module.exports = { app, server, io };