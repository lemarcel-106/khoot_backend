const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');

const authMiddleware = {
    
    // Middleware pour vérifier l'authentification
    async authenticate(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            console.log("verif is true")
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token d\'authentification manquant'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const admin = await Admin.findById(decoded.id);
            // console.log(admin)
            
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }

            req.user = {
                id: admin._id,
                role: admin.role,
                email: admin.email,
                nom: admin.nom,
                ecole: admin.ecole,
                prenom: admin.prenom
            };
            
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
    },

    // Middleware pour vérifier si l'utilisateur est super_admin
    requireSuperAdmin(req, res, next) {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Privilèges super administrateur requis.'
            });
        }
        next();
    },

    // Middleware pour vérifier si l'utilisateur est admin ou super_admin
    requireAdmin(req, res, next) {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Privilèges administrateur requis.'
            });
        }
        next();
    },

    // Middleware pour vérifier si l'utilisateur peut accéder aux écoles
    requireEcoleAccess(req, res, next) {
        if (!['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Vous n\'avez pas les privilèges pour accéder aux écoles.'
            });
        }
        next();
    }
};

module.exports = authMiddleware;