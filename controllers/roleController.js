const RoleService = require('../services/roleService');

const RoleController = {
    async createRole(req, res) {
        try {
            const roleData = req.body;
            const role = await RoleService.createRole(roleData);
            res.status(200).json({
                success: true,
                message: 'Le role a ete cree avec success',
                data: role
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getAllRoles(req, res) {
        try {
            const roles = await RoleService.getAllRoles();
            res.status(200).json({
                success: true,
                message: 'La liste des roles a ete recuperee avec success',
                data: roles
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getRoleById(req, res) {
        try {
            const roleId = req.body;
            const role = await RoleService.getRoleById(roleId);
            if (!role) {
                return res.status(404).json({ message: 'Rôle non trouvé' });
            }
            return res.status(200).json(role);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getRoleByLibelle(req, res) {
        try {
            const libelle = req.body;
            const role = await RoleService.getRoleByLibelle(libelle);
            if (!role) {
                return res.status(404).json({ message: 'Rôle non trouvé' });
            }
            return res.status(200).json(role);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async updateRole(req, res) {
        try {
            const roleId = req.params.id;
            const roleData = req.body;
            const updatedRole = await RoleService.updateRole(roleId, roleData);
            res.status(200).json({
                success: true,
                message: 'Rôle mis à jour avec succès',
                data: updatedRole
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du rôle',
                error: err.message
            });
        }
    },

    async deleteRoleById(req, res) {
        try {
            const roleId = req.params.id;
            await RoleService.deleteRoleById(roleId);
            res.status(200).json({
                success: true,
                message: 'Rôle supprimé avec succès',
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du rôle',
                error: err.message
            });
        }
    }
};

module.exports = RoleController;
