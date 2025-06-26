const Pays = require('../models/Pays');
const Ecole = require('../models/Ecole'); // ✅ AJOUT : Import du modèle Ecole

const PaysService = {
    // Créer un nouveau pays
    async createPays(paysData) {
        try {
            const newPays = new Pays(paysData);
            return await newPays.save();
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du pays : ' + error.message);
            }
        }
    },

    // ✅ MODIFIÉ : Récupérer tous les pays AVEC le total d'écoles
    async getAllPays() {
        try {
            // Utiliser aggregate pour compter les écoles par pays
            const paysAvecEcoles = await Pays.aggregate([
                {
                    // Jointure avec la collection Ecole
                    $lookup: {
                        from: 'ecoles', // Nom de la collection MongoDB (au pluriel)
                        localField: '_id',
                        foreignField: 'pays',
                        as: 'ecoles'
                    }
                },
                {
                    // Ajouter le champ totalEcoles
                    $addFields: {
                        totalEcoles: { $size: '$ecoles' }
                    }
                },
                {
                    // Projeter les champs souhaités (sans la liste complète des écoles)
                    $project: {
                        _id: 1,
                        libelle: 1,
                        code: 1, // Si vous avez un champ code
                        totalEcoles: 1,
                        dateCreation: 1 // Si vous avez ce champ
                    }
                },
                {
                    // Trier par libellé
                    $sort: { libelle: 1 }
                }
            ]);

            return paysAvecEcoles;
        } catch (error) {
            throw new Error('Erreur lors de la récupération des pays : ' + error.message);
        }
    },

    // ✅ MODIFIÉ : Récupérer un pays par ID AVEC le total d'écoles
    async getPaysById(paysId) {
        try {
            const paysAvecEcoles = await Pays.aggregate([
                {
                    // Filtrer par ID
                    $match: { 
                        _id: require('mongoose').Types.ObjectId(paysId) 
                    }
                },
                {
                    // Jointure avec la collection Ecole
                    $lookup: {
                        from: 'ecoles',
                        localField: '_id',
                        foreignField: 'pays',
                        as: 'ecoles'
                    }
                },
                {
                    // Ajouter le champ totalEcoles et la liste des écoles
                    $addFields: {
                        totalEcoles: { $size: '$ecoles' },
                        listeEcoles: {
                            $map: {
                                input: '$ecoles',
                                as: 'ecole',
                                in: {
                                    _id: '$$ecole._id',
                                    libelle: '$$ecole.libelle',
                                    ville: '$$ecole.ville',
                                    adresse: '$$ecole.adresse'
                                }
                            }
                        }
                    }
                },
                {
                    // Projeter les champs souhaités
                    $project: {
                        _id: 1,
                        libelle: 1,
                        code: 1,
                        totalEcoles: 1,
                        listeEcoles: 1,
                        dateCreation: 1
                    }
                }
            ]);

            return paysAvecEcoles.length > 0 ? paysAvecEcoles[0] : null;
        } catch (error) {
            throw new Error('Erreur lors de la récupération du pays : ' + error.message);
        }
    },

    // Récupérer un pays par libellé
    async getPaysByLibelle(libelle) {
        try {
            return await Pays.findOne({ libelle });
        } catch (error) {
            throw new Error('Erreur lors de la récupération du pays : ' + error.message);
        }
    },

    // ✅ NOUVEAU : Récupérer les statistiques détaillées des pays
    async getPaysStatistiques() {
        try {
            const statistiques = await Pays.aggregate([
                {
                    $lookup: {
                        from: 'ecoles',
                        localField: '_id',
                        foreignField: 'pays',
                        as: 'ecoles'
                    }
                },
                {
                    $addFields: {
                        totalEcoles: { $size: '$ecoles' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPays: { $sum: 1 },
                        totalEcolesGlobal: { $sum: '$totalEcoles' },
                        paysAvecEcoles: {
                            $sum: { $cond: [{ $gt: ['$totalEcoles', 0] }, 1, 0] }
                        },
                        paysSansEcoles: {
                            $sum: { $cond: [{ $eq: ['$totalEcoles', 0] }, 1, 0] }
                        },
                        repartition: {
                            $push: {
                                pays: '$libelle',
                                totalEcoles: '$totalEcoles'
                            }
                        }
                    }
                }
            ]);

            return statistiques.length > 0 ? statistiques[0] : null;
        } catch (error) {
            throw new Error('Erreur lors de la récupération des statistiques : ' + error.message);
        }
    },

    updatePays: async (paysId, paysData) => {
        try {
            const updatedPays = await Pays.findByIdAndUpdate(
                paysId,
                { $set: paysData },
                { new: true, runValidators: true }
            );
            if (!updatedPays) {
                throw new Error("Pays non trouvé");
            }
            return updatedPays;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du pays : " + error.message);
        }
    },

    deletePaysById: async (paysId) => {
        try {
            // Vérifier s'il y a des écoles associées avant suppression
            const ecolesAssociees = await Ecole.countDocuments({ pays: paysId });
            
            if (ecolesAssociees > 0) {
                throw new Error(`Impossible de supprimer ce pays. ${ecolesAssociees} école(s) y sont associées.`);
            }

            const deletedPays = await Pays.findByIdAndDelete(paysId);
            if (!deletedPays) {
                throw new Error("Pays non trouvé");
            }
            return deletedPays;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du pays : " + error.message);
        }
    }
};

module.exports = PaysService;