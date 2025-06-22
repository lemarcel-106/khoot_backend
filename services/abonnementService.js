const Abonnement = require('../models/Abonnement');

const abonnementService = {

  async create(data) {
    return await Abonnement.create(data);
  },

  async getAll() {
    return await Abonnement.find();
  },

  async getById(id) {
    return await Abonnement.findById(id);
  },

  async update(id, data) {
    return await Abonnement.findByIdAndUpdate(id, data, { new: true });
  },

  async remove(id) {
    return await Abonnement.findByIdAndDelete(id);
  },

  async renouvelerAbonnement(ecoleId, abonnementId, nouvelleDuree = null) {
    const ecole = await Ecole.findById(ecoleId).populate('abonnementActuel');
    if (!ecole) throw new Error('École introuvable');

    const abonnementOriginal = await Abonnement.findById(abonnementId);
    if (!abonnementOriginal) throw new Error('Abonnement introuvable');

    const duree = nouvelleDuree || abonnementOriginal.dureeEnJours;
    if (!duree) throw new Error('Durée invalide');

    const now = new Date();
    const dateFin = new Date(now.getTime() + duree * 24 * 60 * 60 * 1000);

    // Ajouter l’abonnement actuel à l’historique
    if (ecole.abonnementActuel) {
      ecole.abonnementHistorique = ecole.abonnementHistorique || [];
      ecole.abonnementHistorique.push({
        date: ecole.abonnementActuel.dateDebut || now,
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

    // Créer un nouvel abonnement actif
    const nouveau = new Abonnement({
      nom: abonnementOriginal.nom,
      description: abonnementOriginal.description,
      prix: abonnementOriginal.prix,
      dureeEnJours: duree,
      nombreApprenantsMax: abonnementOriginal.nombreApprenantsMax,
      nombreEnseignantsMax: abonnementOriginal.nombreEnseignantsMax,
      nombreJeuxMax: abonnementOriginal.nombreJeuxMax,
      accesStatistiques: abonnementOriginal.accesStatistiques,
      dateDebut: now,
      dateFin: dateFin,
      actif: true
    });

    await nouveau.save();

    // Associer à l’école
    ecole.abonnementActuel = nouveau._id;
    await ecole.save();

    return {
      success: true,
      message: 'Abonnement renouvelé avec succès',
      dateDebut: now.toISOString().slice(0, 10),
      dateFin: dateFin.toISOString().slice(0, 10),
      dureeUtilisee: duree
    };
  },


};

module.exports = abonnementService;
