const jeuService = require('../services/jeuService');
const logger = require('../logger');

/**
 * Récupère la liste simple des jeux (titre, image, date, créateur)
 * Route: GET /api/jeux
 */
// ✅ APRÈS (correction à appliquer):
exports.getAllJeux = async (req, res) => {
    try {
        // ✅ CORRECTION: Gestion des restrictions pour enseignants
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            nom: req.user.nom,
            ecole: req.user.ecole,
        };

        logger.info(`Récupération des jeux par ${req.user.email} (${req.user.role})`);

        // ✅ MODIFICATION: Le service est maintenant responsable du filtrage selon le rôle
        const jeux = await jeuService.getAllJeuxSimple(adminData);

        res.status(200).json({
            success: true,
            message: req.user.role === 'enseignant' 
                ? 'Vos jeux récupérés avec succès' 
                : 'Liste des jeux récupérée avec succès',
            data: jeux,
            total: jeux.length,
            // ✅ AJOUT: Information sur le filtrage appliqué
            filtrage: req.user.role === 'enseignant' 
                ? 'Jeux créés par vous uniquement' 
                : req.user.role === 'admin' 
                    ? 'Jeux de votre école' 
                    : 'Tous les jeux'
        });
    } catch (err) {
        logger.error('Erreur lors de la récupération des jeux:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};
/**
 * Récupère la liste détaillée des jeux avec toutes les relations
 * Route: GET /api/jeux/detailles
 */
exports.getAllJeuxDetailles = async (req, res) => {
    try {
        // ✅ CORRECTION: Gestion des restrictions pour enseignants
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            nom: req.user.nom,
            ecole: req.user.ecole,
        };

        logger.info(`Récupération détaillée des jeux par ${req.user.email} (${req.user.role})`);

        // ✅ MODIFICATION: Le service est maintenant responsable du filtrage selon le rôle
        const jeux = await jeuService.getAllJeuxDetailles(adminData);

        res.status(200).json({
            success: true,
            message: req.user.role === 'enseignant' 
                ? 'Vos jeux détaillés récupérés avec succès' 
                : 'Liste détaillée des jeux récupérée avec succès',
            data: jeux,
            total: jeux.length,
            // ✅ AJOUT: Information sur le filtrage appliqué
            filtrage: req.user.role === 'enseignant' 
                ? 'Jeux créés par vous uniquement' 
                : req.user.role === 'admin' 
                    ? 'Jeux de votre école' 
                    : 'Tous les jeux'
        });
    } catch (err) {
        logger.error('Erreur lors de la récupération détaillée des jeux:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};
/**
 * Récupère un jeu spécifique par son ID avec tous les détails
 * Route: GET /api/jeux/:id
 */
exports.getJeuById = async (req, res) => {
    const { id } = req.params;

    try {
        // Validation de l'ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        const jeu = await jeuService.getJeuById(id);
        
        // Vérification des permissions selon le rôle
        if (req.user.role !== 'super_admin') {
            // Admin et enseignant ne peuvent voir que les jeux de leur école
            if (!req.user.ecole || req.user.ecole.toString() !== jeu.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Ce jeu n\'appartient pas à votre école.'
                });
            }
            
            // Enseignant ne peut voir que ses propres jeux
            if (req.user.role === 'enseignant' && req.user.id !== jeu.createdBy._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez voir que vos propres jeux.'
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Jeu récupéré avec succès',
            data: jeu
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération du jeu ${id}:`, error);
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Récupère tous les jeux créés par un enseignant spécifique
 * Route: GET /api/jeux/enseignant/:enseignantId
 */
exports.getJeuxByEnseignant = async (req, res) => {
    try {
        const { enseignantId } = req.params;
        const currentUser = req.user;
        
        logger.info(`Récupération des jeux de l'enseignant ${enseignantId} par ${currentUser.email} (${currentUser.role})`);

        // Validation de l'ID de l'enseignant
        if (!enseignantId) {
            return res.status(400).json({
                success: false,
                message: "L'ID de l'enseignant est requis"
            });
        }

        // Gestion des permissions selon le rôle
        if (currentUser.role === 'enseignant') {
            // Les enseignants ne peuvent voir que leurs propres jeux
            if (currentUser.id !== enseignantId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez consulter que vos propres jeux.'
                });
            }
        } else if (currentUser.role === 'admin') {
            // Les admins peuvent voir les jeux des enseignants de leur école
            const AdminService = require('../services/adminService');
            const enseignant = await AdminService.getAdminById(enseignantId);
            
            if (!enseignant) {
                return res.status(404).json({
                    success: false,
                    message: 'Enseignant non trouvé'
                });
            }
            
            if (!currentUser.ecole || enseignant.ecole?.toString() !== currentUser.ecole.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Cet enseignant n\'appartient pas à votre école.'
                });
            }
        }
        // Les super_admins ont accès à tous les jeux (pas de restriction)

        // Récupérer les jeux créés par l'enseignant avec tous les détails
        const jeux = await jeuService.getJeuxByEnseignant(enseignantId, currentUser);

        // ✅ OPTIMISATION : Le service gère déjà le populate complet, plus besoin d'enrichissement manuel
        // Suppression du Promise.all qui était redondant

        // Statistiques supplémentaires
        const stats = {
            totalJeux: jeux.length,
            jeuxAvecQuestions: jeux.filter(jeu => jeu.questions && jeu.questions.length > 0).length,
            jeuxAvecPlanifications: jeux.filter(jeu => jeu.planification && jeu.planification.length > 0).length,
            dernierJeuCree: jeux.length > 0 ? 
                jeux.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null
        };

        res.status(200).json({
            success: true,
            message: `${jeux.length} jeu(x) récupéré(s) avec succès pour l'enseignant`,
            data: {
                enseignant: {
                    id: enseignantId,
                    nom: jeux[0]?.createdBy?.nom || 'Inconnu',
                    prenom: jeux[0]?.createdBy?.prenom || 'Inconnu',
                    email: jeux[0]?.createdBy?.email || 'Inconnu',
                    role: jeux[0]?.createdBy?.role || 'Inconnu',
                    matricule: jeux[0]?.createdBy?.matricule || 'Inconnu',
                    ecole: jeux[0]?.createdBy?.ecole || null
                },
                jeux: jeux, // ✅ Plus simple : directement les jeux du service
                statistiques: stats
            },
            total: jeux.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error(`Erreur lors de la récupération des jeux de l'enseignant ${req.params.enseignantId}:`, error);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur lors de la récupération des jeux',
            error: error.message
        });
    }
};

