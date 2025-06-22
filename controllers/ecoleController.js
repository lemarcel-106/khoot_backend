const EcoleService = require('../services/ecoleService');
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

     async getStatistiques(req, res) {
        try {
            const { ecoleId } = req.params;

            // Vérifier si l'école existe
            if (!ecoleId) {
                return res.status(400).json({
                    error: "L'identifiant de l'école est requis"
                });
            }

            // Total jeux de l'école
            const total_jeux = await Jeu.countDocuments({ ecole: ecoleId });

            // Total enseignants de l'école
            const total_enseignants = await Enseignant.countDocuments({
                ecole: ecoleId,
                role: 'enseignant'
            });

            // Total apprenants de l'école
            const total_apprenants = await Apprenant.countDocuments({
                ecole: ecoleId
            });

            // Total planifications de l'école
            const total_planifications = await Planification.countDocuments({
                ecole: ecoleId
            });

            return res.json({
                success: true,
                data: {
                    total_jeux,
                    total_enseignants,
                    total_apprenants,
                    total_planifications
                }
            });

        } catch (error) {
            console.error('Erreur statistiques :', error);
            return res.status(500).json({
                success: false,
                error: "Erreur lors de la récupération des statistiques de l'école."
            });
        }
    },
    
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
};

module.exports = EcoleController;