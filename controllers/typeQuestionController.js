const typeQuestionService = require('../services/typeQuestionService');

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
    console.log(true)
    try {
        const typeQuestion = await typeQuestionService.createTypeQuestion(req.body);
        res.status(201).json({
            success: true,
            message: 'Type de question créé avec succès',
            data: typeQuestion
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du jeu',
            error: err.message
        });
    }
};

exports.updateTypeQuestion = async (req, res) => {
    try {
        const typeQuestionId = req.params.id;
        const typeQuestionData = req.body;
        const updatedTypeQuestion = await typeQuestionService.updateTypeQuestion(typeQuestionId, typeQuestionData);
        res.status(200).json({
            success: true,
            message: 'Type de question mis à jour avec succès',
            data: updatedTypeQuestion
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du type de question',
            error: err.message
        });
    }
};

exports.deleteTypeQuestionById = async (req, res) => {
    try {
        const typeQuestionId = req.params.id;
        await typeQuestionService.deleteTypeQuestionById(typeQuestionId);
        res.status(200).json({
            success: true,
            message: 'Type de question supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du type de question',
            error: err.message
        });
    }
}    
