const express = require('express');
const EcoleController = require('../../controllers/ecoleController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification et un accès aux écoles
router.use(authenticate);
router.use(requireEcoleAccess);

router.post('/ecoles', checkRequiredFields(['libelle', 'adresse', 'ville', 'telephone', 'email', 'fichier', 'pays', 'admin']), EcoleController.createEcole);

router.put('/ecoles/update/:id', authenticateToken, EcoleController.updateEcole);

router.get('/my-ecoles', EcoleController.getMyEcoles);

router.delete('/ecoles/delete/:id', authenticateToken, EcoleController.deleteEcole);

router.get('/ecoles/id', EcoleController.getEcoleById);

router.get('/ecoles', EcoleController.getAllEcoles);

router.post('/ecoles/email', EcoleController.getMyEcoles);

router.get('/:ecoleId/statistiques', EcoleController.getStatistiques);


router.post('/ecoles/:id/renouveler-abonnement', EcoleController.renouvelerAbonnement);
router.post('/ecoles/:id/annuler-abonnement', EcoleController.annulerAbonnement);


module.exports = router;
