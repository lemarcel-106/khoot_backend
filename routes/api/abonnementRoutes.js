// routes/api/abonnementRoutes.js - AJOUT DE ROUTES ADMIN
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/abonnementController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

// ===================================================================
// ROUTES PUBLIQUES (SANS AUTHENTIFICATION) - Données filtrées
// ===================================================================

/**
 * Récupérer tous les abonnements (version publique - données filtrées)
 * GET /api/abonnements
 */
router.get('/', ctrl.getAll);

/**
 * Récupérer un abonnement par ID (version publique - données filtrées)
 * GET /api/abonnements/:id
 */
router.get('/:id', ctrl.getById);

// ===================================================================
// ROUTES ADMIN PROTÉGÉES - Données complètes avec le champ `free`
// ===================================================================

/**
 * ✅ NOUVELLE ROUTE : Récupérer tous les abonnements avec données complètes
 * GET /api/abonnements/admin/all
 */
router.get('/admin/all', 
    authenticateToken, 
    ctrl.getAllComplete
);

/**
 * ✅ NOUVELLE ROUTE : Récupérer un abonnement par ID avec données complètes
 * GET /api/abonnements/admin/:id
 */
router.get('/admin/:id', 
    authenticateToken, 
    ctrl.getByIdComplete
);

/**
 * ✅ NOUVELLE ROUTE : Récupérer l'abonnement gratuit actuel
 * GET /api/abonnements/admin/free
 */
router.get('/admin/free', 
    authenticateToken, 
    ctrl.getFreeSubscription
);

/**
 * ✅ NOUVELLE ROUTE : Définir un abonnement comme gratuit
 * POST /api/abonnements/admin/set-free/:id
 */
router.post('/admin/set-free/:id', 
    authenticateToken, 
    ctrl.setAsFreeSubscription
);

/**
 * ✅ NOUVELLE ROUTE : Vérifier la validité d'un abonnement d'école
 * GET /api/abonnements/admin/check-validity/:ecoleId
 */
router.get('/admin/check-validity/:ecoleId', 
    authenticateToken, 
    ctrl.checkSubscriptionValidity
);

// ===================================================================
// ROUTES PROTÉGÉES EXISTANTES (avec authentification)
// ===================================================================

/**
 * Créer un nouvel abonnement
 * POST /api/abonnements
 */
router.post('/', 
    authenticateToken, 
    checkRequiredFields(['nom', 'prix', 'dureeEnJours']), 
    ctrl.create
);

/**
 * Mise à jour standard REST
 * PUT /api/abonnements/:id
 */
router.put('/:id', 
    authenticateToken, 
    ctrl.update
);

/**
 * Mise à jour avec POST (compatible avec votre appel actuel)
 * POST /api/abonnements/:id
 */
router.post('/:id', 
    authenticateToken, 
    ctrl.update
);

/**
 * Mise à jour avec /update dans l'URL
 * PUT /api/abonnements/:id/update
 */
router.put('/:id/update', 
    authenticateToken, 
    ctrl.update
);

/**
 * Mise à jour avec POST et /update
 * POST /api/abonnements/:id/update  
 */
router.post('/:id/update', 
    authenticateToken, 
    ctrl.update
);

/**
 * Mise à jour avec ID dans le body
 * POST /api/abonnements/update
 */
router.post('/update', 
    authenticateToken,
    checkRequiredFields(['id']),
    ctrl.updateFromBody
);

/**
 * Supprimer un abonnement - Version DELETE standard
 * DELETE /api/abonnements/:id
 */
router.delete('/:id', 
    authenticateToken, 
    ctrl.remove
);

/**
 * Supprimer un abonnement - Version POST
 * POST /api/abonnements/:id/delete
 */
router.post('/:id/delete', 
    authenticateToken, 
    ctrl.remove
);

// ============================================================================
// ROUTES SPÉCIALISÉES EXISTANTES
// ============================================================================

/**
 * Renouveler un abonnement
 * POST /api/abonnements/:id/renouveler
 */
router.post('/:id/renouveler', 
    authenticateToken, 
    checkRequiredFields(['abonnementId']), 
    ctrl.renouvelerAbonnement
);

/**
 * Récupérer les abonnements actifs
 * GET /api/abonnements/actifs
 */
router.get('/actifs', 
    authenticateToken, 
    ctrl.getAbonnementsActifs
);

module.exports = router;