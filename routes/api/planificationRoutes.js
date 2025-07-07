const express = require('express');
const PlanificationController = require('../../controllers/planificationController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');
const { authenticate } = require('../../utils/middlewares/authMiddleware');

// ===============================================
// ROUTES PRINCIPALES POUR LES PLANIFICATIONS
// ===============================================

/**
 * ✅ ROUTE MISE À JOUR : Créer une planification selon vos spécifications
 * Route: POST /api/planification
 * Champs requis: date_debut, date_fin, heure_debut, heure_fin, limite_participant, type, jeu
 * Authentification: Requise
 * Format attendu selon vos spécifications :
 * {
 *   "date_debut": "2025/06/25",
 *   "date_fin": "2025/06/08", 
 *   "heure_debut": "08h00",
 *   "heure_fin": "12h00",
 *   "limite_participant": 100,
 *   "type": "Examen", // ou "Live" uniquement
 *   "jeu": "686ad4aba87a9d7654bd5910"
 * }
 * Note: Le statut sera automatiquement "en-attente" par défaut
 */
router.post('/planification', 
    authenticate, // ✅ Authentification requise
    checkRequiredFields(['date_debut', 'date_fin', 'heure_debut', 'heure_fin', 'type', 'limite_participant', 'jeu']),  
    PlanificationController.createPlanification
);

/**
 * ✅ NOUVELLE ROUTE : Terminer une planification
 * Route: POST /api/planification/terminer/:id
 * Description: Passe le statut d'une planification à "terminé"
 * Authentification: Requise
 */
router.post('/planification/terminer/:id', 
    authenticate,
    PlanificationController.terminerPlanification
);

// ===============================================
// ROUTES DE CONSULTATION
// ===============================================

/**
 * ✅ ROUTE EXISTANTE : Récupérer une planification par PIN
 * Route: POST /api/planification/pin
 * Body: { "pin": "123456" }
 */
router.post('/planification/pin', 
    checkRequiredFields(['pin']),
    PlanificationController.getPlanificationByPin
);

/**
 * ✅ ROUTE EXISTANTE : Récupérer une planification par ID
 * Route: GET /api/planification/:id
 */
router.get('/planification/:id', 
    PlanificationController.getPlanificationById
);

/**
 * ✅ ROUTE EXISTANTE : Récupérer toutes les planifications d'un jeu
 * Route: GET /api/planification/jeu/:id
 */
router.get('/planification/jeu/:id', 
    PlanificationController.getPlanificationsByJeu
);

// ===============================================
// ROUTES DE GESTION DES PARTICIPANTS
// ===============================================

/**
 * ✅ ROUTE EXISTANTE AMÉLIORÉE : Ajouter un participant existant à une planification
 * Route: POST /api/planification/add-participant
 * Body: { "planificationId": "...", "participantId": "..." }
 * Note: Cette route gère automatiquement le passage du statut à "en-cours"
 */
router.post('/planification/add-participant', 
    checkRequiredFields(['planificationId', 'participantId']),
    PlanificationController.addExistingParticipantToPlan
);

// ===============================================
// ROUTES DE MODIFICATION ET SUPPRESSION
// ===============================================

/**
 * ✅ ROUTE EXISTANTE : Mettre à jour une planification
 * Route: POST /api/planification/update/:id
 * Authentification: Requise
 */
router.post('/planification/update/:id', 
    authenticate,
    PlanificationController.updatePlanification
);

/**
 * ✅ ROUTE EXISTANTE : Supprimer une planification
 * Route: POST /api/planification/delete/:id
 * Authentification: Requise
 */
router.post('/planification/delete/:id', 
    authenticate,
    PlanificationController.deletePlanificationById
);

// ===============================================
// ROUTES DE STATISTIQUES (EXISTANTES)
// ===============================================

/**
 * ✅ ROUTE EXISTANTE : Statistiques détaillées d'une planification
 * Route: GET /api/planification/:id/statistiques
 * Authentification: Requise
 */
router.get('/planification/:id/statistiques', 
    authenticateToken,
    PlanificationController.getStatistiquesDetaillees
);

