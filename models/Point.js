const mongoose = require("mongoose");

const PointSchema = new mongoose.Schema({
    nature: {
        type: String,
        required: true,
        unique:true
    },
    valeur: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Point", PointSchema);
