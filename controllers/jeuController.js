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




// ===============================================
// NOUVELLES FONCTIONS À AJOUTER
// ===============================================

/**
 * Rechercher dans les jeux de l'enseignant connecté
 */
exports.searchMesJeux  =  async (req, res) =>  {
    try {
        const { terme } = req.params;
        const currentUser = req.user;

        if (!terme || terme.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Terme de recherche requis'
            });
        }

        const Jeu = require('../models/Jeu');
        let query = {};

        // Construire la requête selon le rôle
        if (currentUser.role === 'enseignant') {
            query.createdBy = currentUser.id;
        } else if (currentUser.role === 'admin') {
            query.ecole = currentUser.ecole;
        }
        // Les super_admins peuvent rechercher dans tous les jeux

        // Ajouter les critères de recherche
        query.$or = [
            { titre: { $regex: terme, $options: 'i' } },
            { 'createdBy.nom': { $regex: terme, $options: 'i' } },
            { 'createdBy.prenom': { $regex: terme, $options: 'i' } }
        ];

        const jeux = await Jeu.find(query)
            .populate({
                path: 'createdBy',
                select: 'nom prenom email role matricule'
            })
            .populate('ecole', 'libelle ville')
            .populate('questions')
            .populate('planification')
            .sort({ date: -1 })
            .limit(20); // Limiter les résultats

        logger.info(`Recherche de jeux par ${currentUser.email}: "${terme}" - ${jeux.length} résultats`);

        res.status(200).json({
            success: true,
            message: `${jeux.length} jeu(x) trouvé(s) pour "${terme}"`,
            data: jeux,
            total: jeux.length,
            terme_recherche: terme,
            scope: currentUser.role === 'enseignant' ? 'Mes jeux' : 
                   currentUser.role === 'admin' ? 'Jeux de mon école' : 'Tous les jeux'
        });
    } catch (err) {
        logger.error('Erreur lors de la recherche de jeux:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche',
            error: err.message
        });
    }
}

/**
 * Archiver un jeu (le marquer comme inactif sans le supprimer)
 */
exports.archiverJeu =  async (req, res) =>{
    try {
        const jeuId = req.params.id;
        const currentUser = req.user;

        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        // Vérifier les permissions
        const jeuExistant = await jeuService.getJeuById(jeuId);
        
        if (currentUser.role !== 'super_admin') {
            // Vérifier que le jeu appartient à l'école de l'utilisateur
            let jeuEcoleId;
            if (typeof jeuExistant.ecole === 'object' && jeuExistant.ecole._id) {
                jeuEcoleId = jeuExistant.ecole._id.toString();
            } else {
                jeuEcoleId = jeuExistant.ecole.toString();
            }
            
            if (!currentUser.ecole || currentUser.ecole.toString() !== jeuEcoleId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Ce jeu n\'appartient pas à votre école.'
                });
            }
            
            // Enseignant ne peut archiver que ses propres jeux
            if (currentUser.role === 'enseignant') {
                let jeuCreateurId;
                if (typeof jeuExistant.createdBy === 'object' && jeuExistant.createdBy._id) {
                    jeuCreateurId = jeuExistant.createdBy._id.toString();
                } else {
                    jeuCreateurId = jeuExistant.createdBy.toString();
                }
                
                if (currentUser.id.toString() !== jeuCreateurId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez archiver que vos propres jeux.'
                    });
                }
            }
        }

        // Vérifier qu'il n'y a pas de planifications en cours
        const Planification = require('../models/Planification');
        const planificationsEnCours = await Planification.find({
            jeu: jeuId,
            statut: { $in: ['en attente', 'en cours'] }
        });

        if (planificationsEnCours.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Impossible d'archiver ce jeu. Il y a ${planificationsEnCours.length} planification(s) en cours ou en attente.`
            });
        }

        // Archiver le jeu en ajoutant un champ "archive"
        const updatedJeu = await jeuService.updateJeu(jeuId, {
            archive: true,
            dateArchive: new Date(),
            archivePar: currentUser.id
        });

        logger.info(`Jeu archivé par ${currentUser.email}: ${jeuExistant.titre}`);

        res.status(200).json({
            success: true,
            message: 'Jeu archivé avec succès',
            data: {
                id: updatedJeu._id,
                titre: updatedJeu.titre,
                archive: true,
                dateArchive: updatedJeu.dateArchive
            }
        });
    } catch (err) {
        logger.error(`Erreur lors de l'archivage du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'archivage du jeu',
            error: err.message
        });
    }
}

/**
 * Désarchiver un jeu (le rendre à nouveau actif)
 */
exports.desarchiverJeu =  async (req, res) => {
    try {
        const jeuId = req.params.id;
        const currentUser = req.user;

        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        // Vérifier les permissions (même logique que archiverJeu)
        const jeuExistant = await jeuService.getJeuById(jeuId);
        
        if (currentUser.role !== 'super_admin') {
            let jeuEcoleId;
            if (typeof jeuExistant.ecole === 'object' && jeuExistant.ecole._id) {
                jeuEcoleId = jeuExistant.ecole._id.toString();
            } else {
                jeuEcoleId = jeuExistant.ecole.toString();
            }
            
            if (!currentUser.ecole || currentUser.ecole.toString() !== jeuEcoleId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Ce jeu n\'appartient pas à votre école.'
                });
            }
            
            if (currentUser.role === 'enseignant') {
                let jeuCreateurId;
                if (typeof jeuExistant.createdBy === 'object' && jeuExistant.createdBy._id) {
                    jeuCreateurId = jeuExistant.createdBy._id.toString();
                } else {
                    jeuCreateurId = jeuExistant.createdBy.toString();
                }
                
                if (currentUser.id.toString() !== jeuCreateurId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez désarchiver que vos propres jeux.'
                    });
                }
            }
        }

        // Vérifier que le jeu est bien archivé
        if (!jeuExistant.archive) {
            return res.status(400).json({
                success: false,
                message: 'Ce jeu n\'est pas archivé'
            });
        }

        // Désarchiver le jeu
        const updatedJeu = await jeuService.updateJeu(jeuId, {
            archive: false,
            dateDesarchive: new Date(),
            desarchivePar: currentUser.id,
            $unset: { dateArchive: 1, archivePar: 1 }
        });

        logger.info(`Jeu désarchivé par ${currentUser.email}: ${jeuExistant.titre}`);

        res.status(200).json({
            success: true,
            message: 'Jeu désarchivé avec succès',
            data: {
                id: updatedJeu._id,
                titre: updatedJeu.titre,
                archive: false,
                dateDesarchive: updatedJeu.dateDesarchive
            }
        });
    } catch (err) {
        logger.error(`Erreur lors du désarchivage du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du désarchivage du jeu',
            error: err.message
        });
    }
}

