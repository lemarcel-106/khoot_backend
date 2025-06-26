// routes/api/reponseAppRoutes.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();
const reponseAppController = require('../../controllers/reponseAppController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

// ===============================================
// ROUTES CRUD PRINCIPALES
// ===============================================

/**
 * Récupérer toutes les réponses apprenants d'une question spécifique
 * ACCÈS : Public
 */
router.get('/reponse-app/question/:id', 
    reponseAppController.getAllReponseAppById
);

/**
 * Récupérer toutes les réponses apprenants
 * ACCÈS : Public
 */
router.get('/reponse-app/', 
    reponseAppController.getAllReponseApp
);

/**
 * Créer une nouvelle réponse apprenant
 * CHAMPS REQUIS : temps_reponse, etat, participant, question
 * CHAMPS OPTIONNELS : reponse_apprenant
 */
router.post('/reponse-app', 
    checkRequiredFields(['temps_reponse', 'etat', 'participant', 'question']), 
    reponseAppController.createReponseApp
);

/**
 * Mettre à jour une réponse apprenant
 * ACCÈS : Authentifié uniquement
 */
router.post('/reponse-app/update/:id', 
    authenticateToken, 
    reponseAppController.updateReponseApp
);

/**
 * Supprimer une réponse apprenant
 * ACCÈS : Authentifié uniquement
 */
router.post('/reponse-app/delete/:id', 
    authenticateToken, 
    reponseAppController.deleteReponseAppById
);

/**
 * Créer plusieurs réponses apprenants en une fois
 * FORMAT : { "reponses": [{ "participant": "id", "question": "id", ... }, ...] }
 */
router.post('/reponse-app/multiple', 
    reponseAppController.createMultiple
);

// ===============================================
// ROUTES SPÉCIALISÉES PAR PARTICIPANT/APPRENANT
// ===============================================

/**
 * ✅ CORRIGÉ : Ajouter les méthodes manquantes au contrôleur ou les supprimer
 * Pour l'instant, on les commente pour éviter l'erreur
 */

/*
// Ces routes nécessitent l'implémentation des méthodes correspondantes
// dans reponseAppController ou l'importation depuis reponseController

router.get('/reponse-app/participant/:participantId', 
    reponseAppController.getReponsesByParticipant
);

router.get('/reponse-app/apprenant/:apprenantId', 
    reponseAppController.getReponsesByApprenant
);
*/

// ===============================================
// ROUTES DE STATISTIQUES
// ===============================================

/**
 * ✅ CORRIGÉ : Commenter cette route également car la méthode n'existe pas
 */
/*
router.get('/reponse-app/statistiques', 
    reponseAppController.getStatistiques
);
*/

/**
 * Récupérer les statistiques d'un participant spécifique
 * ACCÈS : Public
 */
router.get('/reponse-app/participant/:participantId/stats', 
    async (req, res) => {
        try {
            const participantId = req.params.participantId;
            
            if (!participantId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du participant requis'
                });
            }

            // Cette fonctionnalité peut être implémentée plus tard
            res.status(200).json({
                success: true,
                message: 'Statistiques du participant (fonctionnalité en développement)',
                data: {
                    participantId: participantId,
                    totalReponses: 0,
                    reponsesCorrectes: 0,
                    scoreTotal: 0,
                    tempsReponseMoyen: 0
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

// ===============================================
// ROUTES D'AIDE
// ===============================================

/**
 * Obtenir le format attendu pour la création de réponses apprenants
 */
router.get('/reponse-app/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format de création de réponse apprenant',
        format: {
            single: {
                participant: "ID du participant (obligatoire)",
                question: "ID de la question (obligatoire)",
                temps_reponse: "Temps en secondes (obligatoire)",
                etat: "true/false - indique si la réponse est correcte (obligatoire)",
                reponse_apprenant: "Réponse donnée par l'apprenant (optionnel)"
            },
            multiple: {
                reponses: [
                    {
                        participant: "ID du participant",
                        question: "ID de la question",
                        temps_reponse: 25.5,
                        etat: true,
                        reponse_apprenant: "Ma réponse"
                    }
                ]
            }
        },
        relations: {
            participant: "Le participant sera automatiquement lié à cette réponse",
            apprenant: "L'apprenant sera récupéré depuis le participant",
            question: "La question doit exister dans la base de données"
        },
        exemples: {
            creation: "POST /api/reponse-app",
            multipleCreation: "POST /api/reponse-app/multiple",
            // parParticipant: "GET /api/reponse-app/participant/:participantId", // Commenté car non implémenté
            // parApprenant: "GET /api/reponse-app/apprenant/:apprenantId", // Commenté car non implémenté
            miseAJour: "POST /api/reponse-app/update/:id",
            suppression: "POST /api/reponse-app/delete/:id"
        }
    });
});

/**
 * Vérifier l'état du service des réponses apprenants
 */
router.get('/reponse-app/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service des réponses apprenants opérationnel',
        timestamp: new Date().toISOString(),
        endpoints: {
            crud: [
                'GET /reponse-app/',
                'POST /reponse-app',
                'POST /reponse-app/update/:id',
                'POST /reponse-app/delete/:id'
            ],
            specialized: [
                'GET /reponse-app/question/:id'
                // 'GET /reponse-app/participant/:participantId', // Commenté car non implémenté
                // 'GET /reponse-app/apprenant/:apprenantId' // Commenté car non implémenté
            ],
            bulk: [
                'POST /reponse-app/multiple'
            ],
            // stats: [
            //     'GET /reponse-app/statistiques' // Commenté car non implémenté
            // ]
        }
    });
});

module.exports = router;