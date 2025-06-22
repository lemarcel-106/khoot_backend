const express = require('express');
const router = express.Router();
const jeuController = require('../../controllers/jeuController');
const authenticateToken = require('../../middleware/authenticateToken');
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const { uploadImage } = require('../../middleware/upload');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification et un accès aux écoles
router.use(authenticate);
router.use(requireEcoleAccess);

router.get('/jeux', jeuController.getAllJeux);

router.post('/jeux',authenticateToken, uploadImage.single('image'), checkRequiredFields(['titre']), jeuController.createJeu);

router.put('/jeux/update/:id', jeuController.updateJeu);

router.delete('/jeux/delete/:id', jeuController.deleteJeuById);

router.get('/jeux/:id', jeuController.getJeuById);

router.post('/jeux/pin', jeuController.getJeuDetailsByPin);


module.exports = router;
