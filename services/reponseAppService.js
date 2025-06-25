const ReponseApp = require('../models/ReponseApp');
const Participant = require('../models/Participant')
const reponseAppService = { 

    getAllReponseAppById: async (id) => {
        try {
            return await ReponseApp.findOne({ question: id });
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la recuperation de la reponse apprenant : ' + error.message);
            }
        }
    },

    getAllReponseApp: async () => {
        try {
            return await ReponseApp.find();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de la reponse apprenant : ' + error.message);
            }
        }
    },

    createReponseApp: async (userData) => {
        try {
            // 1. Créer une nouvelle réponse dans ReponseApp
            const newReponseApp = new ReponseApp(userData);
            const savedReponseApp = await newReponseApp.save();

            // 2. Récupérer le participant concerné par la réponse
            const participant = await Participant.findById(userData.participant);
            if (!participant) {
                throw new Error('Participant non trouvé');
            }

            // 3. Ajouter l'ID de la réponse dans le tableau `reponses` du participant
            participant.reponses.push(savedReponseApp._id);

            // 4. Sauvegarder le participant mis à jour
            await participant.save();

            // Retourner la réponse créée
            return savedReponseApp;

        } catch (error) {
            throw new Error('Erreur lors de la création de la réponse : ' + error.message);
        }
    },


    updateReponseApp: async (reponseAppId, reponseAppData) => {
        try {
            const updatedReponseApp = await ReponseApp.findByIdAndUpdate(
                reponseAppId,
                { $set: reponseAppData },
                { new: true, runValidators: true }
            );
            if (!updatedReponseApp) {
                throw new Error("RéponseApp non trouvée");
            }
            return updatedReponseApp;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de la réponseApp : " + error.message);
        }
    },

    deleteReponseAppById: async (reponseAppId) => {
        try {
            const deletedReponseApp = await ReponseApp.findByIdAndDelete(reponseAppId);
            if (!deletedReponseApp) {
                throw new Error("RéponseApp non trouvée");
            }
            return deletedReponseApp;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de la réponseApp : " + error.message);
        }
    }
};

module.exports = reponseAppService;
