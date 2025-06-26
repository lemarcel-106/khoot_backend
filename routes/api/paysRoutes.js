const express = require('express');
const PaysController = require('../../controllers/paysController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

// ✅ ROUTES CORRIGÉES
router.post('/pays', checkRequiredFields(['libelle']), PaysController.createPays);
router.get('/pays', PaysController.getAllPays); // ✅ CORRIGÉ : .use -> .get
router.get('/pays/:id', PaysController.getPaysById); // ✅ CORRIGÉ : /id -> /:id
router.post('/pays/update/:id', authenticateToken, PaysController.updatePays);
router.post('/pays/delete/:id', authenticateToken, PaysController.deletePaysById);

// Vérifier si un libellé existe
router.get('/pays/check-libelle/:libelle', PaysController.checkPaysLibelleExists);

// Récupérer les pays avec écoles
router.get('/pays/avec-ecoles', PaysController.getPaysAvecEcoles);

// Mise à jour avec ID dans le body
router.post('/pays/update', 
    authenticateToken,
    checkRequiredFields(['id']),
    PaysController.updatePaysFromBody
);



module.exports = router;