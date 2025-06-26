const express = require('express');
const router = express.Router();
const apprenantController = require('../../controllers/apprenantController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const { authenticate, requireEcoleAccess } = require('../../utils/middlewares/authMiddleware');
const { checkSubscriptionLimits } = require('../../middleware/subscriptionLimitsMiddleware');


// Routes principales
router.post('/add-apprenant', 
    authenticate,
    requireEcoleAccess,
    apprenantController.addExistingApprenantToJeu
);

router.post('/apprenant/matricule', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getApprenantByMatricule
);

router.post('/apprenants', 
    authenticate,
    checkSubscriptionLimits('apprenants'), // ✅ AJOUT : Contrôle des limites
    checkRequiredFields(['nom', 'prenom', 'avatar']),
    apprenantController.createApprenant
);

// ✅ CORRIGÉ : Suppression d'authenticateToken
router.post('/apprenant/update/:id', 
    authenticate,       // ✅ Un seul middleware d'auth
    requireEcoleAccess,
    apprenantController.updateApprenant
);

// ✅ CORRIGÉ : Suppression d'authenticateToken
router.post('/apprenant/delete/:id', 
    authenticate,       // ✅ Un seul middleware d'auth
    requireEcoleAccess,
    apprenantController.deleteApprenantById
);

router.get('/apprenant/:id', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getApprenantById
);

router.get('/apprenant', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getApprenants
);

router.get('/apprenant/:id/sessions', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getSessionsApprenant
);

router.get('/apprenant/:id/statistiques', 
    authenticate,
    requireEcoleAccess,
    apprenantController.getStatistiquesApprenant
);

module.exports = router;