/**
 * ✅ ROUTE EXISTANTE : Export CSV des résultats d'une planification
 * Route: GET /api/planification/:id/export-csv
 * Authentification: Requise
 */
router.get('/planification/:id/export-csv', 
    authenticateToken,
    PlanificationController.exportResultatsCSV
);

// ===============================================
// ROUTES D'AIDE ET DOCUMENTATION
// ===============================================

/**
 * Route d'aide pour comprendre le format des données
 * Route: GET /api/planification/help/format
 */
router.get('/planification/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format des données pour créer une planification',
        format: {
            route: "POST /api/planification",
            exempleBody: {
                date_debut: "2025/06/25",
                date_fin: "2025/06/28", 
                heure_debut: "08h00",
                heure_fin: "12h00",
                limite_participant: 100,
                type: "Examen", // ou "Live"
                jeu: "686ad4aba87a9d7654bd5910"
            },
            champsRequis: [
                "date_debut (format: YYYY/MM/DD)",
                "date_fin (format: YYYY/MM/DD)", 
                "heure_debut (format: HHhMM ex: 08h00)",
                "heure_fin (format: HHhMM ex: 12h00)",
                "limite_participant (nombre entre 1 et 1000)",
                "type (Examen ou Live uniquement)",
                "jeu (ObjectId du jeu)"
            ],
            automatique: {
                statut: "en-attente (par défaut)",
                pin: "généré automatiquement (6 chiffres)",
                changementStatut: "passe à 'en-cours' quand le premier participant rejoint"
            }
        },
        routes: {
            creation: "POST /api/planification",
            terminer: "POST /api/planification/terminer/:id",
            ajouterParticipant: "POST /api/planification/add-participant",
            consulterParPin: "POST /api/planification/pin",
            consulterParId: "GET /api/planification/:id",
            planificationsJeu: "GET /api/planification/jeu/:id",
            mettreAJour: "POST /api/planification/update/:id",
            supprimer: "POST /api/planification/delete/:id",
            statistiques: "GET /api/planification/:id/statistiques",
            exportCSV: "GET /api/planification/:id/export-csv"
        },
        gestionStatuts: {
            defaut: "en-attente",
            automatique: "en-cours (quand premier participant rejoint)",
            manuel: "terminé (via route /terminer/:id)"
        },
        typesAutorises: ["Examen", "Live"],
        formatsRequis: {
            dates: "YYYY/MM/DD (ex: 2025/06/25)",
            heures: "HHhMM (ex: 08h00, 14h30)",
            limiteParticipants: "Nombre entier entre 1 et 1000"
        }
    });
});

/**
 * ✅ NOUVELLE ROUTE : Obtenir les statistiques rapides d'une planification
 * Route: GET /api/planification/:id/stats-rapides
 * Authentification: Requise
 */
router.get('/planification/:id/stats-rapides', 
    authenticate,
    async (req, res) => {
        try {
            const { id } = req.params;
            const planificationService = require('../../services/planificationService');
            
            const stats = await planificationService.getStatistiquesRapides(id);
            
            res.status(200).json({
                success: true,
                message: 'Statistiques rapides récupérées avec succès',
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
);

/**
 * ✅ NOUVELLE ROUTE : Récupérer toutes les planifications (tous jeux confondus)
 * Route: GET /api/planifications
 * Authentification: Requise
 * Permissions: Selon le rôle utilisateur
 * - Enseignants: Leurs propres planifications uniquement
 * - Admins: Planifications de leur école
 * - Super_admins: Toutes les planifications
 */
router.get('/planifications', 
    authenticate,
    PlanificationController.getAllPlanifications
);

/**
 * ✅ NOUVELLE ROUTE : Recherche sécurisée par PIN
 * Route: POST /api/planification/pin-secure
 * Body: { "pin": "123456" }
 */
router.post('/planification/pin-secure', 
    checkRequiredFields(['pin']),
    async (req, res) => {
        try {
            const { pin } = req.body;
            const planificationService = require('../../services/planificationService');
            
            const planification = await planificationService.getPlanificationByPinSecure(pin);
            
            if (!planification) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune planification trouvée avec ce PIN'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Planification trouvée',
                data: planification
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la recherche',
                error: error.message
            });
        }
    }
);

module.exports = router;