/**
 * Crée un nouveau jeu
 * Route: POST /api/jeux
 */

exports.createJeu = async (req, res) => {
    try {
        const { titre } = req.body;
        logger.info(`Création de jeu par ${req.user.email} (${req.user.role})`);

        // Vérifier que l'utilisateur a une école
        if (!req.user.ecole) {
            return res.status(400).json({
                success: false,
                message: 'Aucune école assignée à votre compte. Impossible de créer un jeu.'
            });
        }

        // ✅ AJOUT : Vérifier que l'utilisateur existe bien dans la base
        const Admin = require('../models/Admin');
        const currentAdmin = await Admin.findById(req.user.id);
        if (!currentAdmin) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé dans la base de données'
            });
        }

        const createdBy = req.user.id;

        const jeuData = {
            titre,
            createdBy,
            ecole: req.user.ecole
        };

        // Ajout conditionnel de l'image si elle est fournie
        if (req.file) {
            jeuData.image = req.file.path;
            logger.info('Image ajoutée au jeu:', req.file.path);
        } else {
            logger.info('Jeu créé sans image');
        }

        // Crée le jeu via le service jeuService
        const { message, statut, savedJeu } = await jeuService.createJeu(jeuData);

        // ✅ VÉRIFICATION SUPPLÉMENTAIRE : Si createdBy est toujours null
        if (!savedJeu.createdBy) {
            logger.warn('createdBy est null, correction...');
            savedJeu.createdBy = {
                _id: currentAdmin._id,
                nom: currentAdmin.nom,
                prenom: currentAdmin.prenom,
                email: currentAdmin.email,
                role: currentAdmin.role,
                matricule: currentAdmin.matricule,
                phone: currentAdmin.phone,
                genre: currentAdmin.genre,
                statut: currentAdmin.statut,
                adresse: currentAdmin.adresse
            };
        }

        logger.info(`Jeu créé avec succès par ${req.user.email}: ${savedJeu.titre}`);

        // Réponse incluant le statut, message, et les informations du jeu
        res.status(201).json({
            success: true,
            statut: statut,
            message: message,
            data: savedJeu
        });
    } catch (err) {
        logger.error('Erreur lors de la création du jeu:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du jeu',
            error: err.message
        });
    }
};


/**
 * Récupère un jeu par son PIN (ACCÈS PUBLIC - sans authentification)
 * Route: POST /api/jeux/pin
 */
