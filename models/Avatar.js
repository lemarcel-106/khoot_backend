const mongoose = require("mongoose");

const AvatarSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                // Vérifier que l'image est au format PNG
                return value.toLowerCase().endsWith('.png');
            },
            message: 'L\'image doit être au format PNG'
        }
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    actif: {
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index pour améliorer les performances
AvatarSchema.index({ actif: 1, titre: 1 });

// Méthode pour obtenir l'URL complète de l'image
AvatarSchema.methods.getImageUrl = function() {
    if (this.image.startsWith('http')) {
        return this.image;
    }
    return `/uploads/avatars/${this.image}`;
};

module.exports = mongoose.model('Avatar', AvatarSchema);