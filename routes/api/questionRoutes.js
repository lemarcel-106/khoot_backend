const express = require('express');
const router = express.Router();
const questionController = require('../../controllers/questionController');
const checkRequiredFields = require('../../middleware/checkRequiredFields');
const authenticateToken = require('../../middleware/authenticateToken');
const { uploadImage } = require('../../middleware/upload');

router.get('/questions', 
    questionController.getAllQuestions
);

router.post('/questions', 
    uploadImage.single('fichier'), 
    checkRequiredFields(['libelle', 'temps', 'limite_response', 'typeQuestion', 'point']), 
    questionController.createQuestion
);

// ✅ CORRIGÉ : POST au lieu de PUT
router.post('/questions/update/:id', 
    authenticateToken, 
    questionController.updateQuestion
);

// ✅ CORRIGÉ : POST au lieu de GET pour delete
router.post('/questions/delete/:id', 
    authenticateToken, 
    questionController.deleteQuestionById
);

router.get('/questions/:id', 
    questionController.recupererQuestionParId
);

router.post('/questions/add-question', 
    questionController.addExistingReponseToQuestion
);

module.exports = router;