exports.getJeuDetailsByPin = async (req, res) => {
    const { pin } = req.body;
    
    try {
        if (!pin) {
            return res.status(400).json({
                success: false,
                message: 'PIN requis'
            });
        }

        // Route publique - pas de vérification d'authentification
        logger.info(`Récupération de jeu par PIN: ${pin}`);

        const jeu = await jeuService.getJeuByPin(pin);
        res.status(200).json({
            success: true,
            statut: 200,
            message: "Jeu obtenu avec succès",
            data: jeu
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération du jeu par PIN ${pin}:`, error);
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Met à jour un jeu existant
 * Route: POST /api/jeux/update/:id
 */
exports.updateJeu = async (req, res) => {
    try {
        const jeuId = req.params.id;
        const jeuData = req.body;
        
        // Vérification des permissions avant mise à jour
        const jeuExistant = await jeuService.getJeuById(jeuId);
        
        if (req.user.role !== 'super_admin') {
            // Vérifier que le jeu appartient à l'école de l'utilisateur
            if (!req.user.ecole || req.user.ecole.toString() !== jeuExistant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Ce jeu n\'appartient pas à votre école.'
                });
            }
            
            // Enseignant ne peut modifier que ses propres jeux
            if (req.user.role === 'enseignant' && req.user.id !== jeuExistant.createdBy._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez modifier que vos propres jeux.'
                });
            }
        }
        
        // Si une nouvelle image est fournie, l'ajouter aux données
        if (req.file) {
            jeuData.image = req.file.path;
            logger.info('Nouvelle image ajoutée lors de la mise à jour:', req.file.path);
        }
        
        const updatedJeu = await jeuService.updateJeu(jeuId, jeuData);
        
        logger.info(`Jeu mis à jour par ${req.user.email}: ${updatedJeu.titre}`);
        
        res.status(200).json({
            success: true,
            message: 'Jeu mis à jour avec succès',
            data: updatedJeu
        });
    } catch (err) {
        logger.error(`Erreur lors de la mise à jour du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du jeu',
            error: err.message
        });
    }
};

/**
 * Supprime un jeu
 * Route: POST /api/jeux/delete/:id
 */
/**
 * Supprime un jeu
 * Route: POST /api/jeux/delete/:id
 */
/**
 * Supprime un jeu
 * Route: POST /api/jeux/delete/:id
 */
exports.deleteJeuById = async (req, res) => {
    try {
        const jeuId = req.params.id;
        
        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        // Vérification des permissions avant suppression
        const jeuExistant = await jeuService.getJeuById(jeuId);
        
        if (req.user.role !== 'super_admin') {
            // ✅ CORRECTION: Gestion correcte des comparaisons d'école
            let jeuEcoleId;
            
            // Gérer les cas où ecole peut être populé ou non
            if (typeof jeuExistant.ecole === 'object' && jeuExistant.ecole._id) {
                jeuEcoleId = jeuExistant.ecole._id.toString();
            } else {
                jeuEcoleId = jeuExistant.ecole.toString();
            }
            
            // Vérifier que le jeu appartient à l'école de l'utilisateur
            if (!req.user.ecole || req.user.ecole.toString() !== jeuEcoleId) {
                logger.warn(`Tentative de suppression refusée pour ${req.user.email}: jeu ${jeuId} n'appartient pas à son école`);
                logger.warn(`User école: ${req.user.ecole}, Jeu école: ${jeuEcoleId}`);
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Ce jeu n\'appartient pas à votre école.'
                });
            }
            
            // ✅ CORRECTION: Gestion correcte des comparaisons de créateur
            let jeuCreateurId;
            
            // Gérer les cas où createdBy peut être populé ou non
            if (typeof jeuExistant.createdBy === 'object' && jeuExistant.createdBy._id) {
                jeuCreateurId = jeuExistant.createdBy._id.toString();
            } else {
                jeuCreateurId = jeuExistant.createdBy.toString();
            }
            
            // Enseignant ne peut supprimer que ses propres jeux
            if (req.user.role === 'enseignant' && req.user.id.toString() !== jeuCreateurId) {
                logger.warn(`Tentative de suppression refusée pour enseignant ${req.user.email}: jeu ${jeuId} ne lui appartient pas`);
                logger.warn(`User ID: ${req.user.id.toString()}, Créateur ID: ${jeuCreateurId}`);
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez supprimer que vos propres jeux.'
                });
            }
        }

        await jeuService.deleteJeuById(jeuId);
        
        logger.info(`Jeu supprimé par ${req.user.email}: ${jeuExistant.titre}`);
        
        res.status(200).json({
            success: true,
            message: 'Jeu supprimé avec succès'
        });
    } catch (err) {
        logger.error(`Erreur lors de la suppression du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du jeu',
            error: err.message
        });
    }
};