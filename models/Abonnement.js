const mongoose = require('mongoose');

const abonnementSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: String,
  prix: { type: Number, default: 0 },
  nombreJeuxMax: Number,
  nombreApprenantsMax: Number,
  nombreEnseignantsMax: Number,
  dureeEnJours: {
  type: Number,
  required: true
    },
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Abonnement', abonnementSchema);