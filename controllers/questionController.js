const questionService = require('../services/questionService');

exports.getAllQuestions = async (req, res) => {
    try {
        const questions = await questionService.recupererToutesLesQuestions();
        res.status(200).json({
            success: true,
            message: 'Liste des questions récupérée avec succès',
            data: questions
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.recupererQuestionParId = async (req, res) => {
    const id = req.params.id;
    try {
        const question = await questionService.recupererQuestionParId(id);
        if (!question) {
            return res.status(404).json({ message: `Question avec l'ID ${id} non trouvée` });
        }
        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const question = await questionService.createQuestion(req);
        res.status(201).json({
            success: true,
            message: 'Question créé avec succès',
            data: question
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la question',
            error: err.message
        });
    }
};

exports.addExistingReponseToQuestion = async (req, res) => {
    try {
        const { questionId, reponseId } = req.body;
        const updatedQuestion = await questionService.addPeponse(questionId, reponseId);
        res.status(200).json({ message: 'Reponse ajouté a la question avec succès', question: updatedQuestion });
    } catch (error) {
        // Gestion des erreurs avec un message adapté
        res.status(400).json({ message: error.message });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const questionData = req.body;
        const updatedQuestion = await questionService.updateQuestion(questionId, questionData);
        res.status(200).json({
            success: true,
            message: 'Question mise à jour avec succès',
            data: updatedQuestion
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la question',
            error: err.message
        });
    }
};

exports.deleteQuestionById = async (req, res) => {
    try {
        const questionId = req.params.id;
        await questionService.deleteQuestionById(questionId);
        res.status(200).json({
            success: true,
            message: 'Question supprimée avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la question',
            error: err.message
        });
    }
}

