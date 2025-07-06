const avatarService = require('../services/avatarService');

const avatarController = {
    /**
     * Créer un avatar
     * POST /api/avatars
     */
    async create(req, res) {
        try {
            console.log('➕ Création d\'un nouvel avatar...');
            const avatar = await avatarService.create(req.body, req.file);
            
            res.status(201).json({
                success: true,
                message: 'Avatar créé avec succès',
                data: avatar
            });
        } catch (error) {
            console.error('❌ Erreur create avatar:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Récupérer tous les avatars
     * GET /api/avatars
     */
    async getAll(req, res) {
        try {
            console.log('📋 Récupération de tous les avatars...');
            const avatars = await avatarService.getAll();
            
            res.json({
                success: true,
                data: avatars,
                total: avatars.length,
                message: 'Avatars récupérés avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur getAll avatars:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Récupérer un avatar par ID
     * GET /api/avatars/:id
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            console.log(`🔍 Récupération de l'avatar ID: ${id}...`);
            
            const avatar = await avatarService.getById(id);
            
            res.json({
                success: true,
                data: avatar,
                message: 'Avatar récupéré avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur getById avatar:', error);
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Mettre à jour un avatar
     * PUT /api/avatars/:id ou POST /api/avatars/update/:id
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            console.log(`🔄 Mise à jour de l'avatar ID: ${id}...`);
            
            const avatar = await avatarService.update(id, req.body, req.file);
            
            res.json({
                success: true,
                message: 'Avatar mis à jour avec succès',
                data: avatar
            });
        } catch (error) {
            console.error('❌ Erreur update avatar:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Supprimer un avatar
     * DELETE /api/avatars/:id ou POST /api/avatars/delete/:id
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            console.log(`🗑️ Suppression de l'avatar ID: ${id}...`);
            
            const result = await avatarService.delete(id);
            
            res.json({
                success: true,
                message: 'Avatar supprimé avec succès',
                data: result
            });
        } catch (error) {
            console.error('❌ Erreur delete avatar:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtenir un avatar aléatoire
     * GET /api/avatars/random
     */
    async getRandom(req, res) {
        try {
            console.log('🎲 Sélection d\'un avatar aléatoire...');
            const avatar = await avatarService.getRandomAvatar();
            
            res.json({
                success: true,
                data: avatar,
                message: 'Avatar aléatoire sélectionné avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur getRandom avatar:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Obtenir les statistiques d'utilisation des avatars
     * GET /api/avatars/stats
     */
    async getStats(req, res) {
        try {
            console.log('📊 Récupération des statistiques des avatars...');
            
            // Importer le helper d'avatar pour les stats
            const AvatarHelper = require('../utils/avatarHelper');
            const stats = await AvatarHelper.getUsageStats();
            
            res.json({
                success: true,
                data: stats,
                message: 'Statistiques des avatars récupérées avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur getStats avatars:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    },

    /**
     * Obtenir les avatars non utilisés
     * GET /api/avatars/unused
     */
    async getUnused(req, res) {
        try {
            console.log('🔍 Récupération des avatars non utilisés...');
            
            const AvatarHelper = require('../utils/avatarHelper');
            const unusedAvatars = await AvatarHelper.getUnusedAvatars();
            
            res.json({
                success: true,
                data: unusedAvatars,
                total: unusedAvatars.length,
                message: 'Avatars non utilisés récupérés avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur getUnused avatars:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des avatars non utilisés'
            });
        }
    }
};

module.exports = avatarController;