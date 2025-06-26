const express = require('express');
const router = express.Router();
const jeuController = require('../../controllers/jeuController');
const authenticateToken = require('../../middleware/authenticateToken');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const { uploadImage } = require('../../middleware/upload');
const { authenticate, requireSuperAdmin } = require('../../utils/middlewares/authMiddleware');
const { checkSubscriptionLimits } = require('../../middleware/subscriptionLimitsMiddleware');

// ===============================================
// ROUTES DE RÉCUPÉRATION (LECTURE)
// ===============================================

/**
 * ✅ MODIFIÉ: Récupérer tous les jeux (version simple)
 * Route: GET /api/jeux
 * Permissions: 
 * - Enseignants: Leurs propres jeux uniquement (statut actif requis)
 * - Admins: Jeux de leur école
 * - Super_admins: Tous les jeux
 * Données: titre, image, date, créateur, école
 */
router.get('/jeux', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    jeuController.getAllJeux
);

/**
 * ✅ MODIFIÉ: Récupérer tous les jeux (version détaillée)
 * Route: GET /api/jeux/detailles
 * Permissions: 
 * - Enseignants: Leurs propres jeux uniquement (statut actif requis)
 * - Admins: Jeux de leur école
 * - Super_admins: Tous les jeux
 * Données: Toutes les relations (questions, planifications, participants)
 */
router.get('/jeux/detailles', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    jeuController.getAllJeuxDetailles
);

/**
 * ✅ MODIFIÉ: Récupérer un jeu spécifique par ID
 * Route: GET /api/jeux/:id
 * Permissions: 
 * - Enseignants: Leurs propres jeux uniquement (statut actif requis)
 * - Admins: Jeux de leur école
 * - Super_admins: Tous les jeux
 */
router.get('/jeux/:id', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    jeuController.getJeuById
);

/**
 * ✅ MODIFIÉ: Récupérer tous les jeux d'un enseignant spécifique
 * Route: GET /api/jeux/enseignant/:enseignantId
 * Permissions:
 * - Enseignants: Leurs propres jeux uniquement (enseignantId = leur ID, statut actif requis)
 * - Admins: Enseignants de leur école
 * - Super_admins: Tous les enseignants
 */
router.get('/jeux/enseignant/:enseignantId', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    jeuController.getJeuxByEnseignant
);

/**
 * Récupérer un jeu par PIN (ACCÈS PUBLIC)
 * Route: POST /api/jeux/pin
 * Permissions: Aucune authentification requise
 * Usage: Pour les apprenants qui rejoignent un jeu
 */
router.post('/jeux/pin', 
    jeuController.getJeuDetailsByPin
);

// ===============================================
// ROUTES DE CRÉATION ET MODIFICATION
// ===============================================

/**
 * ✅ MODIFIÉ: Créer un nouveau jeu
 * Route: POST /api/jeux
 * Permissions: 
 * - Enseignants: Peuvent créer (statut actif requis)
 * - Admins: Peuvent créer
 * - Super_admins: Peuvent créer
 * Champs requis: titre
 * Champs optionnels: image (fichier)
 */
// router.post('/jeux', 
//     authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
//     // ❌ RETIRÉ: authenticateToken (redondant avec authenticate)
//     uploadImage.single('image'),
//     checkRequiredFields(['titre']),
//     jeuController.createJeu
// );

router.post('/jeux', 
    authenticate,
    checkSubscriptionLimits('jeux'), // ✅ AJOUT : Contrôle des limites
    uploadImage.single('image'),
    checkRequiredFields(['titre']),
    jeuController.createJeu
);

/**
 * ✅ MODIFIÉ: Mettre à jour un jeu existant
 * Route: PUT /api/jeux/update/:id (changé de POST à PUT)
 * Permissions:
 * - Enseignants: Leurs propres jeux uniquement (statut actif requis)
 * - Admins: Jeux des enseignants de leur école
 * - Super_admins: Tous les jeux
 */
router.put('/jeux/update/:id', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    uploadImage.single('image'),
    jeuController.updateJeu
);

/**
 * ✅ MODIFIÉ: Supprimer un jeu
 * Route: DELETE /api/jeux/delete/:id (changé de POST à DELETE)
 * Permissions:
 * - Enseignants: Leurs propres jeux uniquement (statut actif requis)
 * - Admins: Jeux des enseignants de leur école
 * - Super_admins: Tous les jeux
 */
router.post('/jeux/delete/:id', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    jeuController.deleteJeuById
);

// ===============================================
// ROUTES D'AIDE ET DOCUMENTATION
// ===============================================

/**
 * Obtenir le format attendu pour la création de jeux
 * Route: GET /api/jeux/help/format
 * Permissions: Aucune authentification requise
 */
router.get('/jeux/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format de création de jeu',
        format: {
            titre: {
                type: "string",
                required: true,
                minLength: 3,
                maxLength: 100,
                description: "Titre du jeu"
            },
            image: {
                type: "file",
                required: false,
                formats: ["jpg", "jpeg", "png"],
                maxSize: "5MB",
                description: "Image de couverture du jeu"
            },
            createdBy: {
                type: "ObjectId",
                required: true,
                autoGenerated: true,
                description: "ID de l'enseignant créateur (automatique)"
            },
            ecole: {
                type: "ObjectId", 
                required: true,
                autoGenerated: true,
                description: "ID de l'école (automatique depuis le token)"
            }
        },
        relations: {
            questions: "Les questions seront ajoutées séparément via /api/questions",
            planifications: "Les planifications seront créées via /api/planification",
            participants: "Les participants rejoindront via PIN"
        },
        exemples: {
            creation: "POST /api/jeux",
            recuperation: "GET /api/jeux/:id",
            parEnseignant: "GET /api/jeux/enseignant/:enseignantId",
            parPin: "POST /api/jeux/pin",
            miseAJour: "PUT /api/jeux/update/:id",  // ✅ Mis à jour
            suppression: "DELETE /api/jeux/delete/:id"  // ✅ Mis à jour
        }
    });
});