/**
 * Dupliquer un jeu existant
 */
exports.dupliquerJeu =  async (req, res) => {
    try {
        const jeuId = req.params.id;
        const currentUser = req.user;

        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        // Récupérer le jeu à dupliquer avec toutes ses relations
        const Jeu = require('../models/Jeu');
        const jeuOriginal = await Jeu.findById(jeuId)
            .populate('questions')
            .populate('createdBy')
            .populate('ecole');

        if (!jeuOriginal) {
            return res.status(404).json({
                success: false,
                message: 'Jeu non trouvé'
            });
        }

        // Vérifier les permissions
        if (currentUser.role !== 'super_admin') {
            let jeuEcoleId;
            if (typeof jeuOriginal.ecole === 'object' && jeuOriginal.ecole._id) {
                jeuEcoleId = jeuOriginal.ecole._id.toString();
            } else {
                jeuEcoleId = jeuOriginal.ecole.toString();
            }
            
            if (!currentUser.ecole || currentUser.ecole.toString() !== jeuEcoleId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Ce jeu n\'appartient pas à votre école.'
                });
            }
            
            if (currentUser.role === 'enseignant') {
                let jeuCreateurId;
                if (typeof jeuOriginal.createdBy === 'object' && jeuOriginal.createdBy._id) {
                    jeuCreateurId = jeuOriginal.createdBy._id.toString();
                } else {
                    jeuCreateurId = jeuOriginal.createdBy.toString();
                }
                
                if (currentUser.id.toString() !== jeuCreateurId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez dupliquer que vos propres jeux.'
                    });
                }
            }
        }

        // Créer le nouveau jeu (copie)
        const nouveauJeuData = {
            titre: `${jeuOriginal.titre} (Copie)`,
            image: jeuOriginal.image,
            createdBy: currentUser.id,
            ecole: currentUser.ecole || jeuOriginal.ecole,
            date: new Date(),
            jeuOriginal: jeuOriginal._id // Référence au jeu original
        };

        const nouveauJeu = await Jeu.create(nouveauJeuData);

        // Dupliquer les questions si elles existent
        const Question = require('../models/Question');
        const questionsOriginales = jeuOriginal.questions || [];
        const nouvellesQuestions = [];

        for (const questionOriginale of questionsOriginales) {
            // Récupérer la question complète avec ses réponses
            const questionComplete = await Question.findById(questionOriginale._id)
                .populate('reponses')
                .populate('typeQuestion')
                .populate('point');

            if (questionComplete) {
                // Créer la nouvelle question
                const nouvelleQuestionData = {
                    libelle: questionComplete.libelle,
                    fichier: questionComplete.fichier,
                    type_fichier: questionComplete.type_fichier,
                    temps: questionComplete.temps,
                    limite_response: questionComplete.limite_response,
                    typeQuestion: questionComplete.typeQuestion?._id,
                    point: questionComplete.point?._id,
                    jeu: nouveauJeu._id,
                    date: new Date()
                };

                const nouvelleQuestion = await Question.create(nouvelleQuestionData);

                // Dupliquer les réponses
                const Reponse = require('../models/Reponse');
                const reponsesOriginales = questionComplete.reponses || [];

                for (const reponseOriginale of reponsesOriginales) {
                    const nouvelleReponseData = {
                        libelle: reponseOriginale.libelle,
                        etat: reponseOriginale.etat,
                        question: nouvelleQuestion._id,
                        date: new Date()
                    };

                    await Reponse.create(nouvelleReponseData);
                }

                nouvellesQuestions.push(nouvelleQuestion._id);
            }
        }

        // Mettre à jour le jeu avec les nouvelles questions
        await Jeu.findByIdAndUpdate(nouveauJeu._id, {
            questions: nouvellesQuestions
        });

        // Récupérer le jeu complet pour la réponse
        const jeuComplet = await Jeu.findById(nouveauJeu._id)
            .populate('questions')
            .populate('createdBy')
            .populate('ecole');

        logger.info(`Jeu dupliqué par ${currentUser.email}: ${jeuOriginal.titre} -> ${nouveauJeu.titre}`);

        res.status(201).json({
            success: true,
            message: 'Jeu dupliqué avec succès',
            data: {
                jeuOriginal: {
                    id: jeuOriginal._id,
                    titre: jeuOriginal.titre
                },
                nouveauJeu: jeuComplet,
                questionsCopiees: nouvellesQuestions.length,
                resume: `${nouvellesQuestions.length} question(s) copiée(s)`
            }
        });
    } catch (err) {
        logger.error(`Erreur lors de la duplication du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la duplication du jeu',
            error: err.message
        });
    }
}