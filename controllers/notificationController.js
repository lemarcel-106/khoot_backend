// controllers/notificationController.js - VERSION CORRIGÉE
const service = require('../services/notificationService');

/**
 * Créer une nouvelle notification
 */
exports.create = async (req, res) => {
    try {
        // Validation supplémentaire
        const { titre, contenu, ecole, type } = req.body;
        
        if (!titre || titre.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Le titre doit contenir au moins 3 caractères'
            });
        }
        
        if (!contenu || contenu.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Le contenu doit contenir au moins 10 caractères'
            });
        }
        
        const notificationData = {
            titre: titre.trim(),
            contenu: contenu.trim(),
            ecole,
            type: type || 'info'
        };
        
        const notification = await service.create(notificationData);
        
        res.status(201).json({ 
            success: true, 
            message: 'Notification créée avec succès',
            data: notification 
        });
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la création de la notification',
            error: error.message 
        });
    }
};

/**
 * ✅ CORRIGÉ : Récupérer les notifications d'une école spécifique
 */
exports.getByEcole = async (req, res) => {
    try {
        const { ecoleId } = req.params;
        
        // Validation de l'ID d'école
        if (!ecoleId) {
            return res.status(400).json({
                success: false,
                message: 'ID de l\'école requis'
            });
        }
        
        // Vérification des permissions (optionnel selon vos besoins)
        const currentUser = req.user;
        if (currentUser && currentUser.role !== 'super_admin') {
            // Si l'utilisateur n'est pas super_admin, vérifier qu'il appartient à cette école
            if (!currentUser.ecole || currentUser.ecole.toString() !== ecoleId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cette école'
                });
            }
        }
        
        const notifications = await service.getByEcole(ecoleId);
        
        res.json({ 
            success: true,
            message: `${notifications.length} notification(s) récupérée(s) avec succès`,
            data: notifications,
            total: notifications.length,
            ecoleId: ecoleId
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des notifications',
            error: error.message 
        });
    }
};

/**
 * Marquer une notification comme lue
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de la notification requis'
            });
        }
        
        const notification = await service.markAsRead(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Notification marquée comme lue',
            data: notification 
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la notification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour de la notification',
            error: error.message 
        });
    }
};

exports.getMyNotifications = async (req, res) => {
  try {
      // Récupérer l'ID de l'école depuis le token JWT
      const currentUser = req.user;
      
      if (!currentUser) {
          return res.status(401).json({
              success: false,
              message: 'Utilisateur non authentifié'
          });
      }
      
      const ecoleId = currentUser.ecole;

      if (!ecoleId) {
          return res.status(400).json({
              success: false,
              message: "Aucune école associée à votre compte"
          });
      }

      // ✅ OPTIMISATION : Récupérer notifications et école en une seule requête
      const { notifications, ecole } = await service.getByEcoleWithDetails(ecoleId);
      
      if (!ecole) {
          return res.status(404).json({
              success: false,
              message: "École non trouvée dans la base de données"
          });
      }

      // Formater les notifications
      const formattedNotifications = notifications.map(notif => ({
          id: notif._id,
          titre: notif.titre,
          contenu: notif.contenu,
          date: notif.date,
          type: notif.type,
          statut: notif.statut,
          isRead: notif.statut === 'lue',
          createdAt: notif.createdAt || notif.date,
          updatedAt: notif.updatedAt
      }));

      res.json({ 
          success: true, 
          message: `${formattedNotifications.length} notification(s) récupérée(s) avec succès`,
          data: formattedNotifications,
          total: formattedNotifications.length,
          nonLues: formattedNotifications.filter(n => !n.isRead).length,
          ecole: {
              id: ecoleId,
              nom: ecole.libelle,
              ville: ecole.ville,
              telephone: ecole.telephone
          },
          user: {
              id: currentUser.id,
              email: currentUser.email,
              role: currentUser.role
          }
      });
  } catch (error) {
      console.error('Erreur lors de la récupération de mes notifications:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Erreur lors de la récupération de vos notifications',
          error: error.message 
      });
  }
};
/**
 * ✅ NOUVEAU : Marquer toutes les notifications comme lues pour l'utilisateur connecté
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const currentUser = req.user;
        
        if (!currentUser || !currentUser.ecole) {
            return res.status(400).json({
                success: false,
                message: "Aucune école associée à votre compte"
            });
        }

        const result = await service.markAllAsReadByEcole(currentUser.ecole);
        
        res.json({ 
            success: true, 
            message: `${result.modifiedCount} notification(s) marquée(s) comme lue(s)`,
            data: {
                notificationsModifiees: result.modifiedCount,
                ecoleId: currentUser.ecole
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des notifications:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour des notifications',
            error: error.message 
        });
    }
};

/**
 * ✅ NOUVEAU : Supprimer une notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de la notification requis'
            });
        }
        
        // Vérifier que la notification appartient à l'école de l'utilisateur (sauf super_admin)
        if (currentUser.role !== 'super_admin') {
            const notification = await service.getById(id);
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification non trouvée'
                });
            }
            
            if (notification.ecole.toString() !== currentUser.ecole.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cette notification'
                });
            }
        }
        
        const deleted = await service.remove(id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Notification non trouvée'
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Notification supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression de la notification',
            error: error.message 
        });
    }
};

/**
 * ✅ NOUVEAU : Obtenir le nombre de notifications non lues
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const currentUser = req.user;
        
        if (!currentUser || !currentUser.ecole) {
            return res.status(400).json({
                success: false,
                message: "Aucune école associée à votre compte"
            });
        }

        const count = await service.getUnreadCountByEcole(currentUser.ecole);
        
        res.json({ 
            success: true, 
            message: 'Nombre de notifications non lues récupéré avec succès',
            data: {
                count: count,
                ecoleId: currentUser.ecole
            }
        });
    } catch (error) {
        console.error('Erreur lors du comptage des notifications:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du comptage des notifications',
            error: error.message 
        });
    }
};