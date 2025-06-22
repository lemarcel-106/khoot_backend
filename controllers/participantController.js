const ParticipationService = require('../services/participantService');

const ParticipationController = {

    async createParticipation(req, res) {
        try {
            const participationData = req.body;
            const participation = await ParticipationService.createParticipation(participationData);
            return res.status(201).json(participation);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getAllParticipations(req, res) {
        try {
            const participations = await ParticipationService.getAllParticipations();
            return res.status(200).json(participations);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getParticipationById(req, res) {
        try {
            const participationId = req.params.id;
            const participation = await ParticipationService.getParticipationById(participationId);
            if (!participation) {
                return res.status(404).json({ message: 'Participation non trouvée' });
            }
            return res.status(200).json(participation);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getParticipationsByApprenant(req, res) {
        try {
            const apprenantId = req.params.id;
            const participations = await ParticipationService.getParticipationsByApprenant(apprenantId);
            if (participations.length === 0) {
                return res.status(404).json({ message: 'Aucune participation trouvée pour cet apprenant' });
            }
            return res.status(200).json(participations);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async updateParticipant(req, res) {
        try {
            const participantId = req.params.id;
            const participantData = req.body;
            const updatedParticipant = await ParticipationService.updateParticipant(participantId, participantData);
            res.status(200).json({
                success: true,
                message: 'Participant mis à jour avec succès',
                data: updatedParticipant
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du participant',
                error: err.message
            });
        }
    },

    async deleteParticipantById(req, res) {
        try {
            const participantId = req.params.id;
            await ParticipationService.deleteParticipantById(participantId);
            res.status(200).json({
                success: true,
                message: 'Participant supprimé avec succès',
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du participant',
                error: err.message
            });
        }
    },

    async getParticipantsByPlanification(req, res) {
        try {
            const planificationId = req.params.id;
            const participants = await ParticipationService.getParticipantsByPlanification(planificationId);
            if (!participants || participants.length === 0) {
                return res.status(404).json({ message: 'Aucun participant trouvé pour cette planification' });
            }
            return res.status(200).json({
                success: true,
                message: 'Participants récupérés avec succès',
                data: participants
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
};

module.exports = ParticipationController;
