const express = require('express');
const PaysController = require('../../controllers/paysController');
const router = express.Router();
const checkRequiredFields= require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.post('/pays',checkRequiredFields(['libelle']), PaysController.createPays);

router.put('/pays/update/:id',authenticateToken, PaysController.updatePays);

router.delete('/pays/delete/:id',authenticateToken, PaysController.deletePaysById);

router.use('/pays', PaysController.getAllPays);

router.get('/pays/id', PaysController.getPaysById);

module.exports = router;
