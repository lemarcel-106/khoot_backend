const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    libelle: {
        type: String,
        required: true
    },
    fichier: {
        type: String,
        required: false
    },
    type_fichier: {
        type: String,
        required: false
    },
    temps: {
        type: Number,
        required: true
    },
    limite_response: {
        type: Boolean,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    reponses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reponse'
        }
    ],
    typeQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TypeQuestion'
    },
    point: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Point'
    },
    jeu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Jeu'
    }
});

module.exports = mongoose.model("Question", QuestionSchema);
