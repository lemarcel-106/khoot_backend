const Admin = require('../models/Admin');
const passwordUtils = require('../utils/password');
const tokenUtils = require('../utils/token');

const adminService = {

    getAllAdmin: async () => {
        try {
            return await Admin.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des administrateurs');
        }
    },

    getAdminById: async (id) => {
        try {
            return await Admin.findById(id)
                .populate({
                    path: 'pays',
                    select: 'libelle'
                })
                .populate({
                    path: 'role',
                    select: 'libelle'
                });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'administrateur par ID');
        }
    },

    getAdminByEmail: async (email) => {
        try {
            return await Admin.findOne({ email })
                .populate({
                    path: 'pays',
                    select: 'libelle'
                })
                .populate({
                    path: 'role',
                    select: 'libelle'
                });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'administrateur par email');
        }
    },

    getAdminByMatricule: async (matricule) => {
        try {
            return await Admin.findOne({ matricule })
                .populate('pays', 'libelle')
                .populate('role', 'libelle');
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'administrateur par matricule');
        }
    },

    createAdmin: async (adminData) => {
        try {
            adminData.password = await passwordUtils.hashPassword(adminData.password);
            const newAdmin = new Admin(adminData);
            return await newAdmin.save();
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de l\'administrateur : ' + error.message);
            }
        }
    },

    loginAdmin: async (email, password) => {
        try {
            const admin = await Admin.findOne({ email });
            if (!admin) throw new Error('Administrateur non trouvé');
            const isMatch = await passwordUtils.comparePassword(password, admin.password);
            if (!isMatch) throw new Error('Mot de passe incorrect');
            const token = tokenUtils.generateToken(admin._id);
            return { admin, token };
        } catch (error) {
            throw new Error('Erreur lors de l\'authentification de l\'administrateur');
        }
    },

    updateAdmin: async (adminId, adminData) => {
        try {
            const updatedAdmin = await Admin.findByIdAndUpdate(
                adminId,
                { $set: adminData },
                { new: true, runValidators: true }
            );
            if (!updatedAdmin) {
                throw new Error("Administrateur non trouvé");
            }
            return updatedAdmin;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'administrateur : " + error.message);
        }
    },

    deleteAdminById: async (adminId) => {
        try {
            const deletedAdmin = await Admin.findByIdAndDelete(adminId);
            if (!deletedAdmin) {
                throw new Error("Administrateur non trouvé");
            }
            return deletedAdmin;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de l'administrateur : " + error.message);
        }
    }
};

module.exports = adminService;