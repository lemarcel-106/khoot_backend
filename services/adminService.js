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



// NOUVELLES FONCTIONS À AJOUTER
// ===============================================

/**
 * Récupérer tous les jeux créés par un enseignant
 */
async getJeuxParEnseignant(enseignantId) {
    try {
        const jeux = await Jeu.find({ createdBy: enseignantId })
            .populate({
                path: 'createdBy',
                select: 'nom prenom email role matricule'
            })
            .populate('ecole', 'libelle ville')
            .populate('questions')
            .populate('planification')
            .sort({ date: -1 })
            .exec();

        return jeux;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération des jeux de l'enseignant: ${error.message}`);
    }
},

/**
 * Récupérer toutes les planifications des jeux d'un enseignant
 */
async getPlanificationsParEnseignant(enseignantId) {
    try {
        // Récupérer d'abord tous les jeux de l'enseignant
        const jeux = await Jeu.find({ createdBy: enseignantId }).select('_id');
        const jeuxIds = jeux.map(jeu => jeu._id);

        // Récupérer toutes les planifications de ces jeux
        const planifications = await Planification.find({ jeu: { $in: jeuxIds } })
            .populate({
                path: 'jeu',
                select: 'titre createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'nom prenom email'
                }
            })
            .populate({
                path: 'participants',
                populate: {
                    path: 'apprenant',
                    select: 'nom prenom pseudonyme matricule'
                }
            })
            .sort({ date: -1 })
            .exec();

        return planifications;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération des planifications de l'enseignant: ${error.message}`);
    }
},

/**
 * Récupérer les statistiques du dashboard d'un enseignant
 */
async getDashboardStats(enseignantId) {
    try {
        // Récupérer l'enseignant
        const enseignant = await Admin.findById(enseignantId).populate('ecole');
        if (!enseignant) {
            throw new Error('Enseignant non trouvé');
        }

        // Récupérer les jeux
        const jeux = await this.getJeuxParEnseignant(enseignantId);
        
        // Récupérer les planifications
        const planifications = await this.getPlanificationsParEnseignant(enseignantId);

        // Compter les apprenants de l'école
        const Apprenant = require('../models/Apprenant');
        const apprenantsEcole = await Apprenant.countDocuments({ 
            ecole: enseignant.ecole,
            type: 'ecole' 
        });
        
        // Compter les apprenants invités de l'école
        const apprenantsInvites = await Apprenant.countDocuments({ 
            ecole: enseignant.ecole,
            type: 'invite'
        });

        // Calculer les statistiques détaillées
        const jeuxActifs = jeux.filter(jeu => {
            return jeu.planification && jeu.planification.some(p => p.statut === 'en cours');
        }).length;

        const planificationsEnCours = planifications.filter(p => p.statut === 'en cours').length;
        const planificationsTerminees = planifications.filter(p => p.statut === 'terminé').length;

        // Calculer le total des participations
        const participationsTotales = planifications.reduce((total, p) => {
            return total + (p.participants ? p.participants.length : 0);
        }, 0);

        // Trouver la dernière activité
        const derniereActivite = jeux.length > 0 
            ? jeux.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
            : null;

        return {
            totalJeux: jeux.length,
            totalPlanifications: planifications.length,
            apprenantsEcole: apprenantsEcole,
            apprenantsInvites: apprenantsInvites,
            jeuxActifs: jeuxActifs,
            planificationsEnCours: planificationsEnCours,
            planificationsTerminees: planificationsTerminees,
            participationsTotales: participationsTotales,
            derniereActivite: derniereActivite,
            enseignant: enseignant
        };
    } catch (error) {
        throw new Error(`Erreur lors du calcul des statistiques: ${error.message}`);
    }
},

/**
 * Récupérer les admins par école
 */
