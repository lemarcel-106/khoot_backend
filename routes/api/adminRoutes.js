// routes/api/adminRoutes.js - VERSION CORRIGÉE
const express = require('express');
const AdminController = require('../../controllers/adminController');
const router = express.Router();
const authenticateToken = require('../../middleware/authenticateToken');
const { checkSubscriptionLimits } = require('../../middleware/subscriptionLimitsMiddleware');

// Import des middlewares de validation conditionnelle
const {
    conditionalAdminValidation,
    conditionalAdminUpdateValidation,
    conditionalAdminDeleteValidation,
    roleBasedAccessControl,
    auditLogger
} = require('../../middleware/conditionalValidation');

// ===============================================
// ROUTES CRUD POUR LES ADMINS
// ===============================================

/**
 * Créer un nouvel admin/enseignant
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins : Peuvent créer uniquement des enseignants dans leur école
 * - Super_admins : Peuvent créer admin/enseignant, doivent spécifier l'école
 */
router.post('/admin', 
    authenticateToken,
    checkSubscriptionLimits('enseignants'), // ✅ AJOUT : Contrôle des limites
    auditLogger('CREATE_ADMIN'),
    conditionalAdminValidation,
    AdminController.createAdmin
);

/**
 * Mettre à jour un admin
 * RÈGLES :
 * - Enseignants : Peuvent modifier uniquement leur profil (sauf rôle/école)
 * - Admins : Peuvent modifier leur profil + enseignants de leur école
 * - Super_admins : Peuvent tout modifier
 */
router.post('/admin/update/:id', 
    authenticateToken,
    auditLogger('UPDATE_ADMIN'),
    conditionalAdminUpdateValidation, // Validation des permissions de mise à jour
    AdminController.updateAdmin
);

/**
 * Supprimer un admin
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins : Peuvent supprimer uniquement les enseignants de leur école
 * - Super_admins : Peuvent supprimer n'importe qui (sauf eux-mêmes)
 */
router.post('/admin/delete/:id', 
    authenticateToken,
    auditLogger('DELETE_ADMIN'),
    conditionalAdminDeleteValidation, // Validation des permissions de suppression
    AdminController.deleteAdminById
);

/**
 * ✅ CORRIGÉ : Commenter cette route car la méthode n'existe pas
 * Modifier le statut d'un admin (actif/désactivé)
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins : Peuvent modifier le statut des enseignants de leur école
 * - Super_admins : Peuvent modifier le statut de n'importe qui
 */
/*
router.post('/admin/:id/status', 
    authenticateToken,
    auditLogger('UPDATE_ADMIN_STATUS'),
    AdminController.updateAdminStatus // <-- Cette méthode n'existe pas
);
*/

/**
 * Rechercher un admin par matricule
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins : Uniquement dans leur école
 * - Super_admins : Partout
 */
router.post('/admin/matricule', 
    authenticateToken,
    roleBasedAccessControl(['admin', 'super_admin']), // Exclure les enseignants
    AdminController.getAdminByMatricule
);

/**
 * Récupérer un admin par ID
 * RÈGLES :
 * - Enseignants : Uniquement leur propre profil
 * - Admins : Leur profil + enseignants de leur école
 * - Super_admins : N'importe qui
 */
router.get('/admin/:id', 
    authenticateToken,
    AdminController.getAdminById
);

/**
 * Récupérer tous les admins
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins : Enseignants de leur école uniquement
 * - Super_admins : Tous les admins
 */
router.get('/admin', 
    authenticateToken,
    roleBasedAccessControl(['admin', 'super_admin']), // Exclure les enseignants
    AdminController.getAllAdmin
);

// ===============================================
// ROUTES POUR LES ENSEIGNANTS PAR ÉCOLE
// ===============================================

/**
 * Récupérer les enseignants de l'école de l'admin connecté AVEC statistiques
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins/Super_admins : Autorisés
 */
router.get('/mes-enseignants', 
    authenticateToken,
    roleBasedAccessControl(['admin', 'super_admin']), // Exclure les enseignants
    AdminController.getMesEnseignants
);

