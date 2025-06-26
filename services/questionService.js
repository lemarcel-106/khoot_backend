const Question = require('../models/Question');
const Reponse = require('../models/Reponse');
const Jeu = require('../models/Jeu');

const questionService = {

    getAllQuestions: async () => {
        try {
            return await Question.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des question');
        }
    },

    createQuestion: async (req) => {
        try {
            const { libelle, type_fichier, temps, limite_response, typeQuestion, point, jeu } = req.body;

            const questionData = {
                libelle,
                type_fichier,
                temps,
                limite_response,
                typeQuestion,
                point,
                jeu
            };

            // Ajout conditionnel du fichier
            if (req.file) {
                questionData.fichier = req.file.path;
            }

            // Création de la question
            const newQuestion = new Question(questionData);
            const savedQuestion = await newQuestion.save();

            // Ajout de la question au jeu
            await questionService.addQuestionToJeu(savedQuestion._id, jeu);

            return savedQuestion;

        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de la question : ' + error.message);
            }
        }
    },

    addQuestionToJeu: async (questionId, jeuId) => {
        // Récupérer le jeu par ID
        const jeu = await Jeu.findById(jeuId);
        if (!jeu) {
            throw new Error('Jeu non trouvé');
        }

        // Vérifie si la question est déjà dans le jeu
        if (jeu.questions.includes(questionId)) {
            throw new Error('La question est déjà ajoutée au jeu');
        }

        // Ajouter l'ID de la question au tableau de questions du jeu
        jeu.questions.push(questionId);
        await jeu.save();

        return jeu;
    },

    recupererQuestionParId: async (id) => {
        try {
            return await Question.findById(id)
                .populate('reponses')
                .populate('typeQuestion')
                .populate('point')
                .exec();
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de la question: ${error.message}`);
        }
    },

    recupererToutesLesQuestions: async () => {
        try {
            return await Question.find()
                .populate('reponses')
                .populate('typeQuestion')
                .populate('point')
                .populate('jeu')
                .exec();
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des questions: ${error.message}`);
        }
    },

    async addPeponse(questionId, reponseId) {
        const question = await Question.findById(questionId);
        if (!question) {
            throw new Error('Question non trouvé');
        }
        const reponse = await Reponse.findById(reponseId);
        if (!reponse) {
            throw new Error('Reponse non trouvé');
        }
        if (question.reponses.includes(reponse._id)) {
            throw new Error('La reposne est déjà ajouté au jeu');
        }
        question.reponses.push(reponse._id);
        await question.save();
        return question;
    },

    updateQuestion: async (questionId, questionData) => {
        try {
            const updatedQuestion = await Question.findByIdAndUpdate(
                questionId,
                { $set: questionData },
                { new: true, runValidators: true }
            );
            if (!updatedQuestion) {
                throw new Error("Question non trouvée");
            }
            return updatedQuestion;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de la question : " + error.message);
        }
    },

    deleteQuestionById: async (questionId) => {
        try {
            const deletedQuestion = await Question.findByIdAndDelete(questionId);
            if (!deletedQuestion) {
                throw new Error("Question non trouvée");
            }
            return deletedQuestion;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de la question : " + error.message);
        }
    },

    /**
     * Récupère toutes les questions d'un jeu avec tous les détails
     * @param {string} jeuId - ID du jeu
     * @param {object} userData - Données de l'utilisateur pour vérification des permissions
     * @returns {Promise<Object>} Questions avec tous les détails et statistiques
     */
    getQuestionsByJeuDetailles: async (jeuId, userData = null) => {
        try {
            // Validation de l'ID du jeu
            if (!jeuId) {
                throw new Error("L'ID du jeu est requis");
            }

            // Vérifier que le jeu existe et les permissions
            const jeu = await Jeu.findById(jeuId)
                .populate('createdBy', 'nom prenom email role ecole')
                .populate('ecole', 'libelle ville')
                .exec();

            if (!jeu) {
                throw new Error("Jeu non trouvé");
            }

            // Vérification des permissions si userData est fourni
            if (userData) {
                if (userData.role !== 'super_admin') {
                    // Vérifier que le jeu appartient à l'école de l'utilisateur
                    const jeuEcoleId = typeof jeu.ecole === 'object' ? jeu.ecole._id.toString() : jeu.ecole.toString();
                    if (!userData.ecole || userData.ecole.toString() !== jeuEcoleId) {
                        throw new Error('Accès refusé. Ce jeu n\'appartient pas à votre école.');
                    }
                    
                    // Enseignant ne peut voir que ses propres jeux
                    if (userData.role === 'enseignant') {
                        const jeuCreateurId = typeof jeu.createdBy === 'object' ? jeu.createdBy._id.toString() : jeu.createdBy.toString();
                        if (userData.id.toString() !== jeuCreateurId) {
                            throw new Error('Accès refusé. Vous ne pouvez voir que vos propres jeux.');
                        }
                    }
                }
            }

            // Récupérer toutes les questions du jeu avec détails complets
            const questions = await Question.find({ jeu: jeuId })
                .populate({
                    path: 'reponses',
                    select: 'reponse_texte etat file date',
                    options: { sort: { date: 1 } } // Trier les réponses par date
                })
                .populate({
                    path: 'typeQuestion',
                    select: 'libelle description reference'
                })
                .populate({
                    path: 'point',
                    select: 'nature valeur description'
                })
                .populate({
                    path: 'jeu',
                    select: 'titre image',
                    populate: {
                        path: 'createdBy',
                        select: 'nom prenom email'
                    }
                })
                .sort({ date: 1 }) // Trier les questions par ordre de création
                .exec();

            // Enrichir les données avec des informations calculées
            const questionsEnrichies = questions.map(question => {
                const questionObj = question.toObject();
                
                // Ajouter des statistiques sur les réponses
                const reponses = questionObj.reponses || [];
                const bonnesReponses = reponses.filter(r => r.etat === 1);
                const mauvaisesReponses = reponses.filter(r => r.etat === 0);
                
                return {
                    ...questionObj,
                    // Informations enrichies
                    infos: {
                        nombreReponses: reponses.length,
                        nombreBonnesReponses: bonnesReponses.length,
                        nombreMauvaisesReponses: mauvaisesReponses.length,
                        aBonneReponse: bonnesReponses.length > 0,
                        tempsFormate: `${questionObj.temps} secondes`,
                        typeReference: questionObj.typeQuestion?.reference,
                        pointsAttribues: questionObj.point?.valeur || 0
                    },
                    // Réponses formatées pour faciliter l'affichage
                    reponsesFormatees: reponses.map(reponse => ({
                        ...reponse,
                        etatTexte: reponse.etat === 1 ? 'Correcte' : 'Incorrecte',
                        isCorrect: reponse.etat === 1
                    }))
                };
            });

            // Retourner les questions avec informations du jeu
            return {
                jeu: {
                    id: jeu._id,
                    titre: jeu.titre,
                    image: jeu.image,
                    date: jeu.date,
                    createdBy: jeu.createdBy,
                    ecole: jeu.ecole,
                    totalQuestions: questionsEnrichies.length
                },
                questions: questionsEnrichies,
                statistiques: {
                    totalQuestions: questionsEnrichies.length,
                    questionsAvecReponses: questionsEnrichies.filter(q => q.infos.nombreReponses > 0).length,
                    questionsAvecBonnesReponses: questionsEnrichies.filter(q => q.infos.aBonneReponse).length,
                    totalPointsPossibles: questionsEnrichies.reduce((total, q) => total + (q.infos.pointsAttribues || 0), 0),
                    tempsTotal: questionsEnrichies.reduce((total, q) => total + q.temps, 0)
                }
            };

        } catch (error) {
            throw new Error(`Erreur lors de la récupération des questions du jeu: ${error.message}`);
        }
    },

    /**
     * Version simplifiée pour récupérer juste les questions d'un jeu
     * @param {string} jeuId - ID du jeu
     * @returns {Promise<Array>} Liste simple des questions
     */
    getQuestionsByJeuSimple: async (jeuId) => {
        try {
            if (!jeuId) {
                throw new Error("L'ID du jeu est requis");
            }

            const questions = await Question.find({ jeu: jeuId })
                .populate('reponses', 'reponse_texte etat file')
                .populate('typeQuestion', 'libelle reference')
                .populate('point', 'nature valeur')
                .sort({ date: 1 })
                .exec();

            return questions;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération simple des questions: ${error.message}`);
        }
    }

}; // ✅ CORRECTION: Fermeture correcte de l'objet questionService

module.exports = questionService;