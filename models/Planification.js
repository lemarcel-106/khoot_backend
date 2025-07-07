const mongoose = require("mongoose");

const PlanificationSchema = new mongoose.Schema({
    pin: {
        type: String,
        required: true,
        unique: true,
    },
    statut: {
        type: String,
        required: true,
        enum: ['en-attente', 'en-cours', 'terminé'],
        default: 'en-attente' // ✅ Statut par défaut
    },
    date_debut: {
        type: String,
        required: true // ✅ Toujours requis maintenant
    },
    date_fin: {
        type: String,
        required: true // ✅ Toujours requis maintenant
    },
    heure_debut: {
        type: String,
        required: true // ✅ Toujours requis maintenant
    },
    heure_fin: {
        type: String,
        required: true // ✅ Toujours requis maintenant
    },
    type: {
        type: String,
        required: true,
        enum: ['Examen', 'Live'] // ✅ Modifié selon vos spécifications
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
    jeu: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Jeu',
        required: true // ✅ Jeu obligatoire
    },
});

// ✅ Middleware pour passer automatiquement le statut à "en-cours" 
// quand au moins un participant rejoint
PlanificationSchema.methods.ajouterParticipant = async function(participantId) {
    // Ajouter le participant s'il n'est pas déjà dans la liste
    if (!this.participants.includes(participantId)) {
        this.participants.push(participantId);
        
        // Si c'est le premier participant et que le statut est "en-attente"
        if (this.participants.length === 1 && this.statut === 'en-attente') {
            this.statut = 'en-cours';
        }
        
        await this.save();
    }
    return this;
};

// ✅ Méthode pour terminer la planification
PlanificationSchema.methods.terminer = async function() {
    if (this.statut !== 'terminé') {
        this.statut = 'terminé';
        await this.save();
    }
    return this;
};

// ✅ Middleware pre-save pour générer automatiquement un PIN unique
PlanificationSchema.pre('save', async function(next) {
    if (!this.pin) {
        let pinUnique = false;
        let tentative = 0;
        const maxTentatives = 10;
        
        while (!pinUnique && tentative < maxTentatives) {
            // Générer un PIN de 6 chiffres
            const pin = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Vérifier l'unicité
            const existant = await mongoose.model('Planification').findOne({ pin });
            if (!existant) {
                this.pin = pin;
                pinUnique = true;
            }
            tentative++;
        }
        
        if (!pinUnique) {
            return next(new Error('Impossible de générer un PIN unique après plusieurs tentatives'));
        }
    }
    next();
});

module.exports = mongoose.model('Planification', PlanificationSchema);