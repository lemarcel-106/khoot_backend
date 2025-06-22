const reponseAppService = require('../services/reponseAppService');

exports.getAllReponseApp = async (req, res) => {
    try {
        const reponseApp = await reponseAppService.getAllReponseApp();
        res.status(200).json({
            success: true,
            message: 'Liste des reponseApp récupérée avec succès',
            data: reponseApp
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.getAllReponseAppById = async (req, res) => {
    try {
        const reponseApp = await reponseAppService.getAllReponseAppById(req.params.id);
        res.status(200).json({
            success: true,
            message: 'La reponseApp récupérée avec succès',
            data: reponseApp
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createReponseApp = async (req, res) => {
    try {
        const pointApp = await reponseAppService.createReponseApp(req.body);
        res.status(201).json({
            success: true,
            message: 'Reponse apprenant créé avec succès',
            data: pointApp
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la reponse',
            error: err.message
        });
    }
};

exports.updateReponseApp= async(req, res)=> {
    try {
        const reponseAppId = req.params.id;
        const reponseAppData = req.body;
        const updatedReponseApp = await reponseAppService.updateReponseApp(reponseAppId, reponseAppData);
        res.status(200).json({
            success: true,
            message: 'RéponseApp mise à jour avec succès',
            data: updatedReponseApp
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la réponseApp',
            error: err.message
        });
    }
},

exports.deleteReponseAppById= async (req, res) => {
    try {
        const reponseAppId = req.params.id;
        await reponseAppService.deleteReponseAppById(reponseAppId);
        res.status(200).json({
            success: true,
            message: 'RéponseApp supprimée avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la réponseApp',
            error: err.message
        });
    }
}



exports.createMultiple = async (req, res) => {
    try {
        const reponses = req.body.reponses;

        if (!Array.isArray(reponses) || reponses.length === 0) {
            return res.status(400).json({ success: false, message: 'Aucune réponse fournie' });
        }

        const inserted = await reponseAppService.insertMany(reponses);

        res.status(201).json({
            success: true,
            message: `${inserted.length} réponses enregistrées avec succès`,
            data: inserted
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de l’enregistrement', error: error.message });
    }
};
