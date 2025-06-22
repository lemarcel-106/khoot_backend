const express = require('express');
const router = express.Router();
const typeQuestionController = require('../../controllers/typeQuestionController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')
const authenticateToken = require('../../middleware/authenticateToken');

router.get('/type-question',typeQuestionController.getAllTypeQuestions);

router.post('/type-question',checkRequiredFields(['libelle', 'description', 'reference']),  typeQuestionController.createTypeQuestion);

router.put('/type-question/update/:id',authenticateToken, typeQuestionController.updateTypeQuestion);

router.delete('/type-question/delete/:id',authenticateToken, typeQuestionController.deleteTypeQuestionById);

module.exports = router;
