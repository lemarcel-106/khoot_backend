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


// À ajouter à la fin de questionController.js

/**
 * Récupère toutes les questions d'un jeu avec tous les détails
 * Route: GET /api/questions/jeu/:jeuId/detailles
 */
exports.getQuestionsByJeuDetailles = async (req, res) => {
    try {
        const jeuId = req.params.jeuId;
        
        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        // Préparer les données utilisateur pour la vérification des permissions
        const userData = req.user ? {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email,
            ecole: req.user.ecole
        } : null;

        const result = await questionService.getQuestionsByJeuDetailles(jeuId, userData);
        
        res.status(200).json({
            success: true,
            message: `Questions du jeu "${result.jeu.titre}" récupérées avec succès`,
            data: result,
            meta: {
                jeuId: jeuId,
                totalQuestions: result.questions.length,
                requestedBy: req.user?.email || 'Anonyme',
                timestamp: new Date().toISOString()
            }
        });
    } catch (err) {
        // Gestion des différents types d'erreurs
        let statusCode = 500;
        if (err.message.includes('non trouvé')) {
            statusCode = 404;
        } else if (err.message.includes('Accès refusé')) {
            statusCode = 403;
        } else if (err.message.includes('requis')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la récupération des questions du jeu',
            error: err.message,
            jeuId: req.params.jeuId
        });
    }
};

/**
 * Récupère les questions d'un jeu (version simplifiée)
 * Route: GET /api/questions/jeu/:jeuId
 */
exports.getQuestionsByJeu = async (req, res) => {
    try {
        const jeuId = req.params.jeuId;
        
        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        const questions = await questionService.getQuestionsByJeuSimple(jeuId);
        
        res.status(200).json({
            success: true,
            message: 'Questions du jeu récupérées avec succès',
            data: questions,
            total: questions.length,
            jeuId: jeuId
        });
    } catch (err) {
        const statusCode = err.message.includes('non trouvé') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la récupération des questions',
            error: err.message,
            jeuId: req.params.jeuId
        });
    }
};

/**
 * Récupère les statistiques des questions d'un jeu
 * Route: GET /api/questions/jeu/:jeuId/statistiques
 */
exports.getQuestionsByJeuStats = async (req, res) => {
    try {
        const jeuId = req.params.jeuId;
        
        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        const userData = req.user ? {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email,
            ecole: req.user.ecole
        } : null;

        const result = await questionService.getQuestionsByJeuDetailles(jeuId, userData);
        
        // Retourner seulement les statistiques
        res.status(200).json({
            success: true,
            message: 'Statistiques des questions récupérées avec succès',
            data: {
                jeu: {
                    id: result.jeu.id,
                    titre: result.jeu.titre,
                    totalQuestions: result.jeu.totalQuestions
                },
                statistiques: result.statistiques,
                detailsParType: result.questions.reduce((acc, question) => {
                    const typeRef = question.typeQuestion?.reference || 'inconnu';
                    if (!acc[typeRef]) {
                        acc[typeRef] = {
                            libelle: question.typeQuestion?.libelle || 'Type inconnu',
                            count: 0,
                            pointsTotal: 0
                        };
                    }
                    acc[typeRef].count++;
                    acc[typeRef].pointsTotal += question.infos.pointsAttribues || 0;
                    return acc;
                }, {})
            }
        });
    } catch (err) {
        let statusCode = 500;
        if (err.message.includes('non trouvé')) {
            statusCode = 404;
        } else if (err.message.includes('Accès refusé')) {
            statusCode = 403;
        } else if (err.message.includes('requis')) {
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: err.message,
            jeuId: req.params.jeuId
        });
    }
};