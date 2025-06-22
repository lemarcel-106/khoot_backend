const reponseService = require('../services/reponseService');

exports.getAllReponses = async (req, res) => {
    try {
        const reponses = await reponseService.getAllReponses();
        res.status(200).json({
            success: true,
            message: 'Liste des reponses récupérée avec succès',
            data: reponses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createReponse = async (req, res) => {
    try {
        const reponse = await reponseService.createReponse(req.body);
        res.status(201).json({
            success: true,
            message: 'Reponse créé avec succès',
            data: reponse
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la reponse',
            error: err.message
        });
    }
};

exports.deleteReponseById = async (req, res) => {
    try {
        const reponseId = req.body.id;
        console.log(reponseId)
        await reponseService.deleteReponseById(reponseId);
        res.status(200).json({
            success: true,
            message: 'Réponse supprimée avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la réponse',
            error: err.message
        });
    }
};


exports.getReponseById = async (req, res) => {
    try {
        const reponseId = req.params.id;
        
        const reponse= await reponseService.getReponseById(reponseId);
        
        if (!reponse) {
                return res.status(404).json({ message: `Reponse non trouvée ${reponseId} ` });
            }
            
        res.status(200).json({
            success: true,  
            message: 'Réponse recupéré avec succès',
            data: reponse
        });
    } catch (err) {
        res.status(500).json({
           
            success: false,
            message: 'Erreur lors de la recuperation de réponse',
            error: err.message
        });
    }
};


exports.updateReponse = async (req, res) => {
    try {
        const reponseId = req.params.id;
        const reponseData = req.body;
        const updatedReponse = await reponseService.updateReponse(reponseId, reponseData);
        res.status(200).json({
            success: true,
            message: 'Réponse mise à jour avec succès',
            data: updatedReponse
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la réponse',
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

        const inserted = await reponseService.insertMany(reponses);

        res.status(201).json({
            success: true,
            message: `${inserted.length} réponses enregistrées avec succès`,
            data: inserted
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de l’enregistrement', error: error.message });
    }
}
    