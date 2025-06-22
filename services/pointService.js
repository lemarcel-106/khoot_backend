const Point = require('../models/Point');

const pointService = {
    getAllPoints: async () => {
        try {
            return await Point.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des points');
        }
    },

    createPoint: async (userData) => {
        try {
            const newPoint = new Point(userData);
            return await newPoint.save();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du point : ' + error.message);
            }
        }
    },

    updatePoint: async (pointId, pointData) => {
        try {
            const updatedPoint = await Point.findByIdAndUpdate(
                pointId,
                { $set: pointData },
                { new: true, runValidators: true }
            );
            if (!updatedPoint) {
                throw new Error("Point non trouvé");
            }
            return updatedPoint;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du point : " + error.message);
        }
    },

    deletePointById: async (pointId) => {
        try {
            const deletedPoint = await Point.findByIdAndDelete(pointId);
            if (!deletedPoint) {
                throw new Error("Point non trouvé");
            }
            return deletedPoint;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du point : " + error.message);
        }
    }
};

module.exports = pointService;
