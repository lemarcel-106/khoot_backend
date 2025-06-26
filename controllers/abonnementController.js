// controllers/abonnementController.js - AJOUT DES MÉTHODES ADMIN
const abonnementService = require('../services/abonnementService');

const abonnementController = {

  // ============================================================================
  // MÉTHODES PUBLIQUES (sans authentification) - Données filtrées
  // ============================================================================

  async getAll(req, res) {
    try {
      console.log('🔍 Récupération de tous les abonnements (version publique)...');
      
      const abonnements = await abonnementService.getAll();
// Exclure les abonnements gratuits (free === true) avant de mapper
      const publicAbonnements = abonnements
        .filter(abonnement => !abonnement.free) // ❌ exclut ceux avec free = true
        .map(abonnement => ({
          _id: abonnement._id,
          nom: abonnement.nom,
          description: abonnement.description,
          prix: abonnement.prix,
          dureeEnJours: abonnement.dureeEnJours,
          nombreJeuxMax: abonnement.nombreJeuxMax,
          nombreApprenantsMax: abonnement.nombreApprenantsMax,
          nombreEnseignantsMax: abonnement.nombreEnseignantsMax,
          dateCreation: abonnement.dateCreation,
          actif: abonnement.actif
          // ✅ PAS de champ 'free'
        }));

      console.log(`✅ ${publicAbonnements.length} abonnements récupérés (version publique)`);

      res.status(200).json({ 
        success: true, 
        data: publicAbonnements,
        total: publicAbonnements.length,
        message: 'Liste des abonnements récupérée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getAll:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des abonnements',
        error: error.message
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 Récupération de l\'abonnement ID (version publique):', id);
      
      const abonnement = await abonnementService.getById(id);
      
      if (!abonnement) {
        return res.status(404).json({ 
          success: false, 
          message: 'Abonnement non trouvé' 
        });
      }

      // Filtrer les informations sensibles (SANS le champ free)
      const publicAbonnement = {
        _id: abonnement._id,
        nom: abonnement.nom,
        description: abonnement.description,
        prix: abonnement.prix,
        dureeEnJours: abonnement.dureeEnJours,
        nombreJeuxMax: abonnement.nombreJeuxMax,
        nombreApprenantsMax: abonnement.nombreApprenantsMax,
        nombreEnseignantsMax: abonnement.nombreEnseignantsMax,
        actif: abonnement.actif
        // ❌ PAS de champ 'free' dans la version publique
      };

      console.log('✅ Abonnement récupéré (version publique):', publicAbonnement.nom);

      res.json({ 
        success: true, 
        data: publicAbonnement,
        message: 'Abonnement récupéré avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getById:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de l\'abonnement',
        error: error.message
      });
    }
  },

  // ============================================================================
  // ✅ NOUVELLES MÉTHODES ADMIN - Données complètes avec le champ `free`
  // ============================================================================

  /**
   * ✅ NOUVELLE : Récupérer tous les abonnements avec données complètes
   * Route: GET /api/abonnements/admin/all
   */
  async getAllComplete(req, res) {
    try {
      console.log('🔍 Récupération de tous les abonnements (version admin complète)...');
      
      const abonnements = await abonnementService.getAll();
      
      // Retourner TOUTES les données, y compris le champ 'free'
      const completeAbonnements = abonnements.map(abonnement => ({
        _id: abonnement._id,
        nom: abonnement.nom,
        description: abonnement.description,
        prix: abonnement.prix,
        dureeEnJours: abonnement.dureeEnJours,
        nombreJeuxMax: abonnement.nombreJeuxMax,
        nombreApprenantsMax: abonnement.nombreApprenantsMax,
        nombreEnseignantsMax: abonnement.nombreEnseignantsMax,
        accesStatistiques: abonnement.accesStatistiques,
        dateCreation: abonnement.dateCreation,
        dateDebut: abonnement.dateDebut,
        dateFin: abonnement.dateFin,
        actif: abonnement.actif,
        free: abonnement.free || false  // ✅ CHAMP 'free' inclus
      }));

      console.log(`✅ ${completeAbonnements.length} abonnements récupérés (version admin complète)`);

      res.status(200).json({ 
        success: true, 
        data: completeAbonnements,
        total: completeAbonnements.length,
        message: 'Liste complète des abonnements récupérée avec succès',
        type: 'admin_complete'
      });
    } catch (error) {
      console.error('❌ Erreur getAllComplete:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération complète des abonnements',
        error: error.message
      });
    }
  },

  /**
   * ✅ NOUVELLE : Récupérer un abonnement par ID avec données complètes
   * Route: GET /api/abonnements/admin/:id
   */
  async getByIdComplete(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 Récupération de l\'abonnement ID (version admin complète):', id);
      
      const abonnement = await abonnementService.getById(id);
      
      if (!abonnement) {
        return res.status(404).json({ 
          success: false, 
          message: 'Abonnement non trouvé' 
        });
      }

      // Retourner TOUTES les données, y compris le champ 'free'
      const completeAbonnement = {
        _id: abonnement._id,
        nom: abonnement.nom,
        description: abonnement.description,
        prix: abonnement.prix,
        dureeEnJours: abonnement.dureeEnJours,
        nombreJeuxMax: abonnement.nombreJeuxMax,
        nombreApprenantsMax: abonnement.nombreApprenantsMax,
        nombreEnseignantsMax: abonnement.nombreEnseignantsMax,
        accesStatistiques: abonnement.accesStatistiques,
        dateCreation: abonnement.dateCreation,
        dateDebut: abonnement.dateDebut,
        dateFin: abonnement.dateFin,
        actif: abonnement.actif,
        free: abonnement.free || false  // ✅ CHAMP 'free' inclus
      };

      console.log('✅ Abonnement récupéré (version admin complète):', completeAbonnement.nom, 'free:', completeAbonnement.free);

      res.json({ 
        success: true, 
        data: completeAbonnement,
        message: 'Abonnement complet récupéré avec succès',
        type: 'admin_complete'
      });
    } catch (error) {
      console.error('❌ Erreur getByIdComplete:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération complète de l\'abonnement',
        error: error.message
      });
    }
  },

  /**
   * ✅ NOUVELLE : Récupérer l'abonnement gratuit actuel
   * Route: GET /api/abonnements/admin/free
   */
  async getFreeSubscription(req, res) {
    try {
      console.log('🔍 Récupération de l\'abonnement gratuit...');
      
      const freeAbonnement = await abonnementService.getFreeSubscription();
      
      if (!freeAbonnement) {
        return res.status(404).json({ 
          success: false, 
          message: 'Aucun abonnement gratuit trouvé' 
        });
      }

      console.log('✅ Abonnement gratuit trouvé:', freeAbonnement.nom);

      res.json({ 
        success: true, 
        data: freeAbonnement,
        message: 'Abonnement gratuit récupéré avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getFreeSubscription:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de l\'abonnement gratuit',
        error: error.message
      });
    }
  },

  /**
   * ✅ NOUVELLE : Définir un abonnement comme gratuit
   * Route: POST /api/abonnements/admin/set-free/:id
   */
  async setAsFreeSubscription(req, res) {
    try {
      const { id } = req.params;
      console.log('🔄 Définition de l\'abonnement', id, 'comme gratuit...');
      
      const freeAbonnement = await abonnementService.setAsFreeSubscription(id);
      
      console.log('✅ Abonnement défini comme gratuit:', freeAbonnement.nom);

      res.json({ 
        success: true, 
        data: freeAbonnement,
        message: `Abonnement "${freeAbonnement.nom}" défini comme gratuit avec succès`
      });
    } catch (error) {
      console.error('❌ Erreur setAsFreeSubscription:', error);
      
      if (error.message.includes('non trouvé')) {
        return res.status(404).json({
          success: false,
          message: 'Abonnement non trouvé'
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la définition de l\'abonnement gratuit',
        error: error.message
      });
    }
  },

  /**
   * ✅ NOUVELLE : Vérifier la validité d'un abonnement d'école
   * Route: GET /api/abonnements/admin/check-validity/:ecoleId
   */
  async checkSubscriptionValidity(req, res) {
    try {
      const { ecoleId } = req.params;
      console.log('🔍 Vérification de la validité de l\'abonnement pour l\'école:', ecoleId);
      
      const validityCheck = await abonnementService.checkSubscriptionValidity(ecoleId);
      
      console.log('✅ Vérification terminée:', validityCheck.valide ? 'VALIDE' : 'INVALIDE');

      res.json({ 
        success: true, 
        data: validityCheck,
        message: 'Vérification de validité effectuée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur checkSubscriptionValidity:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la vérification de validité',
        error: error.message
      });
    }
  },

  // ============================================================================
  // MÉTHODES PROTÉGÉES EXISTANTES (avec authentification)
  // ============================================================================

  async create(req, res) {
    try {
      console.log('➕ Création d\'un nouvel abonnement...');
      console.log('📝 Données reçues:', req.body);
      
      const abonnement = await abonnementService.create(req.body);
      
      console.log('✅ Abonnement créé avec succès:', abonnement.nom);
      
      res.status(201).json({ 
        success: true, 
        data: abonnement,
        message: 'Abonnement créé avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur create:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la création de l\'abonnement',
        error: error.message
      });
    }
  },

  async update(req, res) {
    try {
      const abonnementId = req.params.id;
      const abonnementData = req.body;

      if (!abonnementId) {
        return res.status(400).json({
          success: false,
          message: 'ID de l\'abonnement requis dans l\'URL'
        });
      }

      console.log('🔄 Mise à jour de l\'abonnement avec ID:', abonnementId);
      console.log('📝 Données reçues:', abonnementData);

      if (abonnementData.prix && (abonnementData.prix < 0 || isNaN(abonnementData.prix))) {
        return res.status(400).json({
          success: false,
          message: 'Le prix doit être un nombre positif'
        });
      }

      if (abonnementData.dureeEnJours && (abonnementData.dureeEnJours < 1 || isNaN(abonnementData.dureeEnJours))) {
        return res.status(400).json({
          success: false,
          message: 'La durée doit être un nombre positif'
        });
      }

      const updatedAbonnement = await abonnementService.update(abonnementId, abonnementData);
      
      console.log('✅ Abonnement mis à jour avec succès:', updatedAbonnement.nom);
      
      res.status(200).json({
        success: true,
        message: 'Abonnement mis à jour avec succès',
        data: updatedAbonnement
      });
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour de l\'abonnement:', err);
      
      if (err.message.includes('non trouvé') || err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Abonnement non trouvé',
          error: err.message
        });
      }
      
      if (err.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          error: err.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'abonnement',
        error: err.message
      });
    }
  },

  async updateFromBody(req, res) {
    try {
      const { id, ...abonnementData } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de l\'abonnement requis dans le body de la requête'
        });
      }

      console.log('🔄 Mise à jour de l\'abonnement avec ID (from body):', id);

      const updatedAbonnement = await abonnementService.update(id, abonnementData);
      
      res.status(200).json({
        success: true,
        message: 'Abonnement mis à jour avec succès',
        data: updatedAbonnement
      });
    } catch (err) {
      console.error('❌ Erreur updateFromBody:', err);
      
      if (err.message.includes('non trouvé')) {
        return res.status(404).json({
          success: false,
          message: 'Abonnement non trouvé'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'abonnement',
        error: err.message
      });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      console.log('🗑️ Suppression de l\'abonnement ID:', id);
      
      await abonnementService.remove(id);
      
      console.log('✅ Abonnement supprimé avec succès');
      
      res.status(200).json({
        success: true,
        message: 'Abonnement supprimé avec succès'
      });
    } catch (err) {
      console.error('❌ Erreur lors de la suppression de l\'abonnement:', err);
      
      if (err.message.includes('non trouvé') || err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Abonnement non trouvé',
          error: err.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'abonnement',
        error: err.message
      });
    }
  },

  async renouvelerAbonnement(req, res) {
    try {
      const ecoleId = req.params.id;
      const { abonnementId, dureeEnJours } = req.body;

      console.log('🔄 Renouvellement d\'abonnement pour l\'école:', ecoleId);

      const result = await abonnementService.renouvelerAbonnement(ecoleId, abonnementId, dureeEnJours);
      
      console.log('✅ Abonnement renouvelé avec succès');
      
      return res.status(200).json(result);
    } catch (err) {
      console.error('❌ Erreur lors du renouvellement:', err);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du renouvellement de l\'abonnement',
        error: err.message
      });
    }
  },

  async getAbonnementsActifs(req, res) {
    try {
      const abonnements = await abonnementService.getAbonnementsActifs();
      res.status(200).json({
        success: true,
        message: 'Abonnements actifs récupérés avec succès',
        data: abonnements,
        total: abonnements.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des abonnements actifs',
        error: error.message
      });
    }
  }

};

module.exports = abonnementController;