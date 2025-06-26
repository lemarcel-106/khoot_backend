// controllers/statsController.js
const Ecole = require('../models/Ecole');
const Jeu = require('../models/Jeu');
const Apprenant = require('../models/Apprenant');
const Planification = require('../models/Planification');
const logger = require('../logger');

const StatsController = {
    /**
     * Récupère les statistiques globales pour super_admin uniquement
     * Route: GET /api/stats/global
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    async getGlobalStats(req, res) {
        try {
            // Vérifier que l'utilisateur est authentifié (fait par le middleware)
            const currentUser = req.user;
            
            logger.info(`Récupération des statistiques globales par ${currentUser.email} (${currentUser.role})`);

            // Double vérification du rôle super_admin
            if (currentUser.role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Seuls les super administrateurs peuvent accéder aux statistiques globales.'
                });
            }

            // Récupération parallèle des statistiques
            const [totalEcoles, totalAprennant, totalJeux, totalPlanifications] = await Promise.all([
                // Total des écoles
                Ecole.countDocuments({}),
                
                // Total des apprenants
                Apprenant.countDocuments({}),

                // Total des jeux
                Jeu.countDocuments({}),
                
                // Total des planifications
                Planification.countDocuments({})
            ]);

            // Statistiques détaillées optionnelles
            const [
                ecolesActives,
                jeuxAvecQuestions,
                planificationsActives,
                planificationsEnCours
            ] = await Promise.all([
                // Écoles avec statut actif
                Ecole.countDocuments({ statut: 'actif' }),
                
                // Jeux qui ont au moins une question
                Jeu.countDocuments({ 
                    questions: { $exists: true, $not: { $size: 0 } } 
                }),
                
                // Planifications avec statut actif
                Planification.countDocuments({ statut: 'actif' }),
                
                // Planifications en cours (date actuelle entre date_debut et date_fin)
                Planification.countDocuments({
                    statut: 'actif',
                    date_debut: { $lte: new Date() },
                    date_fin: { $gte: new Date() }
                })
            ]);

            // Construction de la réponse
            const stats = {
                global: {
                    total_ecoles: totalEcoles,
                    total_apprenants: totalAprennant,
                    total_jeux: totalJeux,
                    total_planifications: totalPlanifications
                },
                details: {
                    ecoles: {
                        total: totalEcoles,
                        actives: ecolesActives,
                        inactives: totalEcoles - ecolesActives
                    },
                    jeux: {
                        total: totalJeux,
                        avec_questions: jeuxAvecQuestions,
                        sans_questions: totalJeux - jeuxAvecQuestions
                    },
                    planifications: {
                        total: totalPlanifications,
                        actives: planificationsActives,
                        en_cours: planificationsEnCours,
                        inactives: totalPlanifications - planificationsActives
                    }
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    demandeur: {
                        id: currentUser.id,
                        email: currentUser.email,
                        role: currentUser.role
                    }
                }
            };

            logger.info(`Statistiques globales récupérées: ${totalEcoles} écoles, ${totalJeux} jeux, ${totalPlanifications} planifications`);

            return res.status(200).json({
                success: true,
                message: 'Statistiques globales récupérées avec succès',
                data: stats
            });

        } catch (error) {
            logger.error('Erreur lors de la récupération des statistiques globales:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur lors de la récupération des statistiques',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
            });
        }
    }
};

module.exports = StatsController;