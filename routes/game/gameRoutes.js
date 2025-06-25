const express = require("express");
const gameController = require("../../controllers/gameController");
const checkRequiredFields = require("../../middleware/checkRequiredFields");
const router = express.Router();

// Verifier si la planification existe et recuperer l'id de planification
router.post("/planification", gameController.getPlanificationByPin);
router.get("/planification/:id", gameController.getPlanificationById);
router.post("/login-participant", checkRequiredFields(['matricule']), gameController.loginParticipant);
router.post("/participant", checkRequiredFields(['apprenant', 'planification']), gameController.createParticipation);
router.post("/reponse-app", checkRequiredFields(['temps_reponse', 'reponse_apprenant', 'participant', 'question']), gameController.createReponseApp);
router.get('/participant/:id', gameController.getParticipationById);
router.put('/participant/update/:id', gameController.updateParticipant);

// Authentifier l'apprenant et creer une participation de l'apprenant a la planification

// Reception de score

module.exports = router;
