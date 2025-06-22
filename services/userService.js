const User = require('../models/Users');
const Admin = require('../models/Admin');
const passwordUtils = require('../utils/password');
const tokenUtils = require('../utils/token');

const userService = {

    getAllUsers: async () => {
        try {
            return await User.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des utilisateurs');
        }
    },

    getAllUsersById: async (Id) => {
        try {
            console.log(Id)
            return await User.findById(Id);
        } catch (error) {
            throw new Error('Erreur lors de la récupération des utilisateurs');
        }
    },

    createUser: async (userData) => {
        try {
            userData.password = await passwordUtils.hashPassword(userData.password);
            const newUser = new User(userData);
            return await newUser.save();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de l\'utilisateur : ' + error.message);
            }
        }
    },

    getUserById: async (id) => {
        try {
            return await User.findById(id)
                .populate({
                    path: 'ecole',
                    populate: {
                        path: 'apprenants', // Populate des réponses dans chaque participant
                    }
                })
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'utilisateur par email');
        }
    },

    getUserByEcole: async (id) => {
        try {
            return await User.findOne({ ecole: id }).populate('ecole');
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'utilisateur par ecole');
        }
    },

    getUserByEmail: async (email) => {
        try {
            return await User.findOne({ email }).populate({
        path: 'ecole',
        select: 'libelle adresse ville', // Spécifie les champs à inclure
    });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'utilisateur par email');
        }
    },
    
    getAdminByEmail: async (email) => {
        try {
            return await Admin.findOne({ email });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'utilisateur par email');
        }
    },

    loginUser: async (email, password) => {
        try {
            const user = await User.findOne({ email });
            if (!user) throw new Error('Utilisateur non trouvé');
            const isMatch = await passwordUtils.comparePassword(password, user.password);
            if (!isMatch) throw new Error('Mot de passe incorrect');
            const token = tokenUtils.generateToken(user._id);
            return { user, token };
        } catch (error) {
            throw new Error('Erreur lors de l\'authentification de l\'utilisateur');
        }
    },

    updateUser: async (userId, userData) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: userData },
                { new: true, runValidators: true }
            );
            if (!updatedUser) {
                throw new Error("Utilisateur non trouvé");
            }
            return updatedUser;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'utilisateur : " + error.message);
        }
    },

    deleteUserById: async (userId) => {
        try {
            const deletedUser = await User.findByIdAndDelete(userId);
            if (!deletedUser) {
                throw new Error("Utilisateur non trouvé");
            }
            return deletedUser;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de l'utilisateur : " + error.message);
        }
    }
};

module.exports = userService;
