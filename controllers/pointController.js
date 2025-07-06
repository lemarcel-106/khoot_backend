// controllers/pointController.js - CONTRÔLEUR COMPLET

const Point = require('../models/Point');

const PointController = {
    /**
     * Récupérer tous les points
     */
    async getAllPoints(req, res) {
        try {
            const points = await Point.find()
                .sort({ valeur: 1 }) // Trier par valeur croissante
                .exec();

            res.status(200).json({
                success: true,
                message: 'Points récupérés avec succès',
                data: points,
                total: points.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des points',
                error: error.message
            });
        }
    },

    /**
     * Récupérer un point par ID
     */
    async getPointById(req, res) {
        try {
            const { id } = req.params;
            const point = await Point.findById(id);

            if (!point) {
                return res.status(404).json({
                    success: false,
                    message: 'Point non trouvé'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Point récupéré avec succès',
                data: point
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du point',
                error: error.message
            });
        }
    },

    /**
     * Créer un nouveau point
     */
    async createPoint(req, res) {
        try {
            const { nature, valeur, description } = req.body;

            // Vérifier si un point avec cette valeur existe déjà
            const pointExistant = await Point.findOne({ valeur });
            if (pointExistant) {
                return res.status(400).json({
                    success: false,
                    message: `Un point avec la valeur ${valeur} existe déjà`
                });
            }

            const nouveauPoint = new Point({
                nature,
                valeur,
                description,
                date: new Date()
            });

            const pointCree = await nouveauPoint.save();

            res.status(201).json({
                success: true,
                message: 'Point créé avec succès',
                data: pointCree
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du point',
                error: error.message
            });
        }
    },

    /**
     * Mettre à jour un point
     */
    async updatePoint(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Si on modifie la valeur, vérifier qu'elle n'existe pas déjà
            if (updateData.valeur) {
                const pointExistant = await Point.findOne({ 
                    valeur: updateData.valeur,
                    _id: { $ne: id }
                });
                
                if (pointExistant) {
                    return res.status(400).json({
                        success: false,
                        message: `Un point avec la valeur ${updateData.valeur} existe déjà`
                    });
                }
            }

            const pointMisAJour = await Point.findByIdAndUpdate(
                id,
                { ...updateData, dateModification: new Date() },
                { new: true, runValidators: true }
            );

            if (!pointMisAJour) {
                return res.status(404).json({
                    success: false,
                    message: 'Point non trouvé'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Point mis à jour avec succès',
                data: pointMisAJour
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du point',
                error: error.message
            });
        }
    },

    /**
     * Supprimer un point
     */
    async deletePointById(req, res) {
        try {
            const { id } = req.params;

            // Vérifier si le point est utilisé dans des questions
            const Question = require('../models/Question');
            const questionsUtilisant = await Question.countDocuments({ point: id });

            if (questionsUtilisant > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Ce point ne peut pas être supprimé car il est utilisé dans ${questionsUtilisant} question(s)`
                });
            }

            const pointSupprime = await Point.findByIdAndDelete(id);

            if (!pointSupprime) {
                return res.status(404).json({
                    success: false,
                    message: 'Point non trouvé'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Point supprimé avec succès',
                data: {
                    id: pointSupprime._id,
                    nature: pointSupprime.nature,
                    valeur: pointSupprime.valeur
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du point',
                error: error.message
            });
        }
    },

    /**
     * Récupérer les points par nature
     */
    async getPointsByNature(req, res) {
        try {
            const { nature } = req.params;
            const points = await Point.find({ nature })
                .sort({ valeur: 1 })
                .exec();

            res.status(200).json({
                success: true,
                message: `Points de nature "${nature}" récupérés avec succès`,
                data: points,
                total: points.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des points par nature',
                error: error.message
            });
        }
    },

    /**
     * Obtenir les statistiques d'utilisation des points
     */
    async getStatistiquesPoints(req, res) {
        try {
            const Question = require('../models/Question');
            
            // Récupérer tous les points avec le nombre de questions qui les utilisent
            const pointsAvecStats = await Point.aggregate([
                {
                    $lookup: {
                        from: 'questions',
                        localField: '_id',
                        foreignField: 'point',
                        as: 'questions'
                    }
                },
                {
                    $addFields: {
                        nombreUtilisations: { $size: '$questions' }
                    }
                },
                {
                    $project: {
                        nature: 1,
                        valeur: 1,
                        description: 1,
                        nombreUtilisations: 1,
                        date: 1
                    }
                },
                {
                    $sort: { valeur: 1 }
                }
            ]);

            // Calculer les statistiques globales
            const totalPoints = pointsAvecStats.length;
            const pointsUtilises = pointsAvecStats.filter(p => p.nombreUtilisations > 0).length;
            const pointsNonUtilises = totalPoints - pointsUtilises;
            const utilizationMoyenne = totalPoints > 0 
                ? Math.round(pointsAvecStats.reduce((sum, p) => sum + p.nombreUtilisations, 0) / totalPoints)
                : 0;

            // Grouper par nature
            const repartitionParNature = pointsAvecStats.reduce((acc, point) => {
                if (!acc[point.nature]) {
                    acc[point.nature] = { count: 0, utilisations: 0 };
                }
                acc[point.nature].count++;
                acc[point.nature].utilisations += point.nombreUtilisations;
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                message: 'Statistiques des points récupérées avec succès',
                data: {
                    points: pointsAvecStats,
                    statistiques: {
                        totalPoints,
                        pointsUtilises,
                        pointsNonUtilises,
                        tauxUtilisation: totalPoints > 0 ? Math.round((pointsUtilises / totalPoints) * 100) : 0,
                        utilizationMoyenne,
                        repartitionParNature
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
};

module.exports = PointController;