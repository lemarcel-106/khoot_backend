// ========================================
// CONTRÔLEUR REPONSEAPP COMPLET
// ========================================

// controllers/reponseAppController.js - VERSION COMPLÈTE
const reponseAppService = require('../services/reponseAppService');

// ✅ MÉTHODE PRINCIPALE: Récupérer toutes les réponses apprenants
exports.getAllReponseApp = async (req, res) => {
    try {
        const reponsesApp = await reponseAppService.getAllReponseApp();
        
        // ✅ AJOUT: Enrichir les réponses avec des informations lisibles
        const reponsesEnrichies = reponsesApp.map(reponse => ({
            ...reponse,
            etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
            isCorrect: reponse.etat === 1
        }));
        
        res.status(200).json({
            success: true,
            message: 'Liste des réponses apprenants récupérée avec succès',
            data: reponsesEnrichies,
            total: reponsesEnrichies.length,
            statistiques: {
                totalReponses: reponsesEnrichies.length,
                reponsesCorrectes: reponsesEnrichies.filter(r => r.etat === 1).length,
                reponsesIncorrectes: reponsesEnrichies.filter(r => r.etat === 0).length,
                tempsReponseMoyen: reponsesEnrichies.length > 0 ? 
                    Math.round(reponsesEnrichies.reduce((sum, r) => sum + r.temps_reponse, 0) / reponsesEnrichies.length * 100) / 100 : 0
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Récupérer les réponses d'une question spécifique
exports.getAllReponseAppById = async (req, res) => {
    try {
        const questionId = req.params.id;
        
        if (!questionId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la question requis'
            });
        }
        
        const reponseApp = await reponseAppService.getAllReponseAppById(questionId);
        
        let reponseEnrichie = null;
        if (reponseApp) {
            reponseEnrichie = {
                ...reponseApp,
                etat_lisible: reponseApp.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: reponseApp.etat === 1
            };
        }
        
        res.status(200).json({
            success: true,
            message: reponseApp ? 'Réponse apprenant récupérée avec succès' : 'Aucune réponse trouvée pour cette question',
            data: reponseEnrichie,
            questionId: questionId
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Créer une nouvelle réponse apprenant
exports.createReponseApp = async (req, res) => {
    try {
        // ✅ VALIDATION côté contrôleur
        const { etat, participant, question, temps_reponse } = req.body;
        
        // Validation de l'état
        const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
        if (etat !== undefined && !validValues.includes(etat)) {
            return res.status(400).json({
                success: false,
                message: 'L\'état doit être 0, 1, true ou false'
            });
        }
        
        // Validation des champs requis
        if (!participant) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID du participant est requis'
            });
        }
        
        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de la question est requis'
            });
        }
        
        if (temps_reponse === undefined || temps_reponse < 0) {
            return res.status(400).json({
                success: false,
                message: 'Le temps de réponse doit être un nombre positif'
            });
        }
        
        const reponseApp = await reponseAppService.createReponseApp(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Réponse apprenant créée avec succès',
            data: {
                ...reponseApp,
                etat_lisible: reponseApp.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: reponseApp.etat === 1
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la réponse',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Mettre à jour une réponse apprenant
exports.updateReponseApp = async (req, res) => {
    try {
        const reponseAppId = req.params.id;
        const reponseAppData = req.body;
        
        if (!reponseAppId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la réponse apprenant requis'
            });
        }
        
        // Validation côté contrôleur
        if (reponseAppData.etat !== undefined) {
            const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
            if (!validValues.includes(reponseAppData.etat)) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'état doit être 0, 1, true ou false'
                });
            }
        }
        
        if (reponseAppData.temps_reponse !== undefined && reponseAppData.temps_reponse < 0) {
            return res.status(400).json({
                success: false,
                message: 'Le temps de réponse doit être positif'
            });
        }
        
        const updatedReponseApp = await reponseAppService.updateReponseApp(reponseAppId, reponseAppData);
        
        res.status(200).json({
            success: true,
            message: 'Réponse apprenant mise à jour avec succès',
            data: {
                ...updatedReponseApp.toObject(),
                etat_lisible: updatedReponseApp.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: updatedReponseApp.etat === 1
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la réponse apprenant',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Supprimer une réponse apprenant
exports.deleteReponseAppById = async (req, res) => {
    try {
        const reponseAppId = req.params.id;
        
        if (!reponseAppId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la réponse apprenant requis'
            });
        }
        
        await reponseAppService.deleteReponseAppById(reponseAppId);
        
        res.status(200).json({
            success: true,
            message: 'Réponse apprenant supprimée avec succès'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la réponse apprenant',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Créer plusieurs réponses en une fois
exports.createMultiple = async (req, res) => {
    try {
        const reponses = req.body.reponses;

        if (!Array.isArray(reponses) || reponses.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aucune réponse fournie ou format invalide' 
            });
        }

        // Validation de chaque réponse
        for (let i = 0; i < reponses.length; i++) {
            const reponse = reponses[i];
            
            // Validation de l'état
            const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
            if (reponse.etat !== undefined && !validValues.includes(reponse.etat)) {
                return res.status(400).json({
                    success: false,
                    message: `Réponse ${i + 1} invalide: l'état doit être 0, 1, true ou false`
                });
            }
            
            // Validation des champs requis
            if (!reponse.participant) {
                return res.status(400).json({
                    success: false,
                    message: `Réponse ${i + 1}: ID du participant requis`
                });
            }
            
            if (!reponse.question) {
                return res.status(400).json({
                    success: false,
                    message: `Réponse ${i + 1}: ID de la question requis`
                });
            }
            
            if (reponse.temps_reponse === undefined || reponse.temps_reponse < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Réponse ${i + 1}: temps de réponse invalide`
                });
            }
        }

        const inserted = await reponseAppService.insertMany(reponses);

        res.status(201).json({
            success: true,
            message: `${inserted.length} réponses apprenants enregistrées avec succès`,
            data: inserted.map(reponse => ({
                ...reponse.toObject(),
                etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: reponse.etat === 1
            }))
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'enregistrement', 
            error: error.message 
        });
    }
};

// ✅ MÉTHODE: Récupérer les réponses d'un participant
exports.getReponsesByParticipant = async (req, res) => {
    try {
        const participantId = req.params.participantId;
        
        if (!participantId) {
            return res.status(400).json({
                success: false,
                message: 'ID du participant requis'
            });
        }
        
        const reponses = await reponseAppService.getReponsesByParticipant(participantId);
        
        // Enrichir les réponses
        const reponsesEnrichies = reponses.map(reponse => ({
            ...reponse,
            etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
            isCorrect: reponse.etat === 1
        }));
        
        res.status(200).json({
            success: true,
            message: 'Réponses du participant récupérées avec succès',
            data: reponsesEnrichies,
            total: reponsesEnrichies.length,
            participantId: participantId,
            statistiques: {
                totalReponses: reponsesEnrichies.length,
                reponsesCorrectes: reponsesEnrichies.filter(r => r.etat === 1).length,
                reponsesIncorrectes: reponsesEnrichies.filter(r => r.etat === 0).length,
                scoreTotal: reponsesEnrichies.filter(r => r.etat === 1).length,
                tempsReponseMoyen: reponsesEnrichies.length > 0 ? 
                    Math.round(reponsesEnrichies.reduce((sum, r) => sum + r.temps_reponse, 0) / reponsesEnrichies.length * 100) / 100 : 0
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Récupérer les réponses d'un apprenant
exports.getReponsesByApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.apprenantId;
        
        if (!apprenantId) {
            return res.status(400).json({
                success: false,
                message: 'ID de l\'apprenant requis'
            });
        }
        
        const reponses = await reponseAppService.getReponsesByApprenant(apprenantId);
        
        // Enrichir les réponses
        const reponsesEnrichies = reponses.map(reponse => ({
            ...reponse,
            etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
            isCorrect: reponse.etat === 1
        }));
        
        res.status(200).json({
            success: true,
            message: 'Réponses de l\'apprenant récupérées avec succès',
            data: reponsesEnrichies,
            total: reponsesEnrichies.length,
            apprenantId: apprenantId,
            statistiques: {
                totalReponses: reponsesEnrichies.length,
                reponsesCorrectes: reponsesEnrichies.filter(r => r.etat === 1).length,
                reponsesIncorrectes: reponsesEnrichies.filter(r => r.etat === 0).length,
                pourcentageReussite: reponsesEnrichies.length > 0 ? 
                    Math.round((reponsesEnrichies.filter(r => r.etat === 1).length / reponsesEnrichies.length) * 100) : 0
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

// ✅ MÉTHODE: Obtenir les statistiques globales
exports.getStatistiques = async (req, res) => {
    try {
        const stats = await reponseAppService.getStatistiquesReponseApp();
        
        res.status(200).json({
            success: true,
            message: 'Statistiques des réponses apprenants récupérées avec succès',
            data: {
                ...stats,
                pourcentageIncorrectes: stats.totalReponses > 0 ? 
                    Math.round((stats.reponsesIncorrectes / stats.totalReponses) * 100) : 0,
                tempsReponseMoyenFormate: stats.tempsReponseMoyen ? 
                    `${Math.round(stats.tempsReponseMoyen * 100) / 100}s` : '0s',
                tempsReponseMinFormate: stats.tempsReponseMin ? 
                    `${Math.round(stats.tempsReponseMin * 100) / 100}s` : '0s',
                tempsReponseMaxFormate: stats.tempsReponseMax ? 
                    `${Math.round(stats.tempsReponseMax * 100) / 100}s` : '0s'
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

// ✅ MÉTHODE UTILITAIRE: Valider les données
exports.validateReponseAppData = (req, res) => {
    try {
        const validation = reponseAppService.validateReponseAppData(req.body);
        
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
};

// ✅ MÉTHODE: Obtenir un récapitulatif d'un participant
exports.getRecapitulatifParticipant = async (req, res) => {
    try {
        const participantId = req.params.participantId;
        
        if (!participantId) {
            return res.status(400).json({
                success: false,
                message: 'ID du participant requis'
            });
        }
        
        // Récupérer toutes les réponses du participant
        const reponses = await reponseAppService.getReponsesByParticipant(participantId);
        
        if (reponses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucune réponse trouvée pour ce participant'
            });
        }
        
        // Calculer les statistiques détaillées
        const totalReponses = reponses.length;
        const reponsesCorrectes = reponses.filter(r => r.etat === 1).length;
        const reponsesIncorrectes = reponses.filter(r => r.etat === 0).length;
        const tempsTotal = reponses.reduce((sum, r) => sum + r.temps_reponse, 0);
        const scoreTotal = reponsesCorrectes; // Chaque bonne réponse = 1 point
        
        // Réponses par question avec détails
        const reponsesDetaillees = reponses.map(reponse => ({
            questionId: reponse.question._id,
            questionTitre: reponse.question.libelle,
            reponseApprenant: reponse.reponse_apprenant,
            tempsReponse: reponse.temps_reponse,
            estCorrecte: reponse.etat === 1,
            etatLisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
            pointsObtenus: reponse.etat === 1 ? (reponse.question.point?.valeur || 1) : 0,
            dateReponse: reponse.date
        }));
        
        res.status(200).json({
            success: true,
            message: 'Récapitulatif du participant récupéré avec succès',
            data: {
                participant: {
                    id: participantId,
                    apprenant: reponses[0].apprenant,
                    planification: reponses[0].participant?.planification
                },
                statistiques: {
                    totalReponses,
                    reponsesCorrectes,
                    reponsesIncorrectes,
                    scoreTotal,
                    pourcentageReussite: Math.round((reponsesCorrectes / totalReponses) * 100),
                    tempsTotal: Math.round(tempsTotal * 100) / 100,
                    tempsMoyen: Math.round((tempsTotal / totalReponses) * 100) / 100
                },
                reponses: reponsesDetaillees,
                resume: {
                    mention: reponsesCorrectes / totalReponses >= 0.8 ? 'Excellent' :
                            reponsesCorrectes / totalReponses >= 0.6 ? 'Bien' :
                            reponsesCorrectes / totalReponses >= 0.4 ? 'Passable' : 'Insuffisant',
                    recommandations: reponsesCorrectes / totalReponses < 0.6 ? 
                        ['Revoir les notions de base', 'Pratiquer davantage', 'Demander de l\'aide à l\'enseignant'] :
                        ['Continuer sur cette voie', 'Approfondir les sujets maîtrisés']
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

module.exports = {
    getAllReponseApp: exports.getAllReponseApp,
    getAllReponseAppById: exports.getAllReponseAppById,
    createReponseApp: exports.createReponseApp,
    updateReponseApp: exports.updateReponseApp,
    deleteReponseAppById: exports.deleteReponseAppById,
    createMultiple: exports.createMultiple,
    getReponsesByParticipant: exports.getReponsesByParticipant,
    getReponsesByApprenant: exports.getReponsesByApprenant,
    getStatistiques: exports.getStatistiques,
    validateReponseAppData: exports.validateReponseAppData,
    getRecapitulatifParticipant: exports.getRecapitulatifParticipant
};