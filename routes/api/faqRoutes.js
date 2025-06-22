const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/faqController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')

router.post('/', ctrl.create);
router.get('/', ctrl.getAll);
router.get('/public', ctrl.getPublic);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
