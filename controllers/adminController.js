const AdminService = require('../services/adminService');
const generateMatricule = require('../utils/generateMatriculeAdmin');

const AdminController = {

    async createAdmin(req, res) {
        try {
            const adminData = req.body;
            const currentUser = req.user;

            // Vérification du super_admin
            if (currentUser.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Seul un super administrateur peut créer des admins.'
                });
            }

            // Générer le matricule automatiquement
            try {
                adminData.matricule = await generateMatricule(adminData.ecole);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Erreur lors de la génération du matricule: ${error.message}`
                });
            }

            const admin = await AdminService.createAdmin(adminData);
            return res.status(201).json({
                success: true,
                message: 'Admin créé avec succès',
                data: admin
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAdminById(req, res) {
        try {
            const adminId = req.params.id;
            const currentUser = req.user;

            // Un admin peut voir ses propres infos, un super_admin peut voir tous les admins
            if (currentUser.role !== 'super_admin' && currentUser.id !== adminId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez consulter que vos propres informations.'
                });
            }

            const admin = await AdminService.getAdminById(adminId);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Admin récupéré avec succès',
                data: admin
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAllAdmin(req, res) {
        try {
            const currentUser = req.user;

            // Seul un super_admin peut voir tous les admins
            if (currentUser.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Seul un super administrateur peut consulter la liste des admins.'
                });
            }

            const admins = await AdminService.getAllAdmin();
            return res.status(200).json({
                success: true,
                message: 'Liste des admins récupérée avec succès',
                data: admins
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAdminByMatricule(req, res) {
        try {
            const matricule = req.body.matricule;
            const currentUser = req.user;

            // Seul un super_admin peut rechercher un admin par matricule
            if (currentUser.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Seul un super administrateur peut rechercher un admin par matricule.'
                });
            }

            const admin = await AdminService.getAdminByMatricule(matricule);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Admin récupéré avec succès',
                data: admin
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async updateAdmin(req, res) {
        try {
            const adminId = req.params.id;
            const adminData = req.body;
            const currentUser = req.user;

            // Un admin peut modifier ses propres infos, un super_admin peut modifier tous les admins
            if (currentUser.role !== 'super_admin' && currentUser.id !== adminId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez modifier que vos propres informations.'
                });
            }

            // Empêcher un admin normal de modifier son propre rôle
            if (currentUser.role !== 'super_admin' && adminData.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez pas modifier votre rôle.'
                });
            }

            // Empêcher la modification du matricule
            if (adminData.matricule) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Le matricule ne peut pas être modifié.'
                });
            }

            const updatedAdmin = await AdminService.updateAdmin(adminId, adminData);
            res.status(200).json({
                success: true,
                message: 'Admin mis à jour avec succès',
                data: updatedAdmin
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'admin',
                error: err.message
            });
        }
    },

    async deleteAdminById(req, res) {
        try {
            const adminId = req.params.id;
            const currentUser = req.user;

            // Seul un super_admin peut supprimer des admins
            if (currentUser.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Seul un super administrateur peut supprimer des admins.'
                });
            }

            // Empêcher un super_admin de se supprimer lui-même
            if (currentUser.id === adminId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vous ne pouvez pas supprimer votre propre compte.'
                });
            }

            await AdminService.deleteAdminById(adminId);
            res.status(200).json({
                success: true,
                message: 'Admin supprimé avec succès'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'admin',
                error: err.message
            });
        }
    },

    // Nouvelle méthode pour récupérer le profil de l'admin connecté
    async getMyProfile(req, res) {
        try {
            const currentUser = req.user;
            const admin = await AdminService.getAdminById(currentUser.id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Profil non trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Profil récupéré avec succès',
                data: admin
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Nouvelle méthode pour mettre à jour son propre profil
    async updateMyProfile(req, res) {
        try {
            const adminData = req.body;
            const currentUser = req.user;

            // Empêcher la modification du rôle et du matricule via cette route
            if (adminData.role) {
                delete adminData.role;
            }
            if (adminData.matricule) {
                delete adminData.matricule;
            }

            const updatedAdmin = await AdminService.updateAdmin(currentUser.id, adminData);
            res.status(200).json({
                success: true,
                message: 'Profil mis à jour avec succès',
                data: updatedAdmin
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du profil',
                error: err.message
            });
        }
    }
};

module.exports = AdminController;