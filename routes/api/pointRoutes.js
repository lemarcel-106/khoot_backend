const express = require('express');
const router = express.Router();
const pointController = require('../../controllers/pointController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');


router.get('/points', 
    authenticateToken,
    pointController.getAllPoints
);


router.post('/points', 
    checkRequiredFields(['nature', 'valeur', 'description']), 
    pointController.createPoint
);

// ✅ CORRIGÉ : PUT -> POST
router.post('/point/update/:id', 
    authenticateToken, 
    pointController.updatePoint
);

// ✅ CORRIGÉ : DELETE -> POST
router.post('/point/delete/:id', 
    authenticateToken, 
    pointController.deletePointById
);

module.exports = router;