async getAdminsByEcole(ecoleId) {
    try {
        const admins = await Admin.find({ ecole: ecoleId })
            .populate('ecole', 'libelle ville')
            .populate('pays', 'libelle')
            .sort({ nom: 1, prenom: 1 })
            .exec();

        return admins;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération des admins par école: ${error.message}`);
    }
},

/**
 * Rechercher un admin par matricule
 */
async getAdminByMatricule(matricule, currentUser = null) {
    try {
        let query = { matricule: matricule };

        // Filtrer selon les permissions
        if (currentUser && currentUser.role === 'admin') {
            query.ecole = currentUser.ecole;
        }

        const admin = await Admin.findOne(query)
            .populate('ecole', 'libelle ville')
            .populate('pays', 'libelle')
            .exec();

        return admin;
    } catch (error) {
        throw new Error(`Erreur lors de la recherche par matricule: ${error.message}`);
    }
},

/**
 * Obtenir les statistiques des enseignants d'une école
 */
async getStatsEnseignantsByEcole(ecoleId) {
    try {
        // Récupérer tous les enseignants de l'école
        const enseignants = await Admin.find({ 
            ecole: ecoleId, 
            role: 'enseignant' 
        }).select('_id nom prenom email statut date');

        const stats = {
            totalEnseignants: enseignants.length,
            enseignantsActifs: enseignants.filter(e => e.statut === 'actif').length,
            enseignantsInactifs: enseignants.filter(e => e.statut === 'inactif').length,
            detailsEnseignants: []
        };

        // Pour chaque enseignant, calculer ses statistiques
        for (const enseignant of enseignants) {
            const jeux = await this.getJeuxParEnseignant(enseignant._id);
            const planifications = await this.getPlanificationsParEnseignant(enseignant._id);
            
            const participationsTotales = planifications.reduce((total, p) => {
                return total + (p.participants ? p.participants.length : 0);
            }, 0);

            stats.detailsEnseignants.push({
                enseignant: {
                    id: enseignant._id,
                    nom: enseignant.nom,
                    prenom: enseignant.prenom,
                    email: enseignant.email,
                    statut: enseignant.statut
                },
                statistiques: {
                    jeuxCrees: jeux.length,
                    planificationsTotal: planifications.length,
                    participationsTotales: participationsTotales,
                    planificationsEnCours: planifications.filter(p => p.statut === 'en cours').length,
                    planificationsTerminees: planifications.filter(p => p.statut === 'terminé').length
                }
            });
        }

        // Calculer les moyennes
        if (stats.totalEnseignants > 0) {
            const totalJeux = stats.detailsEnseignants.reduce((sum, e) => sum + e.statistiques.jeuxCrees, 0);
            const totalPlanifications = stats.detailsEnseignants.reduce((sum, e) => sum + e.statistiques.planificationsTotal, 0);
            const totalParticipations = stats.detailsEnseignants.reduce((sum, e) => sum + e.statistiques.participationsTotales, 0);

            stats.moyennes = {
                jeuxParEnseignant: Math.round(totalJeux / stats.totalEnseignants),
                planificationsParEnseignant: Math.round(totalPlanifications / stats.totalEnseignants),
                participationsParEnseignant: Math.round(totalParticipations / stats.totalEnseignants)
            };
        }

        return stats;
    } catch (error) {
        throw new Error(`Erreur lors du calcul des statistiques par école: ${error.message}`);
    }
},



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
    },


    // services/adminService.js - Méthode exemple
async changePassword(userId, currentPassword, newPassword) {
    try {
        // Récupérer l'utilisateur
        const admin = await Admin.findById(userId);
        if (!admin) {
            throw new Error('Utilisateur non trouvé');
        }

        // Vérifier l'ancien mot de passe
        const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
        if (!isValidPassword) {
            throw new Error('Mot de passe actuel incorrect');
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Mettre à jour
        await Admin.findByIdAndUpdate(userId, {
            password: hashedPassword,
            passwordChangedAt: new Date()
        });

        return { success: true };
    } catch (error) {
        throw error;
    }
}

};

module.exports = adminService;