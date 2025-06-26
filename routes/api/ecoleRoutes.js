const express = require('express');
const EcoleController = require('../../controllers/ecoleController');
const router = express.Router();
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');

// Routes CRUD
router.post('/ecoles', 
    authenticate,
    requireEcoleAccess,  // ← Commenté temporairement
    checkRequiredFields(['libelle', 'adresse', 'ville', 'telephone', 'email', 'fichier', 'pays']), 
    EcoleController.createEcole
);
router.get('/ecoles', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getAllEcoles
);

router.get('/ecoles/:id', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getEcoleById
);

// ✅ CORRIGÉ : PUT -> POST
// ✅ APRÈS
router.post('/ecoles/update/:id', 
    authenticate,
    requireEcoleAccess,
    EcoleController.updateEcole
);
// ✅ CORRIGÉ : DELETE -> POST
router.post('/ecoles/delete/:id', 
    authenticate,
    requireEcoleAccess,
    EcoleController.deleteEcole
);

// Routes spécialisées
router.get('/my-ecoles', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getMyEcoles
);

router.post('/ecoles/email', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getMyEcoles
);

// Statistiques
router.get('/mon-ecole/statistiques', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getMyEcoleStatistiques
);

router.get('/ecoles/:ecoleId/statistiques', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getStatistiques
);

router.get('/ecoles/:ecoleId/statistiques-detaillees', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getStatistiquesDetaillees
);

// APRÈS (corrigé) :
router.post('/ecoles/:id/renouveler-abonnement', 
    authenticate,           // ← Un seul middleware d'auth
    requireEcoleAccess,
    checkRequiredFields(['abonnementId']),
    EcoleController.renouvelerAbonnement
);

router.post('/ecoles/:id/annuler-abonnement', 
    authenticate,
    requireEcoleAccess,
    authenticateToken,
    EcoleController.annulerAbonnement
);

// Paramètres
router.get('/parametres', 
    authenticate,
    requireEcoleAccess,
    EcoleController.getParametresEcole
);

router.post('/parametres/update', 
    authenticate,
    requireEcoleAccess,
    EcoleController.updateParametresEcole
);

module.exports = router;