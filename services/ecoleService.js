const Ecole = require('../models/Ecole');

const EcoleService = {

    async createEcole(ecoleData) {
        try {
            const newEcole = new Ecole(ecoleData);
            return await newEcole.save();
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de l\'ecole : ' + error.message);
            }
        }
    },

async getEcoleById(ecoleId, adminData = null) {
    
  let query = Ecole.findById(ecoleId);
  
if (adminData && adminData.role !== 'super_admin') {
    query = query.where('ecole').equals(adminData.ecole);
}

const ecole = await query
  .populate('apprenants')
  .populate('admin')
  .populate('pays')
  .populate('abonnementActuel')
  .lean();


  if (!ecole) return null;

  const historique = (ecole.abonnementHistorique || []).map(h => ({
    date: h.date ? h.date.toISOString().slice(0, 10) : null,
    expdate: h.expdate ? h.expdate.toISOString().slice(0, 10) : null,
    data: {
      id: h.data.id,
      nom: h.data.nom,
      description: h.data.description,
      prix: h.data.prix,
      nombre_apprenant: h.data.nombreApprenantsMax,
      nombre_enseignant: h.data.nombreEnseignantsMax,
      nombre_jeux: h.data.nombreJeuxMax,
      dureeUtilisee: h.data.dureeUtilisee
    }
  }));

  const finalResponse = {
    ...ecole,
      statusAbonnement: !!ecole.abonnementActuel,
      refAbonnement: ecole.abonnementActuel?._id || null,
     
  };

  return finalResponse;
},

    async getAllEcoles(adminData = null) {
        try {
            let query = Ecole.find();
            console.log(adminData.role)
            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par admin
            if (adminData && adminData.role !== 'super_admin') {
                query = query.where('admin').equals(adminData.id);
            }
            
            return await query
                .populate('admin')
                .populate('pays')
                .populate('apprenants')
                .exec();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des écoles : ' + error.message);
        }
    },

    async getEcoleByEmail(email, adminData = null) {
        try {
            console.log(email);
            let query = Ecole.findOne({ email: email });
            
            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par admin
            if (adminData && adminData.role !== 'super_admin') {
                query = query.where('admin').equals(adminData.id);
            }
            
            const ecole = await query
                .populate('admin')
                .populate('pays')
                .populate('apprenants')
                .exec();
                
            if (!ecole) {
                throw new Error('École non trouvée ou accès non autorisé');
            }
            
            return ecole;
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'école par email : ' + error.message);
        }
    },
    
    // Méthode spécifique pour récupérer les écoles d'un administrateur
    async getEcolesByAdmin(adminId) {
        try {
            return await Ecole.find({ admin: adminId })
                .populate('admin')
                .populate('pays')
                .populate('apprenants')
                .exec();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des écoles de l\'administrateur : ' + error.message);
        }
    },

    updateEcole: async (ecoleId, ecoleData, adminData = null) => {
        try {
            let query = { _id: ecoleId };
            
            // Si un admin est fourni et qu'il n'est pas super_admin, on ajoute la condition admin
            if (adminData && adminData.role !== 'super_admin') {
                query.admin = adminData.id;
            }
            
            const updatedEcole = await Ecole.findOneAndUpdate(
                query,
                { $set: ecoleData },
                { new: true, runValidators: true }
            );
            
            if (!updatedEcole) {
                throw new Error("École non trouvée ou accès non autorisé");
            }
            return updatedEcole;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'école : " + error.message);
        }
    },

     deleteEcoleById: async (ecoleId, adminData = null) => {
        try {
            let query = { _id: ecoleId };
            
            // Si un admin est fourni et qu'il n'est pas super_admin, on ajoute la condition admin
            if (adminData && adminData.role !== 'super_admin') {
                query.admin = adminData.id;
            }
            
            const deletedEcole = await Ecole.findOneAndDelete(query);
            
            if (!deletedEcole) {
                throw new Error("École non trouvée ou accès non autorisé");
            }
            return deletedEcole;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de l'école : " + error.message);
        }
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
    async annulerAbonnement(ecoleId) {
    const ecole = await Ecole.findById(ecoleId).populate('abonnementActuel');
    if (!ecole) throw new Error('École introuvable');

    if (!ecole.abonnementActuel) {
      throw new Error("Aucun abonnement actif à annuler");
    }

    const abonnement = ecole.abonnementActuel;

    // Ajouter l'abonnement actuel dans l'historique
    ecole.abonnementHistorique = ecole.abonnementHistorique || [];
    ecole.abonnementHistorique.push({
      date: abonnement.dateDebut || new Date(),
      expdate: abonnement.dateFin || new Date(),
      data: {
        id: abonnement._id,
        nom: abonnement.nom,
        description: abonnement.description,
        prix: abonnement.prix,
        nombreJeuxMax: abonnement.nombreJeuxMax,
        nombreApprenantsMax: abonnement.nombreApprenantsMax,
        nombreEnseignantsMax: abonnement.nombreEnseignantsMax,
        dureeUtilisee: abonnement.dureeEnJours
      }
    });

    // Marquer comme inactif dans la collection Abonnement (facultatif)
    abonnement.actif = false;
    await abonnement.save();

    // Supprimer le lien d'abonnement actif
    ecole.abonnementActuel = null;
    await ecole.save();

    return {
      success: true,
      message: "Abonnement annulé avec succès"
    };
  },
  
  // Méthode utilitaire pour vérifier les permissions
    checkPermission: (adminData, ecoleAdminId) => {
        if (!adminData) return false;
        if (adminData.role === 'super_admin') return true;
        return adminData.id.toString() === ecoleAdminId.toString();
    }
    
};

module.exports = EcoleService;
