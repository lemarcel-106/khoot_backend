const Reponse = require('../models/Reponse');
const Question = require('../models/Question');

const reponseService = {
    getAllReponses: async () => {
        try {
            return await Reponse.find();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de la reponse : ' + error.message);
            }
        }
    },

    createReponse: async (userData) => {
        try {
            // Création de la réponse à partir des données reçues
            const newReponse = new Reponse(userData);
            const savedReponse = await newReponse.save();

            // Ajout de la réponse à la question
            await reponseService.addReponseToQuestion(savedReponse._id, userData.question);

            return savedReponse;
        } catch (error) {
            throw new Error('Erreur lors de la création de la réponse : ' + error.message);
        }
    },

    addReponseToQuestion: async (reponseId, questionId) => {
        // Récupérer la question par ID
        const question = await Question.findById(questionId);
        if (!question) {
            throw new Error('Question non trouvée');
        }

        // Vérifie si la réponse est déjà dans la question
        if (question.reponses.includes(reponseId)) {
            throw new Error('La réponse est déjà ajoutée à cette question');
        }

        // Ajouter l'ID de la réponse au tableau `reponses` de la question
        question.reponses.push(reponseId);
        await question.save();

        return question;
    },

    updateReponse: async (reponseId, reponseData) => {
        try {
            const updatedReponse = await Reponse.findByIdAndUpdate(
                reponseId,
                { $set: reponseData },
                { new: true, runValidators: true }
            );
            if (!updatedReponse) {
                throw new Error("Réponse non trouvée");
            }
            return updatedReponse;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de la réponse : " + error.message);
        }
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
    


getReponseById: async (reponseId) => {
    try {
        const reponse = await Reponse.findById(reponseId);
        
        if (!reponse) {
            throw new Error( `Réponse non trouvée ${reponseId}`);
        }

        return reponse;
    } catch (error) {
        throw new Error('Erreur lors de la récupération de la réponse : ' + error.message);
    }
},

insertMany: async (dataArray) => {
    try {
        return await Reponse.insertMany(dataArray);
    } catch (error) {
        throw new Error("Erreur lors de l'insertion multiple : " + error.message);
    }
}
};


module.exports = reponseService;
