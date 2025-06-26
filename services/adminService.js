// services/adminService.js
const Admin = require('../models/Admin');
// ✅ AJOUT DES IMPORTS MANQUANTS
const Jeu = require('../models/Jeu');
const Planification = require('../models/Planification');
const Ecole = require('../models/Ecole');
const mongoose = require('mongoose');
// Imports existants
const passwordUtils = require('../utils/password');
const tokenUtils = require('../utils/token');


const adminService = {


        /**
     * Récupère tous les enseignants d'une école spécifique
     * @param {string} ecoleId - ID de l'école
     * @param {Object} adminData - Données de l'admin connecté pour vérifier les permissions
     * @returns {Array} Liste des enseignants de l'école
     */
        getEnseignantsByEcole: async (ecoleId, adminData = null) => {
            try {
                let query = Admin.find({
                    ecole: ecoleId,
                    role: { $in: ['enseignant', 'admin'] } // Inclure les enseignants ET les admins
                });
    
                // Vérification des permissions
                if (adminData && adminData.role !== 'super_admin') {
                    // Un admin normal ne peut voir que les enseignants de son école
                    if (!adminData.ecole || adminData.ecole.toString() !== ecoleId.toString()) {
                        throw new Error('Accès non autorisé à cette école');
                    }
                }
    
                const enseignants = await query
                    .select('-password') // Exclure le mot de passe
                    .populate('pays', 'libelle')
                    .populate('ecole', 'libelle ville')
                    .sort({ nom: 1, prenom: 1 }) // Tri alphabétique
                    .exec();
    
                return enseignants;
            } catch (error) {
                throw new Error('Erreur lors de la récupération des enseignants : ' + error.message);
            }
        },
    
        /**
         * Récupère tous les enseignants d'une école avec leurs statistiques de jeux et planifications
         * @param {string} ecoleId - ID de l'école
         * @param {Object} adminData - Données de l'admin connecté pour vérifier les permissions
         * @returns {Array} Liste des enseignants avec leurs statistiques
         */
        getEnseignantsAvecStats: async (ecoleId, adminData = null) => {
            try {
                // Récupérer les enseignants de base
                const enseignants = await adminService.getEnseignantsByEcole(ecoleId, adminData);
    
                // Pour chaque enseignant, calculer ses statistiques
                const enseignantsAvecStats = await Promise.all(
                    enseignants.map(async (enseignant) => {
                        try {
                            // Compter les jeux créés par cet enseignant
                            const nombreJeux = await Jeu.countDocuments({
                                createdBy: enseignant._id,
                                ecole: ecoleId // S'assurer que les jeux appartiennent à la même école
                            });
    
                            // Compter les planifications associées aux jeux de cet enseignant
                            const planificationsResult = await Planification.aggregate([
                                {
                                    $lookup: {
                                        from: 'jeus', // Collection des jeux (au pluriel en MongoDB)
                                        localField: 'jeu',
                                        foreignField: '_id',
                                        as: 'jeuInfo'
                                    }
                                },
                                {
                                    $match: {
                                        'jeuInfo.createdBy': new mongoose.Types.ObjectId(enseignant._id),
                                        'jeuInfo.ecole': new mongoose.Types.ObjectId(ecoleId)
                                    }
                                },
                                {
                                    $count: 'total'
                                }
                            ]);
    
                            const nombrePlanifications = planificationsResult[0]?.total || 0;
    
                            // Convertir en objet simple et ajouter les statistiques
                            const enseignantObj = enseignant.toObject();
                            enseignantObj.statistiques = {
                                nombreJeux: nombreJeux,
                                nombrePlanifications: nombrePlanifications
                            };
    
                            return enseignantObj;
                        } catch (statError) {
                            console.error(`Erreur lors du calcul des stats pour l'enseignant ${enseignant._id}:`, statError);
                            // En cas d'erreur, retourner l'enseignant avec des stats à 0
                            const enseignantObj = enseignant.toObject();
                            enseignantObj.statistiques = {
                                nombreJeux: 0,
                                nombrePlanifications: 0
                            };
                            return enseignantObj;
                        }
                    })
                );
    
                return enseignantsAvecStats;
            } catch (error) {
                throw new Error('Erreur lors de la récupération des enseignants avec statistiques : ' + error.message);
            }
        },
    
        /**
         * ✅ NOUVELLE MÉTHODE : Crée un admin avec le pays de son école par défaut
         * @param {Object} adminData - Données de l'admin à créer
         * @returns {Object} Admin créé
         */
        createAdmin: async (adminData) => {
            try {
                // Si pas de pays spécifié et qu'une école est assignée, utiliser le pays de l'école
                if (!adminData.pays && adminData.ecole) {
                    const ecole = await Ecole.findById(adminData.ecole).populate('pays');
                    if (ecole && ecole.pays) {
                        adminData.pays = ecole.pays._id;
                        console.log(`Pays automatiquement assigné depuis l'école: ${ecole.pays.libelle}`);
                    }
                }
    
                // Hasher le mot de passe
                adminData.password = await passwordUtils.hashPassword(adminData.password);
                
                const newAdmin = new Admin(adminData);
                return await newAdmin.save();
            } catch (error) {
                if (error.code === 11000) {
                    const field = Object.keys(error.keyValue)[0];
                    throw new Error(`Le champ '${field}' existe déjà.`);
                } else {
                    throw new Error('Erreur lors de la création de l\'administrateur : ' + error.message);
                }
            }
        },
    
        /**
         * Récupère tous les jeux créés par un enseignant
         * @param {string} enseignantId - ID de l'enseignant
         * @param {Object} adminData - Données de l'admin connecté pour vérifier les permissions
         * @returns {Array} Liste des jeux créés par l'enseignant
         */
        getJeuxParEnseignant: async (enseignantId, adminData = null) => {
            try {
                // Vérifier que l'enseignant existe et appartient à l'école de l'admin (si pas super_admin)
                const enseignant = await Admin.findById(enseignantId);
                if (!enseignant) {
                    throw new Error('Enseignant non trouvé');
                }
    
                // Vérification des permissions
                if (adminData && adminData.role !== 'super_admin') {
                    if (!adminData.ecole || adminData.ecole.toString() !== enseignant.ecole?.toString()) {
                        throw new Error('Accès non autorisé à cet enseignant');
                    }
                }
    
                const jeux = await Jeu.find({
                    createdBy: enseignantId,
                    ...(adminData && adminData.role !== 'super_admin' ? { ecole: adminData.ecole } : {})
                })
                .populate('createdBy', 'nom prenom email')
                .populate('ecole', 'libelle ville')
                .populate('questions')
                .sort({ date: -1 }) // Tri par date décroissante
                .exec();
    
                return jeux;
            } catch (error) {
                throw new Error('Erreur lors de la récupération des jeux de l\'enseignant : ' + error.message);
            }
        },
    
        /**
         * Récupère toutes les planifications associées aux jeux d'un enseignant
         * @param {string} enseignantId - ID de l'enseignant
         * @param {Object} adminData - Données de l'admin connecté pour vérifier les permissions
         * @returns {Array} Liste des planifications des jeux de l'enseignant
         */
        getPlanificationsParEnseignant: async (enseignantId, adminData = null) => {
            try {
                // Vérifier que l'enseignant existe et appartient à l'école de l'admin (si pas super_admin)
                const enseignant = await Admin.findById(enseignantId);
                if (!enseignant) {
                    throw new Error('Enseignant non trouvé');
                }
    
                // Vérification des permissions
                if (adminData && adminData.role !== 'super_admin') {
                    if (!adminData.ecole || adminData.ecole.toString() !== enseignant.ecole?.toString()) {
                        throw new Error('Accès non autorisé à cet enseignant');
                    }
                }
    
                const planifications = await Planification.aggregate([
                    {
                        $lookup: {
                            from: 'jeus', // Collection des jeux (au pluriel en MongoDB)
                            localField: 'jeu',
                            foreignField: '_id',
                            as: 'jeuInfo'
                        }
                    },
                    {
                        $match: {
                            'jeuInfo.createdBy': new mongoose.Types.ObjectId(enseignantId),
                            ...(adminData && adminData.role !== 'super_admin' ? {
                                'jeuInfo.ecole': new mongoose.Types.ObjectId(adminData.ecole)
                            } : {})
                        }
                    },
                    {
                        $lookup: {
                            from: 'participants', // Collection des participants
                            localField: 'participants',
                            foreignField: '_id',
                            as: 'participantsInfo'
                        }
                    },
                    {
                        $lookup: {
                            from: 'apprenants', // Collection des apprenants
                            localField: 'participantsInfo.apprenant',
                            foreignField: '_id',
                            as: 'apprenantsInfo'
                        }
                    },
                    {
                        $project: {
                            pin: 1,
                            statut: 1,
                            date_debut: 1,
                            date_fin: 1,
                            heure_debut: 1,
                            heure_fin: 1,
                            type: 1,
                            limite_participant: 1,
                            date: 1,
                            jeu: {
                                $arrayElemAt: ['$jeuInfo', 0]
                            },
                            nombreParticipants: { $size: '$participantsInfo' },
                            participants: '$apprenantsInfo'
                        }
                    },
                    {
                        $sort: { date: -1 } // Tri par date décroissante
                    }
                ]);
    
                return planifications;
            } catch (error) {
                throw new Error('Erreur lors de la récupération des planifications de l\'enseignant : ' + error.message);
            }
        },
    
        /**
         * Récupère les statistiques des enseignants d'une école
         * @param {string} ecoleId - ID de l'école
         * @returns {Object} Statistiques des enseignants
         */
        getStatsEnseignantsByEcole: async (ecoleId) => {
            try {
                const stats = await Admin.aggregate([
                    {
                        $match: {
                            ecole: new mongoose.Types.ObjectId(ecoleId),
                            role: { $in: ['enseignant', 'admin'] }
                        }
                    },
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 }
                        }
                    }
                ]);
    
                const totalEnseignants = await Admin.countDocuments({
                    ecole: ecoleId,
                    role: { $in: ['enseignant', 'admin'] }
                });
    
                return {
                    total: totalEnseignants,
                    parRole: stats,
                    ecoleId: ecoleId
                };
            } catch (error) {
                throw new Error('Erreur lors du calcul des statistiques : ' + error.message);
            }
        },

    getAllAdmin: async () => {
        try {
            return await Admin.find();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des administrateurs');
        }
    },

    getAdminById: async (id) => {
        try {
            return await Admin.findById(id)
                .populate({
                    path: 'pays',
                    select: 'libelle'
                })
                .populate({
                    path: 'role',
                    select: 'libelle'
                });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'administrateur par ID');
        }
    },

    getAdminByEmail: async (email) => {
        try {
            return await Admin.findOne({ email })
                .populate({
                    path: 'pays',
                    select: 'libelle'
                })
                .populate({
                    path: 'role',
                    select: 'libelle'
                });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'administrateur par email');
        }
    },

    getAdminByMatricule: async (matricule) => {
        try {
            return await Admin.findOne({ matricule })
                .populate('pays', 'libelle')
                .populate('role', 'libelle');
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'administrateur par matricule');
        }
    },

    createAdmin: async (adminData) => {
        try {
            adminData.password = await passwordUtils.hashPassword(adminData.password);
            const newAdmin = new Admin(adminData);
            return await newAdmin.save();
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de l\'administrateur : ' + error.message);
            }
        }
    },

    loginAdmin: async (email, password) => {
        try {
            const admin = await Admin.findOne({ email });
            if (!admin) throw new Error('Administrateur non trouvé');
            const isMatch = await passwordUtils.comparePassword(password, admin.password);
            if (!isMatch) throw new Error('Mot de passe incorrect');
            const token = tokenUtils.generateToken(admin._id);
            return { admin, token };
        } catch (error) {
            throw new Error('Erreur lors de l\'authentification de l\'administrateur');
        }
    },

    updateAdmin: async (adminId, adminData) => {
        try {
            const updatedAdmin = await Admin.findByIdAndUpdate(
                adminId,
                { $set: adminData },
                { new: true, runValidators: true }
            );
            if (!updatedAdmin) {
                throw new Error("Administrateur non trouvé");
            }
            return updatedAdmin;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'administrateur : " + error.message);
        }
    },

    deleteAdminById: async (adminId) => {
        try {
            const deletedAdmin = await Admin.findByIdAndDelete(adminId);
            if (!deletedAdmin) {
                throw new Error("Administrateur non trouvé");
            }
            return deletedAdmin;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de l'administrateur : " + error.message);
        }
    }
};

module.exports = adminService;