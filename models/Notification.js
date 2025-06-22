const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['info', 'alerte'], default: 'info' },
  statut: { type: String, enum: ['non_lue', 'lue'], default: 'non_lue' },
  ecole: { type: mongoose.Schema.Types.ObjectId, ref: 'Ecole', required: true }
});

module.exports = mongoose.model('Notification', notificationSchema);
