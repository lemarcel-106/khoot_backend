// ==========================================
// ROUTES - routes/api/subscriptionStatsRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const subscriptionStatsController = require('../../controllers/subscriptionStatsController');
const authenticateToken = require('../../middleware/authenticateToken');
const { roleBasedAccessControl } = require('../../middleware/conditionalValidation');

// ===============================================
// ROUTES PRINCIPALES - UTILISATION vs LIMITES
// ===============================================

/**
 * ✅ ROUTE PRINCIPALE : Statistiques détaillées avec utilisation vs limites
 * GET /api/subscription-stats/utilisation-ecoles
 * ACCÈS : Super_admin uniquement
 * 
 * Retourne pour chaque école :
 * - Enseignants: 3/5 (60%) | Apprenants: 120/150 (80%) | Jeux: 8/10 (80%)
 * - Statut général (Bon, Attention, Critique, etc.)
 * - Recommandations automatiques
 */
router.get('/utilisation-ecoles', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getEcolesUtilisationAbonnements
);

/**
 * ✅ ÉCOLES EN RISQUE : Celles qui approchent de leurs limites
 * GET /api/subscription-stats/ecoles-en-risque?seuil=80
 * ACCÈS : Super_admin uniquement
 * 
 * Paramètres optionnels :
 * - seuil : Pourcentage d'utilisation limite (défaut: 80%)
 * 
 * Retourne les écoles dépassant le seuil avec recommandations
 */
router.get('/ecoles-en-risque', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getEcolesEnRisque
);

/**
 * ✅ RÉSUMÉ GLOBAL : Vue d'ensemble managériale
 * GET /api/subscription-stats/resume-global
 * ACCÈS : Super_admin uniquement
 * 
 * Retourne :
 * - Moyennes d'utilisation par type de ressource
 * - Répartition des écoles par statut
 * - Alertes et métriques clés
 */
router.get('/resume-global', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getResumeUtilisationGlobale
);

/**
 * ✅ ÉCOLE SPÉCIFIQUE : Détails d'une école
 * GET /api/subscription-stats/ecole/:ecoleId
 * ACCÈS : Admin de l'école ou Super_admin
 * 
 * Retourne l'utilisation détaillée d'une école spécifique
 */
router.get('/ecole/:ecoleId', 
    authenticateToken,
    subscriptionStatsController.getEcoleUtilisationStats
);

// ===============================================
// ROUTES COMPLÉMENTAIRES (OPTIONNELLES)
// ===============================================

/**
 * 📊 EXPORT CSV : Exporter les statistiques en CSV
 * GET /api/subscription-stats/export-csv
 * ACCÈS : Super_admin uniquement
 */
router.get('/export-csv', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.exportStatsCSV
);

/**
 * 📈 TENDANCES : Évolution de l'utilisation dans le temps
 * GET /api/subscription-stats/tendances?periode=3m
 * ACCÈS : Super_admin uniquement
 * 
 * Paramètres :
 * - periode : 1m, 3m, 6m, 1y (défaut: 3m)
 */
router.get('/tendances', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getTendancesUtilisation
);

/**
 * 🔍 RECHERCHE : Filtrer les écoles par critères
 * GET /api/subscription-stats/recherche?statut=Critique&ville=Brazzaville
 * ACCÈS : Super_admin uniquement
 * 
 * Paramètres optionnels :
 * - statut : Bon, Modéré, Attention, Critique, Limite atteinte
 * - ville : Nom de la ville
 * - abonnement : Nom de l'abonnement
 * - seuil_min, seuil_max : Plage de pourcentage d'utilisation
 */
router.get('/recherche', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.rechercherEcoles
);

/**
 * ⚡ STATS RAPIDES : Métriques clés en temps réel
 * GET /api/subscription-stats/quick-stats
 * ACCÈS : Super_admin uniquement
 * 
 * Retourne rapidement les KPIs essentiels
 */
router.get('/quick-stats', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getQuickStats
);

/**
 * 📅 PLANNING UPGRADES : Écoles nécessitant un upgrade
 * GET /api/subscription-stats/planning-upgrades
 * ACCÈS : Super_admin uniquement
 * 
 * Retourne la liste des écoles à contacter pour upgrade
 */
router.get('/planning-upgrades', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getPlanningUpgrades
);

/**
 * 🏆 COMPARAISON : Comparer plusieurs écoles
 * POST /api/subscription-stats/comparer
 * ACCÈS : Super_admin uniquement
 * 
 * Body: { "ecoleIds": ["id1", "id2", "id3"] }
 */
router.post('/comparer', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.comparerEcoles
);

/**
 * 📊 DASHBOARD : Données pour tableau de bord
 * GET /api/subscription-stats/dashboard
 * ACCÈS : Super_admin uniquement
 * 
 * Retourne toutes les données nécessaires pour un dashboard
 */
router.get('/dashboard', 
    authenticateToken,
    roleBasedAccessControl(['super_admin']),
    subscriptionStatsController.getDashboardData
);

// ===============================================
// ROUTES D'AIDE ET DEBUG
// ===============================================

/**
 * 📖 DOCUMENTATION : Format des réponses
 * GET /api/subscription-stats/help
 * ACCÈS : Public (authentifié)
 */
router.get('/help', 
    authenticateToken,
    (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Documentation des routes statistiques d\'abonnements',
            routes: {
                principales: {
                    'GET /utilisation-ecoles': 'Vue complète utilisation vs limites',
                    'GET /ecoles-en-risque': 'Écoles dépassant un seuil d\'utilisation',
                    'GET /resume-global': 'Résumé exécutif avec moyennes et alertes',
                    'GET /ecole/:id': 'Détails d\'une école spécifique'
                },
                complementaires: {
                    'GET /export-csv': 'Export des données en CSV',
                    'GET /tendances': 'Évolution temporelle',
                    'GET /recherche': 'Filtrage avancé',
                    'GET /quick-stats': 'KPIs essentiels',
                    'GET /planning-upgrades': 'Écoles à upgrader'
                }
            },
            parametres: {
                seuil: 'Pourcentage limite (0-100, défaut: 80)',
                periode: '1m, 3m, 6m, 1y pour les tendances',
                filtres: 'statut, ville, abonnement, seuil_min, seuil_max'
            },
            exemples: {
                principal: 'GET /api/subscription-stats/utilisation-ecoles',
                risque: 'GET /api/subscription-stats/ecoles-en-risque?seuil=90',
                recherche: 'GET /api/subscription-stats/recherche?statut=Critique&ville=Brazzaville'
            }
        });
    }
);

/**
 * 🔧 HEALTH CHECK : Vérifier le fonctionnement
 * GET /api/subscription-stats/health
 * ACCÈS : Public (authentifié)
 */
router.get('/health', 
    authenticateToken,
    async (req, res) => {
        try {
            // Test rapide de connexion aux modèles
            const [ecolesCount, abonnementsCount] = await Promise.all([
                require('../../models/Ecole').countDocuments(),
                require('../../models/Abonnement').countDocuments()
            ]);

            res.status(200).json({
                success: true,
                message: 'Service de statistiques opérationnel',
                status: 'healthy',
                data: {
                    ecolesEnBase: ecolesCount,
                    abonnementsEnBase: abonnementsCount,
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Problème de connexion à la base de données',
                status: 'unhealthy',
                error: error.message
            });
        }
    }
);

module.exports = router;