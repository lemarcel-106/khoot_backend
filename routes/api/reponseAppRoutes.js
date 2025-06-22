const express = require('express');
const router = express.Router();
const reponseAppController = require('../../controllers/reponseAppController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.get('/reponse-app/participant/:id', reponseAppController.getAllReponseAppById);

router.get('/reponse-app/', reponseAppController.getAllReponseApp);

router.put('/reponse-app/update/:id', authenticateToken, reponseAppController.updateReponseApp);

router.delete('/reponse-app/delete/:id', authenticateToken, reponseAppController.deleteReponseAppById);

router.post('/reponse-app', checkRequiredFields(['temps_reponse', 'reponse_apprenant', 'participant', 'question']), reponseAppController.createReponseApp);

module.exports = router;
