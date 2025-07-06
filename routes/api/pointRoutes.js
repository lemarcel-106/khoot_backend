
const express = require('express');
const router = express.Router();
const PointController = require('../../controllers/pointController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

/**
 * Récupérer tous les points
 */
router.get('/points', 
    authenticateToken,
    PointController.getAllPoints
);

/**
 * Récupérer un point par ID
 */
router.get('/points/:id', 
    authenticateToken,
    PointController.getPointById
);

/**
 * Créer un nouveau point
 */
router.post('/points', 
    authenticateToken,
    checkRequiredFields(['nature', 'valeur', 'description']), 
    PointController.createPoint
);

/**
 * Mettre à jour un point
 */
router.post('/points/update/:id', 
    authenticateToken, 
    PointController.updatePoint
);

/**
 * Supprimer un point
 */
router.post('/points/delete/:id', 
    authenticateToken, 
    PointController.deletePointById
);

/**
 * Récupérer les points par nature
 */
router.get('/points/nature/:nature', 
    authenticateToken,
    PointController.getPointsByNature
);

/**
 * Statistiques d'utilisation des points
 */
router.get('/points/statistiques', 
    authenticateToken,
    PointController.getStatistiquesPoints
);

module.exports = router;