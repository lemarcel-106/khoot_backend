// models/Abonnement.js - VERSION AMÉLIORÉE avec gestion `free`
const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: String,
  prix: { type: Number, default: 0 },
  
  // ✅ AJOUT : Champ pour identifier l'abonnement gratuit
  free: { 
    type: Boolean, 
    default: false 
  },
  
  nombreJeuxMax: { type: Number, required: true },
  nombreApprenantsMax: { type: Number, required: true },
  nombreEnseignantsMax: { type: Number, required: true },
  dureeEnJours: {
    type: Number,
    required: true
  },
  accesStatistiques: { 
    type: Boolean,
    default: true
  },
  dateCreation: { type: Date, default: Date.now },
  dateDebut: Date,
  dateFin: Date,
  actif: { type: Boolean, default: false }
});

// ============================================================================
// MIDDLEWARE PRE-SAVE : Gestion de l'abonnement gratuit unique
// ============================================================================

abonnementSchema.pre('save', async function(next) {
  try {
    // Si on définit cet abonnement comme gratuit
    if (this.free === true) {
      // Retirer le flag free de tous les autres abonnements
      await mongoose.model('Abonnement').updateMany(
        { _id: { $ne: this._id } },
        { $set: { free: false } }
      );
      
      console.log('✅ Abonnement gratuit défini : tous les autres passent à free=false');
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MIDDLEWARE PRE-REMOVE : Protection contre suppression du seul abonnement gratuit
// ============================================================================

abonnementSchema.pre('findOneAndDelete', async function(next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());
    
    if (docToDelete && docToDelete.free === true) {
      // Vérifier s'il existe d'autres abonnements gratuits
      const otherFreeAbonnements = await this.model.countDocuments({
        _id: { $ne: docToDelete._id },
        free: true
      });
      
      if (otherFreeAbonnements === 0) {
        const error = new Error('Impossible de supprimer le seul abonnement gratuit du système');
        error.code = 'CANNOT_DELETE_ONLY_FREE_SUBSCRIPTION';
        return next(error);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// MÉTHODES STATIQUES
// ============================================================================

/**
 * Récupérer l'abonnement gratuit actuel
 */
abonnementSchema.statics.getFreeSubscription = function() {
  return this.findOne({ free: true, actif: true });
};

/**
 * Définir un abonnement comme gratuit (et retirer le flag des autres)
 */
abonnementSchema.statics.setAsFreeSubscription = async function(abonnementId) {
  // Retirer le flag free de tous les abonnements
  await this.updateMany({}, { $set: { free: false } });
  
  // Définir le nouvel abonnement gratuit
  return await this.findByIdAndUpdate(
    abonnementId, 
    { $set: { free: true } },
    { new: true }
  );
};

/**
 * Vérifier la validité d'un abonnement d'école
 */
abonnementSchema.statics.checkValidite = async function(ecoleId) {
  const Ecole = require('./Ecole');
  const Admin = require('./Admin');
  const Apprenant = require('./Apprenant');
  const Jeu = require('./Jeu');
  
  try {
    const ecole = await Ecole.findById(ecoleId).populate('abonnementActuel');
    
    if (!ecole || !ecole.abonnementActuel) {
      return { valide: false, raison: 'Aucun abonnement' };
    }
    
    const abonnement = ecole.abonnementActuel;
    
    // Vérification de la date d'expiration
    if (abonnement.dateFin && new Date() > new Date(abonnement.dateFin)) {
      return { valide: false, raison: 'Abonnement expiré' };
    }
    
    // Comptage des ressources actuelles
    const [nbApprenants, nbEnseignants, nbJeux] = await Promise.all([
      Apprenant.countDocuments({ ecole: ecoleId }),
      Admin.countDocuments({ ecole: ecoleId, role: { $in: ['admin', 'enseignant'] } }),
      Jeu.countDocuments({ ecole: ecoleId })
    ]);
    
    // Vérification des limites
    const violations = [];
    
    if (nbApprenants >= abonnement.nombreApprenantsMax) {
      violations.push(`Limite apprenants atteinte (${nbApprenants}/${abonnement.nombreApprenantsMax})`);
    }
    
    if (nbEnseignants >= abonnement.nombreEnseignantsMax) {
      violations.push(`Limite enseignants atteinte (${nbEnseignants}/${abonnement.nombreEnseignantsMax})`);
    }
    
    if (nbJeux >= abonnement.nombreJeuxMax) {
      violations.push(`Limite jeux atteinte (${nbJeux}/${abonnement.nombreJeuxMax})`);
    }
    
    if (violations.length > 0) {
      return { 
        valide: false, 
        raison: 'Limites dépassées', 
        violations,
        stats: { nbApprenants, nbEnseignants, nbJeux }
      };
    }
    
    return { 
      valide: true, 
      stats: { nbApprenants, nbEnseignants, nbJeux },
      limites: {
        apprenants: abonnement.nombreApprenantsMax,
        enseignants: abonnement.nombreEnseignantsMax,
        jeux: abonnement.nombreJeuxMax
      }
    };
    
  } catch (error) {
    return { valide: false, raison: 'Erreur technique', error: error.message };
  }
};

module.exports = mongoose.model('Abonnement', abonnementSchema);