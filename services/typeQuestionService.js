const TypeQuestion = require('../models/TypeQuestion');

const typeQuestionService = {
    getAllTypeQuestions: async () => {
        try {
            return await TypeQuestion.find();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du type de question : ' + error.message);
            }
        }
    },

    createTypeQuestion: async (userData) => {
        try {
            const newTypeService = new TypeQuestion(userData);
            return await newTypeService.save();
        } catch (error) {
            throw new Error('Erreur lors de la création du participant');
        }
    },

    updateTypeQuestion: async (typeQuestionId, typeQuestionData) => {
        try {
            const updatedTypeQuestion = await TypeQuestion.findByIdAndUpdate(
                typeQuestionId,
                { $set: typeQuestionData },
                { new: true, runValidators: true }
            );
            if (!updatedTypeQuestion) {
                throw new Error("Type de question non trouvé");
            }
            return updatedTypeQuestion;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du type de question : " + error.message);
        }
    },

    deleteTypeQuestionById: async (typeQuestionId) => {
        try {
            const deletedTypeQuestion = await TypeQuestion.findByIdAndDelete(typeQuestionId);
            if (!deletedTypeQuestion) {
                throw new Error("Type de question non trouvé");
            }
            return deletedTypeQuestion;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du type de question : " + error.message);
        }
    }
};

module.exports = typeQuestionService;
