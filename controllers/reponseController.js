// ========================================
// SUITE DU CONTRÔLEUR REPONSE COMPLET
// ========================================

// controllers/reponseController.js - VERSION COMPLÈTE
const reponseService = require('../services/reponseService');

exports.getAllReponses = async (req, res) => {
    try {
        const reponses = await reponseService.getAllReponses();
        
        // ✅ AJOUT: Enrichir les réponses avec des informations lisibles
        const reponsesEnrichies = reponses.map(reponse => ({
            ...reponse,
            etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
            isCorrect: reponse.etat === 1
        }));
        
        res.status(200).json({
            success: true,
            message: 'Liste des réponses récupérée avec succès',
            data: reponsesEnrichies,
            total: reponsesEnrichies.length,
            statistiques: {
                totalReponses: reponsesEnrichies.length,
                reponsesCorrectes: reponsesEnrichies.filter(r => r.etat === 1).length,
                reponsesIncorrectes: reponsesEnrichies.filter(r => r.etat === 0).length
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

exports.createReponse = async (req, res) => {
    try {
        // ✅ AJOUT: Validation côté contrôleur (accepte true/false et 0/1)
        const { etat, question } = req.body;
        
        const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
        if (etat !== undefined && !validValues.includes(etat)) {
            return res.status(400).json({
                success: false,
                message: 'L\'état doit être 0, 1, true ou false'
            });
        }
        
        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de la question est requis'
            });
        }
        
        const reponse = await reponseService.createReponse(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Réponse créée avec succès',
            data: {
                ...reponse,
                etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: reponse.etat === 1
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

exports.getReponseById = async (req, res) => {
    try {
        const reponseId = req.params.id;
        const reponse = await reponseService.getReponseById(reponseId);
        
        res.status(200).json({
            success: true,  
            message: 'Réponse récupérée avec succès',
            data: {
                ...reponse,
                etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: reponse.etat === 1
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la réponse',
            error: err.message
        });
    }
};

// ✅ AJOUT: Suite manquante du contrôleur
exports.updateReponse = async (req, res) => {
    try {
        const reponseId = req.params.id;
        const reponseData = req.body;
        
        // Validation côté contrôleur
        if (reponseData.etat !== undefined) {
            const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
            if (!validValues.includes(reponseData.etat)) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'état doit être 0, 1, true ou false'
                });
            }
        }
        
        const updatedReponse = await reponseService.updateReponse(reponseId, reponseData);
        
        res.status(200).json({
            success: true,
            message: 'Réponse mise à jour avec succès',
            data: {
                ...updatedReponse.toObject(),
                etat_lisible: updatedReponse.etat === 1 ? 'Correct' : 'Incorrect',
                isCorrect: updatedReponse.etat === 1
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la réponse',
            error: err.message
        });
    }
};

exports.deleteReponseById = async (req, res) => {
    try {
        const reponseId = req.params.id;
        
        if (!reponseId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la réponse requis'
            });
        }
        
        await reponseService.deleteReponseById(reponseId);
        
        res.status(200).json({
            success: true,
            message: 'Réponse supprimée avec succès'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la réponse',
            error: err.message
        });
    }
};

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
        for (const reponse of reponses) {
            const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
            if (reponse.etat !== undefined && !validValues.includes(reponse.etat)) {
                return res.status(400).json({
                    success: false,
                    message: `Réponse invalide: l'état doit être 0, 1, true ou false`
                });
            }
            
            if (!reponse.question) {
                return res.status(400).json({
                    success: false,
                    message: 'Chaque réponse doit avoir un ID de question'
                });
            }
        }

        const inserted = await reponseService.insertMany(reponses);

        res.status(201).json({
            success: true,
            message: `${inserted.length} réponses enregistrées avec succès`,
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

// ✅ NOUVELLES MÉTHODES AJOUTÉES
exports.getReponsesByQuestion = async (req, res) => {
    try {
        const questionId = req.params.questionId;
        
        if (!questionId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la question requis'
            });
        }
        
        const reponses = await reponseService.getReponsesByQuestion(questionId);
        
        // Enrichir les réponses
        const reponsesEnrichies = reponses.map(reponse => ({
            ...reponse,
            etat_lisible: reponse.etat === 1 ? 'Correct' : 'Incorrect',
            isCorrect: reponse.etat === 1
        }));
        
        res.status(200).json({
            success: true,
            message: 'Réponses de la question récupérées avec succès',
            data: reponsesEnrichies,
            total: reponsesEnrichies.length,
            questionId: questionId,
            statistiques: {
                totalReponses: reponsesEnrichies.length,
                reponsesCorrectes: reponsesEnrichies.filter(r => r.etat === 1).length,
                reponsesIncorrectes: reponsesEnrichies.filter(r => r.etat === 0).length
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

exports.getStatistiques = async (req, res) => {
    try {
        const stats = await reponseService.getStatistiquesReponse();
        
        res.status(200).json({
            success: true,
            message: 'Statistiques des réponses récupérées avec succès',
            data: {
                ...stats,
                pourcentageIncorrectes: stats.totalReponses > 0 ? 
                    Math.round(((stats.totalReponses - stats.reponsesCorrectes) / stats.totalReponses) * 100) : 0
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

// ✅ MÉTHODE UTILITAIRE POUR VALIDER LES DONNÉES
exports.validateReponseData = (req, res) => {
    try {
        const validation = reponseService.validateReponseData(req.body);
        
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

module.exports = {
    getAllReponses: exports.getAllReponses,
    createReponse: exports.createReponse,
    getReponseById: exports.getReponseById,
    updateReponse: exports.updateReponse,
    deleteReponseById: exports.deleteReponseById,
    createMultiple: exports.createMultiple,
    getReponsesByQuestion: exports.getReponsesByQuestion,
    getStatistiques: exports.getStatistiques,
    validateReponseData: exports.validateReponseData
};