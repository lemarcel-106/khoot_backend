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

// ===== ROUTES DE RÉCUPÉRATION =====

/**
 * Route pour récupérer la liste simple des jeux (titre, image, date, créateur)
 * Utilisation : Pour afficher une liste rapide des jeux dans une interface
 * Réponse : Données légères, chargement rapide
 */
router.get('/jeux', jeuController.getAllJeux);

/**
 * Route pour récupérer la liste détaillée des jeux avec toutes les relations
 * Utilisation : Pour l'administration, tableau de bord détaillé
 * Réponse : Toutes les données (questions, planifications, participants, etc.)
 */
router.get('/jeux/detailles', jeuController.getAllJeuxDetailles);

/**
 * Route pour récupérer un jeu spécifique par son ID avec tous les détails
 * Utilisation : Pour afficher/éditer un jeu particulier
 * Réponse : Jeu complet avec toutes ses relations
 */
router.get('/jeux/:id', jeuController.getJeuById);

// ===== ROUTES D'ACTION =====

/**
 * Route pour créer un nouveau jeu
 * Image optionnelle, seul le titre est obligatoire
 */
router.post('/jeux', 
    authenticateToken, 
    uploadImage.single('image'), // Image optionnelle
    checkRequiredFields(['titre']), // Seul le titre est obligatoire
    jeuController.createJeu
);

/**
 * Route pour récupérer un jeu par son PIN
 * Utilisé probablement pour rejoindre une session de jeu
 */
router.post('/jeux/pin', jeuController.getJeuDetailsByPin);

/**
 * Route pour mettre à jour un jeu existant
 * Image optionnelle pour la mise à jour aussi
 */
router.put('/jeux/update/:id', 
    uploadImage.single('image'), // Image optionnelle pour la mise à jour
    jeuController.updateJeu
);

/**
 * Route pour supprimer un jeu
 */
router.delete('/jeux/delete/:id', jeuController.deleteJeuById);

module.exports = router;