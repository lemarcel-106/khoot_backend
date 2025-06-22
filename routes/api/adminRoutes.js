const express = require('express');
const AdminController = require('../../controllers/adminController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.post('/admin', checkRequiredFields(['nom', 'prenom', 'matricule', 'genre', 'statut', 'phone', 'email', 'adresse', 'pays', 'role', 'ecole']), AdminController.createAdmin);

router.put('/admin/update/:id', authenticateToken, AdminController.updateAdmin);

router.delete('/admin/delete/:id', authenticateToken, AdminController.deleteAdminById);

router.post('/admin/matricule', authenticateToken, AdminController.getAdminByMatricule);

router.get('/admin/:id', authenticateToken, AdminController.getAdminById);

router.get('/admin', authenticateToken, authenticateToken, AdminController.getAllAdmin);


module.exports = router;
