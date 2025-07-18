const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: true,
    },
    prenom: {
        type: String,
        required: true,
    },
    matricule: {
        type: String,
        unique: true
        // Suppression de 'required: true' car il sera généré automatiquement
    },
    genre: {
        type: String,
        required: true,
    },
    statut: {
        type: String,
        enum: ['actif', 'inactif', 'suspendu'],
        default: 'actif',
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true    
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    adresse: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    },
    pays: { type: mongoose.Schema.Types.ObjectId, ref: 'Pays' },
    role: {
        type: String,
        enum: ['enseignant', 'admin', 'super_admin'],
        required: true,
    },
    ecole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ecole',
        validate: {
            validator: function (value) {
                // Si le rôle est super_admin, alors ecole peut être null
                if (this.role === 'super_admin') return true;
                // Sinon, ecole est requis
                return value != null;
            },
            message: "Le champ 'ecole' est requis sauf pour les super_admins."
        }
    },
});

module.exports = mongoose.model("Admin", AdminSchema);