const Role = require('../models/Role');

const RoleService = {
    async createRole(roleData) {
        try {
            const newRole = new Role(roleData);
            return await newRole.save();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du role : ' + error.message);
            }
        }
    },

    async getAllRoles() {
        try {
            return await Role.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des rôles : ' + error.message);
        }
    },

    async getRoleById(roleId) {
        try {
            return await Role.findById(roleId);
        } catch (error) {
            throw new Error('Erreur lors de la récupération du rôle : ' + error.message);
        }
    },

    async getRoleByLibelle(libelle) {
        try {
            return await Role.findOne({ libelle });
        } catch (error) {
            throw new Error('Erreur lors de la récupération du rôle par libelle : ' + error.message);
        }
    },

    updateRole: async (roleId, roleData) => {
        try {
            const updatedRole = await Role.findByIdAndUpdate(
                roleId,
                { $set: roleData },
                { new: true, runValidators: true }
            );
            if (!updatedRole) {
                throw new Error("Rôle non trouvé");
            }
            return updatedRole;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du rôle : " + error.message);
        }
    },

    deleteRoleById: async (roleId) => {
        try {
            const deletedRole = await Role.findByIdAndDelete(roleId);
            if (!deletedRole) {
                throw new Error("Rôle non trouvé");
            }
            return deletedRole;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du rôle : " + error.message);
        }
    }

};

module.exports = RoleService;
