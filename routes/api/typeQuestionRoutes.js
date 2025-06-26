// routes/api/typeQuestionRoutes.js
const express = require('express');
const router = express.Router();
const typeQuestionController = require('../../controllers/typeQuestionController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

// ===============================================
// ROUTES CRUD PRINCIPALES
// ===============================================

/**
 * Récupérer tous les types de question
 * ACCÈS : Public
 */
router.get('/type-question', 
    typeQuestionController.getAllTypeQuestions
);

/**
 * Récupérer un type de question par ID
 * ACCÈS : Public
 */
router.get('/type-question/:id', 
    typeQuestionController.getTypeQuestionById
);

/**
 * Créer un nouveau type de question
 * CHAMPS REQUIS : libelle, description, reference
 * RÉFÉRENCES AUTORISÉES : 30, 31, 32
 */
router.post('/type-question', 
    checkRequiredFields(['libelle', 'description', 'reference']), 
    typeQuestionController.createTypeQuestion
);

/**
 * Mettre à jour un type de question
 * ACCÈS : Authentifié uniquement
 */
router.post('/type-question/update/:id', 
    authenticateToken, 
    typeQuestionController.updateTypeQuestion
);

/**
 * Supprimer un type de question
 * ACCÈS : Authentifié uniquement
 * NOTE : Impossible si le type est utilisé dans des questions
 */
router.post('/type-question/delete/:id', 
    authenticateToken, 
    typeQuestionController.deleteTypeQuestionById
);

// ===============================================
// ROUTES DE RECHERCHE ET CONSULTATION
// ===============================================

/**
 * Récupérer un type de question par sa référence
 * ACCÈS : Public
 */
router.get('/type-question/reference/:reference', 
    typeQuestionController.getTypeQuestionByReference
);

/**
 * Rechercher des types de question par libellé
 * ACCÈS : Public
 */
router.get('/type-question/search/:searchTerm', 
    typeQuestionController.searchTypeQuestions
);

/**
 * Rechercher tous les types (équivalent à une recherche vide)
 * ACCÈS : Public
 */
router.get('/type-question/search/', 
    typeQuestionController.searchTypeQuestions
);

// ===============================================
// ROUTES DE STATISTIQUES
// ===============================================

/**
 * Récupérer les statistiques des types de question
 * ACCÈS : Public
 */
router.get('/type-question/statistiques', 
    typeQuestionController.getStatistiques
);

/**
 * Vérifier l'utilisation d'un type de question spécifique
 * ACCÈS : Public
 */
router.get('/type-question/:id/utilisation', 
    async (req, res) => {
        try {
            const typeQuestionId = req.params.id;
            
            if (!typeQuestionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du type de question requis'
                });
            }

            // Vérifier l'utilisation dans les questions
            const Question = require('../../models/Question');
            const utilisations = await Question.find({ typeQuestion: typeQuestionId })
                .select('libelle date')
                .populate('jeu', 'titre')
                .sort({ date: -1 });

            res.status(200).json({
                success: true,
                message: 'Utilisation du type de question récupérée avec succès',
                data: {
                    typeQuestionId: typeQuestionId,
                    nombreUtilisations: utilisations.length,
                    questions: utilisations
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification de l\'utilisation',
                error: error.message
            });
        }
    }
);

// ===============================================
// ROUTES DE VALIDATION
// ===============================================

/**
 * Valider les données d'un type de question sans le créer
 * ACCÈS : Public
 */
router.post('/type-question/validate', 
    async (req, res) => {
        try {
            const typeQuestionService = require('../../services/typeQuestionService');
            const validation = typeQuestionService.validateTypeQuestionData(req.body, false);
            
            if (validation.isValid) {
                // Vérifier aussi l'unicité de la référence si fournie
                if (req.body.reference) {
                    const exists = await typeQuestionService.checkReferenceExists(req.body.reference);
                    if (exists) {
                        validation.isValid = false;
                        validation.errors.push(`La référence "${req.body.reference}" existe déjà`);
                    }
                }
            }
            
            res.status(200).json({
                success: true,
                message: validation.isValid ? 'Données valides' : 'Données invalides',
                valid: validation.isValid,
                errors: validation.errors
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la validation',
                error: error.message
            });
        }
    }
);

/**
 * Vérifier si une référence existe déjà
 * ACCÈS : Public
 */
router.get('/type-question/check-reference/:reference', 
    async (req, res) => {
        try {
            const reference = req.params.reference;
            const typeQuestionService = require('../../services/typeQuestionService');
            const exists = await typeQuestionService.checkReferenceExists(reference);
            
            res.status(200).json({
                success: true,
                data: {
                    reference: reference,
                    exists: exists,
                    available: !exists
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification',
                error: error.message
            });
        }
    }
);

// ===============================================
// ROUTES D'AIDE
// ===============================================

/**
 * Obtenir le format attendu pour la création de types de question
 */
router.get('/type-question/help/format', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Format de création de type de question',
        format: {
            libelle: {
                type: "string",
                required: true,
                minLength: 3,
                maxLength: 100,
                description: "Nom du type de question"
            },
            description: {
                type: "string",
                required: true,
                minLength: 10,
                maxLength: 500,
                description: "Description détaillée du type"
            },
            reference: {
                type: "string",
                required: true,
                allowedValues: ["30", "31", "32"],
                unique: true,
                description: "Référence unique du type"
            }
        },
        exemples: {
            creation: "POST /api/type-question",
            recuperation: "GET /api/type-question/:id",
            parReference: "GET /api/type-question/reference/:reference",
            recherche: "GET /api/type-question/search/:searchTerm",
            miseAJour: "POST /api/type-question/update/:id",
            suppression: "POST /api/type-question/delete/:id",
            validation: "POST /api/type-question/validate",
            checkReference: "GET /api/type-question/check-reference/:reference"
        },
        referencesDisponibles: {
            "30": "Type de question à choix multiples",
            "31": "Type de question ouverte",
            "32": "Type de question vrai/faux"
        }
    });
});

/**
 * Obtenir les références disponibles
 */
router.get('/type-question/help/references', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Références de types de question disponibles',
        data: {
            references: [
                {
                    code: "30",
                    nom: "Choix multiples",
                    description: "Questions avec plusieurs options de réponse"
                },
                {
                    code: "31", 
                    nom: "Question ouverte",
                    description: "Questions nécessitant une réponse textuelle libre"
                },
                {
                    code: "32",
                    nom: "Vrai/Faux",
                    description: "Questions avec réponse binaire vrai ou faux"
                }
            ],
            note: "Chaque référence ne peut être utilisée qu'une seule fois"
        }
    });
});

/**
 * Vérifier l'état du service des types de question
 */
router.get('/type-question/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Service des types de question opérationnel',
        timestamp: new Date().toISOString(),
        endpoints: {
            crud: [
                'GET /type-question',
                'GET /type-question/:id',
                'POST /type-question',
                'POST /type-question/update/:id',
                'POST /type-question/delete/:id'
            ],
            recherche: [
                'GET /type-question/reference/:reference',
                'GET /type-question/search/:searchTerm'
            ],
            validation: [
                'POST /type-question/validate',
                'GET /type-question/check-reference/:reference'
            ],
            statistiques: [
                'GET /type-question/statistiques',
                'GET /type-question/:id/utilisation'
            ],
            aide: [
                'GET /type-question/help/format',
                'GET /type-question/help/references'
            ]
        }
    });
});

module.exports = router;