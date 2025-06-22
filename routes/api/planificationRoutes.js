const express = require('express');
const PlanificationController = require('../../controllers/planificationController');
const router = express.Router();
const checkRequiredFields= require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.post('/planification',checkRequiredFields([ 'statut', 'date_debut', 'date_fin','heure_debut','heure_fin','type','limite_participant', 'jeu']),  PlanificationController.createPlanification);

router.get('/planification', PlanificationController.getPlanificationByPin);

router.put('/planification/update/:id', PlanificationController.updatePlanification);

router.delete('/planification/delete/:id', PlanificationController.deletePlanificationById);

router.get('/planification/:id', PlanificationController.getPlanificationById);

router.get('/planification/jeu/:id', PlanificationController.getPlanificationsByJeu);

router.post('/planification/pin', PlanificationController.getPlanificationByPin);

router.post('/planification/add-participant', PlanificationController.addExistingParticipantToPlan);

module.exports = router;
