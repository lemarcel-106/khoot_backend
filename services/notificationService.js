const Notification = require('../models/Notification');

exports.create = (data) => Notification.create(data);
exports.getByEcole = (ecoleId) => Notification.find({ ecole: ecoleId });
exports.markAsRead = (id) => Notification.findByIdAndUpdate(id, { statut: 'lue' }, { new: true });
