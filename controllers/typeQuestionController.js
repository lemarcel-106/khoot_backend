const typeQuestionService = require('../services/typeQuestionService');




exports.getTypeQuestionById = async (req, res) => {
    try {
        const typeQuestionId = req.params.id;
        
        if (!typeQuestionId) {
            return res.status(400).json({
                success: false,
                message: 'ID du type de question requis'
            });
        }
        
        const typeQuestion = await typeQuestionService.getTypeQuestionById(typeQuestionId);
        
        res.status(200).json({
            success: true,
            message: 'Type de question récupéré avec succès',
            data: typeQuestion
        });
    } catch (err) {
        const statusCode = err.message.includes('non trouvé') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la récupération du type de question',
            error: err.message
        });
    }
};

exports.getTypeQuestionByReference = async (req, res) => {
    try {
        const reference = req.params.reference;
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                message: 'Référence du type de question requise'
            });
        }
        
        const typeQuestion = await typeQuestionService.getTypeQuestionByReference(reference);
        
        res.status(200).json({
            success: true,
            message: 'Type de question récupéré avec succès',
            data: typeQuestion
        });
    } catch (err) {
        const statusCode = err.message.includes('non trouvé') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la récupération du type de question',
            error: err.message
        });
    }
};

exports.searchTypeQuestions = async (req, res) => {
    try {
        const searchTerm = req.params.searchTerm;
        
        const typeQuestions = await typeQuestionService.searchTypeQuestionsByLibelle(searchTerm);
        
        res.status(200).json({
            success: true,
            message: 'Recherche de types de question effectuée avec succès',
            data: typeQuestions,
            total: typeQuestions.length,
            searchTerm: searchTerm || 'tous'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche',
            error: err.message
        });
    }
};

exports.getStatistiques = async (req, res) => {
    try {
        const stats = await typeQuestionService.getStatistiquesTypeQuestion();
        
        res.status(200).json({
            success: true,
            message: 'Statistiques des types de question récupérées avec succès',
            data: stats
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: err.message
        });
    }
};



exports.getAllTypeQuestions = async (req, res) => {
    try {
        const typeQuestions = await typeQuestionService.getAllTypeQuestions();
        res.status(200).json({
            success: true,
            message: 'Liste des type de question récupérée avec succès',
            data: typeQuestions
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createTypeQuestion = async (req, res) => {
    try {
        // ✅ VALIDATION PRÉALABLE
        const validation = typeQuestionService.validateTypeQuestionData(req.body, false);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.errors
            });
        }

        const typeQuestion = await typeQuestionService.createTypeQuestion(req.body);
        res.status(201).json({
            success: true,
            message: 'Type de question créé avec succès',
            data: typeQuestion
        });
    } catch (err) {
        const statusCode = err.message.includes('existe déjà') ? 409 : 500;
        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la création du type de question',
            error: err.message
        });
    }
};

exports.updateTypeQuestion = async (req, res) => {
    try {
        const typeQuestionId = req.params.id;
        const typeQuestionData = req.body;
        
        if (!typeQuestionId) {
            return res.status(400).json({
                success: false,
                message: 'ID du type de question requis'
            });
        }

        // ✅ VALIDATION PRÉALABLE
        const validation = typeQuestionService.validateTypeQuestionData(typeQuestionData, true);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: validation.errors
            });
        }
        
        const updatedTypeQuestion = await typeQuestionService.updateTypeQuestion(typeQuestionId, typeQuestionData);
        res.status(200).json({
            success: true,
            message: 'Type de question mis à jour avec succès',
            data: updatedTypeQuestion
        });
    } catch (err) {
        let statusCode = 500;
        if (err.message.includes('non trouvé')) statusCode = 404;
        if (err.message.includes('existe déjà')) statusCode = 409;
        
        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la mise à jour du type de question',
            error: err.message
        });
    }
};

exports.deleteTypeQuestionById = async (req, res) => {
    try {
        const typeQuestionId = req.params.id;
        
        if (!typeQuestionId) {
            return res.status(400).json({
                success: false,
                message: 'ID du type de question requis'
            });
        }
        
        const deletedTypeQuestion = await typeQuestionService.deleteTypeQuestionById(typeQuestionId);
        res.status(200).json({
            success: true,
            message: 'Type de question supprimé avec succès',
            data: {
                id: deletedTypeQuestion._id,
                libelle: deletedTypeQuestion.libelle,
                reference: deletedTypeQuestion.reference
            }
        });
    } catch (err) {
        let statusCode = 500;
        if (err.message.includes('non trouvé')) statusCode = 404;
        if (err.message.includes('utilisé dans')) statusCode = 409;
        
        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la suppression du type de question',
            error: err.message
        });
    }
};