const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  reponse: { type: String, required: true },
  ordre: Number,
  dateCreation: { type: Date, default: Date.now },

  type: {
    type: String,
    enum: ['enseignant', 'ecole', 'apprenant'],
  }
});

module.exports = mongoose.model('FAQ', faqSchema);


