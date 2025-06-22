const mongoose = require("mongoose")

const AbonnementHistoriqueSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  expdate: { type: Date, required: true },
  data: {
      id: mongoose.Schema.Types.ObjectId,
      nom: String,
      description: String,
      prix: Number,
      nombreJeuxMax: Number,
      nombreApprenantsMax: Number,
      nombreEnseignantsMax: Number,
      dureeUtilisee: Number
    }
});

const EcoleSchema = new mongoose.Schema({
  libelle: { type: String, required: true, unique: true },
  adresse: { type: String, required: true, unique: true },
  ville: { type: String, required: true },
  telephone: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  fichier: { type: String },

  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  pays: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays' },
  apprenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant' }],

  abonnementActuel: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonnement' },
  abonnementHistorique: [AbonnementHistoriqueSchema],
});

module.exports = mongoose.model('Ecole', EcoleSchema);
