const express = require('express');
const router = express.Router();
const apprenantController = require('../../controllers/apprenantController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification et un accès aux écoles
router.use(authenticate);
router.use(requireEcoleAccess);

router.post('/add-apprenant', apprenantController.addExistingApprenantToJeu);

router.post('/apprenant/matricule', apprenantController.getApprenantByMatricule);

router.post('/apprenant', checkRequiredFields(['nom', 'avatar', 'ecole', 'prenom', 'phone']), apprenantController.createApprenant);

router.put('/apprenant/update/:id', authenticateToken, apprenantController.updateApprenant);

router.delete('/apprenant/delete/:id', authenticateToken, apprenantController.deleteApprenantById);

router.get('/apprenant/:id', apprenantController.getApprenantById);

router.get('/apprenant', apprenantController.getApprenants);


module.exports = router;
