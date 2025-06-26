// models/Notification.js - VERSION AMÉLIORÉE
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    titre: { 
        type: String, 
        required: [true, 'Le titre est obligatoire'],
        trim: true,
        minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
        maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    contenu: { 
        type: String, 
        required: [true, 'Le contenu est obligatoire'],
        trim: true,
        minlength: [10, 'Le contenu doit contenir au moins 10 caractères'],
        maxlength: [1000, 'Le contenu ne peut pas dépasser 1000 caractères']
    },
    date: { 
        type: Date, 
        default: Date.now,
        index: true // Index pour optimiser les requêtes de tri par date
    },
    type: { 
        type: String, 
        enum: {
            values: ['info', 'alerte', 'urgent', 'maintenance'],
            message: 'Le type doit être : info, alerte, urgent ou maintenance'
        }, 
        default: 'info',
        index: true // Index pour optimiser les requêtes par type
    },
    statut: { 
        type: String, 
        enum: {
            values: ['non_lue', 'lue'],
            message: 'Le statut doit être : non_lue ou lue'
        }, 
        default: 'non_lue',
        index: true // Index pour optimiser les requêtes par statut
    },
    ecole: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Ecole', 
        required: [true, 'L\'école est obligatoire'],
        index: true // Index pour optimiser les requêtes par école
    },
    
    // ✅ NOUVEAUX CHAMPS
    dateLue: {
        type: Date,
        default: null // Date à laquelle la notification a été lue
    },
    priorite: {
        type: String,
        enum: {
            values: ['basse', 'normale', 'haute', 'critique'],
            message: 'La priorité doit être : basse, normale, haute ou critique'
        },
        default: 'normale'
    },
    expirationDate: {
        type: Date,
        default: null // Date d'expiration optionnelle
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null // Qui a créé la notification
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {} // Données supplémentaires flexibles
    }
}, {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    toJSON: { virtuals: true }, // Inclure les champs virtuels dans JSON
    toObject: { virtuals: true }
});

// ✅ INDEX COMPOSÉ pour optimiser les requêtes courantes
notificationSchema.index({ ecole: 1, statut: 1, date: -1 });
notificationSchema.index({ ecole: 1, type: 1 });
notificationSchema.index({ ecole: 1, priorite: 1, date: -1 });

// ✅ CHAMPS VIRTUELS
notificationSchema.virtual('isExpired').get(function() {
    if (!this.expirationDate) return false;
    return new Date() > this.expirationDate;
});

notificationSchema.virtual('ageInDays').get(function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

notificationSchema.virtual('isRecent').get(function() {
    return this.ageInDays <= 7; // Considéré comme récent si moins de 7 jours
});

// ✅ MÉTHODES D'INSTANCE
notificationSchema.methods.markAsRead = function() {
    this.statut = 'lue';
    this.dateLue = new Date();
    return this.save();
};

notificationSchema.methods.isAccessibleBy = function(user) {
    // Vérifier si l'utilisateur peut accéder à cette notification
    if (user.role === 'super_admin') return true;
    return this.ecole.toString() === user.ecole.toString();
};

// ✅ MÉTHODES STATIQUES
notificationSchema.statics.getByEcoleWithStats = async function(ecoleId) {
    return this.aggregate([
        { $match: { ecole: mongoose.Types.ObjectId(ecoleId) } },
        {
            $group: {
                _id: null,
                notifications: { $push: '$$ROOT' },
                total: { $sum: 1 },
                nonLues: { 
                    $sum: { $cond: [{ $eq: ['$statut', 'non_lue'] }, 1, 0] } 
                },
                parType: {
                    $push: {
                        type: '$type',
                        count: 1
                    }
                }
            }
        }
    ]);
};

notificationSchema.statics.cleanExpired = async function() {
    const now = new Date();
    return this.deleteMany({
        expirationDate: { $lt: now }
    });
};

// ✅ MIDDLEWARE PRE-SAVE
notificationSchema.pre('save', function(next) {
    // Validation personnalisée
    if (this.statut === 'lue' && !this.dateLue) {
        this.dateLue = new Date();
    }
    
    // Si priorité critique, type doit être alerte ou urgent
    if (this.priorite === 'critique' && !['alerte', 'urgent'].includes(this.type)) {
        this.type = 'urgent';
    }
    
    next();
});

// ✅ MIDDLEWARE POST-SAVE (pour logging ou notifications en temps réel)
notificationSchema.post('save', function(doc) {
    // Ici vous pourriez ajouter du logging ou déclencher des événements
    console.log(`📨 Notification créée: ${doc.titre} pour école ${doc.ecole}`);
});

module.exports = mongoose.model('Notification', notificationSchema);