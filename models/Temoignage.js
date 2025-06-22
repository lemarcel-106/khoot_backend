const mongoose = require('mongoose');

const temoignageSchema = new mongoose.Schema({
  auteur: { type: String, required: true },
  fonction: { type: String, required: true },
  contenu: { type: String, required: true },
  date: { type: Date, default: Date.now },
  valide: { type: Boolean, default: false }
});

module.exports = mongoose.model('Temoignage', temoignageSchema);
