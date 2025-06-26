const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');

router.get('/users', 
    authenticateToken, 
    userController.getUsers
);

router.post('/users', 
    checkRequiredFields(['name', 'email', 'statut', 'password', 'ecole', 'phone']), 
    userController.createUser
);

// ✅ CORRIGÉ : PUT -> POST
router.post('/user/update/:id', 
    authenticateToken, 
    userController.updateUser
);

// ✅ CORRIGÉ : DELETE -> POST
router.post('/user/delete/:id', 
    authenticateToken, 
    userController.deleteUserById
);

router.get('/user/:id', 
    authenticateToken, 
    userController.getUsersById
);

router.get('/user/ecole/:id', 
    authenticateToken, 
    userController.getUserByEcole
);

module.exports = router;