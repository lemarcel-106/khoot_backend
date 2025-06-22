const Pays = require('../models/Pays'); 

const PaysService = {
    // Créer un nouveau pays
    async createPays(paysData) {
        try {
            const newPays = new Pays(paysData);
            return await newPays.save();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du pays : ' + error.message);
            }
        }
    },

    // Récupérer tous les pays
    async getAllPays() {
        try {
            return await Pays.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des pays : ' + error.message);
        }
    },

    // Récupérer un pays par ID
    async getPaysById(paysId) {
        try {
            return await Pays.findById(paysId);
        } catch (error) {
            throw new Error('Erreur lors de la récupération du pays : ' + error.message);
        }
    },

    // Récupérer un pays par libellé
    async getPaysByLibelle(libelle) {
        try {
            return await Pays.findOne({ libelle });
        } catch (error) {
            throw new Error('Erreur lors de la récupération du pays : ' + error.message);
        }
    },

    updatePays: async (paysId, paysData) => {
        try {
            const updatedPays = await Pays.findByIdAndUpdate(
                paysId,
                { $set: paysData },
                { new: true, runValidators: true }
            );
            if (!updatedPays) {
                throw new Error("Pays non trouvé");
            }
            return updatedPays;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du pays : " + error.message);
        }
    },

    deletePaysById: async (paysId) => {
        try {
            const deletedPays = await Pays.findByIdAndDelete(paysId);
            if (!deletedPays) {
                throw new Error("Pays non trouvé");
            }
            return deletedPays;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du pays : " + error.message);
        }
    }
};

module.exports = PaysService;
