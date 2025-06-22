const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/temoignageController');

router.post('/', ctrl.create);
router.get('/', ctrl.getAll);
router.get('/public', ctrl.getValid);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
