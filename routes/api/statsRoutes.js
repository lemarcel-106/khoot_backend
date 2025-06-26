// routes/api/statsRoutes.js
const express = require('express');
const router = express.Router();
const StatsController = require('../../controllers/statsController');
const { authenticate, requireSuperAdmin } = require('../../utils/middlewares/authMiddleware');

/**
 * Route pour récupérer les statistiques globales
 * Accès: Super administrateurs uniquement
 * Route: GET /api/stats/global
 * Retourne: total école, total jeux, total planifications + détails
 */
router.get('/stats/global', 
    authenticate,           // Vérifier l'authentification
    requireSuperAdmin,      // Vérifier le rôle super_admin
    StatsController.getGlobalStats
);

module.exports = router;