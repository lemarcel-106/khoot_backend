const Avatar = require('../models/Avatar');

const avatarService = {
    // Créer un nouvel avatar
    createAvatar: async (req) => {
        try {
            const { name } = req.body;
            if (!req.file) {
                throw new Error('Aucune image envoyée.');
            }
            const newAvatar = new Avatar({
                name,
                image: req.file.path
            });
            return await newAvatar.save();
        } catch (error) {
            throw new Error('Erreur lors de la création de l\'avatar: ' + error.message);
        }
    },

    // Supprimer un avatar par son ID
    deleteAvatar: async (avatarId) => {
        try {
            const deletedAvatar = await Avatar.findByIdAndDelete(avatarId);
            if (!deletedAvatar) {
                throw new Error('Avatar non trouvé');
            }
            return deletedAvatar;
        } catch (error) {
            throw new Error('Erreur lors de la suppression de l\'avatar: ' + error.message);
        }
    },

    // Récupérer tous les avatars
    getAllAvatars: async () => {
        try {
            return await Avatar.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des avatars: ' + error.message);
        }
    }
};

module.exports = avatarService;
