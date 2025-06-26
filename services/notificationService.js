// services/notificationService.js - VERSION AMÉLIORÉE
const Notification = require('../models/Notification');

const notificationService = {


    getByEcoleWithDetails: async (ecoleId) => {
        try {
            const [notifications, ecoleDetails] = await Promise.all([
                // Récupérer les notifications
                Notification.find({ ecole: ecoleId })
                    .populate('ecole', 'libelle ville telephone')
                    .sort({ date: -1 })
                    .lean(),
                
                // Récupérer les détails de l'école
                require('../models/Ecole').findById(ecoleId)
                    .select('libelle ville telephone')
                    .lean()
            ]);
    
            return {
                notifications,
                ecole: ecoleDetails
            };
        } catch (error) {
            throw new Error('Erreur lors de la récupération des notifications avec détails école : ' + error.message);
        }
    },
    
    /**
     * Créer une nouvelle notification
     */
    create: async (data) => {
        try {
            const notification = await Notification.create(data);
            return await notification.populate('ecole', 'libelle ville');
        } catch (error) {
            throw new Error('Erreur lors de la création de la notification : ' + error.message);
        }
    },

    /**
     * ✅ CORRIGÉ : Récupérer les notifications d'une école avec tri et formatage
     */
    getByEcole: async (ecoleId) => {
        try {
            return await Notification.find({ ecole: ecoleId })
                .populate('ecole', 'libelle ville')
                .sort({ date: -1 }) // Tri par date décroissante (plus récentes en premier)
                .lean(); // Pour de meilleures performances
        } catch (error) {
            throw new Error('Erreur lors de la récupération des notifications : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Récupérer une notification par ID
     */
    getById: async (id) => {
        try {
            return await Notification.findById(id).populate('ecole', 'libelle ville');
        } catch (error) {
            throw new Error('Erreur lors de la récupération de la notification : ' + error.message);
        }
    },

    /**
     * ✅ AMÉLIORÉ : Marquer une notification comme lue avec vérification
     */
    markAsRead: async (id) => {
        try {
            const notification = await Notification.findByIdAndUpdate(
                id, 
                { 
                    statut: 'lue',
                    dateLue: new Date() // Ajouter la date de lecture
                }, 
                { new: true }
            ).populate('ecole', 'libelle ville');
            
            return notification;
        } catch (error) {
            throw new Error('Erreur lors de la mise à jour de la notification : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Marquer toutes les notifications d'une école comme lues
     */
    markAllAsReadByEcole: async (ecoleId) => {
        try {
            const result = await Notification.updateMany(
                { 
                    ecole: ecoleId, 
                    statut: 'non_lue' 
                },
                { 
                    statut: 'lue',
                    dateLue: new Date()
                }
            );
            
            return result;
        } catch (error) {
            throw new Error('Erreur lors de la mise à jour des notifications : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Compter les notifications non lues d'une école
     */
    getUnreadCountByEcole: async (ecoleId) => {
        try {
            return await Notification.countDocuments({
                ecole: ecoleId,
                statut: 'non_lue'
            });
        } catch (error) {
            throw new Error('Erreur lors du comptage des notifications : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Supprimer une notification
     */
    remove: async (id) => {
        try {
            return await Notification.findByIdAndDelete(id);
        } catch (error) {
            throw new Error('Erreur lors de la suppression de la notification : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Récupérer les notifications récentes d'une école (par exemple, les 10 dernières)
     */
    getRecentByEcole: async (ecoleId, limit = 10) => {
        try {
            return await Notification.find({ ecole: ecoleId })
                .populate('ecole', 'libelle ville')
                .sort({ date: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des notifications récentes : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Obtenir des statistiques sur les notifications d'une école
     */
    getStatsByEcole: async (ecoleId) => {
        try {
            const [total, nonLues, lues, parType] = await Promise.all([
                // Total des notifications
                Notification.countDocuments({ ecole: ecoleId }),
                
                // Notifications non lues
                Notification.countDocuments({ ecole: ecoleId, statut: 'non_lue' }),
                
                // Notifications lues
                Notification.countDocuments({ ecole: ecoleId, statut: 'lue' }),
                
                // Répartition par type
                Notification.aggregate([
                    { $match: { ecole: ecoleId } },
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ])
            ]);

            return {
                total,
                nonLues,
                lues,
                pourcentageLues: total > 0 ? Math.round((lues / total) * 100) : 0,
                parType: parType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            throw new Error('Erreur lors du calcul des statistiques : ' + error.message);
        }
    },

    /**
     * ✅ NOUVEAU : Nettoyer les anciennes notifications (utile pour maintenance)
     */
    cleanOldNotifications: async (daysOld = 30) => {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const result = await Notification.deleteMany({
                date: { $lt: cutoffDate },
                statut: 'lue' // Ne supprimer que les notifications déjà lues
            });
            
            return result;
        } catch (error) {
            throw new Error('Erreur lors du nettoyage des notifications : ' + error.message);
        }
    }
};

module.exports = notificationService;