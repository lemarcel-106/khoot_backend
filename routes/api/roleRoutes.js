const express = require('express');
const RoleController = require('../../controllers/roleController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');


router.post('/roles',checkRequiredFields(['libelle']), RoleController.createRole);

router.put('/roles/update/:id',authenticateToken, RoleController.updateRole);

router.delete('/roles/delete/:id',authenticateToken, RoleController.deleteRoleById);

router.get('/roles', RoleController.getAllRoles);

router.get('/roles/id', RoleController.getRoleById);

module.exports = router;
