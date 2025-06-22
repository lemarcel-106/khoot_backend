const Ecole = require('../models/Ecole');
const Admin = require('../models/Admin');

const EcoleService = {

    async createEcole(ecoleData) {
        try {
            // MODIFICATION : Plus besoin de référencer l'admin dans l'école
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
        try {
            let query = Ecole.findById(ecoleId);
            
            // MODIFICATION : Si l'admin n'est pas super_admin, on vérifie qu'il appartient à cette école
            if (adminData && adminData.role !== 'super_admin') {
                // Vérifier que l'admin a cette école assignée
                const admin = await Admin.findById(adminData.id);
                if (!admin || !admin.ecole || admin.ecole.toString() !== ecoleId) {
                    throw new Error('Accès non autorisé à cette école');
                }
            }

            const ecole = await query
                .populate('apprenants')
                .populate('pays')
                .populate('abonnementActuel')
                .lean();

            if (!ecole) return null;

            // MODIFICATION : Récupérer l'admin de cette école
            const adminEcole = await Admin.findOne({ ecole: ecoleId })
                .populate('pays', 'libelle')
                .populate('role', 'libelle');

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
                admin: adminEcole, // Ajouter l'admin trouvé
                statusAbonnement: !!ecole.abonnementActuel,
                refAbonnement: ecole.abonnementActuel?._id || null,
            };

            return finalResponse;
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'école : ' + error.message);
        }
    },

    async getAllEcoles(adminData = null) {
        try {
            let query = Ecole.find();
            
            // MODIFICATION : Si l'admin n'est pas super_admin, on filtre par son école
            if (adminData && adminData.role !== 'super_admin') {
                if (!adminData.ecole) {
                    throw new Error('Aucune école assignée à cet administrateur');
                }
                query = query.where('_id').equals(adminData.ecole);
            }
            
            const ecoles = await query
                .populate('pays')
                .populate('apprenants')
                .exec();

            // MODIFICATION : Pour chaque école, récupérer son admin
            const ecolesAvecAdmin = await Promise.all(
                ecoles.map(async (ecole) => {
                    const admin = await Admin.findOne({ ecole: ecole._id })
                        .populate('pays', 'libelle')
                        .populate('role', 'libelle');
                    
                    return {
                        ...ecole.toObject(),
                        admin: admin
                    };
                })
            );

            return ecolesAvecAdmin;
        } catch (error) {
            throw new Error('Erreur lors de la récupération des écoles : ' + error.message);
        }
    },

    async getEcoleByEmail(email, adminData = null) {
        try {
            let query = Ecole.findOne({ email: email });
            
            // MODIFICATION : Si l'admin n'est pas super_admin, vérifier son accès
            if (adminData && adminData.role !== 'super_admin') {
                const ecole = await query.exec();
                if (!ecole) {
                    throw new Error('École non trouvée');
                }
                
                // Vérifier que l'admin a accès à cette école
                const admin = await Admin.findById(adminData.id);
                if (!admin || !admin.ecole || admin.ecole.toString() !== ecole._id.toString()) {
                    throw new Error('Accès non autorisé à cette école');
                }
                
                query = Ecole.findOne({ email: email });
            }
            
            const ecole = await query
                .populate('pays')
                .populate('apprenants')
                .exec();
                
            if (!ecole) {
                throw new Error('École non trouvée');
            }

            // Récupérer l'admin de cette école
            const adminEcole = await Admin.findOne({ ecole: ecole._id })
                .populate('pays', 'libelle')
                .populate('role', 'libelle');
            
            return {
                ...ecole.toObject(),
                admin: adminEcole
            };
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'école par email : ' + error.message);
        }
    },
    
    // MODIFICATION : Nouvelle méthode pour récupérer les écoles d'un administrateur
    async getEcolesByAdmin(adminId) {
        try {
            // Récupérer l'admin pour avoir son école
            const admin = await Admin.findById(adminId);
            if (!admin || !admin.ecole) {
                return []; // Aucune école assignée
            }

            const ecole = await Ecole.findById(admin.ecole)
                .populate('pays')
                .populate('apprenants')
                .exec();

            return ecole ? [ecole] : [];
        } catch (error) {
            throw new Error('Erreur lors de la récupération des écoles de l\'administrateur : ' + error.message);
        }
    },

    updateEcole: async (ecoleId, ecoleData, adminData = null) => {
        try {
            // MODIFICATION : Vérifier les permissions différemment
            if (adminData && adminData.role !== 'super_admin') {
                const admin = await Admin.findById(adminData.id);
                if (!admin || !admin.ecole || admin.ecole.toString() !== ecoleId) {
                    throw new Error('Accès non autorisé à cette école');
                }
            }
            
            const updatedEcole = await Ecole.findByIdAndUpdate(
                ecoleId,
                { $set: ecoleData },
                { new: true, runValidators: true }
            );
            
            if (!updatedEcole) {
                throw new Error("École non trouvée");
            }
            return updatedEcole;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'école : " + error.message);
        }
    },

    deleteEcoleById: async (ecoleId, adminData = null) => {
        try {
            // MODIFICATION : Vérifier les permissions différemment
            if (adminData && adminData.role !== 'super_admin') {
                const admin = await Admin.findById(adminData.id);
                if (!admin || !admin.ecole || admin.ecole.toString() !== ecoleId) {
                    throw new Error('Accès non autorisé à cette école');
                }
            }
            
            const deletedEcole = await Ecole.findByIdAndDelete(ecoleId);
            
            if (!deletedEcole) {
                throw new Error("École non trouvée");
            }

            // BONUS : Mettre à jour les admins qui référençaient cette école
            await Admin.updateMany(
                { ecole: ecoleId },
                { $unset: { ecole: 1 } }
            );

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

        // Ajouter l'abonnement actuel à l'historique
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

        // Associer à l'école
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
    checkPermission: (adminData, ecoleId) => {
        if (!adminData) return false;
        if (adminData.role === 'super_admin') return true;
        // Vérifier que l'admin a cette école assignée
        return adminData.ecole && adminData.ecole.toString() === ecoleId.toString();
    }
    
};

module.exports = EcoleService;