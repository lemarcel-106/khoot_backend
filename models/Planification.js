const mongoose = require("mongoose")

const PlanificationSchema = new mongoose.Schema({
    pin: {
        type: String,
        required: true,
        unique: true,
        
    },
    statut: {
        type: String,
        required: true,
        enum: ['en attente', 'en cours', 'terminé']
    },
    date_debut: {
        type: String,
        required: function () { return this.type === 'attribuer'; }
    },
    date_fin: {
        type: String,
        required: function () { return this.type === 'attribuer'; }
    },
    heure_debut: {
        type: String,
        required: function () { return this.type === 'attribuer'; }
    },
    heure_fin: {
        type: String,
        required: function () { return this.type === 'attribuer'; }
    },
    type: {
        type: String,
        required: true,
        enum: ['live', 'attribuer']
    },
    limite_participant: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
    jeu: { type: mongoose.Schema.Types.ObjectId, ref: 'Jeu' },
})

module.exports = mongoose.model('Planification', PlanificationSchema);