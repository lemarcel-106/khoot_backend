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
    }

};

module.exports = questionService;
