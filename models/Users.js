const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    prenom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    adresse: {
        type: String,
        required: true,
    },
    genre: {
        type: String,
        required: true,
    },
    adresse: {
        type: String,
        required: true,
    },
    statut: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    ecole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ecole',
    },
    pays: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays' },
    role: {
        type: String,
        enum: ['admin', 'super_admin', 'user'],
        default: 'user'
    },

});

module.exports = mongoose.model('User', UserSchema);
