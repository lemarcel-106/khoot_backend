const express = require('express');
const EcoleController = require('../../controllers/ecoleController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');

// ===============================================
// MIDDLEWARES GLOBAUX POUR TOUTES LES ROUTES
// ===============================================

// Toutes les routes nécessitent une authentification et un accès aux écoles
router.use(authenticate);
router.use(requireEcoleAccess);

// ===============================================
// ROUTES CRUD POUR LES ÉCOLES
// ===============================================

// Créer une nouvelle école
router.post('/ecoles', 
    checkRequiredFields(['libelle', 'adresse', 'ville', 'telephone', 'email', 'fichier', 'pays', 'admin']), 
    EcoleController.createEcole
);

// Récupérer toutes les écoles (filtrées selon les permissions)
router.get('/ecoles', 
    EcoleController.getAllEcoles
);

// Récupérer une école par ID
router.get('/ecoles/:id', 
    EcoleController.getEcoleById
);

// Mettre à jour une école
router.put('/ecoles/update/:id', 
    authenticateToken, 
    EcoleController.updateEcole
);

// Supprimer une école
router.delete('/ecoles/delete/:id', 
    authenticateToken, 
    EcoleController.deleteEcole
);

// ===============================================
// ROUTES SPÉCIFIQUES À L'ADMIN CONNECTÉ
// ===============================================

// Récupérer les écoles de l'admin connecté
router.get('/my-ecoles', 
    EcoleController.getMyEcoles
);

// Récupérer une école par email (pour l'admin connecté)
router.post('/ecoles/email', 
    EcoleController.getMyEcoles
);

// ===============================================
// ROUTES POUR LES STATISTIQUES
// ===============================================

// Récupérer les statistiques de l'école de l'admin connecté
router.get('/mon-ecole/statistiques', 
    EcoleController.getMyEcoleStatistiques
);

// Récupérer les statistiques d'une école spécifique
router.get('/ecoles/:ecoleId/statistiques', 
    EcoleController.getStatistiques
);

// Récupérer les statistiques détaillées d'une école spécifique
router.get('/ecoles/:ecoleId/statistiques-detaillees', 
    EcoleController.getStatistiquesDetaillees
);

// ===============================================
// ROUTES POUR LA GESTION DES ABONNEMENTS
// ===============================================

// Renouveler l'abonnement d'une école
router.post('/ecoles/:id/renouveler-abonnement', 
    authenticateToken,
    checkRequiredFields(['abonnementId']),
    EcoleController.renouvelerAbonnement
);

// Annuler l'abonnement d'une école
router.post('/ecoles/:id/annuler-abonnement', 
    authenticateToken,
    EcoleController.annulerAbonnement
);

// ===============================================
// ROUTES OPTIONNELLES (si vous voulez les ajouter)
// ===============================================

// Route pour rechercher des écoles par critères (pour super_admin)
router.get('/ecoles/search/:critere', 
    authenticateToken,
    async (req, res) => {
        try {
            const { critere } = req.params;
            const { value } = req.query;
            
            // Vérifier que seul un super_admin peut faire cette recherche
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Privilèges super administrateur requis.'
                });
            }

            let query = {};
            
            switch (critere) {
                case 'ville':
                    query = { ville: new RegExp(value, 'i') };
                    break;
                case 'nom':
                    query = { libelle: new RegExp(value, 'i') };
                    break;
                case 'email':
                    query = { email: new RegExp(value, 'i') };
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Critère de recherche non valide. Utilisez: ville, nom, ou email'
                    });
            }

            const Ecole = require('../../models/Ecole');
            const ecoles = await Ecole.find(query)
                .populate('admin', 'nom prenom email')
                .populate('pays', 'libelle')
                .limit(20); // Limiter les résultats

            res.status(200).json({
                success: true,
                message: `Écoles trouvées pour ${critere}: ${value}`,
                data: ecoles,
                total: ecoles.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la recherche',
                error: error.message
            });
        }
    }
);

