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
        type: Boolean,
        required: true
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

module.exports = mongoose.model('ReponseApp', ReponseAppSchema);
