const pointService = require('../services/pointService');

exports.getAllPoints = async (req, res) => {
    try {
        const points = await pointService.getAllPoints();
        res.status(200).json({
            success: true,
            message: 'Liste des points récupérée avec succès',
            data: points
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createPoint = async (req, res) => {
    try {
        const point = await pointService.createPoint(req.body);
        res.status(201).json({
            success: true,
            message: 'Point créé avec succès',
            data: point
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du jeu',
            error: err.message
        });
    }
};

exports.updatePoint = async (req, res) => {
    try {
        const pointId = req.params.id;
        const pointData = req.body;
        const updatedPoint = await pointService.updatePoint(pointId, pointData);
        res.status(200).json({
            success: true,
            message: 'Point mis à jour avec succès',
            data: updatedPoint
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du point',
            error: err.message
        });
    }
};

exports.deletePointById = async (req, res) => {
    try {
        const pointId = req.params.id;
        await pointService.deletePointById(pointId);
        res.status(200).json({
            success: true,
            message: 'Point supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du point',
            error: err.message
        });
    }
}