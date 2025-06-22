const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/notificationController');

router.post('/', ctrl.create);
router.get('/:ecoleId', ctrl.getByEcole);
router.patch('/:id/marquer-lue', ctrl.markAsRead);

module.exports = router;
