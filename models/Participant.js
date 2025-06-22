const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema({
    score: {
        type: Number,
        required: true,
    },
    reponses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReponseApp' }],
    date: {
        type: Date,
        default: Date.now
    },
    apprenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant' },
    planification: { type: mongoose.Schema.Types.ObjectId, ref: 'Planification' }
});

module.exports = mongoose.model("Participant", ParticipantSchema);
