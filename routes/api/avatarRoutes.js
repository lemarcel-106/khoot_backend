const express = require('express');
const router = express.Router();
const avatarController = require('../../controllers/avatarController');
const {uploadAvatar} = require('../../middleware/upload'); // Middleware pour gérer l'upload des fichiers

// Route pour créer un avatar
router.post('/avatar/create', uploadAvatar.single('image'), avatarController.createAvatar);

// Route pour supprimer un avatar
router.delete('/avatar/delete/:id', avatarController.deleteAvatar);

// Route pour récupérer tous les avatars
router.get('/avatars', avatarController.getAllAvatars);

module.exports = router;