// Route pour obtenir le tableau de bord d'une école
router.get('/ecoles/:ecoleId/dashboard', 
    authenticateToken,
    async (req, res) => {
        try {
            const { ecoleId } = req.params;
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            // Vérifications de sécurité
            if (adminData.role !== 'super_admin' && adminData.ecole?.toString() !== ecoleId) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé"
                });
            }

            const mongoose = require('mongoose');
            const Ecole = require('../../models/Ecole');
            const Apprenant = require('../../models/Apprenant');
            const Admin = require('../../models/Admin');
            const Jeu = require('../../models/Jeu');
            const Planification = require('../../models/Planification');

            // Récupérer les données du tableau de bord
            const [ecole, statsGenerales, activitesRecentes] = await Promise.all([
                // Informations de l'école
                Ecole.findById(ecoleId)
                    .populate('pays', 'libelle')
                    .populate('admin', 'nom prenom email')
                    .populate('abonnementActuel'),

                // Statistiques générales
                Promise.all([
                    Apprenant.countDocuments({ ecole: ecoleId }),
                    Admin.countDocuments({ ecole: ecoleId, role: { $in: ['enseignant', 'admin'] } }),
                    Jeu.countDocuments({ ecole: ecoleId }),
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
                            $count: 'total'
                        }
                    ]).then(result => result[0]?.total || 0)
                ]),

                // Activités récentes
                Promise.all([
                    Apprenant.find({ ecole: ecoleId })
                        .sort({ date: -1 })
                        .limit(5)
                        .select('nom prenom matricule date'),
                    Jeu.find({ ecole: ecoleId })
                        .sort({ date: -1 })
                        .limit(5)
                        .select('titre date')
                        .populate('createdBy', 'nom prenom'),
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
                                'jeuInfo.ecole': new mongoose.Types.ObjectId(ecoleId),
                                statut: 'en cours'
                            }
                        },
                        {
                            $limit: 5
                        },
                        {
                            $project: {
                                pin: 1,
                                type: 1,
                                date_debut: 1,
                                participants: 1,
                                'jeuInfo.titre': 1
                            }
                        }
                    ])
                ])
            ]);

            const [total_apprenants, total_enseignants, total_jeux, total_planifications] = statsGenerales;
            const [apprenants_recents, jeux_recents, planifications_actives] = activitesRecentes;

            res.status(200).json({
                success: true,
                message: 'Tableau de bord récupéré avec succès',
                data: {
                    ecole: {
                        id: ecole._id,
                        nom: ecole.libelle,
                        ville: ecole.ville,
                        adresse: ecole.adresse,
                        telephone: ecole.telephone,
                        email: ecole.email,
                        pays: ecole.pays?.libelle,
                        admin: ecole.admin,
                        abonnement: ecole.abonnementActuel
                    },
                    statistiques: {
                        total_apprenants,
                        total_enseignants,
                        total_jeux,
                        total_planifications
                    },
                    activites_recentes: {
                        apprenants_recents,
                        jeux_recents,
                        planifications_actives
                    },
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erreur dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du tableau de bord',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// Route pour exporter les données d'une école (CSV/JSON)
router.get('/ecoles/:ecoleId/export', 
    authenticateToken,
    async (req, res) => {
        try {
            const { ecoleId } = req.params;
            const { format = 'json' } = req.query; // json ou csv
            const adminData = {
                id: req.user.id,
                role: req.user.role,
                ecole: req.user.ecole
            };

            // Vérifications de sécurité
            if (adminData.role !== 'super_admin' && adminData.ecole?.toString() !== ecoleId) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé"
                });
            }

            const Ecole = require('../../models/Ecole');
            const Apprenant = require('../../models/Apprenant');
            const Admin = require('../../models/Admin');
            const Jeu = require('../../models/Jeu');

            const [ecole, apprenants, enseignants, jeux] = await Promise.all([
                Ecole.findById(ecoleId).populate('pays admin'),
                Apprenant.find({ ecole: ecoleId }).select('-__v'),
                Admin.find({ ecole: ecoleId }).select('-password -__v'),
                Jeu.find({ ecole: ecoleId }).populate('createdBy', 'nom prenom').select('-__v')
            ]);

            const exportData = {
                ecole: ecole,
                apprenants: apprenants,
                enseignants: enseignants,
                jeux: jeux,
                export_date: new Date().toISOString()
            };

            if (format === 'csv') {
                // Pour CSV, vous pourriez utiliser une bibliothèque comme 'csv-writer'
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="ecole_${ecoleId}_export.csv"`);
                // Ici, vous implémenteriez la conversion en CSV
                res.status(501).json({
                    success: false,
                    message: 'Export CSV pas encore implémenté. Utilisez format=json'
                });
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="ecole_${ecoleId}_export.json"`);
                res.status(200).json({
                    success: true,
                    message: 'Export réalisé avec succès',
                    data: exportData
                });
            }

        } catch (error) {
            console.error('Erreur export:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'export',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// ===============================================
// ROUTE POUR VALIDER LA DISPONIBILITÉ
// ===============================================

// Vérifier si un nom d'école ou email est disponible
router.post('/ecoles/check-availability', 
    authenticateToken,
    async (req, res) => {
        try {
            const { field, value } = req.body; // field: 'libelle' ou 'email', value: la valeur à vérifier
            
            if (!field || !value) {
                return res.status(400).json({
                    success: false,
                    message: 'Field et value sont requis'
                });
            }

            if (!['libelle', 'email', 'telephone'].includes(field)) {
                return res.status(400).json({
                    success: false,
                    message: 'Field doit être libelle, email ou telephone'
                });
            }

            const Ecole = require('../../models/Ecole');
            const query = {};
            query[field] = value;

            const existingEcole = await Ecole.findOne(query);
            const isAvailable = !existingEcole;

            res.status(200).json({
                success: true,
                message: `Vérification de disponibilité pour ${field}`,
                data: {
                    field,
                    value,
                    available: isAvailable,
                    message: isAvailable 
                        ? `${field} est disponible`
                        : `${field} est déjà utilisé`
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification',
                error: error.message
            });
        }
    }
);

module.exports = router;