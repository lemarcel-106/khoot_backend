const participantService = require('../services/apprenantService');
const jeuService = require('../services/jeuService');

exports.getApprenants = async (req, res) => {
    try {
        // Récupérer les données de l'admin connecté depuis le middleware d'authentification
        const adminData = {
            id: req.user.id,
            role: req.user.role
        };
        
        const participants = await participantService.getAllParticipantService(adminData);
        res.status(200).json({
            success: true,
            message: 'Liste des participants récupérée avec succès',
            data: participants
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createApprenant = async (req, res) => {
    try {
        const apprenant = await participantService.createParticipant(req);
        await participantService.addApprenantToEcole(req.body.ecole, apprenant._id);
        res.status(201).json({
            success: true,
            message: 'Apprenant créé avec succès',
            data: apprenant
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `Le ${field} existe déjà, veuillez en utiliser un autre.`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'utilisateur',
            error: err.message
        });
    }
};


exports.addExistingApprenantToJeu = async (req, res) => {
    try {
        const { jeuId, participantId } = req.body;
        const updatedJeu = await jeuService.addParticipant(jeuId, participantId);
        res.status(200).json({ message: 'Participant ajouté au jeu avec succès', jeu: updatedJeu });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.updateApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        const apprenantData = req.body;
        const updatedApprenant = await participantService.updateApprenant(apprenantId, apprenantData);
        res.status(200).json({
            success: true,
            message: 'Apprenant mis à jour avec succès',
            data: updatedApprenant
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'apprenant',
            error: err.message
        });
    }
};

exports.deleteApprenantById = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        await participantService.deleteApprenantById(apprenantId);
        res.status(200).json({
            success: true,
            message: 'Apprenant supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'apprenant',
            error: err.message
        });
    }
};

exports.getApprenantById = async (req, res) => {
    try {
        const adminId = req.params.id;
        const admin = await participantService.getApprenantById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Apprenant non trouvé' });
        }
        return res.status(200).json({
            success: true,
            message: 'Apprenant recupere avec success',
            data: admin
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

exports.getApprenantByMatricule = async (req, res) => {
    try {
        const matricule = req.body;
        const admin = await participantService.getParticipantByMatricule(matricule);
        if (!admin) {
            return res.status(404).json({ message: 'Apprenant non trouvé' });
        }
        return res.status(200).json({
            success: true,
            message: 'Apprenant recupere avec success',
            data: admin
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}