/**
 * Récupérer tous les jeux créés par un enseignant donné
 * RÈGLES :
 * - Enseignants : Uniquement leurs propres jeux
 * - Admins : Jeux des enseignants de leur école
 * - Super_admins : Tous les jeux
 */
router.get('/enseignants/:enseignantId/jeux', 
    authenticateToken,
    AdminController.getJeuxParEnseignant
);

/**
 * Récupérer toutes les planifications des jeux d'un enseignant donné
 * RÈGLES :
 * - Enseignants : Uniquement leurs propres planifications
 * - Admins : Planifications des enseignants de leur école
 * - Super_admins : Toutes les planifications
 */
router.get('/enseignants/:enseignantId/planifications', 
    authenticateToken,
    AdminController.getPlanificationsParEnseignant
);

/**
 * Récupérer les statistiques des enseignants d'une école
 * RÈGLES :
 * - Enseignants : INTERDIT
 * - Admins : Uniquement leur école
 * - Super_admins : N'importe quelle école
 */
router.get('/ecoles/:ecoleId/enseignants/stats', 
    authenticateToken,
    roleBasedAccessControl(['admin', 'super_admin']), // Exclure les enseignants
    AdminController.getStatsEnseignantsByEcole
);

// ===============================================
// ROUTES POUR LE PROFIL PERSONNEL
// ===============================================

/**
 * Récupérer le profil de l'admin connecté
 * RÈGLES : Tous les rôles peuvent consulter leur propre profil
 */
router.get('/profile', 
    authenticateToken,
    AdminController.getMyProfile
);

/**
 * Mettre à jour le profil de l'admin connecté
 * RÈGLES : Tous les rôles peuvent modifier leur profil (sauf rôle/école/matricule)
 */
router.post('/profile/update', 
    authenticateToken,
    auditLogger('UPDATE_PROFILE'), // Audit des modifications de profil
    AdminController.updateMyProfile
);

// ===============================================
// ROUTES DE GESTION AVANCÉE (SUPER_ADMIN SEULEMENT)
// ===============================================

/**
 * Statistiques globales du système
 * RÈGLES : Super_admins uniquement
 */
router.get('/system/stats', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    async (req, res) => {
        try {
            // Cette route pourrait être implémentée plus tard
            res.status(200).json({
                success: true,
                message: 'Fonctionnalité en développement',
                data: {
                    totalEcoles: 0,
                    totalAdmins: 0,
                    totalEnseignants: 0,
                    totalApprenants: 0
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * Logs d'audit (Super_admins uniquement)
 */
router.get('/audit/logs', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    async (req, res) => {
        try {
            // Cette route pourrait être implémentée plus tard pour consulter les logs
            res.status(200).json({
                success: true,
                message: 'Fonctionnalité de logs en développement',
                data: []
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ===============================================
// ROUTES D'AIDE ET DOCUMENTATION
// ===============================================

/**
 * Obtenir les permissions de l'utilisateur connecté
 */
router.get('/permissions', 
    authenticateToken,
    async (req, res) => {
        try {
            const user = req.user;
            let permissions = [];

            // Définir les permissions selon le rôle
            switch (user.role) {
                case 'enseignant':
                    permissions = [
                        'view_own_profile',
                        'update_own_profile',
                        'view_own_games',
                        'create_games',
                        'view_own_planifications'
                    ];
                    break;

                case 'admin':
                    permissions = [
                        'view_own_profile',
                        'update_own_profile',
                        'view_school_teachers',
                        'create_teachers',
                        'update_school_teachers',
                        'delete_school_teachers',
                        'view_school_stats'
                    ];
                    break;

                case 'super_admin':
                    permissions = [
                        'view_all_profiles',
                        'update_all_profiles',
                        'create_admins',
                        'create_teachers',
                        'delete_users',
                        'view_system_stats',
                        'view_audit_logs'
                    ];
                    break;
            }

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        ecole: user.ecole
                    },
                    permissions: permissions
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);


module.exports = router;