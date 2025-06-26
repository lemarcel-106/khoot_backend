// middleware/authenticateToken.js
const tokenUtils = require('../utils/token');

const authenticateToken = (req, res, next) => {
    try {
        // Récupérer l'en-tête Authorization
        const authHeader = req.header('Authorization');

        // Vérifier si l'en-tête Authorization est présent
        if (!authHeader) {
            return res.status(401).json({ 
                success: false,
                message: 'Accès refusé, en-tête Authorization manquant' 
            });
        }

        // Extraire le token après "Bearer "
        const token = authHeader.replace('Bearer ', '');

        // Vérifier si le token est vide ou incorrectement formaté
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Accès refusé, token manquant' 
            });
        }

        // Vérifier et décoder le token avec utilitaire de token
        const decoded = tokenUtils.verifyToken(token);
        
        // ✅ IMPORTANT : Stocker les infos complètes de l'utilisateur
        req.user = {
            id: decoded.id.toString ? decoded.id.toString() : decoded.id,  // ✅ Assurer que c'est une chaîne
            email: decoded.email,
            role: decoded.role,
            nom: decoded.nom,
            prenom: decoded.prenom,
            ecole: decoded.ecole && decoded.ecole.toString ? decoded.ecole.toString() : decoded.ecole  // ✅ Assurer que c'est une chaîne
        };
        
        console.log('Token décodé avec succès:', req.user); // Debug - retirer en production
        
        next(); // Continuer vers le prochain middleware ou contrôleur
    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        return res.status(403).json({ 
            success: false,
            message: 'Token invalide' 
        });
    }
};

module.exports = authenticateToken;