// routes/api/reponseRoutes.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();
const reponseController = require('../../controllers/reponseController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

// ===============================================
// ROUTES CRUD PRINCIPALES
// ===============================================

/**
 * Récupérer toutes les réponses
 * ACCÈS : Public (avec authentification)
 */
router.get('/reponse', reponseController.getAllReponses);

/**
 * Récupérer une réponse par ID
 * ACCÈS : Public (avec authentification)
 */
router.get('/reponse/:id', reponseController.getReponseById);

/**
 * Créer une nouvelle réponse
 * CHAMPS REQUIS : question, etat
 * CHAMPS OPTIONNELS : reponse_texte, file
 */
router.post('/reponse', 
    checkRequiredFields(['question', 'etat']), 
    reponseController.createReponse
);

/**
 * Mettre à jour une réponse existante
 * ACCÈS : Authentifié uniquement
 */
router.post('/reponse/update/:id', 
    authenticateToken, 
    reponseController.updateReponse
);

/**
 * Supprimer une réponse
 * ACCÈS : Authentifié uniquement
 */
router.post('/reponse/delete/:id', 
    authenticateToken, 
    reponseController.deleteReponseById
);

/**
 * Créer plusieurs réponses en une fois
 * FORMAT : { "reponses": [{ "question": "id", "etat": true, "reponse_texte": "..." }, ...] }
 */
router.post('/reponse/multiple', 
    reponseController.createMultiple
);

// ===============================================
// ROUTES SPÉCIALISÉES - COMMENTÉES CAR MÉTHODES MANQUANTES
// ===============================================

/**
 * ✅ CORRIGÉ : Ces routes utilisent des méthodes qui n'existent pas encore
 * dans reponseController. On les commente pour éviter l'erreur.
 */

/*
// Cette route nécessite l'implémentation de getReponsesByQuestion
router.get('/reponse/question/:questionId', 
    reponseController.getReponsesByQuestion
);

// Cette route nécessite l'implémentation de getStatistiques
router.get('/reponse/statistiques', 
    reponseController.getStatistiques
);
*/

// ===============================================
// ROUTES D'AIDE
// ===============================================

/**
 * Obtenir le format attendu pour la création de réponses
 */
router.get('/reponse/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format de création de réponse',
        format: {
            single: {
                question: "ID de la question (obligatoire)",
                etat: "true/false - indique si la réponse est correcte (obligatoire)",
                reponse_texte: "Texte de la réponse (optionnel si file présent)",
                file: "Chemin vers un fichier (optionnel si reponse_texte présent)"
            },
            multiple: {
                reponses: [
                    {
                        question: "ID de la question",
                        etat: true,
                        reponse_texte: "Réponse 1"
                    },
                    {
                        question: "ID de la question",
                        etat: false,
                        reponse_texte: "Réponse 2"
                    }
                ]
            }
        },
        exemples: {
            creation: "POST /api/reponse",
            multipleCreation: "POST /api/reponse/multiple",
            recuperation: "GET /api/reponse/:id",
            miseAJour: "POST /api/reponse/update/:id",
            suppression: "POST /api/reponse/delete/:id"
            // parQuestion: "GET /api/reponse/question/:questionId", // Commenté car non implémenté
            // statistiques: "GET /api/reponse/statistiques" // Commenté car non implémenté
        }
    });
});

/**
 * Vérifier l'état du service des réponses
 */
router.get('/reponse/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service des réponses opérationnel',
        timestamp: new Date().toISOString(),
        endpoints: {
            crud: [
                'GET /reponse',
                'GET /reponse/:id',
                'POST /reponse',
                'POST /reponse/update/:id',
                'POST /reponse/delete/:id'
            ],
            bulk: [
                'POST /reponse/multiple'
            ],
            aide: [
                'GET /reponse/help/format',
                'GET /reponse/health'
            ]
            // specialized: [
            //     'GET /reponse/question/:questionId' // Commenté car non implémenté
            // ],
            // stats: [
            //     'GET /reponse/statistiques' // Commenté car non implémenté
            // ]
        }
    });
});

module.exports = router;