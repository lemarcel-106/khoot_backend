const mongoose = require("mongoose")

const JeuSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false, // Image maintenant optionnelle
        default: null    // Valeur par défaut null
    },
     // Dans models/Jeu.js, le champ createdBy doit ressembler à :
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin', // ✅ Pas 'User' !
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    planification: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Planification' }
    ],
    questions: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }
    ],
    ecole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ecole',
        required: true
    }
})

module.exports = mongoose.model('Jeu', JeuSchema);