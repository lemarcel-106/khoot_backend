const Reponse = require('../models/Reponse');
const Question = require('../models/Question');

const reponseService = {

    // ✅ NOUVELLE MÉTHODE: Valider les données de réponse
    validateReponseData: (data) => {
        const errors = [];
        
        // Validation de l'état (accepte 0, 1, true, false)
        if (data.etat !== undefined) {
            const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
            if (!validValues.includes(data.etat)) {
                errors.push('L\'état doit être 0, 1, true ou false');
            }
        }
        
        // Au moins un contenu requis (texte ou fichier)
        if (!data.reponse_texte && !data.file) {
            errors.push('Une réponse textuelle ou un fichier est requis');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // ✅ CORRIGÉ: Récupérer toutes les réponses avec détails complets
    getAllReponses: async () => {
        try {
            return await Reponse.find()
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point jeu',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        },
                        {
                            path: 'jeu',
                            select: 'titre createdBy ecole',
                            populate: [
                                {
                                    path: 'createdBy',
                                    select: 'nom prenom email'
                                },
                                {
                                    path: 'ecole',
                                    select: 'libelle ville'
                                }
                            ]
                        }
                    ]
                })
                .sort({ date: -1 })
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des réponses : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Récupérer les réponses d'une question avec tous les détails
    getReponsesByQuestion: async (questionId) => {
        try {
            return await Reponse.find({ question: questionId })
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point temps limite_response',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        }
                    ]
                })
                .sort({ etat: -1, date: 1 }) // Réponses correctes en premier
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des réponses de la question : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Créer une réponse avec validation
    createReponse: async (userData) => {
        try {
            // Validation des données
            const validation = reponseService.validateReponseData(userData);
            if (!validation.isValid) {
                throw new Error('Données invalides: ' + validation.errors.join(', '));
            }

            // Création de la réponse
            const newReponse = new Reponse(userData);
            const savedReponse = await newReponse.save();

            // Ajout de la réponse à la question
            await reponseService.addReponseToQuestion(savedReponse._id, userData.question);

            // Retourner la réponse avec tous les détails
            return await Reponse.findById(savedReponse._id)
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        }
                    ]
                })
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la création de la réponse : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Récupérer une réponse par ID avec tous les détails
    getReponseById: async (reponseId) => {
        try {
            const reponse = await Reponse.findById(reponseId)
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point jeu temps limite_response',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        },
                        {
                            path: 'jeu',
                            select: 'titre createdBy ecole',
                            populate: [
                                {
                                    path: 'createdBy',
                                    select: 'nom prenom email'
                                },
                                {
                                    path: 'ecole',
                                    select: 'libelle ville'
                                }
                            ]
                        }
                    ]
                })
                .lean();
            
            if (!reponse) {
                throw new Error(`Réponse non trouvée avec l'ID: ${reponseId}`);
            }

            return reponse;
        } catch (error) {
            throw new Error('Erreur lors de la récupération de la réponse : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Mettre à jour une réponse avec validation
    updateReponse: async (reponseId, reponseData) => {
        try {
            // Validation des nouvelles données
            if (Object.keys(reponseData).length > 0) {
                const validation = reponseService.validateReponseData(reponseData);
                if (!validation.isValid) {
                    throw new Error('Données invalides: ' + validation.errors.join(', '));
                }
            }

            const updatedReponse = await Reponse.findByIdAndUpdate(
                reponseId,
                { $set: reponseData },
                { new: true, runValidators: true }
            )
            .populate({
                path: 'question',
                select: 'libelle typeQuestion point',
                populate: [
                    {
                        path: 'typeQuestion',
                        select: 'libelle description reference'
                    },
                    {
                        path: 'point',
                        select: 'nature valeur description'
                    }
                ]
            });
            
            if (!updatedReponse) {
                throw new Error("Réponse non trouvée");
            }
            return updatedReponse;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de la réponse : " + error.message);
        }
    },

    // ✅ AJOUT: Obtenir des statistiques sur les réponses
    getStatistiquesReponse: async () => {
        try {
            const totalReponses = await Reponse.countDocuments();
            const reponsesCorrectes = await Reponse.countDocuments({ etat: 1 });
            const reponsesIncorrectes = await Reponse.countDocuments({ etat: 0 });
            
            // Compter les réponses par question
            const reponseParQuestion = await Reponse.aggregate([
                {
                    $group: {
                        _id: '$question',
                        nombreReponses: { $sum: 1 },
                        reponsesCorrectes: {
                            $sum: { $cond: [{ $eq: ['$etat', 1] }, 1, 0] }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'questions',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'questionInfo'
                    }
                },
                {
                    $project: {
                        questionId: '$_id',
                        questionTitre: { $arrayElemAt: ['$questionInfo.libelle', 0] },
                        nombreReponses: 1,
                        reponsesCorrectes: 1,
                        pourcentageCorrect: {
                            $multiply: [
                                { $divide: ['$reponsesCorrectes', '$nombreReponses'] },
                                100
                            ]
                        }
                    }
                },
                { $sort: { nombreReponses: -1 } }
            ]);

            return {
                totalReponses,
                reponsesCorrectes,
                reponsesIncorrectes,
                pourcentageCorrectes: totalReponses > 0 ? 
                    Math.round((reponsesCorrectes / totalReponses) * 100) : 0,
                reponseParQuestion: reponseParQuestion.slice(0, 10)
            };
        } catch (error) {
            throw new Error('Erreur lors du calcul des statistiques : ' + error.message);
        }
    },

    // Méthodes existantes conservées...
    addReponseToQuestion: async (reponseId, questionId) => {
        const question = await Question.findById(questionId);
        if (!question) {
            throw new Error('Question non trouvée');
        }

        if (question.reponses.includes(reponseId)) {
            throw new Error('La réponse est déjà ajoutée à cette question');
        }

        question.reponses.push(reponseId);
        await question.save();
        return question;
    },

    deleteReponseById: async (reponseId) => {
        try {
            const deletedReponse = await Reponse.findByIdAndDelete(reponseId);
            if (!deletedReponse) {
                throw new Error("Réponse non trouvée");
            }
            return deletedReponse;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de la réponse : " + error.message);
        }
    },

    insertMany: async (dataArray) => {
        try {
            // Valider chaque réponse avant insertion
            for (const data of dataArray) {
                const validation = reponseService.validateReponseData(data);
                if (!validation.isValid) {
                    throw new Error(`Réponse invalide: ${validation.errors.join(', ')}`);
                }
            }
            
            return await Reponse.insertMany(dataArray);
        } catch (error) {
            throw new Error("Erreur lors de l'insertion multiple : " + error.message);
        }
    }
};

module.exports = reponseService;
