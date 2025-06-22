const avatarService = require('../services/avatarService');

const avatarController = {
    createAvatar: async (req, res) => {
        try {
            const newAvatar = await avatarService.createAvatar(req);
            res.status(201).json({
                success: true,
                message: 'Avatar créé avec succès',
                data: newAvatar
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteAvatar: async (req, res) => {
        try {
            const avatarId = req.params.id;
            const deletedAvatar = await avatarService.deleteAvatar(avatarId);
            res.status(200).json({
                success: true,
                message: 'Avatar supprimé avec succès',
                data: deletedAvatar
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getAllAvatars: async (req, res) => {
        try {
            const avatars = await avatarService.getAllAvatars();
            res.status(200).json({
                success: true,
                data: avatars
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = avatarController;
