const express = require('express');
const ParticipationController = require('../../controllers/participantController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.post('/participant', checkRequiredFields(['apprenant', 'planification']), ParticipationController.createParticipation);

router.put('/participant/update/:id', ParticipationController.updateParticipant);

router.delete('/participant/delete/:id', ParticipationController.deleteParticipantById);

router.get('/participant', ParticipationController.getAllParticipations);

router.get('/participant/:id', ParticipationController.getParticipationById);

router.get('/participant/apprenant/:id', ParticipationController.getParticipationsByApprenant);

router.get('/participant/planification/:id', ParticipationController.getParticipantsByPlanification);

router.get('/participant/planification', ParticipationController.getParticipationsByApprenant);

module.exports = router;
