
// Créez un nouveau fichier : middleware/subscriptionLimitsMiddleware.js
const mongoose = require('mongoose');
const Ecole = require('../models/Ecole');
const Admin = require('../models/Admin');
const Apprenant = require('../models/Apprenant');
const Jeu = require('../models/Jeu');

/**
 * Middleware pour vérifier les limites d'abonnement avant création
 * @param {string} resourceType - Type de ressource : 'jeux', 'apprenants', 'enseignants', 'accesStatistiques'
 */
const checkSubscriptionLimits = (resourceType) => {
    return async (req, res, next) => {
        try {
            const currentUser = req.user;
            
            // Ne s'applique qu'aux admins et enseignants d'école
            if (currentUser.role === 'super_admin' || !currentUser.ecole) {
                return next();
            }

            // Récupérer l'école avec son abonnement
            const ecole = await Ecole.findById(currentUser.ecole)
                .populate('abonnementActuel')
                .lean();

            if (!ecole) {
                return res.status(404).json({
                    success: false,
                    message: 'École non trouvée'
                });
            }

            // Si pas d'abonnement actuel, refuser
            if (!ecole.abonnementActuel) {
                return res.status(403).json({
                    success: false,
                    message: 'Aucun abonnement actif. Veuillez souscrire à un abonnement pour utiliser cette fonctionnalité.',
                    code: 'NO_SUBSCRIPTION'
                });
            }

            const abonnement = ecole.abonnementActuel;

            // Vérifier si l'abonnement est expiré
            if (abonnement.dateFin && new Date() > new Date(abonnement.dateFin)) {
                return res.status(403).json({
                    success: false,
                    message: 'Votre abonnement a expiré. Veuillez le renouveler pour continuer.',
                    code: 'SUBSCRIPTION_EXPIRED'
                });
            }

            // Compter les ressources actuelles selon le type
            let currentCount = 0;
            let maxAllowed = 0;
            let resourceName = '';

            switch (resourceType) {
                case 'jeux':
                    currentCount = await Jeu.countDocuments({ ecole: ecole._id });
                    maxAllowed = abonnement.nombreJeuxMax;
                    resourceName = 'jeux';
                    break;
                case 'apprenants':
                    currentCount = await Apprenant.countDocuments({ ecole: ecole._id });
                    maxAllowed = abonnement.nombreApprenantsMax;
                    resourceName = 'apprenants';
                    break;
                case 'enseignants':
                    currentCount = await Admin.countDocuments({ 
                        ecole: ecole._id, 
                        role: { $in: ['admin', 'enseignant'] }
                    });
                    maxAllowed = abonnement.nombreEnseignantsMax;
                    resourceName = 'enseignants';
                    break;
                case 'accesStatistiques':
                    // Vérifier si l'abonnement permet l'accès aux statistiques
                    if (!abonnement.accesStatistiques) {
                        return res.status(403).json({
                            success: false,
                            message: 'Votre abonnement ne permet pas l\'accès aux statistiques avancées.',
                            code: 'STATISTICS_NOT_ALLOWED'
                        });
                    }
                    return next();
                default:
                    return next();
            }

            // Vérifier la limite
            if (currentCount >= maxAllowed) {
                return res.status(403).json({
                    success: false,
                    message: `Limite atteinte ! Votre abonnement "${abonnement.nom}" permet maximum ${maxAllowed} ${resourceName}. Vous en avez actuellement ${currentCount}.`,
                    code: 'LIMIT_REACHED',
                    details: {
                        resourceType,
                        currentCount,
                        maxAllowed,
                        abonnement: {
                            nom: abonnement.nom,
                            id: abonnement._id
                        }
                    }
                });
            }

            // Ajouter les informations d'abonnement à la requête pour usage ultérieur
            req.subscriptionInfo = {
                ecole: ecole._id,
                abonnement: abonnement,
                currentCount,
                maxAllowed,
                remaining: maxAllowed - currentCount
            };

            next();
        } catch (error) {
            console.error('Erreur lors de la vérification des limites d\'abonnement:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification des limites d\'abonnement'
            });
        }
    };
};

module.exports = {
    checkSubscriptionLimits
};
