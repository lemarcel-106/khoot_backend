// services/abonnementService.js - VERSION AMÉLIORÉE avec règles métier
const Abonnement = require('../models/Abonnement');
const Ecole = require('../models/Ecole');

const abonnementService = {

  // ============================================================================
  // MÉTHODES CRUD DE BASE (AMÉLIORÉES)
  // ============================================================================

  async create(data) {
    try {
      // Si aucun abonnement gratuit n'existe et qu'aucun flag n'est spécifié
      const existingFree = await Abonnement.findOne({ free: true });
      if (!existingFree && data.free === undefined) {
        data.free = true; // Premier abonnement créé = gratuit par défaut
      }
      
      return await Abonnement.create(data);
    } catch (error) {
      throw new Error('Erreur lors de la création de l\'abonnement : ' + error.message);
    }
  },

  async update(id, data) {
    try {
      const updatedAbonnement = await Abonnement.findByIdAndUpdate(
        id, 
        { $set: data }, 
        { new: true, runValidators: true }
      );
      
      if (!updatedAbonnement) {
        throw new Error('Abonnement non trouvé');
      }
      
      return updatedAbonnement;
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de l\'abonnement : ' + error.message);
    }
  },

  async remove(id) {
    try {
      const abonnementToDelete = await Abonnement.findById(id);
      
      if (!abonnementToDelete) {
        throw new Error('Abonnement non trouvé');
      }
      
      // Vérification : ne pas supprimer le seul abonnement gratuit
      if (abonnementToDelete.free === true) {
        const otherFreeAbonnements = await Abonnement.countDocuments({
          _id: { $ne: id },
          free: true
        });
        
        if (otherFreeAbonnements === 0) {
          throw new Error('Impossible de supprimer le seul abonnement gratuit du système');
        }
      }
      
      const deletedAbonnement = await Abonnement.findByIdAndDelete(id);
      return deletedAbonnement;
    } catch (error) {
      throw new Error('Erreur lors de la suppression de l\'abonnement : ' + error.message);
    }
  },

  // ============================================================================
  // MÉTHODES SPÉCIALISÉES POUR LES ABONNEMENTS GRATUITS
  // ============================================================================

  /**
   * Récupérer l'abonnement gratuit actuel
   */
  async getFreeSubscription() {
    try {
      return await Abonnement.findOne({ free: true, actif: true });
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'abonnement gratuit : ' + error.message);
    }
  },

  /**
   * Définir un abonnement comme gratuit
   */
  async setAsFreeSubscription(abonnementId) {
    try {
      // Retirer le flag free de tous les abonnements
      await Abonnement.updateMany({}, { $set: { free: false } });
      
      // Définir le nouvel abonnement gratuit
      const newFreeAbonnement = await Abonnement.findByIdAndUpdate(
        abonnementId, 
        { $set: { free: true } },
        { new: true }
      );
      
      if (!newFreeAbonnement) {
        throw new Error('Abonnement non trouvé');
      }
      
      return newFreeAbonnement;
    } catch (error) {
      throw new Error('Erreur lors de la définition de l\'abonnement gratuit : ' + error.message);
    }
  },

  /**
   * S'assurer qu'il y a toujours un abonnement gratuit
   */
  async ensureFreeSubscriptionExists() {
    try {
      const existingFree = await Abonnement.findOne({ free: true });
      
      if (!existingFree) {
        // Créer un abonnement gratuit de base
        const defaultFreeAbonnement = await Abonnement.create({
          nom: 'Gratuit',
          description: 'Abonnement gratuit par défaut',
          prix: 0,
          dureeEnJours: 365, // 1 an
          nombreJeuxMax: 3,
          nombreApprenantsMax: 30,
          nombreEnseignantsMax: 3,
          accesStatistiques: false,
          free: true,
          actif: true
        });
        
        console.log('✅ Abonnement gratuit par défaut créé :', defaultFreeAbonnement.nom);
        return defaultFreeAbonnement;
      }
      
      return existingFree;
    } catch (error) {
      throw new Error('Erreur lors de la vérification de l\'abonnement gratuit : ' + error.message);
    }
  },

  // ============================================================================
  // GESTION DES ÉCOLES ET ATTRIBUTION D'ABONNEMENTS
  // ============================================================================

  /**
   * Attribuer automatiquement l'abonnement gratuit à une nouvelle école
   */
  async assignFreeSubscriptionToSchool(ecoleId) {
    try {
      const freeAbonnement = await this.getFreeSubscription();
      
      if (!freeAbonnement) {
        throw new Error('Aucun abonnement gratuit disponible');
      }
      
      const ecole = await Ecole.findByIdAndUpdate(
        ecoleId,
        { abonnementActuel: freeAbonnement._id },
        { new: true }
      );
      
      if (!ecole) {
        throw new Error('École non trouvée');
      }
      
      return {
        success: true,
        message: 'Abonnement gratuit attribué avec succès',
        ecole: ecole,
        abonnement: freeAbonnement
      };
    } catch (error) {
      throw new Error('Erreur lors de l\'attribution de l\'abonnement gratuit : ' + error.message);
    }
  },

  /**
   * Vérifier la validité de l'abonnement d'une école
   */
  async checkSubscriptionValidity(ecoleId) {
    try {
      return await Abonnement.checkValidite(ecoleId);
    } catch (error) {
      throw new Error('Erreur lors de la vérification de validité : ' + error.message);
    }
  },

  /**
   * Désactiver automatiquement un abonnement si les limites sont atteintes
   */
  async deactivateIfLimitsReached(ecoleId) {
    try {
      const validityCheck = await this.checkSubscriptionValidity(ecoleId);
      
      if (!validityCheck.valide) {
        const ecole = await Ecole.findById(ecoleId).populate('abonnementActuel');
        
        if (ecole && ecole.abonnementActuel) {
          // Marquer l'abonnement comme inactif
          await Abonnement.findByIdAndUpdate(
            ecole.abonnementActuel._id,
            { actif: false }
          );
          
          // Attribuer l'abonnement gratuit en remplacement
          await this.assignFreeSubscriptionToSchool(ecoleId);
          
          return {
            success: true,
            message: 'Abonnement désactivé pour dépassement de limites',
            raison: validityCheck.raison,
            violations: validityCheck.violations
          };
        }
      }
      
      return {
        success: true,
        message: 'Abonnement valide',
        details: validityCheck
      };
    } catch (error) {
      throw new Error('Erreur lors de la désactivation : ' + error.message);
    }
  },

  // ============================================================================
  // RENOUVELLEMENT AMÉLIORÉ
  // ============================================================================

  async renouvelerAbonnement(ecoleId, abonnementId, nouvelleDuree = null) {
    try {
      const ecole = await Ecole.findById(ecoleId).populate('abonnementActuel');
      if (!ecole) throw new Error('École introuvable');

      const abonnementOriginal = await Abonnement.findById(abonnementId);
      if (!abonnementOriginal) throw new Error('Abonnement introuvable');

      const duree = nouvelleDuree || abonnementOriginal.dureeEnJours;
      if (!duree) throw new Error('Durée invalide');

      const now = new Date();
      const dateFin = new Date(now.getTime() + duree * 24 * 60 * 60 * 1000);

      // Ajouter l'abonnement actuel à l'historique s'il existe
      if (ecole.abonnementActuel) {
        ecole.abonnementHistorique.push({
          date: now,
          expdate: ecole.abonnementActuel.dateFin || now,
          data: {
            id: ecole.abonnementActuel._id,
            nom: ecole.abonnementActuel.nom,
            description: ecole.abonnementActuel.description,
            prix: ecole.abonnementActuel.prix,
            nombreApprenantsMax: ecole.abonnementActuel.nombreApprenantsMax,
            nombreEnseignantsMax: ecole.abonnementActuel.nombreEnseignantsMax,
            nombreJeuxMax: ecole.abonnementActuel.nombreJeuxMax,
            dureeUtilisee: ecole.abonnementActuel.dureeEnJours
          }
        });
      }

      // Créer un nouvel abonnement actif (copie de l'original avec nouvelles dates)
      const nouvelAbonnement = new Abonnement({
        nom: abonnementOriginal.nom,
        description: abonnementOriginal.description,
        prix: abonnementOriginal.prix,
        dureeEnJours: duree,
        nombreApprenantsMax: abonnementOriginal.nombreApprenantsMax,
        nombreEnseignantsMax: abonnementOriginal.nombreEnseignantsMax,
        nombreJeuxMax: abonnementOriginal.nombreJeuxMax,
        accesStatistiques: abonnementOriginal.accesStatistiques,
        free: abonnementOriginal.free,
        dateDebut: now,
        dateFin: dateFin,
        actif: true
      });

      await nouvelAbonnement.save();

      // Associer le nouvel abonnement à l'école
      ecole.abonnementActuel = nouvelAbonnement._id;
      await ecole.save();

      return {
        success: true,
        message: 'Abonnement renouvelé avec succès',
        dateDebut: now.toISOString().slice(0, 10),
        dateFin: dateFin.toISOString().slice(0, 10),
        dureeUtilisee: duree,
        nouvelAbonnement: nouvelAbonnement
      };
    } catch (error) {
      throw new Error('Erreur lors du renouvellement : ' + error.message);
    }
  },

  // ============================================================================
  // MÉTHODES UTILITAIRES EXISTANTES (maintenues pour compatibilité)
  // ============================================================================

  async getAll() {
    try {
      return await Abonnement.find().sort({ dateCreation: -1 });
    } catch (error) {
      throw new Error('Erreur lors de la récupération des abonnements : ' + error.message);
    }
  },

  async getById(id) {
    try {
      return await Abonnement.findById(id);
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'abonnement : ' + error.message);
    }
  },

  async getAbonnementsActifs() {
    try {
      return await Abonnement.find({ actif: { $ne: false } });
    } catch (error) {
      throw new Error('Erreur lors de la récupération des abonnements actifs : ' + error.message);
    }
  },

  // Alias pour compatibilité
  async updateAbonnement(id, data) {
    return await this.update(id, data);
  },

  async deleteAbonnement(id) {
    return await this.remove(id);
  },

  async createAbonnement(data) {
    return await this.create(data);
  },

  async getAllAbonnements() {
    return await this.getAll();
  },

  async getAbonnementById(id) {
    return await this.getById(id);
  }

};

module.exports = abonnementService;