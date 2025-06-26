// routes/api/notificationRoutes.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/notificationController');
const authenticateToken = require('../../middleware/authenticateToken');
const checkRequiredFields = require('../../middleware/checkRequiredFields');

// ===============================================
// ROUTES CRUD POUR LES NOTIFICATIONS
// ===============================================

/**
 * Créer une nouvelle notification
 * CHAMPS REQUIS : titre, contenu, ecole
 * ACCÈS : Authentifié uniquement
 */
router.post('/', 
    authenticateToken,
    checkRequiredFields(['titre', 'contenu', 'ecole']),
    ctrl.create
);

/**
 * ✅ CORRIGÉ : Récupérer les notifications d'une école spécifique
 * ROUTE : GET /api/notifications/ecole/:ecoleId
 * ACCÈS : Authentifié uniquement
 */
router.get('/ecole/:ecoleId', 
    authenticateToken,
    ctrl.getByEcole
);

/**
 * ✅ NOUVEAU : Récupérer les notifications de l'école de l'admin connecté
 * ROUTE : GET /api/notifications/my-notifications
 * ACCÈS : Authentifié uniquement
 */
router.get('/my-notifications', 
    authenticateToken,
    ctrl.getMyNotifications
);

/**
 * Marquer une notification comme lue
 * ROUTE : POST /api/notifications/:id/marquer-lue
 * ACCÈS : Authentifié uniquement
 */
router.post('/:id/marquer-lue', 
    authenticateToken,
    ctrl.markAsRead
);

/**
 * ✅ NOUVEAU : Marquer toutes les notifications comme lues pour l'utilisateur connecté
 * ROUTE : POST /api/notifications/marquer-toutes-lues
 * ACCÈS : Authentifié uniquement
 */
router.post('/marquer-toutes-lues', 
    authenticateToken,
    ctrl.markAllAsRead
);

/**
 * ✅ NOUVEAU : Supprimer une notification
 * ROUTE : POST /api/notifications/:id/delete
 * ACCÈS : Authentifié uniquement
 */
router.post('/:id/delete', 
    authenticateToken,
    ctrl.deleteNotification
);

/**
 * ✅ NOUVEAU : Obtenir le nombre de notifications non lues
 * ROUTE : GET /api/notifications/count-unread
 * ACCÈS : Authentifié uniquement
 */
router.get('/count-unread', 
    authenticateToken,
    ctrl.getUnreadCount
);

// ===============================================
// ROUTES D'AIDE ET DOCUMENTATION
// ===============================================

/**
 * Obtenir le format attendu pour la création de notifications
 */
router.get('/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format de création de notification',
        format: {
            titre: {
                type: "string",
                required: true,
                minLength: 3,
                maxLength: 100,
                description: "Titre de la notification"
            },
            contenu: {
                type: "string",
                required: true,
                minLength: 10,
                maxLength: 1000,
                description: "Contenu détaillé de la notification"
            },
            ecole: {
                type: "ObjectId",
                required: true,
                description: "ID de l'école destinataire"
            },
            type: {
                type: "string",
                enum: ["info", "alerte"],
                default: "info",
                description: "Type de notification"
            }
        },
        exemples: {
            creation: "POST /api/notifications",
            parEcole: "GET /api/notifications/ecole/:ecoleId",
            mesNotifications: "GET /api/notifications/my-notifications",
            marquerLue: "POST /api/notifications/:id/marquer-lue",
            marquerToutesLues: "POST /api/notifications/marquer-toutes-lues",
            compterNonLues: "GET /api/notifications/count-unread",
            supprimer: "POST /api/notifications/:id/delete"
        }
    });
});

/**
 * Vérifier l'état du service des notifications
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service des notifications opérationnel',
        timestamp: new Date().toISOString(),
        endpoints: {
            crud: [
                'POST /notifications',
                'GET /notifications/ecole/:ecoleId',
                'POST /notifications/:id/delete'
            ],
            user: [
                'GET /notifications/my-notifications',
                'POST /notifications/:id/marquer-lue',
                'POST /notifications/marquer-toutes-lues',
                'GET /notifications/count-unread'
            ],
            aide: [
                'GET /notifications/help/format',
                'GET /notifications/health'
            ]
        }
    });
});

module.exports = router;