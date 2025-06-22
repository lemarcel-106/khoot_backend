const participantService = require('../services/apprenantService');
const jeuService = require('../services/jeuService');

exports.getApprenants = async (req, res) => {
    try {
        // MODIFICATION : Récupérer les données de l'admin connecté avec son école
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            ecole: req.user.ecole // AJOUT : inclure l'école de l'admin
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
        // MODIFICATION : Vérifier que l'admin a une école assignée
        if (!req.user.ecole) {
            return res.status(400).json({
                success: false,
                message: 'Aucune école assignée à cet administrateur. Veuillez contacter le super administrateur.'
            });
        }

        // MODIFICATION : Si l'école n'est pas spécifiée dans le body, utiliser celle de l'admin
        if (!req.body.ecole) {
            req.body.ecole = req.user.ecole;
        }

        // MODIFICATION : Vérifier que l'admin ne crée des apprenants que pour son école
        if (req.user.role !== 'super_admin' && req.body.ecole.toString() !== req.user.ecole.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez créer des apprenants que pour votre école.'
            });
        }

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

        // MODIFICATION : Vérifier l'accès au jeu selon le nouveau modèle
        const jeu = await jeuService.getJeuById(jeuId);
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== jeu.ecole.toString()) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Accès refusé à ce jeu' 
                });
            }
        }

        const updatedJeu = await jeuService.addParticipant(jeuId, participantId);
        res.status(200).json({ 
            success: true,
            message: 'Participant ajouté au jeu avec succès', 
            jeu: updatedJeu 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

exports.updateApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        const apprenantData = req.body;

        // MODIFICATION : Vérifier l'accès à l'apprenant selon le nouveau modèle
        const apprenant = await participantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        // Empêcher la modification de l'école si ce n'est pas un super_admin
        if (req.user.role !== 'super_admin' && apprenantData.ecole) {
            delete apprenantData.ecole;
        }

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

        // MODIFICATION : Vérifier l'accès à l'apprenant selon le nouveau modèle
        const apprenant = await participantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

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
        const apprenantId = req.params.id;
        const apprenant = await participantService.getApprenantById(apprenantId);
        
        if (!apprenant) {
            return res.status(404).json({ 
                success: false,
                message: 'Apprenant non trouvé' 
            });
        }

        // MODIFICATION : Vérifier l'accès à l'apprenant selon le nouveau modèle
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Apprenant récupéré avec succès',
            data: apprenant
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

exports.getApprenantByMatricule = async (req, res) => {
    try {
        const matricule = req.body;
        const apprenant = await participantService.getParticipantByMatricule(matricule);
        
        if (!apprenant) {
            return res.status(404).json({ 
                success: false,
                message: 'Apprenant non trouvé' 
            });
        }

        // MODIFICATION : Vérifier l'accès à l'apprenant selon le nouveau modèle
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Apprenant récupéré avec succès',
            data: apprenant
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}