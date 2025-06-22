const express = require('express');
const AdminController = require('../../controllers/adminController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

// Route pour créer un admin - le matricule n'est plus requis car généré automatiquement
router.post('/admin', checkRequiredFields(['nom', 'prenom', 'genre', 'statut', 'phone', 'email', 'adresse', 'pays', 'role', 'ecole']), AdminController.createAdmin);

router.put('/admin/update/:id', authenticateToken, AdminController.updateAdmin);

router.delete('/admin/delete/:id', authenticateToken, AdminController.deleteAdminById);

router.post('/admin/matricule', authenticateToken, AdminController.getAdminByMatricule);

router.get('/admin/:id', authenticateToken, AdminController.getAdminById);

router.get('/admin', authenticateToken, AdminController.getAllAdmin);

// Nouvelles routes pour la gestion du profil personnel
router.get('/profile', authenticateToken, AdminController.getMyProfile);

router.put('/profile', authenticateToken, AdminController.updateMyProfile);

module.exports = router;