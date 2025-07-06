const mongoose = require("mongoose");

const ApprenantSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        trim: true
    },
    prenom: {
        type: String,
        required: true,
        trim: true
    },
    avatar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Avatar',
        required: true
    },
    matricule: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        default: "aucun"
    },
    email: {
        type: String,
        required: false,
        default: "aucune"
    },
    // NOUVEAU : Type d'apprenant
    typeApprenant: {
        type: String,
        enum: ['ecole', 'invite'],
        default: 'ecole',
        required: true
    },
    // NOUVEAU : Pseudonyme pour les invités
    pseudonyme: {
        type: String,
        trim: true,
        validate: {
            validator: function(value) {
                // Pseudonyme requis seulement pour les invités
                if (this.typeApprenant === 'invite') {
                    return value && value.length > 0;
                }
                return true;
            },
            message: 'Le pseudonyme est requis pour les apprenants invités'
        }
    },
    actif: {
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    ecole: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Ecole',
        validate: {
            validator: function(value) {
                // École requise pour les apprenants d'école, optionnelle pour les invités
                if (this.typeApprenant === 'ecole') {
                    return value != null;
                }
                return true;
            },
            message: 'L\'école est requise pour les apprenants d\'école'
        }
    }
}, {
    timestamps: true
});

// Index composé pour améliorer les performances
ApprenantSchema.index({ ecole: 1, actif: 1 });
ApprenantSchema.index({ typeApprenant: 1, actif: 1 });
ApprenantSchema.index({ matricule: 1 }, { unique: true });

// Méthode pour obtenir le nom d'affichage
ApprenantSchema.methods.getNomAffichage = function() {
    if (this.typeApprenant === 'invite') {
        return this.pseudonyme || `${this.prenom} ${this.nom}`;
    }
    return `${this.prenom} ${this.nom}`;
};

// Méthode pour vérifier si c'est un invité
ApprenantSchema.methods.estInvite = function() {
    return this.typeApprenant === 'invite';
};

// Méthode statique pour obtenir les apprenants par type
ApprenantSchema.statics.getByType = function(type, filter = {}) {
    return this.find({ typeApprenant: type, actif: true, ...filter })
        .populate('avatar')
        .populate('ecole')
        .sort({ nom: 1, prenom: 1 });
};

// Méthode statique pour obtenir les invités
ApprenantSchema.statics.getInvites = function(ecoleId = null) {
    const filter = { typeApprenant: 'invite', actif: true };
    if (ecoleId) {
        filter.ecole = ecoleId;
    }
    return this.find(filter)
        .populate('avatar')
        .populate('ecole')
        .sort({ pseudonyme: 1 });
};

// Méthode statique pour rechercher des apprenants
ApprenantSchema.statics.search = function(term, filter = {}) {
    const searchFilter = {
        actif: true,
        ...filter,
        $or: [
            { nom: { $regex: term, $options: 'i' } },
            { prenom: { $regex: term, $options: 'i' } },
            { pseudonyme: { $regex: term, $options: 'i' } },
            { matricule: { $regex: term, $options: 'i' } }
        ]
    };

    return this.find(searchFilter)
        .populate('avatar')
        .populate('ecole')
        .sort({ nom: 1, prenom: 1 });
};

module.exports = mongoose.model("Apprenant", ApprenantSchema);