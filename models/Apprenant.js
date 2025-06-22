const mongoose = require("mongoose");

const ApprenantSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: true
    },
    matricule: {
        type: String,
        required: true,
        unique: true  // ✅ Seul le matricule reste unique
    },
    phone: {
        type: String,
        required: false,
        default: "aucun"
        // ❌ PAS de unique: true
    },
    email: {
        type: String,
        required: false,
        default: "aucune"
        // ❌ PAS de unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    ecole: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Ecole' 
    }
});

// ✨ Forcer la suppression des index uniques sur phone et email au démarrage
ApprenantSchema.index({ phone: 1 }, { unique: false });
ApprenantSchema.index({ email: 1 }, { unique: false });

module.exports = mongoose.model("Apprenant", ApprenantSchema);