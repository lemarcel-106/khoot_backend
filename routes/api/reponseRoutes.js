const express = require('express');
const router = express.Router();
const reponseController = require('../../controllers/reponseController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.get('/reponse', reponseController.getAllReponses);

router.get('/reponse/:id', reponseController.getReponseById);

router.post('/reponse',checkRequiredFields(['question']), reponseController.createReponse);

router.post('/reponse/update/:id',authenticateToken, reponseController.updateReponse);

router.get('/reponse/delete/:id',authenticateToken, reponseController.deleteReponseById);

router.post('/reponse/multiple', reponseController.createMultiple);

module.exports = router;
