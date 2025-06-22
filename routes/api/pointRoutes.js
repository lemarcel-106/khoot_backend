const express = require('express');
const router = express.Router();
const pointController = require('../../controllers/pointController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.get('/points',  pointController.getAllPoints);

router.post('/points', checkRequiredFields(['nature', 'valeur', 'description']), pointController.createPoint);

router.put('/point/update/:id',authenticateToken, pointController.updatePoint);

router.delete('/point/delete/:id',authenticateToken, pointController.deletePointById);

module.exports = router;