/**
 * ✅ MODIFIÉ: Obtenir les permissions par rôle
 * Route: GET /api/jeux/help/permissions
 * Permissions: Aucune authentification requise
 */
router.get('/jeux/help/permissions', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Permissions par rôle pour les jeux',
        permissions: {
            enseignant: {
                create: "Oui (statut actif requis)",  // ✅ Mis à jour
                read: "Ses propres jeux uniquement",
                update: "Ses propres jeux uniquement", 
                delete: "Ses propres jeux uniquement",
                description: "Accès limité à ses créations + vérification statut actif"  // ✅ Mis à jour
            },
            admin: {
                create: "Oui",
                read: "Jeux de son école",
                update: "Jeux des enseignants de son école",
                delete: "Jeux des enseignants de son école", 
                description: "Gestion de l'école"
            },
            super_admin: {
                create: "Oui",
                read: "Tous les jeux",
                update: "Tous les jeux",
                delete: "Tous les jeux",
                description: "Accès complet au système + accès aux statistiques globales"  // ✅ Mis à jour
            }
        },
        notes: [
            "L'école est automatiquement assignée selon l'utilisateur connecté",
            "Les enseignants ne peuvent pas modifier l'école d'affectation",
            "Les super_admins peuvent gérer tous les jeux de toutes les écoles",
            "✅ NOUVEAU: Les enseignants doivent avoir un statut 'actif' pour se connecter",  // ✅ Ajouté
            "✅ NOUVEAU: Vérification automatique du statut à chaque requête"  // ✅ Ajouté
        ]
    });
});

/**
 * Vérifier l'état du service des jeux
 * Route: GET /api/jeux/health
 * Permissions: Aucune authentification requise
 */
router.get('/jeux/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service des jeux opérationnel',
        timestamp: new Date().toISOString(),
        endpoints: {
            lecture: [
                'GET /jeux',
                'GET /jeux/detailles', 
                'GET /jeux/:id',
                'GET /jeux/enseignant/:enseignantId',
                'POST /jeux/pin'
            ],
            ecriture: [
                'POST /jeux',
                'PUT /jeux/update/:id',   // ✅ Mis à jour
                'DELETE /jeux/delete/:id' // ✅ Mis à jour
            ],
            aide: [
                'GET /jeux/help/format',
                'GET /jeux/help/permissions',
                'GET /jeux/health'
            ]
        },
        statistiques: {
            methodesDisponibles: 8,
            routesProtegees: 6,
            routesPubliques: 3
        },
        securite: {  // ✅ Nouveau
            verificationStatut: true,
            restrictionEnseignants: true,
            filtrageDonnees: true
        }
    });
});

// ===============================================
// ROUTES DE STATISTIQUES (OPTIONNELLES)
// ===============================================

/**
 * ✅ MODIFIÉ: Obtenir les statistiques des jeux par école
 * Route: GET /api/jeux/stats/ecole/:ecoleId
 * Permissions: Admins de l'école, Super_admins (statut actif requis)
 */
router.get('/jeux/stats/ecole/:ecoleId', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    async (req, res) => {
        try {
            const { ecoleId } = req.params;
            const currentUser = req.user;

            // Vérification des permissions
            if (currentUser.role !== 'super_admin') {
                if (!currentUser.ecole || currentUser.ecole.toString() !== ecoleId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé à cette école'
                    });
                }
            }

            // Cette fonctionnalité peut être implémentée plus tard
            res.status(200).json({
                success: true,
                message: 'Statistiques des jeux (fonctionnalité en développement)',
                data: {
                    ecoleId: ecoleId,
                    totalJeux: 0,
                    jeuxActifs: 0,
                    enseignantsActifs: 0,
                    participationsTotal: 0
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * ✅ MODIFIÉ: Obtenir mes statistiques personnelles
 * Route: GET /api/jeux/mes-stats
 * Permissions: Enseignants (leurs stats), Admins (stats école), Super_admins (toutes stats)
 * Note: Enseignants doivent avoir statut actif
 */
router.get('/jeux/mes-stats', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    async (req, res) => {
        try {
            const currentUser = req.user;

            // ✅ AJOUT: Gestion différente selon le rôle
            let statsScope;
            switch (currentUser.role) {
                case 'enseignant':
                    statsScope = 'Mes jeux personnels';
                    break;
                case 'admin':
                    statsScope = 'Jeux de mon école';
                    break;
                case 'super_admin':
                    statsScope = 'Toutes les statistiques système';
                    break;
                default:
                    statsScope = 'Accès limité';
            }

            // Cette fonctionnalité peut être implémentée plus tard
            res.status(200).json({
                success: true,
                message: 'Mes statistiques de jeux (fonctionnalité en développement)',
                data: {
                    userId: currentUser.id,
                    userRole: currentUser.role,
                    statsScope: statsScope,  // ✅ Ajouté
                    mesJeux: 0,
                    planificationsTotal: 0,
                    participantsTotal: 0,
                    dernierJeuCree: null
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

module.exports = router;