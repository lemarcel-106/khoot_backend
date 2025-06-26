// utils/middlewares/authMiddleware.js - Version mise à jour
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const logger = require('../../logger');

const authMiddleware = {
    
    // Middleware pour vérifier l'authentification ET le statut
    async authenticate(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            console.log("vérification d'authentification en cours...");
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token d\'authentification manquant'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const admin = await Admin.findById(decoded.id);
            
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: 'Token invalide'
                });
            }

            // ✅ AJOUT: Vérification du statut utilisateur
            if (admin.statut !== 'actif') {
                logger.warn(`Tentative de connexion d'un utilisateur ${admin.statut}: ${admin.email}`);
                
                let message;
                switch (admin.statut) {
                    case 'inactif':
                        message = 'Votre compte est inactif. Veuillez contacter un administrateur pour réactiver votre compte.';
                        break;
                    case 'suspendu':
                        message = 'Votre compte est suspendu. Veuillez contacter un administrateur pour plus d\'informations.';
                        break;
                    default:
                        message = 'Votre compte n\'est pas autorisé à accéder au système.';
                }

                return res.status(403).json({
                    success: false,
                    message: message,
                    statut: admin.statut
                });
            }

            req.user = {
                id: admin._id.toString(),  // ✅ CORRECTION : Convertir en chaîne
                role: admin.role,
                email: admin.email,
                nom: admin.nom,
                ecole: admin.ecole ? admin.ecole.toString() : null,  // ✅ CORRECTION : Convertir ecole aussi
                prenom: admin.prenom,
                statut: admin.statut
            };
            
            console.log(`Utilisateur authentifié: ${admin.email} (${admin.role}) - Statut: ${admin.statut}`);
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

   // ✅ CORRECTION : Middleware pour vérifier l'accès aux fonctionnalités d'école
        requireEcoleAccess(req, res, next) {
            if (!['enseignant', 'admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous n\'avez pas les privilèges pour accéder aux fonctionnalités de l\'école.'
                });
            }
            
            // ✅ CORRECTION : Les super_admin n'ont pas besoin d'école assignée pour créer des écoles
            if (req.user.role !== 'super_admin' && !req.user.ecole) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucune école assignée à votre compte.'
                });
            }

            next();
        },

    // ✅ NOUVEAU : Middleware spécifique pour les enseignants avec vérification renforcée
    requireEnseignantAccess(req, res, next) {
        // Vérifier le rôle
        if (req.user.role !== 'enseignant') {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux enseignants.'
            });
        }

        // Vérifier le statut (normalement déjà fait par authenticate, mais double sécurité)
        if (req.user.statut !== 'actif') {
            return res.status(403).json({
                success: false,
                message: 'Votre compte enseignant doit être actif pour accéder à cette fonctionnalité.'
            });
        }

        // Vérifier l'école
        if (!req.user.ecole) {
            return res.status(400).json({
                success: false,
                message: 'Aucune école assignée à votre compte enseignant.'
            });
        }

        next();
    }
};

module.exports = authMiddleware;