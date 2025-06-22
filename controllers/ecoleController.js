const EcoleService = require('../services/ecoleService');
const mongoose = require('mongoose');
const Ecole = require('../models/Ecole');
const Enseignant = require('../models/Admin');
const Apprenant = require('../models/Apprenant');
const Jeu = require('../models/Jeu');
const Planification = require('../models/Planification');

const EcoleController = {

    // Récupérer toutes les écoles (avec contrôle d'accès)
    async getAllEcoles(req, res) {
        try {
            // Récupérer les données de l'admin connecté depuis le middleware d'authentification
            const adminData = {
                id: req.user.id,
                role: req.user.role
            };

            const ecoles = await EcoleService.getAllEcoles(adminData);
            
            res.status(200).json({
                success: true,
                message: 'Écoles récupérées avec succès',
                data: ecoles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Récupérer une école par ID (avec contrôle d'accès)
    async getEcoleById(req, res) {
        try {
            const { id } = req.params;
            const adminData = {
                id: req.user.id,
                role: req.user.role
            };

            const ecole = await EcoleService.getEcoleById(id, adminData);
            
            res.status(200).json({
                success: true,
                message: 'École récupérée avec succès',
                data: ecole
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // Mettre à jour une école (avec contrôle d'accès)
    async updateEcole(req, res) {
        try {
            const { id } = req.params;
            const ecoleData = req.body;
            const adminData = {
                id: req.user.id,
                role: req.user.role
            };

            const updatedEcole = await EcoleService.updateEcole(id, ecoleData, adminData);
            
            res.status(200).json({
                success: true,
                message: 'École mise à jour avec succès',
                data: updatedEcole
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Supprimer une école (avec contrôle d'accès)
    async deleteEcole(req, res) {
        try {
            const { id } = req.params;
            const adminData = {
                id: req.user.id,
                role: req.user.role
            };

            const deletedEcole = await EcoleService.deleteEcoleById(id, adminData);
            
            res.status(200).json({
                success: true,
                message: 'École supprimée avec succès',
                data: deletedEcole
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Créer une nouvelle école
    async createEcole(req, res) {
        try {
            const ecoleData = req.body;
            // Associer l'école à l'admin qui la crée
            ecoleData.admin = req.user.id;

            const newEcole = await EcoleService.createEcole(ecoleData);
            
            res.status(201).json({
                success: true,
                message: 'École créée avec succès',
                data: newEcole
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Récupérer les écoles de l'admin connecté uniquement
    async getMyEcoles(req, res) {
        try {
            const adminId = req.user.id;
            const ecoles = await EcoleService.getEcolesByAdmin(adminId);
            
            res.status(200).json({
                success: true,
                message: 'Vos écoles récupérées avec succès',
                data: ecoles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Statistiques d'une école spécifique (version améliorée)
    async getStatistiques(req, res) {
        try {
            const { ecoleId } = req.params;
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            // Vérifier si l'école existe et si l'admin a accès
            if (!ecoleId) {
                return res.status(400).json({
                    success: false,
                    message: "L'identifiant de l'école est requis"
                });
            }

            // Vérification des permissions d'accès à l'école
            if (adminData.role !== 'super_admin') {
                // Pour un admin normal, vérifier qu'il appartient à cette école
                if (adminData.ecole && adminData.ecole.toString() !== ecoleId) {
                    return res.status(403).json({
                        success: false,
                        message: "Accès refusé. Vous ne pouvez consulter que les statistiques de votre école."
                    });
                }
            }

            // Vérifier que l'école existe
            const ecoleExists = await Ecole.findById(ecoleId);
            if (!ecoleExists) {
                return res.status(404).json({
                    success: false,
                    message: "École non trouvée"
                });
            }

            // Calculer les statistiques en parallèle pour optimiser les performances
            const [total_apprenants, total_enseignants, total_jeux, total_planifications] = await Promise.all([
                // Total apprenants de l'école
                Apprenant.countDocuments({ ecole: ecoleId }),
                
                // Total enseignants de l'école (admins et enseignants)
                Enseignant.countDocuments({
                    ecole: ecoleId,
                    role: { $in: ['enseignant', 'admin'] }
                }),
                
                // Total jeux créés pour cette école
                Jeu.countDocuments({ ecole: ecoleId }),
                
                // Total planifications pour les jeux de cette école
                Planification.aggregate([
                    {
                        $lookup: {
                            from: 'jeus', // Nom de la collection en MongoDB (au pluriel)
                            localField: 'jeu',
                            foreignField: '_id',
                            as: 'jeuInfo'
                        }
                    },
                    {
                        $match: {
                            'jeuInfo.ecole': new mongoose.Types.ObjectId(ecoleId)
                        }
                    },
                    {
                        $count: 'total'
                    }
                ]).then(result => result[0]?.total || 0)
            ]);

            return res.status(200).json({
                success: true,
                message: 'Statistiques récupérées avec succès',
                data: {
                    ecole: {
                        id: ecoleId,
                        nom: ecoleExists.libelle,
                        ville: ecoleExists.ville
                    },
                    statistiques: {
                        total_apprenants,
                        total_enseignants,
                        total_jeux,
                        total_planifications
                    },
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques :', error);
            return res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors de la récupération des statistiques",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Nouvelle méthode pour récupérer les stats de l'école de l'admin connecté
    async getMyEcoleStatistiques(req, res) {
        try {
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            // Vérifier que l'admin a une école associée
            if (!adminData.ecole) {
                return res.status(400).json({
                    success: false,
                    message: "Aucune école associée à votre compte"
                });
            }

            // Rediriger vers la méthode getStatistiques avec l'ID de l'école de l'admin
            req.params.ecoleId = adminData.ecole.toString();
            return await EcoleController.getStatistiques(req, res);

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques de mon école :', error);
            return res.status(500).json({
                success: false,
                message: "Erreur interne du serveur",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Renouveler l'abonnement d'une école
    async renouvelerAbonnement(req, res) {
        try {
            const ecoleId = req.params.id;
            const { abonnementId, dureeEnJours } = req.body;

            const result = await EcoleService.renouvelerAbonnement(ecoleId, abonnementId, dureeEnJours);
            return res.status(200).json(result);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Annuler l'abonnement d'une école
    async annulerAbonnement(req, res) {
        try {
            const ecoleId = req.params.id;
            const result = await EcoleService.annulerAbonnement(ecoleId);
            return res.status(200).json(result);
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Méthode utilitaire pour obtenir des statistiques détaillées
    async getStatistiquesDetaillees(req, res) {
        try {
            const { ecoleId } = req.params;
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            // Vérifications de sécurité
            if (!ecoleId) {
                return res.status(400).json({
                    success: false,
                    message: "L'identifiant de l'école est requis"
                });
            }

            if (adminData.role !== 'super_admin' && adminData.ecole?.toString() !== ecoleId) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé"
                });
            }

            // Récupérer les statistiques détaillées
            const [
                ecoleInfo,
                apprenants,
                enseignants,
                jeux,
                planifications,
                participationsActives
            ] = await Promise.all([
                // Informations de l'école
                Ecole.findById(ecoleId).populate('pays'),
                
                // Détails des apprenants
                Apprenant.find({ ecole: ecoleId }).select('nom prenom matricule date'),
                
                // Détails des enseignants
                Enseignant.find({ 
                    ecole: ecoleId, 
                    role: { $in: ['enseignant', 'admin'] } 
                }).select('nom prenom email role'),
                
                // Détails des jeux
                Jeu.find({ ecole: ecoleId }).select('titre date').populate('createdBy', 'nom prenom'),
                
                // Détails des planifications
                Planification.aggregate([
                    {
                        $lookup: {
                            from: 'jeus',
                            localField: 'jeu',
                            foreignField: '_id',
                            as: 'jeuInfo'
                        }
                    },
                    {
                        $match: {
                            'jeuInfo.ecole': new mongoose.Types.ObjectId(ecoleId)
                        }
                    },
                    {
                        $project: {
                            pin: 1,
                            statut: 1,
                            type: 1,
                            date_debut: 1,
                            date_fin: 1,
                            limite_participant: 1,
                            participants: 1,
                            'jeuInfo.titre': 1
                        }
                    }
                ]),
                
                // Participations actives (planifications en cours)
                Planification.countDocuments({
                    statut: 'en cours'
                })
            ]);

            if (!ecoleInfo) {
                return res.status(404).json({
                    success: false,
                    message: "École non trouvée"
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Statistiques détaillées récupérées avec succès',
                data: {
                    ecole: {
                        id: ecoleId,
                        nom: ecoleInfo.libelle,
                        ville: ecoleInfo.ville,
                        adresse: ecoleInfo.adresse,
                        telephone: ecoleInfo.telephone,
                        email: ecoleInfo.email,
                        pays: ecoleInfo.pays?.libelle
                    },
                    statistiques: {
                        resume: {
                            total_apprenants: apprenants.length,
                            total_enseignants: enseignants.length,
                            total_jeux: jeux.length,
                            total_planifications: planifications.length,
                            participations_actives: participationsActives
                        },
                        details: {
                            apprenants_recents: apprenants
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .slice(0, 5),
                            jeux_recents: jeux
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .slice(0, 5),
                            planifications_actives: planifications.filter(p => p.statut === 'en cours')
                        }
                    },
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques détaillées :', error);
            return res.status(500).json({
                success: false,
                message: "Erreur interne du serveur",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = EcoleController;