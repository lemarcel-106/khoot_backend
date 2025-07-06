const express = require('express');
const router = express.Router();
const apprenantController = require('../../controllers/apprenantController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');
const { checkSubscriptionLimits } = require('../../middleware/subscriptionLimitsMiddleware');


// Routes principales
router.post('/add-apprenant', 
    authenticate,
    requireEcoleAccess,
    apprenantController.addExistingApprenantToJeu
);

router.post('/apprenant/matricule', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getApprenantByMatricule
);

router.post('/apprenants', 
    authenticate,
    checkSubscriptionLimits('apprenants'), // ✅ AJOUT : Contrôle des limites
    checkRequiredFields(['nom', 'prenom', 'avatar']),
    apprenantController.createApprenant
);

// ✅ CORRIGÉ : Suppression d'authenticateToken
router.post('/apprenant/update/:id', 
    authenticate,       // ✅ Un seul middleware d'auth
    requireEcoleAccess,
    apprenantController.updateApprenant
);

// ✅ CORRIGÉ : Suppression d'authenticateToken
router.post('/apprenant/delete/:id', 
    authenticate,       // ✅ Un seul middleware d'auth
    requireEcoleAccess,
    apprenantController.deleteApprenantById
);

router.get('/apprenant/:id', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getApprenantById
);

router.get('/apprenant', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getApprenants
);

router.get('/apprenant/:id/sessions', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getSessionsApprenant
);

router.get('/apprenant/:id/statistiques', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getStatistiquesApprenant
);


// ===============================================
// NOUVELLES ROUTES POUR LES APPRENANTS INVITÉS
// ===============================================

/**
 * Créer un apprenant invité
 * POST /api/apprenants/invite
 * Champs requis: pseudonyme
 * Champs optionnels: nom, prenom, avatar, ecole
 */
router.post('/apprenants/invite', 
    authenticate,
    checkSubscriptionLimits('apprenants'), // Vérifier les limites d'abonnement
    checkRequiredFields(['pseudonyme']),
    apprenantController.createInvite
);

/**
 * Récupérer tous les apprenants invités
 * GET /api/apprenants/invites
 * Paramètres de requête optionnels: ?ecole=id
 */
router.get('/apprenants/invites', 
    authenticate,
    apprenantController.getInvites
);

/**
 * Convertir un invité en apprenant d'école
 * POST /api/apprenants/:id/convertir-ecole
 * Champs requis: ecole
 * Champs optionnels: phone, email
 */
router.post('/apprenants/:id/convertir-ecole', 
    authenticate,
    requireEcoleAccess,
    checkRequiredFields(['ecole']),
    apprenantController.convertirEnEcole
);

/**
 * Récupérer les apprenants par type
 * GET /api/apprenants/type/:type
 * Types valides: 'ecole' ou 'invite'
 */
router.get('/apprenants/type/:type', 
    authenticate,
    apprenantController.getByType
);

/**
 * Créer plusieurs apprenants invités en une fois
 * POST /api/apprenants/invite/bulk
 * Corps de requête: { "apprenants": [{ "pseudonyme": "..." }, ...] }
 */
router.post('/apprenants/invite/bulk', 
    authenticate,
    checkSubscriptionLimits('apprenants'),
    checkRequiredFields(['apprenants']),
    apprenantController.createInvitesBulk
);

/**
 * Rechercher des apprenants
 * GET /api/apprenants/search/:term
 * Paramètres de requête optionnels: ?type=ecole|invite
 */
router.get('/apprenants/search/:term', 
    authenticate,
    apprenantController.searchApprenants
);

// ===============================================
// ROUTES ALTERNATIVES POUR COMPATIBILITÉ
// ===============================================

/**
 * Alternative pour créer un invité (format court)
 * POST /api/invite
 */
router.post('/invite', 
    authenticate,
    checkRequiredFields(['pseudonyme']),
    apprenantController.createInvite
);

/**
 * Alternative pour lister les invités (format court)
 * GET /api/invites
 */
router.get('/invites', 
    authenticate,
    apprenantController.getInvites
);

/**
 * Convertir un invité (format court)
 * POST /api/invite/:id/to-student
 */
router.post('/invite/:id/to-student', 
    authenticate,
    requireEcoleAccess,
    checkRequiredFields(['ecole']),
    apprenantController.convertirEnEcole
);

// ===============================================
// ROUTES SPÉCIALISÉES POUR LA GESTION DES INVITÉS
// ===============================================

/**
 * Obtenir les statistiques des apprenants par type
 * GET /api/apprenants/stats/types
 */
router.get('/apprenants/stats/types', 
    authenticate,
    async (req, res) => {
        try {
            const apprenantService = require('../../services/apprenantService');
            
            // Données admin pour filtrage
            const adminData = req.user ? {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            } : null;

            // Récupérer tous les apprenants
            const allApprenants = await apprenantService.getAll(adminData);
            
            // Calculer les statistiques
            const stats = {
                total: allApprenants.length,
                ecole: allApprenants.filter(a => a.typeApprenant === 'ecole').length,
                invite: allApprenants.filter(a => a.typeApprenant === 'invite').length,
                actifs: allApprenants.filter(a => a.actif === true).length,
                inactifs: allApprenants.filter(a => a.actif === false).length
            };

            res.json({
                success: true,
                data: stats,
                message: 'Statistiques des apprenants récupérées avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur stats apprenants:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    }
);

/**
 * Nettoyer les invités inactifs (pour maintenance)
 * POST /api/apprenants/maintenance/cleanup-invites
 * Paramètres de requête: ?days=7 (supprime les invités inactifs depuis X jours)
 */
router.post('/apprenants/maintenance/cleanup-invites', 
    authenticate,
    async (req, res) => {
        try {
            // Vérifier que l'utilisateur est admin ou super_admin
            if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé : droits administrateur requis'
                });
            }

            const apprenantService = require('../../services/apprenantService');
            const days = parseInt(req.query.days) || 30;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // Récupérer les invités inactifs
            const inactiveInvites = await apprenantService.getAll(null, {
                typeApprenant: 'invite',
                actif: false,
                date: { $lt: cutoffDate }
            });

            let deletedCount = 0;
            for (const invite of inactiveInvites) {
                try {
                    await apprenantService.delete(invite._id);
                    deletedCount++;
                } catch (error) {
                    console.warn(`Impossible de supprimer l'invité ${invite._id}:`, error.message);
                }
            }

            res.json({
                success: true,
                message: `Nettoyage terminé : ${deletedCount} invités supprimés`,
                data: {
                    deleted: deletedCount,
                    found: inactiveInvites.length,
                    cutoffDate: cutoffDate,
                    daysOld: days
                }
            });
        } catch (error) {
            console.error('❌ Erreur cleanup invités:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du nettoyage des invités',
                error: error.message
            });
        }
    }
);


module.exports = router;