const bcrypt = require('bcryptjs');

// Fonction pour hasher un mot de passe
exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Fonction pour comparer un mot de passe avec un hash
exports.comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
