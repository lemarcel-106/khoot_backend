const PlanificationService = require('../services/planificationService');

const PlanificationController = {
    async createPlanification(req, res) {
        try {
            const planificationData = req.body;
            const planification = await PlanificationService.createPlanification(planificationData);
            return res.status(201).json({
                success: true,
                message: 'Planification créé avec succès',
                data: planification
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

 // Dans controllers/planificationController.js
// Remplacer la méthode getPlanificationsByJeu existante

    async getPlanificationsByJeu(req, res) {
        try {
            const jeuId = req.params.id;
            
            // ✅ VALIDATION : Vérifier que l'ID du jeu est fourni
            if (!jeuId) {
                return res.status(400).json({
                    success: false,
                    message: "L'ID du jeu est requis"
                });
            }
            
            // ✅ VALIDATION : Vérifier que le jeu existe
            const Jeu = require('../models/Jeu');
            const jeuExists = await Jeu.findById(jeuId);
            if (!jeuExists) {
                return res.status(404).json({
                    success: false,
                    message: "Jeu non trouvé"
                });
            }
            
            // Récupérer les planifications
            const planifications = await PlanificationService.getPlanificationsByJeu(jeuId);
            
            // ✅ CORRECTION : Valider et nettoyer les données
            const cleanedPlanifications = await PlanificationService.validateAndCleanPlanifications(planifications);
            
            // ✅ AMÉLIORATION : Ajouter des statistiques
            const stats = {
                totalPlanifications: cleanedPlanifications.length,
                planificationsActives: cleanedPlanifications.filter(p => p.statut === 'en cours').length,
                totalParticipants: cleanedPlanifications.reduce((total, p) => total + (p.participants?.length || 0), 0)
            };
            
            return res.status(200).json({
                success: true,
                message: `${cleanedPlanifications.length} planification(s) récupérée(s) avec succès`,
                data: cleanedPlanifications,
                statistiques: stats,
                jeu: {
                    id: jeuExists._id,
                    titre: jeuExists.titre
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Erreur getPlanificationsByJeu:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Erreur du serveur',
                error: error.message 
            });
        }
    },
    
    async getPlanificationByPin(req, res) {
        try {
            const pin = req.body;
            const planification = await PlanificationService.getPlanificationByPin(pin);
            if (!planification) {
                return res.status(404).json({ message: 'Planification non trouvée' });
            }
            return res.status(200).json(planification);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async addExistingParticipantToPlan(req, res) {
        try {
            const { planificationId, participantId } = req.body;
            const updatedJeu = await PlanificationService.addParticipant(planificationId, participantId);
            res.status(200).json({ message: 'Participant ajouté a la planification avec succès', jeu: updatedJeu });
        } catch (error) {
            // Gestion des erreurs avec un message adapté
            res.status(400).json({ message: error.message });
        }
    },

    async updatePlanification(req, res) {
        try {
            const planificationId = req.params.id;
            const planificationData = req.body;
            const updatedPlanification = await PlanificationService.updatePlanification(planificationId, planificationData);
            res.status(200).json({
                success: true,
                message: 'Planification mise à jour avec succès',
                data: updatedPlanification
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la planification',
                error: err.message
            });
        }
    },
    
     async getPlanificationById(req, res) {
        const { id } = req.params;

        try {
            const pin = req.body;
            const planification = await PlanificationService.getPlanificationById(id);
            if (!planification) {
                return res.status(404).json({ message: 'Planification non trouvée' });
            }
            return res.status(200).json(planification);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async deletePlanificationById(req, res) {
        try {
            const planificationId = req.params.id;
            await PlanificationService.deletePlanificationById(planificationId);
            res.status(200).json({
                success: true,
                message: 'Planification supprimée avec succès',
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la planification',
                error: err.message
            });
        }
    }
};

module.exports = PlanificationController;
