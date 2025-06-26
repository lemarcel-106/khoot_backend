// models/ReponseApp.js - VERSION CORRIGÉE
const mongoose = require('mongoose');

const ReponseAppSchema = new mongoose.Schema({
    temps_reponse: {
        type: Number,
        required: true
    },
    reponse_apprenant: {
        type: String,
        required: false
    },
    etat: {
        type: Number, // ✅ CHANGÉ: Boolean -> Number
        required: true,
        set: function(value) {
            // ✅ CONVERSION AUTOMATIQUE: true -> 1, false -> 0
            if (value === true || value === 'true') return 1;
            if (value === false || value === 'false') return 0;
            if (value === 1 || value === '1') return 1;
            if (value === 0 || value === '0') return 0;
            return value; // Laisser mongoose gérer les autres cas
        },
        validate: {
            validator: function(value) {
                return value === 0 || value === 1;
            },
            message: 'L\'état doit être 0 (faux) ou 1 (vrai), ou true/false'
        }
    },
    apprenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apprenant'
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    },
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// ✅ AJOUT: Méthode virtuelle pour faciliter la lecture
ReponseAppSchema.virtual('isCorrect').get(function() {
    return this.etat === 1;
});

// ✅ AJOUT: Méthode pour convertir en format lisible
ReponseAppSchema.methods.toReadable = function() {
    return {
        ...this.toObject(),
        etat_lisible: this.etat === 1 ? 'Correct' : 'Incorrect',
        isCorrect: this.etat === 1
    };
};

module.exports = mongoose.model('ReponseApp', ReponseAppSchema);
