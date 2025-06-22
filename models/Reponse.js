const mongoose = require('mongoose');

const ReponseSchema = new mongoose.Schema({
    file: {
        type: String,
        required: false,
    },
    etat: {
        type: Boolean,
        required: true,
    },
    reponse_texte: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }
});

module.exports = mongoose.model('Reponse', ReponseSchema);
