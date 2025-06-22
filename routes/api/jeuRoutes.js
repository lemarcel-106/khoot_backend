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

// Route modifiée : image devient optionnelle, seul le titre est requis
router.post('/jeux', 
    authenticateToken, 
    uploadImage.single('image'), // Image optionnelle
    checkRequiredFields(['titre']), // Seul le titre est obligatoire
    jeuController.createJeu
);

// Route de mise à jour avec image optionnelle
router.put('/jeux/update/:id', 
    uploadImage.single('image'), // Image optionnelle pour la mise à jour aussi
    jeuController.updateJeu
);

router.delete('/jeux/delete/:id', jeuController.deleteJeuById);

router.get('/jeux/:id', jeuController.getJeuById);

router.post('/jeux/pin', jeuController.getJeuDetailsByPin);

module.exports = router;