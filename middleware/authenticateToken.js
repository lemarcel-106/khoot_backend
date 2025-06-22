const tokenUtils = require('../utils/token');

const authenticateToken = (req, res, next) => {
    // Récupérer l'en-tête Authorization
    const authHeader = req.header('Authorization');


    // Vérifier si l'en-tête Authorization est présent
    if (!authHeader) {
        return res.status(401).json({ message: 'Accès refusé, en-tête Authorization manquant' });
    }

    // Extraire le token après "Bearer "
    const token = authHeader.replace('Bearer ', '');

    // Vérifier si le token est vide ou incorrectement formaté
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé, token manquant' });
    }

    try {
        // Vérifier et décoder le token avec utilitaire de token
        const decoded = tokenUtils.verifyToken(token);
        req.user = decoded; // Stocker les infos de l'utilisateur décodé dans req.user
        next(); // Continuer vers le prochain middleware ou contrôleur
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide' });
    }
};

module.exports = authenticateToken;
