// ==========================================
// 1. ROUTES FAQ CORRIGÉES
// ==========================================

// routes/api/faqRoutes.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/faqController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

// ===============================================
// ROUTES CRUD PRINCIPALES - FAQ
// ===============================================

/**
 * Créer une nouvelle FAQ
 * CHAMPS REQUIS : question, reponse
 * CHAMPS OPTIONNELS : ordre, type
 */
router.post('/', 
    authenticateToken, 
    checkRequiredFields(['question', 'reponse']), 
    ctrl.create
);

/**
 * Récupérer toutes les FAQ (avec tri par ordre)
 */
router.get('/', ctrl.getAll);

/**
 * Récupérer les FAQ publiques
 */
router.get('/public', ctrl.getPublic);

/**
 * Récupérer une FAQ par ID
 */
router.get('/:id', ctrl.getById);

/**
 * Mettre à jour une FAQ - VERSION CORRIGÉE POST
 */
router.post('/update/:id', 
    authenticateToken, 
    ctrl.update
);

/**
 * Alternative REST standard pour la mise à jour
 */
router.put('/:id', 
    authenticateToken, 
    ctrl.update
);

/**
 * Supprimer une FAQ - VERSION CORRIGÉE POST
 */
router.post('/delete/:id', 
    authenticateToken, 
    ctrl.remove
);

/**
 * Alternative REST standard pour la suppression
 */
router.delete('/:id', 
    authenticateToken, 
    ctrl.remove
);

// ===============================================
// ROUTES SPÉCIALISÉES - FAQ
// ===============================================

/**
 * Récupérer les FAQ par type
 */
router.get('/type/:type', ctrl.getByType);

/**
 * Rechercher dans les FAQ
 */
router.get('/search/:searchTerm', ctrl.search);

/**
 * Réorganiser l'ordre des FAQ
 */
router.post('/reorder', 
    authenticateToken,
    checkRequiredFields(['orders']),
    ctrl.reorder
);

module.exports = router;
