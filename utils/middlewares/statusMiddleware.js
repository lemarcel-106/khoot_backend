// utils/middlewares/statusMiddleware.js
const Admin = require('../../models/Admin');
const logger = require('../../logger');

const statusMiddleware = {
    /**
     * Middleware pour vérifier que l'utilisateur a un statut actif
     * Empêche la connexion des utilisateurs inactifs ou suspendus
     */
    async checkActiveStatus(req, res, next) {
        try {
            // Ce middleware doit être utilisé APRÈS l'authentification
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié'
                });
            }

            // Récupérer les informations à jour de l'utilisateur depuis la base
            const currentAdmin = await Admin.findById(req.user.id);
            
            if (!currentAdmin) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé dans la base de données'
                });
            }

            // Vérifier le statut de l'utilisateur
            if (currentAdmin.statut !== 'actif') {
                logger.warn(`Tentative de connexion d'un utilisateur ${currentAdmin.statut}: ${currentAdmin.email}`);
                
                let message;
                switch (currentAdmin.statut) {
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
                    statut: currentAdmin.statut
                });
            }

            // Si le statut est actif, mettre à jour req.user avec les données fraîches
            req.user = {
                ...req.user,
                statut: currentAdmin.statut,
                // Mettre à jour d'autres champs si nécessaire
                nom: currentAdmin.nom,
                prenom: currentAdmin.prenom,
                email: currentAdmin.email
            };

            logger.info(`Utilisateur actif connecté: ${currentAdmin.email} (${currentAdmin.role})`);
            next();

        } catch (error) {
            logger.error('Erreur lors de la vérification du statut:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur interne lors de la vérification du statut utilisateur'
            });
        }
    },

    /**
     * Middleware spécifique pour les enseignants
     * Vérifie que l'enseignant a un statut actif
     */
    async checkEnseignantActiveStatus(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié'
                });
            }

            // Appliquer uniquement aux enseignants
            if (req.user.role === 'enseignant') {
                // Utiliser le middleware général de vérification de statut
                return statusMiddleware.checkActiveStatus(req, res, next);
            }

            // Pour les autres rôles, passer au middleware suivant
            next();

        } catch (error) {
            logger.error('Erreur lors de la vérification du statut enseignant:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur interne lors de la vérification du statut'
            });
        }
    }
};

module.exports = statusMiddleware;