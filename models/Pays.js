const mongoose = require("mongoose");

const PaysSchema = new mongoose.Schema({
    libelle: {
        type: String,
        required: true,
        unique: true
    },
});

module.exports = mongoose.model("Pays", PaysSchema);
