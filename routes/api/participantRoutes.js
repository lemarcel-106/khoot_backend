// ===== routes/api/participantRoutes.js - CORRIGÉ =====
const express = require('express');
const ParticipationController = require('../../controllers/participantController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

router.post('/participant', 
    checkRequiredFields(['apprenant', 'planification']), 
    ParticipationController.createParticipation
);

// ✅ CORRIGÉ : PUT -> POST
router.post('/participant/update/:id', 
    ParticipationController.updateParticipant
);

// ✅ CORRIGÉ : DELETE -> POST
router.post('/participant/delete/:id', 
    ParticipationController.deleteParticipantById
);

router.get('/participant', 
    ParticipationController.getAllParticipations
);

router.get('/participant/:id', 
    ParticipationController.getParticipationById
);

router.get('/participant/apprenant/:id', 
    ParticipationController.getParticipationsByApprenant
);

router.get('/participant/planification/:id', 
    ParticipationController.getParticipantsByPlanification
);

module.exports = router;