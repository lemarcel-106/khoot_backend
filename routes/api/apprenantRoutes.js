const express = require('express');
const router = express.Router();
const apprenantController = require('../../controllers/apprenantController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');
const { checkSubscriptionLimits } = require('../../middleware/subscriptionLimitsMiddleware');

// ===============================================
// ROUTES EXISTANTES
// ===============================================

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

/**
 * Obtenir un résumé détaillé d'un apprenant (invité ou école)
 * GET /api/apprenants/:id/resume
 */
router.get('/apprenants/:id/resume', 
    authenticate,
    requireEcoleAccess,
    async (req, res) => {
        try {
            const apprenantService = require('../../services/apprenantService');
            const { id } = req.params;

            // Récupérer l'apprenant avec toutes ses relations
            const apprenant = await apprenantService.getById(id);

            // Récupérer les statistiques de participation si disponibles
            const Participant = require('../../models/Participant');
            const participations = await Participant.find({ apprenant: id })
                .populate('planification', 'titre date')
                .sort({ date: -1 })
                .limit(5);

            const resume = {
                apprenant: apprenant,
                statistiques: {
                    nombreParticipations: participations.length,
                    scoreTotal: participations.reduce((sum, p) => sum + (p.score || 0), 0),
                    scoreMoyen: participations.length > 0 
                        ? Math.round(participations.reduce((sum, p) => sum + (p.score || 0), 0) / participations.length)
                        : 0
                },
                dernieresParticipations: participations.slice(0, 3)
            };

            res.json({
                success: true,
                data: resume,
                message: 'Résumé de l\'apprenant récupéré avec succès'
            });
        } catch (error) {
            console.error('❌ Erreur resume apprenant:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du résumé',
                error: error.message
            });
        }
    }
);

/**
 * Activer/Désactiver un apprenant
 * POST /api/apprenants/:id/toggle-status
 */
router.post('/apprenants/:id/toggle-status', 
    authenticate,
    requireEcoleAccess,
    async (req, res) => {
        try {
            const apprenantService = require('../../services/apprenantService');
            const { id } = req.params;

            const apprenant = await apprenantService.getById(id);
            const nouvelEtat = !apprenant.actif;

            const updatedApprenant = await apprenantService.update(id, { actif: nouvelEtat });

            res.json({
                success: true,
                message: `Apprenant ${nouvelEtat ? 'activé' : 'désactivé'} avec succès`,
                data: updatedApprenant
            });
        } catch (error) {
            console.error('❌ Erreur toggle status apprenant:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du changement de statut',
                error: error.message
            });
        }
    }
);

/**
 * Exporter la liste des apprenants (CSV)
 * GET /api/apprenants/export/csv
 */
router.get('/apprenants/export/csv', 
    authenticate,
    requireEcoleAccess,
    async (req, res) => {
        try {
            const apprenantService = require('../../services/apprenantService');
            
            // Données admin pour filtrage
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            const apprenants = await apprenantService.getAll(adminData);

            // Générer le CSV
            const csvHeader = 'Matricule,Nom,Prenom,Pseudonyme,Type,Email,Telephone,Ecole,Statut,Date Creation\n';
            const csvRows = apprenants.map(a => {
                return [
                    a.matricule || '',
                    a.nom || '',
                    a.prenom || '',
                    a.pseudonyme || '',
                    a.typeApprenant || '',
                    a.email || '',
                    a.phone || '',
                    a.ecole?.libelle || '',
                    a.actif ? 'Actif' : 'Inactif',
                    new Date(a.date).toLocaleDateString('fr-FR')
                ].map(field => `"${field}"`).join(',');
            }).join('\n');

            const csvContent = csvHeader + csvRows;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="apprenants_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send('\ufeff' + csvContent); // BOM pour Excel
        } catch (error) {
            console.error('❌ Erreur export CSV:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'export CSV',
                error: error.message
            });
        }
    }
);

/**
 * Dupliquer un apprenant invité (créer une copie)
 * POST /api/apprenants/:id/duplicate
 */
router.post('/apprenants/:id/duplicate', 
    authenticate,
    requireEcoleAccess,
    async (req, res) => {
        try {
            const apprenantService = require('../../services/apprenantService');
            const { id } = req.params;

            // Récupérer l'apprenant original
            const originalApprenant = await apprenantService.getById(id);
            
            if (originalApprenant.typeApprenant !== 'invite') {
                return res.status(400).json({
                    success: false,
                    message: 'Seuls les apprenants invités peuvent être dupliqués'
                });
            }

            // Créer une copie avec un nouveau pseudonyme
            const duplicateData = {
                nom: originalApprenant.nom,
                prenom: originalApprenant.prenom,
                pseudonyme: `${originalApprenant.pseudonyme}_copie_${Date.now()}`,
                avatar: originalApprenant.avatar,
                ecole: originalApprenant.ecole
            };

            const duplicate = await apprenantService.create(duplicateData, 'invite');

            res.status(201).json({
                success: true,
                message: 'Apprenant invité dupliqué avec succès',
                data: duplicate
            });
        } catch (error) {
            console.error('❌ Erreur duplicate apprenant:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la duplication',
                error: error.message
            });
        }
    }
);

/**
 * Obtenir les apprenants récemment créés
 * GET /api/apprenants/recent
 */
router.get('/apprenants/recent', 
    authenticate,
    requireEcoleAccess,
    async (req, res) => {
        try {
            const apprenantService = require('../../services/apprenantService');
            const limit = parseInt(req.query.limit) || 10;
            
            // Données admin pour filtrage
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            // Récupérer les apprenants récents
            const recentApprenants = await apprenantService.getAll(adminData);
            
            // Trier par date de création (plus récents en premier) et limiter
            const sortedRecent = recentApprenants
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, limit);

            res.json({
                success: true,
                data: sortedRecent,
                total: sortedRecent.length,
                message: `${sortedRecent.length} apprenants récents récupérés`
            });
        } catch (error) {
            console.error('❌ Erreur apprenants récents:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des apprenants récents',
                error: error.message
            });
        }
    }
);

module.exports = router;