const userService = require('../services/userService');

exports.getUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({
            success: true,
            message: 'Liste des utilisateurs récupérée avec succès',
            data: users
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.getUsersById = async (req, res) => {
    try {
        const users = await userService.getUserById(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Utilisateur récupérée avec succès',
            data: users
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'utilisateur',
            error: err.message
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = req.body;
        const updatedUser = await userService.updateUser(userId, userData);
        res.status(200).json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: updatedUser
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'utilisateur',
            error: err.message
        });
    }
};

exports.deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        await userService.deleteUserById(userId);
        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'utilisateur',
            error: err.message
        });
    }
};

exports.getUserByEcole = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userService.getUserByEcole(userId);
        res.status(200).json({
            success: true,
            message: 'Utilisateur ajouté avec succès',
            data: user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'utilisateur',
            error: err.message
        });
    }
}