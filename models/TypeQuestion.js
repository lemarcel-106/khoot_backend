const mongoose = require('mongoose');

const TypeQuestionSchema = new mongoose.Schema({
    libelle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reference: {
        type: String,
        required: true,
        enum: ['30', '31', '32'],
        unique:true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TypeQuestion', TypeQuestionSchema);
