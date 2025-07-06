// middleware/conditionalValidation.js - VERSION CORRIGÉE
/**
 * Middleware de validation conditionnelle pour la création d'admins
 * Valide les champs requis selon le rôle de l'utilisateur connecté
 */
const conditionalAdminValidation = (req, res, next) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        const { role: userRole, ecole: userEcole } = req.user;
        const { role: targetRole, ecole } = req.body;

        console.log('Validation conditionnelle:', {
            userRole,
            userEcole,
            targetRole,
            ecoleSpecifiee: ecole
        });

        // Champs de base toujours requis
        const baseRequiredFields = [
            'nom', 
            'prenom', 
            'genre', 
            'statut', 
            'phone', 
            'email', 
            'password', 
            'adresse', 
            'role'
        ];

        const missingFields = [];

        // Vérifier les champs de base
        baseRequiredFields.forEach(field => {
            const fieldValue = req.body[field];
            if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
                missingFields.push(field);
            }
        });

        // ========================================
        // VALIDATION SELON LE RÔLE DE L'UTILISATEUR CONNECTÉ
        // ========================================

        if (userRole === 'enseignant') {
            // ❌ Les enseignants ne peuvent créer aucun utilisateur
            return res.status(403).json({
                success: false,
                message: 'Les enseignants ne peuvent pas créer d\'utilisateurs'
            });

        } else if (userRole === 'admin') {
            // ✅ Les admins peuvent créer uniquement des enseignants
            if (targetRole !== 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Les admins ne peuvent créer que des enseignants',
                    roleAutorise: 'enseignant',
                    roleRecu: targetRole
                });
            }

            // ✅ Vérifier que l'admin a une école assignée
            if (!userEcole) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur : L\'admin connecté n\'a pas d\'école assignée'
                });
            }

            // ✅ L'école sera automatiquement assignée (celle de l'admin)
            // On supprime l'école du body si elle est spécifiée pour éviter les conflits
            if (ecole) {
                console.log('École spécifiée par admin ignorée, utilisation de l\'école de l\'admin connecté');
                delete req.body.ecole;
            }

        } else if (userRole === 'super_admin') {
            // ✅ Les super_admins peuvent créer admin, enseignant, mais PAS d'autres super_admin
            const rolesAutorises = ['admin', 'enseignant'];
            
            if (!rolesAutorises.includes(targetRole)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le rôle spécifié n\'est pas autorisé',
                    rolesAutorises: rolesAutorises,
                    roleRecu: targetRole
                });
            }

            // ✅ Les super_admins DOIVENT spécifier l'école (obligatoire)
            if (!ecole || (typeof ecole === 'string' && ecole.trim() === '')) {
                missingFields.push('ecole');
                return res.status(400).json({
                    success: false,
                    message: 'L\'école est obligatoire pour les super administrateurs',
                    champManquant: 'ecole'
                });
            }

            // ✅ Vérifier que l'ID de l'école est valide (ObjectId)
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(ecole)) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'ID de l\'école fourni n\'est pas valide',
                    ecoleRecu: ecole
                });
            }

        } else {
            // ❌ Rôle non reconnu
            return res.status(403).json({
                success: false,
                message: 'Rôle utilisateur non reconnu',
                roleUtilisateur: userRole
            });
        }

        // ========================================
        // VÉRIFICATION DES CHAMPS MANQUANTS
        // ========================================
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Certains champs sont manquants ou vides',
                champsManquants: missingFields,
                roleUtilisateur: userRole,
                roleCible: targetRole
            });
        }

        // ✅ Validation réussie, passer au middleware suivant
        console.log('Validation conditionnelle réussie');
        next();

    } catch (error) {
        console.error('Erreur dans conditionalAdminValidation:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation des données',
            error: error.message
        });
    }
};

/**
 * Middleware de validation pour la mise à jour d'admins
 * Vérifie les permissions selon le rôle
 */
const conditionalAdminUpdateValidation = (req, res, next) => {
    try {
        const currentUser = req.user;
        const targetId = req.params.id;
        const updateData = req.body;

        // Vérifications communes pour tous les rôles
        
        // Empêcher la modification du matricule
        if (updateData.matricule) {
            return res.status(403).json({
                success: false,
                message: 'Le matricule ne peut pas être modifié'
            });
        }

        // Vérifications spécifiques par rôle
        if (currentUser.role === 'enseignant') {
            // Les enseignants ne peuvent modifier que leur propre profil
            if (currentUser.id !== targetId) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous ne pouvez modifier que votre propre profil'
                });
            }
            
            // Empêcher la modification du rôle et de l'école
            if (updateData.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous ne pouvez pas modifier votre rôle'
                });
            }
            
            if (updateData.ecole) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous ne pouvez pas modifier votre école'
                });
            }
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation de la mise à jour',
            error: error.message
        });
    }
};

/**
 * Middleware de validation pour la suppression d'admins
 */
const conditionalAdminDeleteValidation = (req, res, next) => {
    try {
        const currentUser = req.user;
        const targetId = req.params.id;

        // Empêcher l'auto-suppression
        if (currentUser.id === targetId) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer votre propre compte'
            });
        }

        // Les enseignants ne peuvent supprimer personne
        if (currentUser.role === 'enseignant') {
            return res.status(403).json({
                success: false,
                message: 'Les enseignants ne peuvent pas supprimer d\'administrateurs'
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la validation de la suppression',
            error: error.message
        });
    }
};

/**
 * Middleware pour vérifier l'accès aux données selon le rôle
 */
const roleBasedAccessControl = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            const currentUser = req.user;

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié'
                });
            }

            // Vérifier si le rôle de l'utilisateur est autorisé
            if (!allowedRoles.includes(currentUser.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`,
                    votreRole: currentUser.role,
                    rolesAutorises: allowedRoles
                });
            }

            next();

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification des permissions',
                error: error.message
            });
        }
    };
};

/**
 * Middleware pour logger les actions sensibles
 */
const auditLogger = (action) => {
    return (req, res, next) => {
        const timestamp = new Date().toISOString();
        const user = req.user;
        const ip = req.ip || req.connection.remoteAddress;
        
        console.log(`[AUDIT] ${timestamp} - Action: ${action} - User: ${user?.email} (${user?.role}) - IP: ${ip} - Target: ${req.params.id || 'N/A'}`);
        
        next();
    };
};

module.exports = {
    conditionalAdminValidation,
    conditionalAdminUpdateValidation,
    conditionalAdminDeleteValidation,
    roleBasedAccessControl,
    auditLogger
};