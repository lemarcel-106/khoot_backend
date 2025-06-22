const jeuService = require('../services/jeuService');
const logger = require('../logger');

exports.getAllJeux = async (req, res) => {
    try {
        // Récupérer les données de l'admin connecté depuis le middleware d'authentification
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            nom: req.user.nom,
            ecole: req.user.ecole,
        };
        // console.log("adminData")

        const jeux = await jeuService.getAllJeu(adminData);

        res.status(200).json({
            success: true,
            message: 'Liste des jeux récupérée avec succès',
            data: jeux
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createJeu = async (req, res) => {
    try {
        const { titre } = req.body;
        logger.info('Creation de mon jeu ah ah ah', req.user);
        console.log('MongoDB est connecté à Atlas creation du jeu');

        if (!req.file) {
            return res.status(400).json({ message: 'Aucune image envoyée.' });
        }
        const createdBy = req.user.id;

        const jeuData = {
            titre,
            image: req.file.path,
            createdBy
        };

        // Crée le jeu via le service jeuService
        const { message, statut, savedJeu } = await jeuService.createJeu(jeuData);

        // Réponse incluant le statut, message, et les informations du jeu
        res.status(201).json({
            statut: statut,
            message: message,
            jeu: savedJeu // Renvoie le jeu avec les détails complets
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du jeu',
            error: err.message
        });
    }
};

exports.getJeuDetailsByPin = async (req, res) => {
    const { pin } = req.body;
    try {
        const jeu = await jeuService.getJeuByPin(pin);
        res.status(201).json({
            statut: 200,
            message: "Jeu obtenu avec success",
            jeu
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.getJeuById = async (req, res) => {
    const { id } = req.params;

    try {
        const jeu = await jeuService.getJeuById(id);
        res.status(200).json(jeu);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


exports.updateJeu = async (req, res) => {
    try {
        const jeuId = req.params.id;
        const jeuData = req.body;
        const updatedJeu = await jeuService.updateJeu(jeuId, jeuData);
        res.status(200).json({
            success: true,
            message: 'Jeu mis à jour avec succès',
            data: updatedJeu
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du jeu',
            error: err.message
        });
    }
};

exports.deleteJeuById = async (req, res) => {
    try {
        const jeuId = req.params.id;
        await jeuService.deleteJeuById(jeuId);
        res.status(200).json({
            success: true,
            message: 'Jeu supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du jeu',
            error: err.message
        });
    }
}

