const express = require('express');
const router = express.Router();
const questionController = require('../../controllers/questionController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');
const { uploadImage } = require('../../middleware/upload');
const { authenticate } = require('../../utils/middlewares/authMiddleware');

// ===============================================
// ROUTES EXISTANTES (CRUD CLASSIQUE)
// ===============================================

router.get('/questions', 
    questionController.getAllQuestions
);

router.post('/questions', 
    uploadImage.single('fichier'), 
    checkRequiredFields(['libelle', 'temps', 'limite_response', 'typeQuestion', 'point']), 
    questionController.createQuestion
);

// ✅ CORRIGÉ : POST au lieu de PUT
router.post('/questions/update/:id', 
    authenticateToken, 
    questionController.updateQuestion
);

// ✅ CORRIGÉ : POST au lieu de GET pour delete
router.post('/questions/delete/:id', 
    authenticateToken, 
    questionController.deleteQuestionById
);

router.get('/questions/:id', 
    questionController.recupererQuestionParId
);

router.post('/questions/add-question', 
    questionController.addExistingReponseToQuestion
);

// ===============================================
// NOUVELLES ROUTES SPÉCIFIQUES POUR LES QUESTIONS PAR JEU
// ===============================================

/**
 * Récupérer toutes les questions d'un jeu avec détails complets
 * Route: GET /api/questions/jeu/:jeuId/detailles
 * Permissions: 
 * - Enseignants: Leurs propres jeux uniquement (statut actif requis)
 * - Admins: Jeux de leur école
 * - Super_admins: Tous les jeux
 * Données: Questions avec réponses, points, types, statistiques
 */
router.get('/questions/jeu/:jeuId/detailles', 
    authenticate,  // ✅ Vérifie automatiquement l'auth + statut actif
    questionController.getQuestionsByJeuDetailles
);

/**
 * Récupérer les questions d'un jeu (version simplifiée)
 * Route: GET /api/questions/jeu/:jeuId
 * Permissions: Authentification requise
 * Données: Questions avec populate de base
 */
router.get('/questions/jeu/:jeuId', 
    authenticate,
    questionController.getQuestionsByJeu
);

/**
 * Récupérer les statistiques des questions d'un jeu
 * Route: GET /api/questions/jeu/:jeuId/statistiques
 * Permissions: 
 * - Enseignants: Leurs propres jeux uniquement
 * - Admins: Jeux de leur école
 * - Super_admins: Tous les jeux
 * Données: Statistiques et résumé des questions
 */
router.get('/questions/jeu/:jeuId/statistiques', 
    authenticate,
    questionController.getQuestionsByJeuStats
);

// ===============================================
// ROUTE D'AIDE ET DOCUMENTATION
// ===============================================

/**
 * Obtenir le format des données pour les questions d'un jeu
 * Route: GET /api/questions/jeu/help/format
 */
router.get('/questions/jeu/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format des données pour les questions d\'un jeu',
        routes: {
            detailles: {
                url: "GET /api/questions/jeu/:jeuId/detailles",
                description: "Questions complètes avec tous les détails",
                permissions: "Selon rôle utilisateur",
                donnees: [
                    "Informations du jeu",
                    "Liste des questions avec réponses",
                    "Types de questions",
                    "Points attribués",
                    "Statistiques globales",
                    "Temps par question"
                ]
            },
            simple: {
                url: "GET /api/questions/jeu/:jeuId",
                description: "Questions basiques avec populate",
                permissions: "Authentification requise",
                donnees: [
                    "Questions avec réponses",
                    "Types et points",
                    "Pas de statistiques"
                ]
            },
            statistiques: {
                url: "GET /api/questions/jeu/:jeuId/statistiques",
                description: "Seulement les statistiques",
                permissions: "Selon rôle utilisateur",
                donnees: [
                    "Nombre total de questions",
                    "Répartition par type",
                    "Points totaux possibles",
                    "Temps total estimé"
                ]
            }
        },
        exemples: {
            jeuId: "648a1b2c3d4e5f6789abcdef",
            appelDetaille: "GET /api/questions/jeu/648a1b2c3d4e5f6789abcdef/detailles",
            appelSimple: "GET /api/questions/jeu/648a1b2c3d4e5f6789abcdef",
            appelStats: "GET /api/questions/jeu/648a1b2c3d4e5f6789abcdef/statistiques"
        },
        permissions: {
            enseignant: "Peut voir les questions de ses propres jeux uniquement",
            admin: "Peut voir les questions des jeux de son école",
            super_admin: "Peut voir les questions de tous les jeux"
        }
    });
});

module.exports = router;