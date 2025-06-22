const Apprenant = require('../models/Apprenant');
const Ecole = require('../models/Ecole')
const { generateUniqueMatricule }  = require('../utils/generateUniqueMatricule')

const apprenantService = {

    getAllParticipantService: async (adminData = nul) => {
        try {
            let query = Apprenant.find();

            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par admin
            if (adminData && adminData.ecole !== 'super_admin') {
                query = query.where('ecole').equals(adminData.ecole);
            }
            return await query
                .populate('ecole', 'libelle ville telephone')
                .exec();
            // return participants;
        } catch (error) {
            throw new Error('Erreur lors de la récupération des apprenants');
        }
    },

    async getApprenantById(adminId) {
        try {
            return await Apprenant.findById(adminId)
                .populate('ecole', 'libelle ville telephone')
                .exec();
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'apprenant : ' + error.message);
        }
    },

    createParticipant: async (req) => {
        try {
            const { nom, prenom, phone, email, ecole, avatar } = req.body;
            
            const matricule = await generateUniqueMatricule();

            const participant = {
                nom,
                prenom,
                phone,
                email,
                matricule: matricule,
                avatar,
                ecole
            };

            const newParticipant = new Apprenant(participant);
            return await newParticipant.save();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création l\'apprenant : ' + error.message);
            }
        }
    },

    getParticipantByMatricule: async (matricule) => {
        try {
            // return await Apprenant.findOne({ matricule })
            const user = await Apprenant.findOne({matricule})
                .populate('ecole', 'libelle ville telephone')
                .exec();
            return user
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'utilisateur par matricule ah ah oh');
        }
    },

    loginParticipant: async (matricule) => {
        try {
            const user = await Apprenant.findOne({ matricule })
            if (!user) throw new Error('Utilisateur non trouvé');
            const token = tokenUtils.generateToken(user._id);
            return { user, token };
        } catch (error) {
            throw new Error('Erreur lors de l\'authentification de l\'utilisateur');
        }
    },

    addApprenantToEcole: async (ecoleId, apprenantId) => {
        const ecole = await Ecole.findById(ecoleId);
        if (!ecole) {
            throw new Error('Ecole non trouvée');
        }
        const apprenant = await Apprenant.findById(apprenantId);
        if (!apprenant) {
            throw new Error('Apprenant non trouvé');
        }
        if (ecole.apprenants.includes(apprenant._id)) {
            throw new Error('L\'apprenant est déjà ajouté à cette école');
        }
        ecole.apprenants.push(apprenant._id);
        await ecole.save();
    },

    updateApprenant: async (apprenantId, apprenantData) => {
        try {
            const updatedApprenant = await Apprenant.findByIdAndUpdate(
                apprenantId,
                { $set: apprenantData },
                { new: true, runValidators: true }
            );
            if (!updatedApprenant) {
                throw new Error("Apprenant non trouvé");
            }
            return updatedApprenant;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'apprenant : " + error.message);
        }
    },

    deleteApprenantById: async (apprenantId) => {
        try {
            const deletedApprenant = await Apprenant.findByIdAndDelete(apprenantId);
            if (!deletedApprenant) {
                throw new Error("Apprenant non trouvé");
            }
            return deletedApprenant;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de l'apprenant : " + error.message);
        }
    }
};


module.exports = apprenantService;
