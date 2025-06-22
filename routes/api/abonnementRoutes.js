const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/abonnementController');
const checkRequiredFields = require('../../middleware/checkRequiredFields')


router.post('/', ctrl.create);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

//router.post('/:id/renouveler', ctrl.renouveler);

module.exports = router;
