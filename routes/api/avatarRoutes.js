const express = require('express');
const router = express.Router();
const avatarController = require('../../controllers/avatarController');
const { uploadAvatar } = require('../../middleware/upload');
const authenticateToken = require('../../middleware/authenticateToken');

// ===============================================
// ROUTES PUBLIQUES (SANS AUTHENTIFICATION)
// ===============================================

/**
 * Récupérer tous les avatars actifs
 * GET /api/avatars
 */
router.get('/avatars', avatarController.getAll);

/**
 * Récupérer un avatar par ID
 * GET /api/avatars/:id
 */
router.get('/avatars/:id', avatarController.getById);

/**
 * Obtenir un avatar aléatoire
 * GET /api/avatars/random
 * IMPORTANT: Cette route doit être AVANT /:id pour éviter les conflits
 */
router.get('/avatars/random', avatarController.getRandom);

// ===============================================
// ROUTES PROTÉGÉES (AUTHENTIFICATION REQUISE)
// ===============================================

/**
 * Créer un nouvel avatar
 * POST /api/avatars
 * Champs requis: titre
 * Fichier requis: image (PNG uniquement)
 */
router.post('/avatars', 
    authenticateToken,
    uploadAvatar.single('image'),
    avatarController.create
);

/**
 * Mettre à jour un avatar (méthode REST standard)
 * PUT /api/avatars/:id
 */
router.put('/avatars/:id', 
    authenticateToken,
    uploadAvatar.single('image'),
    avatarController.update
);

/**
 * Mettre à jour un avatar (méthode POST pour compatibilité)
 * POST /api/avatars/update/:id
 */
router.post('/avatars/update/:id', 
    authenticateToken,
    uploadAvatar.single('image'),
    avatarController.update
);

/**
 * Supprimer un avatar (méthode REST standard)
 * DELETE /api/avatars/:id
 */
router.delete('/avatars/:id', 
    authenticateToken,
    avatarController.delete
);

/**
 * Supprimer un avatar (méthode POST pour compatibilité)
 * POST /api/avatars/delete/:id
 */
router.post('/avatars/delete/:id', 
    authenticateToken,
    avatarController.delete
);

// ===============================================
// ROUTES ADMINISTRATIVES (STATISTIQUES)
// ===============================================

/**
 * Obtenir les statistiques d'utilisation des avatars
 * GET /api/avatars/admin/stats
 */
router.get('/avatars/admin/stats', 
    authenticateToken,
    avatarController.getStats
);

/**
 * Obtenir la liste des avatars non utilisés
 * GET /api/avatars/admin/unused
 */
router.get('/avatars/admin/unused', 
    authenticateToken,
    avatarController.getUnused
);

// ===============================================
// ROUTES DE COMPATIBILITÉ (ANCIEN FORMAT)
// ===============================================

/**
 * Créer un avatar (ancien format)
 * POST /api/avatar/create
 */
router.post('/avatar/create', 
    authenticateToken,
    uploadAvatar.single('image'), 
    avatarController.create
);

/**
 * Supprimer un avatar (ancien format)
 * DELETE /api/avatar/delete/:id
 */
router.delete('/avatar/delete/:id', 
    authenticateToken,
    avatarController.delete
);

/**
 * Récupérer tous les avatars (ancien format)
 * GET /api/avatars (déjà défini ci-dessus)
 */

module.exports = router;