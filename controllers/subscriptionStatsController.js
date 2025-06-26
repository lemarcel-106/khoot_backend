// ==========================================
// CONTRÔLEUR - controllers/subscriptionStatsController.js
// ==========================================

const subscriptionStatsService = require('../services/subscriptionStatsService');

const subscriptionStatsController = {

  /**
   * ✅ ROUTE PRINCIPALE : Statistiques détaillées utilisation vs limites
   */
  async getEcolesUtilisationAbonnements(req, res) {
    try {
      console.log('📊 [CONTROLLER] Récupération des statistiques d\'utilisation...');
      
      const stats = await subscriptionStatsService.getEcolesUtilisationAbonnements();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Statistiques d\'utilisation des abonnements récupérées avec succès',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getEcolesUtilisationAbonnements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques d\'utilisation',
        error: error.message
      });
    }
  },

  /**
   * ✅ ÉCOLES EN RISQUE
   */
  async getEcolesEnRisque(req, res) {
    try {
      console.log('⚠️ [CONTROLLER] Récupération des écoles en risque...');
      
      const { seuil = 80 } = req.query;
      
      // Validation du seuil
      const seuilNum = parseInt(seuil);
      if (isNaN(seuilNum) || seuilNum < 0 || seuilNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Le seuil doit être un nombre entre 0 et 100'
        });
      }
      
      const stats = await subscriptionStatsService.getEcolesEnRisque(seuilNum);
      
      res.status(200).json({
        success: true,
        data: stats,
        seuil: `${seuilNum}%`,
        message: `Écoles utilisant plus de ${seuilNum}% de leurs limites`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getEcolesEnRisque:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des écoles en risque',
        error: error.message
      });
    }
  },

  /**
   * ✅ RÉSUMÉ GLOBAL
   */
  async getResumeUtilisationGlobale(req, res) {
    try {
      console.log('🌍 [CONTROLLER] Récupération du résumé global...');
      
      const stats = await subscriptionStatsService.getResumeUtilisationGlobale();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Résumé global d\'utilisation récupéré avec succès',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getResumeUtilisationGlobale:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du résumé global',
        error: error.message
      });
    }
  },

  /**
   * ✅ ÉCOLE SPÉCIFIQUE
   */
  async getEcoleUtilisationStats(req, res) {
    try {
      const { ecoleId } = req.params;
      const currentUser = req.user;

      console.log(`🏫 [CONTROLLER] Stats pour école ${ecoleId}...`);

      // Validation de l'ID
      if (!ecoleId || ecoleId.length !== 24) {
        return res.status(400).json({
          success: false,
          message: 'ID d\'école invalide'
        });
      }

      // Vérification des permissions
      if (currentUser.role !== 'super_admin') {
        if (!currentUser.ecole || currentUser.ecole.toString() !== ecoleId) {
          return res.status(403).json({
            success: false,
            message: 'Accès refusé : vous ne pouvez consulter que votre propre école'
          });
        }
      }

      const stats = await subscriptionStatsService.getEcoleUtilisationStats(ecoleId);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'École non trouvée'
        });
      }

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Statistiques de l\'école récupérées avec succès'
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getEcoleUtilisationStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques de l\'école',
        error: error.message
      });
    }
  },

  /**
   * 📊 EXPORT CSV
   */
  async exportStatsCSV(req, res) {
    try {
      console.log('📄 [CONTROLLER] Export CSV demandé...');
      
      const csvData = await subscriptionStatsService.exportStatsCSV();
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="stats-abonnements-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur exportStatsCSV:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export CSV',
        error: error.message
      });
    }
  },

  /**
   * 📈 TENDANCES
   */
  async getTendancesUtilisation(req, res) {
    try {
      const { periode = '3m' } = req.query;
      
      console.log(`📈 [CONTROLLER] Tendances pour période: ${periode}`);
      
      // Validation de la période
      const periodesValides = ['1m', '3m', '6m', '1y'];
      if (!periodesValides.includes(periode)) {
        return res.status(400).json({
          success: false,
          message: `Période invalide. Valeurs acceptées: ${periodesValides.join(', ')}`
        });
      }
      
      const tendances = await subscriptionStatsService.getTendancesUtilisation(periode);
      
      res.status(200).json({
        success: true,
        data: tendances,
        periode: periode,
        message: `Tendances d'utilisation récupérées (${periode})`
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getTendancesUtilisation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des tendances',
        error: error.message
      });
    }
  },

  /**
   * 🔍 RECHERCHE
   */
  async rechercherEcoles(req, res) {
    try {
      console.log('🔍 [CONTROLLER] Recherche d\'écoles...');
      
      const filtres = req.query;
      
      // Validation des filtres
      const filtresValides = ['statut', 'ville', 'abonnement', 'seuil_min', 'seuil_max'];
      const filtresInvalides = Object.keys(filtres).filter(f => !filtresValides.includes(f));
      
      if (filtresInvalides.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Filtres invalides: ${filtresInvalides.join(', ')}. Valeurs acceptées: ${filtresValides.join(', ')}`
        });
      }
      
      const resultats = await subscriptionStatsService.rechercherEcoles(filtres);
      
      res.status(200).json({
        success: true,
        data: resultats,
        filtres: filtres,
        message: `${resultats.ecoles.length} école(s) trouvée(s)`
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur rechercherEcoles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
        error: error.message
      });
    }
  },

  /**
   * ⚡ STATS RAPIDES
   */
  async getQuickStats(req, res) {
    try {
      console.log('⚡ [CONTROLLER] Récupération stats rapides...');
      
      const quickStats = await subscriptionStatsService.getQuickStats();
      
      res.status(200).json({
        success: true,
        data: quickStats,
        message: 'Statistiques rapides récupérées',
        executionTime: quickStats.executionTime
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getQuickStats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des stats rapides',
        error: error.message
      });
    }
  },

  /**
   * 📅 PLANNING UPGRADES
   */
  async getPlanningUpgrades(req, res) {
    try {
      console.log('📅 [CONTROLLER] Planning des upgrades...');
      
      const planning = await subscriptionStatsService.getPlanningUpgrades();
      
      res.status(200).json({
        success: true,
        data: planning,
        message: 'Planning des upgrades généré avec succès'
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getPlanningUpgrades:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du planning',
        error: error.message
      });
    }
  },

  /**
   * 🏆 COMPARAISON D'ÉCOLES
   */
  async comparerEcoles(req, res) {
    try {
      console.log('🏆 [CONTROLLER] Comparaison d\'écoles...');
      
      const { ecoleIds } = req.body;
      
      // Validation
      if (!ecoleIds || !Array.isArray(ecoleIds) || ecoleIds.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Veuillez fournir au moins 2 IDs d\'école dans un tableau'
        });
      }
      
      if (ecoleIds.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 écoles peuvent être comparées à la fois'
        });
      }
      
      // Valider chaque ID
      const idsInvalides = ecoleIds.filter(id => !id || id.length !== 24);
      if (idsInvalides.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs d\'école invalides détectés'
        });
      }
      
      const comparaison = await subscriptionStatsService.comparerEcoles(ecoleIds);
      
      res.status(200).json({
        success: true,
        data: comparaison,
        message: `Comparaison de ${ecoleIds.length} écoles effectuée`
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur comparerEcoles:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la comparaison',
        error: error.message
      });
    }
  },

  /**
   * 📊 DONNÉES DASHBOARD
   */
  async getDashboardData(req, res) {
    try {
      console.log('📊 [CONTROLLER] Récupération données dashboard...');
      
      const { compact = false } = req.query;
      
      const dashboardData = await subscriptionStatsService.getDashboardData(compact === 'true');
      
      res.status(200).json({
        success: true,
        data: dashboardData,
        message: 'Données dashboard récupérées avec succès',
        compact: compact === 'true'
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Erreur getDashboardData:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données dashboard',
        error: error.message
      });
    }
  }

};

module.exports = subscriptionStatsController;