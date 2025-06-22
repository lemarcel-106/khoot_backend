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
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    ecole: { type: mongoose.Schema.Types.ObjectId, ref: 'Ecole' }
});

module.exports = mongoose.model("Apprenant", ApprenantSchema);
