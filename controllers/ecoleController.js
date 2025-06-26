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

    // Méthode pour obtenir les statistiques détaillées selon le format exact souhaité
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

            // Vérification des permissions d'accès à l'école
            if (adminData.role !== 'super_admin') {
                if (adminData.ecole && adminData.ecole.toString() !== ecoleId) {
                    return res.status(403).json({
                        success: false,
                        message: "Accès refusé. Vous ne pouvez consulter que les statistiques de votre école."
                    });
                }
            }

            // 1. Récupérer les détails complets de l'école avec apprenants
            const ecoleDetails = await Ecole.findById(ecoleId)
                .populate('pays', 'libelle')
                .populate('abonnementActuel')
                .populate('apprenants')
                .lean();

            if (!ecoleDetails) {
                return res.status(404).json({
                    success: false,
                    message: "École non trouvée"
                });
            }

            // 2. Récupérer l'administrateur de l'école
            const administrateur = await Enseignant.findOne({ 
                ecole: ecoleId, 
                role: 'admin' 
            }).populate('pays', 'libelle').lean();

            // 3. Récupérer la liste des jeux avec leurs professeurs associés
            const jeuxAvecProfesseurs = await Jeu.find({ ecole: ecoleId })
                .populate('createdBy', 'nom prenom email matricule role')
                .populate('questions')
                .sort({ date: -1 })
                .lean();

            // 4. Récupérer toutes les planifications avec détails
            const planifications = await Planification.aggregate([
                {
                    $lookup: {
                        from: 'jeus', // Collection des jeux
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
                    $lookup: {
                        from: 'admins', // Collection des enseignants
                        localField: 'createdBy',
                        foreignField: '_id',
                        as: 'enseignantInfo'
                    }
                },
                {
                    $sort: { dateCreation: -1 }
                }
            ]);

            // Construire la réponse selon le format exact demandé
            return res.status(200).json({
                success: true,
                message: "Statistiques détaillées de l'école récupérées avec succès",
                data: {
                    // Détails de l'école avec la structure exacte
                    ecole: {
                        _id: ecoleDetails._id,
                        libelle: ecoleDetails.libelle,
                        adresse: ecoleDetails.adresse,
                        ville: ecoleDetails.ville,
                        telephone: ecoleDetails.telephone,
                        email: ecoleDetails.email,
                        fichier: ecoleDetails.fichier,
                        pays: ecoleDetails.pays ? {
                            _id: ecoleDetails.pays._id,
                            libelle: ecoleDetails.pays.libelle
                        } : null,
                        apprenants: ecoleDetails.apprenants || []
                    },

                    // Abonnement associé selon le format exact
                    abonnement: ecoleDetails.abonnementActuel ? {
                        _id: ecoleDetails.abonnementActuel._id,
                        nom: ecoleDetails.abonnementActuel.nom,
                        description: ecoleDetails.abonnementActuel.description,
                        prix: ecoleDetails.abonnementActuel.prix,
                        nombreJeuxMax: ecoleDetails.abonnementActuel.nombreJeuxMax,
                        nombreApprenantsMax: ecoleDetails.abonnementActuel.nombreApprenantsMax,
                        nombreEnseignantsMax: ecoleDetails.abonnementActuel.nombreEnseignantsMax,
                        dureeEnJours: ecoleDetails.abonnementActuel.dureeEnJours,
                        dateCreation: ecoleDetails.abonnementActuel.dateCreation
                    } : null,

                    // Administrateur selon le format exact
                    administrateur: administrateur ? {
                        _id: administrateur._id,
                        nom: administrateur.nom,
                        prenom: administrateur.prenom,
                        matricule: administrateur.matricule,
                        genre: administrateur.genre,
                        statut: administrateur.statut,
                        phone: administrateur.phone,
                        email: administrateur.email,
                        adresse: administrateur.adresse,
                        date: administrateur.date,
                        pays: administrateur.pays ? {
                            _id: administrateur.pays._id,
                            libelle: administrateur.pays.libelle
                        } : null,
                        role: administrateur.role
                    } : null,

                    // Liste des jeux avec professeur selon le format exact
                    jeux: jeuxAvecProfesseurs.map(jeu => ({
                        _id: jeu._id,
                        titre: jeu.titre,
                        image: jeu.image,
                        date: jeu.date,
                        nombreQuestions: jeu.questions?.length || 0,
                        professeur: jeu.createdBy ? {
                            _id: jeu.createdBy._id,
                            nom: jeu.createdBy.nom,
                            prenom: jeu.createdBy.prenom,
                            email: jeu.createdBy.email,
                            matricule: jeu.createdBy.matricule,
                            role: jeu.createdBy.role
                        } : null
                    })),

                    // Planifications selon le format exact
                    planifications: {
                        total: planifications.length,
                        liste: planifications.map(planif => ({
                            _id: planif._id,
                            pin: planif.pin,
                            statut: planif.statut,
                            jeu: planif.jeuInfo && planif.jeuInfo.length > 0 ? {
                                _id: planif.jeuInfo[0]._id,
                                titre: planif.jeuInfo[0].titre
                            } : null,
                            enseignant: planif.enseignantInfo && planif.enseignantInfo.length > 0 ? {
                                nom: planif.enseignantInfo[0].nom,
                                prenom: planif.enseignantInfo[0].prenom,
                                matricule: planif.enseignantInfo[0].matricule
                            } : null
                        }))
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques détaillées :', error);
            return res.status(500).json({
                success: false,
                message: "Erreur interne du serveur",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    
    async getParametresEcole(req, res) {
        try {
            // Récupérer l'ID de l'école depuis le token JWT
            const currentUser = req.user;
            
            console.log('🔍 Debug getParametresEcole:');
            console.log('- User:', currentUser);

            // Vérifier que l'admin a une école associée
            if (!currentUser.ecole) {
                return res.status(400).json({
                    success: false,
                    message: "Aucune école associée à votre compte"
                });
            }

            // ✅ SOLUTION DIRECTE : Récupérer l'école sans vérification de permissions stricte
            // pour les paramètres de sa propre école
            const ecole = await EcoleService.getEcoleById(currentUser.ecole, null);

            if (!ecole) {
                return res.status(404).json({
                    success: false,
                    message: "École non trouvée"
                });
            }

            // Formater la réponse avec les paramètres de l'école
            const parametres = {
                ecole: {
                    id: ecole._id,
                    libelle: ecole.libelle,
                    adresse: ecole.adresse,
                    ville: ecole.ville,
                    telephone: ecole.telephone,
                    email: ecole.email,
                    pays: ecole.pays,
                    admin: ecole.admin
                },
                abonnement: null,
                limites: {
                    apprenants: {
                        actuels: ecole.apprenants?.length || 0,
                        maximum: 0
                    },
                    enseignants: {
                        actuels: 0,
                        maximum: 0
                    },
                    jeux: {
                        actuels: 0,
                        maximum: 0
                    }
                }
            };

            // Si un abonnement actuel existe
            if (ecole.abonnementActuel) {
                parametres.abonnement = {
                    id: ecole.abonnementActuel._id,
                    nom: ecole.abonnementActuel.nom,
                    description: ecole.abonnementActuel.description,
                    prix: ecole.abonnementActuel.prix,
                    dateDebut: ecole.abonnementActuel.dateDebut,
                    dateFin: ecole.abonnementActuel.dateFin,
                    dureeEnJours: ecole.abonnementActuel.dureeEnJours,
                    statut: new Date() < new Date(ecole.abonnementActuel.dateFin) ? 'actif' : 'expiré'
                };

                // Mettre à jour les limites avec l'abonnement
                parametres.limites.apprenants.maximum = ecole.abonnementActuel.nombreApprenantsMax || 0;
                parametres.limites.enseignants.maximum = ecole.abonnementActuel.nombreEnseignantsMax || 0;
                parametres.limites.jeux.maximum = ecole.abonnementActuel.nombreJeuxMax || 0;
            }

            // Compter les enseignants actuels
            const Enseignant = require('../models/Admin');
            const enseignantsCount = await Enseignant.countDocuments({
                ecole: currentUser.ecole,
                role: { $in: ['enseignant', 'admin'] }
            });
            parametres.limites.enseignants.actuels = enseignantsCount;

            // Compter les jeux actuels
            const Jeu = require('../models/Jeu');
            const jeuxCount = await Jeu.countDocuments({ ecole: currentUser.ecole });
            parametres.limites.jeux.actuels = jeuxCount;

            return res.status(200).json({
                success: true,
                message: 'Paramètres de l\'école récupérés avec succès',
                data: parametres,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres:', error);
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération des paramètres de l'école",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Méthode pour mettre à jour les paramètres de l'école
    async updateParametresEcole(req, res) {
        try {
            // Récupérer l'ID de l'école depuis le token JWT
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

            // Extraire les données à mettre à jour
            const { libelle, adresse, ville, telephone, email, pays } = req.body;

            // Préparer les données de mise à jour
            const updateData = {};
            if (libelle) updateData.libelle = libelle;
            if (adresse) updateData.adresse = adresse;
            if (ville) updateData.ville = ville;
            if (telephone) updateData.telephone = telephone;
            if (email) updateData.email = email;
            if (pays) updateData.pays = pays;

            // Mettre à jour l'école
            const updatedEcole = await EcoleService.updateEcole(adminData.ecole, updateData, adminData);

            return res.status(200).json({
                success: true,
                message: 'Paramètres de l\'école mis à jour avec succès',
                data: updatedEcole,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour des paramètres:', error);
            return res.status(500).json({
                success: false,
                message: "Erreur lors de la mise à jour des paramètres de l'école",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

}; // ✅ IMPORTANT : Bien fermer l'objet EcoleController

module.exports = EcoleController;

